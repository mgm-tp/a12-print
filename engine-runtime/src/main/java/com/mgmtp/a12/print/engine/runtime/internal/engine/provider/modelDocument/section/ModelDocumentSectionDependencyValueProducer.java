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
package com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.section;

import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.runtime.internal.ModelDocumentDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.element.AttachmentWrapper;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.element.ReferenceModelDocumentDependency;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalModelDocumentPrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.SectionUtils;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.reference.PlaceableReference;
import com.mgmtp.a12.print.model.document.internal.attachments.PrintAttachment;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Objects;

public class ModelDocumentSectionDependencyValueProducer implements ModelDocumentDependencyValueProvider<
	AttachmentWrapper<ModelDocumentSectionResult>,
	ModelDocumentSectionDependency
> {

	@Override
	public ValueFactory<AttachmentWrapper<ModelDocumentSectionResult>> produce(
		ModelDocumentSectionDependency dependency,
		PrintJob job,
		PrintEngine<?> engine,
		InternalModelDocumentPrintEngineRuntime runtime
	) {
		final var sectionTrace = dependency.getSection();
		final var section = sectionTrace.getTracedElement();
		final var printDocumentContext = dependency.getDocumentContext();

		final var headerReferences = new ArrayList<PrintModelTreeTrace<PlaceableReference>>();
		final var footerReferences = new ArrayList<PrintModelTreeTrace<PlaceableReference>>();
		section.getReferences().forEach(reference -> {
			if (SectionUtils.isInSection(section, reference, true)) {
				headerReferences.add(sectionTrace.createDescendent(reference));
			} else if (SectionUtils.isInSection(section, reference, false)) {
				footerReferences.add(sectionTrace.createDescendent(reference));
			}
		});

		final var headerElements = runtime.streamReferenceModelDocumentDependency(
			ReferenceModelDocumentDependency.ofReferences(headerReferences, printDocumentContext, Collections.emptyList())
		).filter(Objects::nonNull).toList();
		final var footerElements = runtime.streamReferenceModelDocumentDependency(
			ReferenceModelDocumentDependency.ofReferences(footerReferences, printDocumentContext, Collections.emptyList())
		).filter(Objects::nonNull).toList();

		final var attachments = new ArrayList<PrintAttachment>();
		headerElements.forEach(el -> attachments.addAll(el.getAttachments()));
		footerElements.forEach(el -> attachments.addAll(el.getAttachments()));

		return () -> new AttachmentWrapper<>(
			new ModelDocumentSectionResult(
				section,
				headerElements.stream().map(AttachmentWrapper::getElement).toList(),
				footerElements.stream().map(AttachmentWrapper::getElement).toList()
			),
			attachments
		);
	}
}
