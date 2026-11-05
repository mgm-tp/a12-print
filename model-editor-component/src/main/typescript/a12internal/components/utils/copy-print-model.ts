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
import type { Model, Header } from "@com.mgmtp.a12.base/base-model-api";
import { PrintModelMarshaller } from "@com.mgmtp.a12.print/print-model-api-utils/marshaller";
import { clonePrintModel } from "@com.mgmtp.a12.print/print-model-api/utils";
import { clonePrintModelAsFragment } from "@com.mgmtp.a12.print/print-model-api/a12internal";
import { FRAGMENT_MODEL_REFERENCE_PURPOSE } from "@com.mgmtp.a12.print/print-model-api/model";

import { FragmentUtils } from "../../../internal/utils/fragment-utils.js";

const printModelMarshaller = new PrintModelMarshaller();

export const copyPrintModel = (model: Model, newName: string): Model => {
	const deserializerPrintModel = printModelMarshaller.deserialize(model as unknown as Record<string, unknown>, {
		html: false,
	});

	if (!deserializerPrintModel.result) {
		throw new Error(`Model ${model.header.id} cannot be deserialized`);
	}

	const clonedPrintModel = clonePrintModel(deserializerPrintModel.result, newName);

	const serializerPrintModel = printModelMarshaller.serialize(clonedPrintModel, { html: false });

	if (!serializerPrintModel.result) {
		throw new Error(`Model ${clonedPrintModel.header.id} cannot be serialized`);
	}

	return serializerPrintModel.result;
};

export const copyAsFragmentModel = (model: Model, newName: string): Model => {
	const deserializerPrintModel = printModelMarshaller.deserialize(model as unknown as Record<string, unknown>, {
		html: false,
	});

	if (!deserializerPrintModel.result) {
		throw new Error(`Model ${model.header.id} cannot be deserialized`);
	}

	const fragmentModel = clonePrintModelAsFragment(deserializerPrintModel.result, newName);

	const serializerPrintModel = printModelMarshaller.serialize(fragmentModel, { html: false });

	if (!serializerPrintModel.result) {
		throw new Error(`Model ${fragmentModel.header.id} cannot be serialized`);
	}

	return serializerPrintModel.result;
};

/**
 * Cheap pre-check for the copy action, working on the model header alone.
 *
 * It covers the conditions under which {@link clonePrintModelAsFragment} throws, so that the action can be disabled
 * before the model is deserialized.
 */
export const canCopyAsFragmentModel = (header: Header): boolean => {
	return !(
		FragmentUtils.isFragmentModelHeader(header) ||
		hasFragmentModelReference(header) ||
		hasPrintModelReference(header) ||
		hasMultipleDocumentModelReference(header)
	);
};

const hasFragmentModelReference = (header: Header): boolean => {
	return !!header.modelReferences?.some(ref => ref.purpose === FRAGMENT_MODEL_REFERENCE_PURPOSE);
};

const hasPrintModelReference = (header: Header): boolean => {
	return !!header.modelReferences?.some(
		ref => ref.modelType === "print" && ref.purpose !== FRAGMENT_MODEL_REFERENCE_PURPOSE
	);
};

const hasMultipleDocumentModelReference = (header: Header): boolean => {
	return header.modelReferences
		? header.modelReferences.filter(ref => ref.modelType === "document").length > 1
		: false;
};
