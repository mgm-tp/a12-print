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
} from "@com.mgmtp.a12.print/print-model-api/model";
import { PRINT_MODEL_VERSION } from "@com.mgmtp.a12.print/print-model-api/constant";
import type { PrintModelDTO } from "@com.mgmtp.a12.print/print-model-api/generated/a12internal";

export const createPrintModel = (modelName: string, roles: Array<{ roleName: string }>): PrintModelDTO => {
	return {
		header: {
			id: modelName,
			modelType: "print",
			modelVersion: PRINT_MODEL_VERSION,
			description: "Description",
			locales: [],
			annotations: roles.length
				? [
						{
							name: "roles",
							value: roles.map(role => role.roleName).join(","),
						},
					]
				: [],
		},
		content: {
			id: PRINT_MODEL_CONTENT_LOG_ID,
			general: {
				id: PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
				metadata: {
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
				},
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
