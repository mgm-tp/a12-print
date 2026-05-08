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
import { Model } from "@com.mgmtp.a12.base/base-model-api/lib/main/model/index.js";
import { PrintModel } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

export function getModelReferencesMaps(printModel: PrintModel, documentModels: Model[], printModels: Model[]) {
	const referencedDocumentModels = getReferencedDocumentModels(documentModels, printModel);
	const documentModelMap = referencedDocumentModels.reduce((acc: Record<string, string>, model) => {
		acc[model.header.id] = JSON.stringify(model);
		return acc;
	}, {});

	const referencedPrintModels = getReferencedPrintModels(printModels, printModel);
	const printModelMap = referencedPrintModels.reduce((acc: Record<string, string>, model) => {
		acc[model.header.id] = JSON.stringify(model);
		return acc;
	}, {});
	return { documentModelMap, printModelMap };
}

function getReferencedDocumentModels(expandedDocumentModels: Model[], printModel: Model): Model[] {
	const referencedDocumentModels: Model[] = [];
	printModel.header.modelReferences?.forEach(reference => {
		if (reference.modelType === "document" && reference.purpose === "data binding") {
			const referencedDocumentModel = expandedDocumentModels.find(
				model => model.header.id === reference.reference
			);
			if (!referencedDocumentModel) {
				console.error(`Referenced document model ${reference.reference} not found`);
				return;
			}
			referencedDocumentModels.push(referencedDocumentModel);
		}
	});

	return referencedDocumentModels;
}

function getReferencedPrintModels(printModels: Model[], printModel: Model): Model[] {
	const referencedPrintModels: Model[] = [];
	printModel.header.modelReferences?.forEach(reference => {
		if (reference.modelType === "print" && reference.purpose === "DINTemplate") {
			const referencedDocumentModel = printModels.find(model => model.header.id === reference.reference);
			if (!referencedDocumentModel) {
				console.error(`Referenced print model ${reference.reference} not found`);
				return;
			}
			referencedPrintModels.push(referencedDocumentModel);
		}
	});

	return referencedPrintModels;
}
