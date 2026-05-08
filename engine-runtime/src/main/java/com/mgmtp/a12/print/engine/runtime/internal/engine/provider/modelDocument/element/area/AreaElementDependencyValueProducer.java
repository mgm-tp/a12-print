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
package com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.element.area;

import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.runtime.internal.ModelDocumentDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.element.AttachmentWrapper;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.element.ReferenceModelDocumentDependency;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalModelDocumentPrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.Variable;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.element.base.DataContext;
import com.mgmtp.a12.print.model.document.internal.attachments.PrintAttachment;
import com.mgmtp.a12.print.model.document.internal.base.IPrintElement;
import com.mgmtp.a12.print.model.document.internal.element.PrintElementNestedContainer;
import lombok.RequiredArgsConstructor;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Objects;

@RequiredArgsConstructor
public class AreaElementDependencyValueProducer implements ModelDocumentDependencyValueProvider<AttachmentWrapper<IPrintElement>, AreaElementDependency> {

	@Override
	public ValueFactory<AttachmentWrapper<IPrintElement>> produce(AreaElementDependency dependency, PrintJob job, PrintEngine<?> engine, InternalModelDocumentPrintEngineRuntime runtime) {
		final var area = dependency.getArea();
		final var path = dependency.getPrintModelPath();
		final var printDocumentContext = dependency.getPrintDocumentContext();

		final var repAreaContext = area.getAreaProperties().getDataContexts().stream()
			.filter(DataContext::isRepetition).findFirst();

		final var attachments = new ArrayList<PrintAttachment>();
		final var childElements = new ArrayList<IPrintElement>();

		if (repAreaContext.isPresent()) {
			final var documentContextRepetitions = printDocumentContext
				.findRepetitions(Variable.abs(repAreaContext.get().getPath()))
				.toList();

			if (documentContextRepetitions.isEmpty()) {
				return () -> null;
			}

			final int documentContextRepetitionCount = documentContextRepetitions.size();
			final int repetitionCount = area.getAreaProperties().getMaxRepetitions().map(maxRepetitions ->
				Math.min(
					documentContextRepetitionCount,
					maxRepetitions
				)
			).orElse(documentContextRepetitionCount);

			for (var i = 0; i < repetitionCount; i++) {
				final var repetition = documentContextRepetitions.get(i);
				var subChildElements = runtime.streamReferenceModelDocumentDependency(
					ReferenceModelDocumentDependency.ofContainerReferences(new PrintModelTreeTrace<>(path, area), repetition, Collections.emptyList())
				).filter(Objects::nonNull).toList();

				subChildElements.forEach(el -> attachments.addAll(el.getAttachments()));

				childElements.add(new PrintElementNestedContainer(
					area.getId(),
					area.getType(),
					subChildElements.stream().map(AttachmentWrapper::getElement).toList()
				));
			}
		} else {
			var subChildElements = runtime.streamReferenceModelDocumentDependency(
				ReferenceModelDocumentDependency.ofContainerReferences(new PrintModelTreeTrace<>(path, area), printDocumentContext, Collections.emptyList())
			).filter(Objects::nonNull).toList();
			subChildElements.forEach(el -> attachments.addAll(el.getAttachments()));

			childElements.addAll(subChildElements.stream().map(AttachmentWrapper::getElement).toList());
		}

		return () -> new AttachmentWrapper<>(
			new PrintElementNestedContainer(
				area.getId(),
				area.getType(),
				childElements
			),
			attachments
		);
	}
}
