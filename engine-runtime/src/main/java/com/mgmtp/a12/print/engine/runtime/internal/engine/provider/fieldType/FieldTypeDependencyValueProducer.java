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
package com.mgmtp.a12.print.engine.runtime.internal.engine.provider.fieldType;

import com.mgmtp.a12.kernel.md.model.api.IField;
import com.mgmtp.a12.kernel.md.model.api.fieldtypes.IFieldType;
import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.internal.CoreDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.loader.DocumentModelDependency;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalCorePrintEngineRuntime;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class FieldTypeDependencyValueProducer implements CoreDependencyValueProvider<IFieldType, FieldTypeDependency> {
	@Override
	public ValueFactory<IFieldType> produce(FieldTypeDependency dependency, PrintJob job, PrintEngine<?> engine, InternalCorePrintEngineRuntime runtime) {
		final var printDocumentContext = dependency.getPrintDocumentContext();
		final var path = dependency.getPath();
		final var id = dependency.getId();

		var model = dependency.getModel();

		if(model == null){
			model = printDocumentContext.getDocumentModelId();
			log.warn("Model is null for Field: {}, assuming context DocumentModel {}.", id, model);
		}

		final var documentModel = runtime.provide(new DocumentModelDependency(model)).get();
		final var field = documentModel
			.getDocumentModelSearchService()
			.getByPath(path)
			.filter(e -> e instanceof IField)
			.map(e -> (IField) e)
			.orElseThrow(() -> new PrintException(String.format("Field %s does not exists in DocumentModel %s", path, documentModel.getHeader().getId())));
		return () -> field
			.getEffectiveType()
			.orElseThrow(() -> new PrintException(String.format("Unable to resolve the effectiveFieldType for Field %s in DocumentModel %s", path, documentModel.getHeader().getId())));
	}
}
