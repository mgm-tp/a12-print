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
package com.mgmtp.a12.print.engine.runtime.internal.engine.provider.metadata;

import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.api.exception.impl.PrintDomainException;
import com.mgmtp.a12.print.engine.runtime.internal.CoreDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.PrintDocumentContext;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.loader.PrintModelDependency;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalCorePrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.computation.ComputationExpression;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.provider.LogicContainerEvaluationDependency;
import com.mgmtp.a12.print.engine.runtime.internal.message.PrintMessageCollector;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.pdDocument.AccessibilityMetadata;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.general.Metadata;
import com.mgmtp.a12.print.model.api.walker.model.PrintModelPath;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class AccessibilityMetadataDependencyValueProducer implements CoreDependencyValueProvider<AccessibilityMetadata, AccessibilityMetadataDependency> {

	@Override
	public ValueFactory<AccessibilityMetadata> produce(
		AccessibilityMetadataDependency dependency,
		PrintJob job,
		PrintEngine<?> engine,
		InternalCorePrintEngineRuntime runtime
	) {
		final var printModel = runtime.provide(new PrintModelDependency(dependency.getPrintModelId())).get();
		final var metadata = printModel.getContent().getGeneral().getMetadata();
		final var printDocumentContext = dependency.getPrintDocumentContext();
		final var path = PrintModelPath.create(printModel);

		final var title = evaluateMetadataField(
			runtime,
			metadata.getTitleLogicContainer(),
			path,
			printDocumentContext
		);
		final var description = evaluateMetadataField(
			runtime,
			metadata.getDescriptionLogicContainer(),
			path,
			printDocumentContext
		);
		final var author = evaluateMetadataField(
			runtime,
			metadata.getAuthorLogicContainer(),
			path,
			printDocumentContext
		);
		final var language = evaluateMetadataField(
			runtime,
			metadata.getLanguageLogicContainer(),
			path,
			printDocumentContext
		);

		final var result = new AccessibilityMetadata(
			title,
			language,
			description,
			author,
			AccessibilityMetadata.DEFAULT_PRODUCER
		);

		return () -> result;
	}

	private String evaluateMetadataField(
		InternalCorePrintEngineRuntime runtime,
		Metadata.MetadataLogicContainer logicContainer,
		PrintModelPath path,
		PrintDocumentContext printDocumentContext
	) {
		try {
			final var trace = new PrintModelTreeTrace<>(path, logicContainer);
			final var evaluation = runtime.provide(
				new LogicContainerEvaluationDependency(trace,
					new ComputationExpression.Parameters()
						.withPrintDocumentContext(printDocumentContext))
			).get();

			final var result = evaluation.getValue()
				.map(Object::toString)
				.filter(s -> !s.isEmpty())
				.orElse("");

			if (result.isEmpty()) {
				PrintMessageCollector.addWarning(
					String.format("Metadata field %s evaluated to an empty value. This may affect PDF accessibility.", logicContainer.getField())
				);
			}
			return result;
		} catch (Exception e) {
			throw new PrintDomainException("Failed to evaluate the metadata computation for {}", logicContainer.getField(), e);
		}
	}

}
