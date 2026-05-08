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
import { PrintValidationMode } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/validation/print-validator.js";
import { PrintModelMarshaller } from "@com.mgmtp.a12.print/print-model-api-utils/lib/marshaller/index.js";
import { clonePrintModel } from "@com.mgmtp.a12.print/print-model-api/lib/utils/print-model/index.js";

const printModelMarshaller = new PrintModelMarshaller();

export const copyPrintModel = (model: Model, newName: string): Model => {
	const deserializerPrintModel = printModelMarshaller.deserialize(
		model as unknown as Record<string, unknown>,
		[],
		PrintValidationMode.SKIP_REFERENCES
	);

	if (!deserializerPrintModel.result) {
		throw new Error(`Model ${model.header.id} cannot be deserialized`);
	}

	const clonedPrintModel = clonePrintModel(deserializerPrintModel.result, newName);

	const serializerPrintModel = printModelMarshaller.serialize(
		clonedPrintModel,
		[],
		PrintValidationMode.SKIP_REFERENCES
	);

	if (!serializerPrintModel.result) {
		throw new Error(`Model ${clonedPrintModel.header.id} cannot be serialized`);
	}

	return serializerPrintModel.result;
};
