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

import type {
	ElementType,
	PartialAnyPrintModelElement,
	PrintModelElement,
} from "@com.mgmtp.a12.print/print-model-api/model";
import {
	PartialCalculation,
	PartialField,
	PartialPageNumber,
	PartialPageNumberTotal,
} from "@com.mgmtp.a12.print/print-model-api/model";

const DEFAULT_FIELD_TEXT = "field-entity";
const DEFAULT_CALC_TEXT = "calc-entity";

export const getEntityDisplayText = (element: PartialAnyPrintModelElement): string => {
	if (PartialField.isInstance(element)) {
		return element.field?.path?.split("/").pop() ?? DEFAULT_FIELD_TEXT;
	}

	if (PartialCalculation.isInstance(element)) {
		return element.calculation?.name || DEFAULT_CALC_TEXT;
	}

	if (PartialPageNumber.isInstance(element) || PartialPageNumberTotal.isInstance(element)) {
		return element.type;
	}

	return "unknown-entity";
};

export const createEntityElement = (insertEntityType: string): PrintModelElement => {
	let newEntityElement: PartialAnyPrintModelElement = { id: nanoid(), type: insertEntityType as ElementType };

	if (PartialField.isInstance(newEntityElement) || PartialCalculation.isInstance(newEntityElement)) {
		newEntityElement = {
			...newEntityElement,
			[String(insertEntityType).toLowerCase()]: {
				id: nanoid(),
			},
		};
	}

	return newEntityElement;
};
