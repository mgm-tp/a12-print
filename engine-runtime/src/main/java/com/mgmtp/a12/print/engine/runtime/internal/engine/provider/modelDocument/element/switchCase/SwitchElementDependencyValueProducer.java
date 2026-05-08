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
package com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.element.switchCase;

import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.runtime.internal.ModelDocumentDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.element.AttachmentWrapper;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.element.ElementFactoryBuilder;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalModelDocumentPrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.computation.ComputationExpression;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.provider.LogicContainerEvaluationDependency;
import com.mgmtp.a12.print.engine.runtime.internal.runtime.RuntimeWalker;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.element.type.switchCase.SwitchCase;
import com.mgmtp.a12.print.model.document.internal.attachments.PrintAttachment;
import com.mgmtp.a12.print.model.document.internal.base.IPrintElement;
import com.mgmtp.a12.print.model.document.internal.element.PrintElementNestedContainer;
import lombok.RequiredArgsConstructor;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Objects;

@RequiredArgsConstructor
public class SwitchElementDependencyValueProducer implements ModelDocumentDependencyValueProvider<AttachmentWrapper<IPrintElement>, SwitchElementDependency> {
	@Override
	public ValueFactory<AttachmentWrapper<IPrintElement>> produce(SwitchElementDependency dependency, PrintJob job, PrintEngine<?> engine, InternalModelDocumentPrintEngineRuntime runtime) {
		final var switchElement = dependency.getSwitchElement();
		final var path = dependency.getPrintModelPath();
		final var printDocumentContext = dependency.getPrintDocumentContext();
		final var attachments = new ArrayList<PrintAttachment>();
		final var subChildElements = new ArrayList<AttachmentWrapper<IPrintElement>>();

		final var visibleAreas = switchElement
			.getReferences()
			.stream()
			.map(SwitchCase.class::cast)
			.filter(switchCase -> {
				final var logicContainerEvaluation = runtime.provide(
					new LogicContainerEvaluationDependency(
						new PrintModelTreeTrace<>(path, switchCase),
						new ComputationExpression.Parameters().withPrintDocumentContext(printDocumentContext)
					)
				).get();
				return logicContainerEvaluation.getValue().filter(e -> Objects.equals(e, true)).isPresent();
			})
			.toList();

		if (visibleAreas.isEmpty()) {
			return () -> null;
		}

		visibleAreas.forEach(visibleArea -> {
			final var subChildElement= new RuntimeWalker<>(runtime).walkReference(
					new ElementFactoryBuilder(dependency.getPrintDocumentContext(), Collections.emptyList()),
					new PrintModelTreeTrace<>(path, visibleArea),
					ElementFactoryBuilder::single
			)
			.apply(runtime)
			.get();

			subChildElements.add(subChildElement);
			attachments.addAll(subChildElement.getAttachments());
		});

		return () -> new AttachmentWrapper<>(
			new PrintElementNestedContainer(
				switchElement.getId(),
				switchElement.getType(),
				subChildElements.stream().map(AttachmentWrapper::getElement).toList()
			),
			attachments
		);
	}
}
