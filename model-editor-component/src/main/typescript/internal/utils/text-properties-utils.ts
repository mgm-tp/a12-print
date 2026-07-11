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
import type { PartialTextProperties, Styleable } from "@com.mgmtp.a12.print/print-model-api/model";
import { PossibleInputSource } from "@com.mgmtp.a12.print/print-model-api/input-source";

export function isStyleable(element: unknown): element is Styleable {
	return typeof element === "object" && element !== null && "textProperties" in element;
}

const TEXT_PROPERTY_KEYS: ReadonlyArray<keyof Omit<PartialTextProperties, "id">> = [
	"textStyleId",
	"color",
	"backgroundColor",
	"bold",
	"italic",
	"underlined",
	"alignment",
];

/**
 * Returns true if any text property has a non-INHERITED source (INPUT or DEFAULT).
 * Use this for Expression elements in table columns, where the clean state is all-INHERITED.
 */
export function hasNonInheritedTextProperties(textProperties: PartialTextProperties | undefined): boolean {
	if (!textProperties) {
		return false;
	}
	return TEXT_PROPERTY_KEYS.some(key => {
		const prop = textProperties[key];
		return prop?.source === PossibleInputSource.INPUT || prop?.source === PossibleInputSource.DEFAULT;
	});
}

/**
 * Returns true if textProperties exists at all (any source, including INHERITED).
 * Use this for Field and Calculation elements, where the clean state is undefined.
 */
export function hasAnyTextProperties(textProperties: PartialTextProperties | undefined): boolean {
	return textProperties !== undefined;
}
