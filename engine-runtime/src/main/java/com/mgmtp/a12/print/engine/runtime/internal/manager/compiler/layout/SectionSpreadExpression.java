/*
 * SPDX-License-Identifier: EUPL-1.2 OR LicenseRef-commercial
 *
 * Copyright (c) 2012-2026 mgm technology partners GmbH
 *
 * Dual License
 * ------------
 * This source file is part of the mgm A12 Platform and available under
 * a choice of two different licenses:
 *
 * 1. Open-Source License - EUPL v1.2
 *    You may redistribute and/or modify this file under the terms of the
 *    European Union Public License, version 1.2 - see https://eupl.eu/.
 *
 * 2. Commercial License
 *    Alternatively, you may obtain a commercial license from
 *    mgm technology partners GmbH, that permits use of this software
 *    under different terms (including support and maintenance services).
 *
 *    Please contact a12-license@mgm-tp.com for more information.
 *
 * You must select and comply with exactly one of the above license options.
 *
 * Warranty Disclaimer (applies to either option)
 * ----------------------------------------------
 * THIS SOFTWARE IS PROVIDED "AS IS" AND WITHOUT WARRANTY OF ANY KIND,
 * WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NON-INFRINGEMENT, EXCEPT WHERE SUCH DISCLAIMERS ARE HELD TO BE
 * LEGALLY INVALID. SEE THE RESPECTIVE LICENSE TEXT FOR DETAILS.
 */
package com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout;

import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.api.PrintModelId;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.pdfBox.PDDocumentContainer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.heightCalculation.EvaluatedHeightOffset;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.AttachmentToAppend;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalPdfPrintEngineRuntime;
import com.mgmtp.a12.print.model.api.model.section.ModelSection;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.NonNull;
import lombok.Value;

import java.util.*;

@Value
@EqualsAndHashCode(callSuper = true)
public class SectionSpreadExpression extends ContainerSpreadExpression {

	@NonNull ModelSection container;
	@NonNull SectionType sectionType;

	@Builder
	public SectionSpreadExpression(
		@NonNull String id,
		@NonNull ModelSection container,
		@NonNull String[] childSpreadExpressionIds,
		@NonNull PrintModelId printModelId,
		@NonNull SectionType sectionType
	){
		super(id, container, childSpreadExpressionIds, printModelId);
		this.container = container;
		this.sectionType = sectionType;
	}

	@Override
	public ValueFactory<SpreadExpressionResult> produce(SpreadExpressionDependency dependency, PrintJob job, PrintEngine<?> engine, InternalPdfPrintEngineRuntime runtime) {
		final var printDocumentContext = dependency.getPrintDocumentContext();
		final var evaluatedHeightOffset = dependency.getEvaluatedHeightOffset();

		final var sortablePDDocuments = new ArrayList<SortablePDDocument>();
		final LinkedHashMap<String, AttachmentToAppend> attachmentsToAppend = new LinkedHashMap<>();
		final Map<String, String> pageNumberGlobalStyles = new HashMap<>();

		final var yPosition = getSectionType().equals(SectionType.FOOTER)
			? this.getContainer().getActualFooterHeight()
			: 0;

		runtime.streamSpreadExpressionManagerDependency(Arrays.stream(this.getChildSpreadExpressionIds()).map(
			childSpreadExpressionId -> new SpreadExpressionManagerDependency(
				childSpreadExpressionId,
				printDocumentContext,
				new EvaluatedHeightOffset(
					evaluatedHeightOffset.getYOffset() + yPosition,
					evaluatedHeightOffset.getXOffset()
				),
				dependency.getTotalPageCount(),
				dependency.getInitialPageCount(),
				null
			)
		)).forEachOrdered(spreadExpressionResult -> {
			sortablePDDocuments.add(spreadExpressionResult.getSortablePDDocument());
			attachmentsToAppend.putAll(spreadExpressionResult.getAttachmentsToAppend());
			pageNumberGlobalStyles.putAll(spreadExpressionResult.getPageNumberGlobalStyles());
		});

		final var spreadExpressionResult = new SpreadExpressionResult(
			dependency.getSpreadExpressionId(),
			new SortablePDDocument(new PDDocumentContainer(sortablePDDocuments)),
			getSectionType().equals(SectionType.FOOTER)
				? this.getContainer().getPageOrientation().getPageHeight()
				: this.getContainer().getHeaderHeight().getValue(),
			yPosition,
			yPosition,
			attachmentsToAppend,
			pageNumberGlobalStyles
		);

		return () -> spreadExpressionResult;
	}

	public enum SectionType {
		HEADER,
		FOOTER
	}
}
