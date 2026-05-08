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

import com.mgmtp.a12.kernel.md.model.api.IElement;
import com.mgmtp.a12.kernel.md.model.api.IField;
import com.mgmtp.a12.kernel.md.model.api.fieldtypes.IFieldType;
import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.runtime.internal.CoreDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.constant.Constants;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalCorePrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.manager.ManagedPrintJob;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.DocumentModelIndex;
import com.mgmtp.a12.print.model.api.model.element.base.ComputationAlternative;
import org.apache.commons.collections4.CollectionUtils;

import java.util.List;
import java.util.Optional;

/**
 * This class is used to get field type of field defined in DocumentModel.
 */
public class FieldTypeFromPathDependencyValueProducer implements CoreDependencyValueProvider<Optional<IFieldType>, FieldTypeFromPathValueDependency> {
	@Override
	public ValueFactory<Optional<IFieldType>> produce(FieldTypeFromPathValueDependency dependency, PrintJob job,
													  PrintEngine<?> engine, InternalCorePrintEngineRuntime runtime
	) {
		List<ComputationAlternative> computationAlternatives = dependency.getComputationAlternatives();

		if (CollectionUtils.isEmpty(computationAlternatives)) {
			return Optional::empty;
		}
		String referencedFieldPath = computationAlternatives.getFirst().getOperation();
		if (referencedFieldPath.startsWith(Constants.OPEN_SQUARE_BRACKET)) {
			referencedFieldPath = referencedFieldPath
				.replace(Constants.OPEN_SQUARE_BRACKET, Constants.EMPTY_STRING)
				.replace(Constants.CLOSED_SQUARE_BRACKET, Constants.EMPTY_STRING);
			String[] subPaths = referencedFieldPath.split(Constants.SLASH);
			return checkSubPaths(job, subPaths, referencedFieldPath);
		}
		return Optional::empty;
	}

	private static ValueFactory<Optional<IFieldType>> checkSubPaths(
		PrintJob job,
		String[] subPaths,
		String referencedFieldPath
	) {
		if (subPaths.length > 1) {
			referencedFieldPath = referencedFieldPath.substring(referencedFieldPath.indexOf(Constants.SLASH));
			final String fieldPath = referencedFieldPath;

			if (job instanceof ManagedPrintJob managedPrintJob) {
				DocumentModelIndex documentModel = managedPrintJob.getPrintModelCompilationContext()
						.getDocumentModelById(subPaths[0]);
				if (documentModel != null) {
					Optional<IElement> element = documentModel.getByPath(fieldPath);
					if (element.isPresent() && element.get() instanceof IField field) {
						return () -> Optional.of(field.getFieldType());
					}
				}
			}
		}
		return Optional::empty;
	}
}
