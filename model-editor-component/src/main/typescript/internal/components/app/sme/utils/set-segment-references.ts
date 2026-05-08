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
import { nanoid } from "nanoid";

import { Model } from "@com.mgmtp.a12.base/base-model-api/lib/main/model/index.js";
import { PrintModelMarshaller } from "@com.mgmtp.a12.print/print-model-api-utils/lib/marshaller/index.js";
import {
	ModelReferenceEntity,
	PrintModel,
	SegmentReference,
	SegmentReferenceDirection,
	SegmentReferencePurpose,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { PrintValidationMode } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/validation/print-validator.js";

const printModelMarshaller = new PrintModelMarshaller();

export const setSegmentReferences = (model: Model, templateModel: Model): [Model, Model] => {
	const deserializerPrintModel = printModelMarshaller.deserialize(
		model as unknown as Record<string, unknown>,
		[],
		PrintValidationMode.SKIP_REFERENCES
	);

	const deserializerTemplatePrintModel = printModelMarshaller.deserialize(
		templateModel as unknown as Record<string, unknown>,
		[],
		PrintValidationMode.SKIP_REFERENCES
	);

	const printModel = deserializerPrintModel.result;
	const templatePrintModel = deserializerTemplatePrintModel.result;

	if (!printModel || !templatePrintModel) {
		throw new Error("print models cannot be deserialized");
	}

	const outgoingId = printModel.header.id;
	const incomingId = templatePrintModel.header.id;

	const incomingReference: SegmentReference = {
		id: nanoid(),
		referenceModel: outgoingId,
		purpose: SegmentReferencePurpose.DINTemplate,
		direction: SegmentReferenceDirection.IncomingReference,
		refIds: [],
	};

	const outgoingReference: SegmentReference = {
		id: nanoid(),
		referenceModel: incomingId,
		purpose: SegmentReferencePurpose.DINTemplate,
		direction: SegmentReferenceDirection.OutgoingReference,
		refIds: [],
	};

	const modelReference: ModelReferenceEntity = {
		id: nanoid(),
		reference: incomingId,
		purpose: SegmentReferencePurpose.DINTemplate,
		modelType: "print",
		alias: incomingId,
	};

	const updatedTemplatePrintModel = setReference(templatePrintModel, incomingReference);
	let updatedPrintModel = setReference(printModel, outgoingReference);
	updatedPrintModel = setModelReference(updatedPrintModel, modelReference);

	const serializerPrintModel = printModelMarshaller.serialize(
		updatedPrintModel,
		[],
		PrintValidationMode.SKIP_REFERENCES
	);

	const serializerTemplatePrintModel = printModelMarshaller.serialize(
		updatedTemplatePrintModel,
		[],
		PrintValidationMode.SKIP_REFERENCES
	);

	const updatedModel = serializerPrintModel.result;
	const updateTemplateModel = serializerTemplatePrintModel.result;

	if (!updatedModel || !updateTemplateModel) {
		throw new Error("print models cannot be serialized");
	}

	return [updatedModel, updateTemplateModel];
};

const setReference = (printModel: PrintModel, reference: SegmentReference): PrintModel => {
	return {
		...printModel,
		content: {
			...printModel.content,
			segments: {
				...printModel.content.segments,
				references: printModel.content.segments.references.find(
					ref => ref.referenceModel === reference.referenceModel
				)
					? printModel.content.segments.references
					: [...printModel.content.segments.references, reference],
			},
		},
	};
};
const setModelReference = (printModel: PrintModel, reference: ModelReferenceEntity): PrintModel => {
	return {
		...printModel,
		header: {
			...printModel.header,
			modelReferences: printModel.header?.modelReferences?.find(ref => ref.reference === reference.reference)
				? printModel.header.modelReferences
				: [...(printModel.header?.modelReferences || []), reference],
		},
	};
};
