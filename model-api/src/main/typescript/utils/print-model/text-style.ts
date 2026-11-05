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

import { type PartialTextStyle, type PrintModelEntity } from "../../model/index.js";

import { deepCloneObject } from "./base.js";

export function cloneTextStyles<Reference extends PrintModelEntity & { readonly refId?: string }>(
	textStyles: readonly string[],
	textStyleDefinitions: readonly PartialTextStyle[],
	textStyleReferences: readonly Reference[] = []
) {
	const textStyleIdMap = new Map<string, string>();
	const clonedTextStyles: PartialTextStyle[] = [];
	const newTextStyles: string[] = [];
	const clonedTextStyleReferences: Reference[] = [];

	textStyles?.forEach(textStyleId => {
		const targetTextStyle = textStyleDefinitions?.find(textStyle => textStyle.id === textStyleId);
		if (targetTextStyle) {
			const clonedTextStyle = deepCloneObject({
				target: targetTextStyle,
				extraAssignFunc: (key, value) => {
					return key === "id" ? nanoid() : value;
				},
			});

			textStyleIdMap.set(textStyleId, clonedTextStyle.id);
			newTextStyles.push(clonedTextStyle.id);
			clonedTextStyles.push(clonedTextStyle);
			return;
		}

		// the list also names text styles a fragment model provides - the reference is what this model owns
		const textStyleReference = textStyleReferences.find(reference => reference.id === textStyleId);
		if (!textStyleReference) {
			return;
		}

		const clonedReference = deepCloneObject({
			target: textStyleReference,
			extraAssignFunc: (key, value) => (key === "id" ? nanoid() : value),
		});

		textStyleIdMap.set(textStyleId, clonedReference.id);
		if (textStyleReference.refId) {
			// elements may address the fragment style by the id it has in the fragment model, which stays
			textStyleIdMap.set(textStyleReference.refId, textStyleReference.refId);
		}
		newTextStyles.push(clonedReference.id);
		clonedTextStyleReferences.push(clonedReference);
	});

	return {
		newTextStyles,
		clonedTextStyles,
		clonedTextStyleReferences,
		textStyleIdMap,
	};
}
