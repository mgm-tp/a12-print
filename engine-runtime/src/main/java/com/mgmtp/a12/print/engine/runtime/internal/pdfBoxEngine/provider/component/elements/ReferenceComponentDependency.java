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
package com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements;

import com.mgmtp.a12.print.engine.runtime.internal.PrintEngineRuntimeDependency;
import com.mgmtp.a12.print.engine.runtime.internal.PrintEngineRuntimeStreamDependency;
import com.mgmtp.a12.print.engine.runtime.internal.RuntimeType;
import com.mgmtp.a12.print.engine.runtime.internal.engine.ValueDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.PrintDocumentContext;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.Component;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.container.BaseReferenceContainer;
import com.mgmtp.a12.print.model.api.model.reference.ElementReference;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NonNull;
import org.apache.pdfbox.pdmodel.PDDocument;

import java.util.Collection;
import java.util.stream.Stream;


/**
 * The type Instance selector.
 */
@Data
@PrintEngineRuntimeDependency(type = RuntimeType.PDF_BOX)
@PrintEngineRuntimeStreamDependency(type = RuntimeType.PDF_BOX)
@AllArgsConstructor
public class ReferenceComponentDependency implements ValueDependency<Component> {

	private final PrintModelTreeTrace<? extends ElementReference> reference;
	private final PrintDocumentContext printDocumentContext;
	@NonNull
	private final PDDocument document;
	private final Long containerWidth;
	int totalPageCount;
	int currentPageCount;

	public ReferenceComponentDependency(
		PrintModelTreeTrace<? extends ElementReference> reference,
		PrintDocumentContext printDocumentContext,
		@NonNull PDDocument document,
		int totalPageCount,
		int currentPageCount
	) {
		this.reference = reference;
		this.printDocumentContext = printDocumentContext;
		this.document = document;
		this.containerWidth = null;
		this.totalPageCount = totalPageCount;
		this.currentPageCount = currentPageCount;
	}

	public static Stream<ReferenceComponentDependency> ofContainerReferences(
		final PrintModelTreeTrace<? extends BaseReferenceContainer<? extends ElementReference>> path,
		final PrintDocumentContext document,
		@NonNull final PDDocument pdDocument,
		int totalPageCount,
		int currentPageCount
	) {
		return ofReferences(path, path.getTracedElement().getReferences(), document, pdDocument, totalPageCount, currentPageCount);
	}

	public static Stream<ReferenceComponentDependency> ofReferences(
		final PrintModelTreeTrace<? extends BaseReferenceContainer<? extends ElementReference>> path,
		final Collection<? extends ElementReference> references,
		final PrintDocumentContext document,
		@NonNull final PDDocument pdDocument,
		int totalPageCount,
		int currentPageCount
	) {
		return references.stream()
			.map(e ->
				new ReferenceComponentDependency(path.createDescendent(e), document, pdDocument, totalPageCount, currentPageCount));
	}
}
