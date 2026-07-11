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
import { PossibleInputSource } from "@com.mgmtp.a12.print/print-model-api/input-source";

import type * as OldModel from "../02-embeded-images/print-model.js";

import type * as NewModel from "./print-model.js";

export default function transformLineElementBorder(oldModel: OldModel.PrintModelDTO): NewModel.PrintModelDTO {
	const transformedElementDefinitions = oldModel.content.elementDefinitions?.map(element =>
		transformElementDefinition(element)
	);
	return {
		...oldModel,
		content: {
			...oldModel.content,
			elementDefinitions: transformedElementDefinitions,
		},
	};
}

function transformElementDefinition(element: OldModel.ElementDefinitionsDTO): NewModel.ElementDefinitionsDTO {
	if (element.type === "Line") {
		if (element.borderProperties?.borderStyle?.source === PossibleInputSource.UNSET) {
			return {
				...element,
				borderProperties: {
					borderStyle: {
						...element.borderProperties.borderStyle,
						source: PossibleInputSource.INPUT,
						value: "Solid",
					},
					borderWidth: {
						...element.borderProperties.borderWidth!,
						value:
							element.borderProperties.borderWidth?.source === PossibleInputSource.DEFAULT
								? 2
								: typeof element.borderProperties.borderWidth?.value === "number"
									? element.borderProperties.borderWidth.value * 2
									: 0,
						source: PossibleInputSource.INPUT,
					},
					borderColor: element.borderProperties.borderColor,
				},
			};
		}
	}
	return element as NewModel.ElementDefinitionsDTO;
}
