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
package com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.segment;

import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.runtime.internal.ModelDocumentDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.element.AttachmentWrapper;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.element.ElementFactoryBuilder;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.element.ReferenceModelDocumentDependency;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalModelDocumentPrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.runtime.RuntimeWalker;
import com.mgmtp.a12.print.model.document.internal.attachments.PrintAttachment;
import com.mgmtp.a12.print.model.document.internal.base.IPrintElement;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Objects;

public class ModelDocumentSegmentDependencyValueProducer implements ModelDocumentDependencyValueProvider<
	AttachmentWrapper<ModelDocumentSegmentResult>,
	ModelDocumentSegmentDependency
> {

	@Override
	public ValueFactory<AttachmentWrapper<ModelDocumentSegmentResult>> produce(
		ModelDocumentSegmentDependency dependency,
		PrintJob job,
		PrintEngine<?> engine,
		InternalModelDocumentPrintEngineRuntime runtime
	) {
		final var segmentTrace = dependency.getSegment();
		final var segment = segmentTrace.getTracedElement();
		final var printDocumentContext = dependency.getDocumentContext();
		final var overriddenBoundingBoxes = dependency.getOverriddenBoundingBoxes();

		final var elements = runtime.streamReferenceModelDocumentDependency(
			ReferenceModelDocumentDependency.ofReferences(
				dependency.getReferences(),
				printDocumentContext,
				overriddenBoundingBoxes
			)
		).filter(Objects::nonNull).toList();

		final var attachments = new ArrayList<PrintAttachment>();
		elements.forEach(el -> attachments.addAll(el.getAttachments()));

		return () -> new AttachmentWrapper<>(
			new ModelDocumentSegmentResult(
				segment.getId(),
				segment.getPageOrientation(),
				elements.stream().map(AttachmentWrapper::getElement).toList()
			),
			attachments
		);
	}
}
