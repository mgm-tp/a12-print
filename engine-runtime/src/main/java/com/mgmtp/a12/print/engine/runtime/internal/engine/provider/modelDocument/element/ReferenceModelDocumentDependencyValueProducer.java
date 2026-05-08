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
package com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.element;

import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.runtime.internal.ModelDocumentDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.PdfDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.MarkupFactoryBuilder;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.MarkupResult;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalModelDocumentPrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalPdfPrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.computation.ComputationExpression;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.provider.LogicContainerEvaluationDependency;
import com.mgmtp.a12.print.engine.runtime.internal.runtime.RuntimeWalker;
import com.mgmtp.a12.print.model.api.model.reference.PlaceableReference;
import com.mgmtp.a12.print.model.document.internal.base.IPrintElement;
import lombok.extern.slf4j.Slf4j;

import java.util.Objects;

@Slf4j
public class ReferenceModelDocumentDependencyValueProducer implements ModelDocumentDependencyValueProvider<AttachmentWrapper<IPrintElement>, ReferenceModelDocumentDependency> {

	@Override
	public ValueFactory<AttachmentWrapper<IPrintElement>> produce(ReferenceModelDocumentDependency dependency, PrintJob job, PrintEngine<?> engine, InternalModelDocumentPrintEngineRuntime runtime) {

		var placeable = dependency.getReference().tryCastTracedElement(PlaceableReference.class);

		if (placeable.filter(p -> !p.getTracedElement()
								   .getHideConditions()
								   .isEmpty()
					 )
					 .isPresent()
		) {
			var placeableReference = placeable.get();
			var hidden = runtime.provide(
				new LogicContainerEvaluationDependency(placeableReference,
					new ComputationExpression.Parameters()
						.withPrintDocumentContext(dependency.getPrintDocumentContext()))
			).get();
			if (hidden.getValue().filter(e -> Objects.equals(e, true)).isPresent()) {
				if(log.isDebugEnabled()) {
					log.debug("{} was hidden due to {} evaluating to true", placeableReference.getTracedElement().getId(), hidden.getStrategyId());
				}
				return () -> null;
			}
		}

		return new RuntimeWalker<>(runtime).walkReference(
			new ElementFactoryBuilder(dependency.getPrintDocumentContext(), dependency.getOverriddenBoundingBoxes()),
			dependency.getReference(),
			ElementFactoryBuilder::single
		).apply(runtime);
	}

}
