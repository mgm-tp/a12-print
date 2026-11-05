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

import {
	PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
	PRINT_MODEL_CONTENT_LOG_ID,
	type PrintModelSubType,
} from "@com.mgmtp.a12.print/print-model-api/model";
import { PRINT_MODEL_VERSION } from "@com.mgmtp.a12.print/print-model-api/constant";
import { MODEL_SUB_TYPE_ANNOTATION_NAME } from "@com.mgmtp.a12.print/print-model-api/model";
import type {
	AnnotationsDTO,
	MetadataDTO,
	PrintModelDTO,
} from "@com.mgmtp.a12.print/print-model-api/generated/a12internal";

const createAnnotations = (
	roles: Array<{ roleName: string }>,
	modelSubType: PrintModelSubType | undefined
): AnnotationsDTO[] => {
	const annotations: AnnotationsDTO[] = [];
	if (roles.length) {
		annotations.push({ name: "roles", value: roles.map(role => role.roleName).join(",") });
	}
	if (modelSubType) {
		annotations.push({ name: MODEL_SUB_TYPE_ANNOTATION_NAME, value: modelSubType });
	}
	return annotations;
};

const createEmptyMetadata = (): MetadataDTO => ({
	id: nanoid(),
	titleComputation: [],
	descriptionComputation: [],
	languageComputation: [],
	authorComputation: [],
});

const createDefaultMetadata = (modelName: string): MetadataDTO => ({
	id: nanoid(),
	titleComputation: [
		{
			id: nanoid(),
			operation: `"${modelName}"`,
		},
	],
	descriptionComputation: [
		{
			id: nanoid(),
			operation: '"Description"',
		},
	],
	languageComputation: [
		{
			id: nanoid(),
			operation: '"DE"',
		},
	],
	authorComputation: [
		{
			id: nanoid(),
			operation: '"Print Model Editor"',
		},
	],
});

/**
 * Creates an empty print model.
 *
 * @param modelName Id of the new model.
 * @param roles Roles the new model is annotated with.
 * @param modelSubType Sub type of the new model.
 * @see createEmptyMetadata
 */
export const createPrintModel = (
	modelName: string,
	roles: Array<{ roleName: string }>,
	modelSubType?: PrintModelSubType
): PrintModelDTO => {
	const isFragmentModel = modelSubType === "fragment";
	return {
		header: {
			id: modelName,
			modelType: "print",
			modelVersion: PRINT_MODEL_VERSION,
			description: "Description",
			locales: [],
			annotations: createAnnotations(roles, modelSubType),
		},
		content: {
			id: PRINT_MODEL_CONTENT_LOG_ID,
			general: {
				id: PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
				metadata: isFragmentModel ? createEmptyMetadata() : createDefaultMetadata(modelName),
				structure: [],
				segmentDefaults: {
					id: nanoid(),
					fontSize: 12,
				},
			},
			segments: {
				id: nanoid(),
				definitions: [],
				references: [],
			},
			elementDefinitions: [],
		},
	};
};
