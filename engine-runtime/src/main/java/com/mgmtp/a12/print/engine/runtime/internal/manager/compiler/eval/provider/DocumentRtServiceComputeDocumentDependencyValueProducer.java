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
package com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.eval.provider;

import com.mgmtp.a12.kernel.md.document.api.services.IDocumentFactory;
import com.mgmtp.a12.kernel.md.facade.DocumentRtServiceFactory;
import com.mgmtp.a12.kernel.md.rt.api.IDocumentRtService;
import com.mgmtp.a12.kernel.md.rt.api.IDocumentServiceConfig;
import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.MutablePrintDocument;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.PrintDocument;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.loader.DocumentDependency;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalCorePrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.eval.EvaluationDocumentModelCompiler;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.eval.EvaluationDocumentPrefill;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.eval.kernel.ComputedEvaluationDocument;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.eval.kernel.EvaluationDocument;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.provider.ComputeDocumentDependency;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.provider.ComputeDocumentDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.DocumentModelIndex;
import lombok.Data;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;

@Data
@Slf4j
public class DocumentRtServiceComputeDocumentDependencyValueProducer implements ComputeDocumentDependencyValueProducer {

	@NonNull
	private final IDocumentRtService documentRtService;
	@NonNull
	private final IDocumentServiceConfig serviceConfig;
	@NonNull
	private final DocumentRtServiceFactory serviceFactory;
	@NonNull
	private final IDocumentFactory documentFactory;
	@NonNull
	private final Map<String, DocumentModelIndex> modelIndexMap;

	@NonNull
	private final EvaluationDocumentPrefill evaluationDocumentPrefill;

	public DocumentRtServiceComputeDocumentDependencyValueProducer(
		@NonNull Map<String, DocumentModelIndex> documentModelIndexMap,
		@NonNull DocumentRtServiceFactory serviceFactory,
		@NonNull IDocumentServiceConfig documentServiceConfig,
		@NonNull IDocumentFactory documentFactory,
		@NonNull EvaluationDocumentPrefill evaluationDocumentPrefill
	) {
		this.serviceFactory = serviceFactory;
		this.modelIndexMap = documentModelIndexMap;
		this.serviceConfig = documentServiceConfig;
		this.documentFactory = documentFactory;
		this.evaluationDocumentPrefill = evaluationDocumentPrefill;
		this.documentRtService = serviceFactory.createDocumentRtService(documentServiceConfig);
	}

	@Override
	public ValueFactory<PrintDocument> produce(
		ComputeDocumentDependency dependency,
		PrintJob job,
		PrintEngine<?> engine,
		InternalCorePrintEngineRuntime runtime
	) {
		final var model = getModelIndexMap().get(dependency.getDocumentModelId());
		final var evaluationDocument = new EvaluationDocument(model);

		for (var reference : model.getHeader().getModelReferences()) {
			if (reference.equals(EvaluationDocumentModelCompiler.SyntheticModel)) {
				evaluationDocument.addDocumentFragment(dependency.getParameters());
			} else {
				evaluationDocument.addDocumentFragment(
					runtime.provide(new DocumentDependency(reference.getAlias())).get()
				);
			}
		}

		final var computedEvaluationDocument = new ComputedEvaluationDocument(evaluationDocument, evaluationDocument.getDocumentModelId());
		final var documentComputationResult = this.documentRtService.compute(
			computedEvaluationDocument,
			model.getHeader().getLocales().stream().findAny().orElseGet(job::getLocale)
		);

		documentComputationResult.getComputedFieldInstancesWithErrors().forEach(
			error -> log.error("Computing {} resulted in an error for the field {}. Details: {}", evaluationDocument.getDocumentModelId(), error.getPath(), error)
		);

		if (!documentComputationResult.noErrorOccurred()) {
			throw new PrintException("Error during Computation.");
		}

		final var mutableComputedDocument = MutablePrintDocument.from(computedEvaluationDocument.getResult(), model);
		documentComputationResult.applyTo(mutableComputedDocument, documentFactory);
		final var computedDocument = mutableComputedDocument.setImmutable();

		return () -> computedDocument;
	}

}
