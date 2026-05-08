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
package com.mgmtp.a12.print.engine.runtime.internal.runtime;

import com.mgmtp.a12.kernel.md.document.api.IFieldInstance;
import com.mgmtp.a12.print.engine.api.JobDependencyProvider;
import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.internal.CoreDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.KernelDocumentJobDependency;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.constant.Constants;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.MutablePrintDocument;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.PrintDocument;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.loader.DocumentDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.loader.DocumentModelDependency;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalCorePrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.PrintModelCompilationContext;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Optional;

@Slf4j
@RequiredArgsConstructor
public class PrintDocumentDependencyValueProducer implements CoreDependencyValueProvider<PrintDocument, DocumentDependency> {

	@NonNull
	private final PrintModelCompilationContext printModel;
	@NonNull
	private final ArrayList<JobDependencyProvider> providers;

	private static void tracePrintDocumentContext(PrintDocument printDocumentContext) {
		if (log.isTraceEnabled()) {
			log.trace(String.format("PrintDocument with id: `%s` was resolved for DocumentModel `%s`", printDocumentContext.getId(), printDocumentContext.context().getDocumentModelId()));
			printDocumentContext.forEach(r -> {

				var value = Optional.empty();

				if (r instanceof IFieldInstance) {
					value = ((IFieldInstance) r).getValue();
				}

				log.trace(
					String.format("%1$-" + 20 + "s", value.map(e -> String.format("%s", e)).orElse("")).substring(0, 20) +
					"\t" +
					String.format("%1$-" + 20 + "s", Arrays.toString(r.getRepetitions())) +
					"\t" +
					r.getPath()
				);

			});
		}
	}

	@Override
	public ValueFactory<PrintDocument> produce(DocumentDependency dependency, PrintJob job, PrintEngine<?> engine, InternalCorePrintEngineRuntime runtime) {

		final var reference = printModel
			.getHeader()
			.getModelReferences()
			.stream()
			.filter(e -> e.getModelType().equals(Constants.DOCUMENT_MODEL_TYPE)
					&& (
					dependency.getDocumentModelId().equals(e.getReference())
						|| dependency.getDocumentModelId().equals(e.getAlias())
				)
			)
			.findFirst();

		if (reference.isEmpty()) {
			throw new PrintException(String.format(
				"DocumentModel: '%s' is not referenced by the current PrintModel '%s' and therefore no Document can be provided.",
				dependency.getDocumentModelId(),
				job.getPrintModelId().getModelHeaderId())
			);
		}

		final var documentDataDependency = new KernelDocumentJobDependency(reference::get);

		for (JobDependencyProvider provider : providers) {
			if (!provider.canProvide(documentDataDependency)) {
				continue;
			}
			provider.provide(documentDataDependency);
		}

		final var indexDocument = documentDataDependency
			.getDocument()
			.orElseThrow(() -> new PrintException("Missing Document for DocumentModel: " + dependency.getDocumentModelId()));
		final var documentModel = runtime.provide(new DocumentModelDependency(dependency.getDocumentModelId())).get();

		final var result = MutablePrintDocument.from(indexDocument, documentModel).setImmutable();

		tracePrintDocumentContext(result);

		return () -> result;
	}

}
