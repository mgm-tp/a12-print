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

import type * as OldModel from "../../version-3.1.0/print-model.js";

import type * as NewModel from "./print-model.js";

export function createComputations(
	operation: string | undefined,
	defaultValue: string
): NewModel.ComputationAlternativesDTO[] {
	const value = operation ?? defaultValue;
	return [
		{
			id: nanoid(),
			operation: `"${value}"`,
			precondition: undefined,
		},
	];
}

export function transformMetaDataComputation(oldModel: OldModel.PrintModelDTO): NewModel.PrintModelDTO {
	if (!oldModel.content.general) {
		return oldModel;
	}

	const { details, title, id, ...restGeneral } = oldModel.content.general;

	return {
		...oldModel,
		content: {
			...oldModel.content,
			general: {
				id: id,
				metadata: {
					id: details?.id ?? nanoid(),
					titleComputation: createComputations(title, oldModel.header.id),
					descriptionComputation: createComputations(oldModel.header.description, "Description"),
					languageComputation: createComputations(details?.language, "DE"),
					authorComputation: createComputations(details?.author, "Print Model Editor"),
				},
				...restGeneral,
			},
		},
	};
}
