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
/* eslint-disable @typescript-eslint/no-explicit-any */
import { nanoid } from "nanoid";

import {
	isPartialValidPlaceableReference,
	type PartialTextProperties,
	type PartialBorderProperties,
} from "../../model/partial.js";
import type { Alignment, BorderStyle, InputSource } from "../../model/index.js";
import { TEXT_STYLE } from "../../model/constant.js";

import { type DeepPartial } from "../type-utils.js";

import { type CloneContext } from "./type.js";
import { CloneTreeTrace } from "./clone-tree-trace.js";

export function clonePrintModelEntity<T extends object>(target: T) {
	return deepCloneObject({
		target,
		extraAssignFunc: (key, value) => {
			return key === "id" ? nanoid() : value;
		},
	});
}

export function deepCloneObject<T extends object>({
	target,
	extraAssignFunc,
}: {
	target: T;
	extraAssignFunc?: (key: string, value: any) => any;
}) {
	const keys: (keyof T)[] = Object.keys(target) as (keyof T)[];
	const newObject: Record<keyof T, any> = {} as T;
	for (const key of keys) {
		let value = target[key];
		if (extraAssignFunc) {
			value = extraAssignFunc(String(key), target[key]);
		}

		if (typeof value !== "object") {
			newObject[key] = value;
		} else if (Array.isArray(value)) {
			newObject[key] = deepCloneArray({
				array: value,
				extraAssignFunc: extraAssignFunc,
			});
		} else if (typeof value === "object" && value) {
			newObject[key] = deepCloneObject({
				target: value,
				extraAssignFunc,
			});
		}
	}

	return newObject;
}

export function deepCloneArray({
	array,
	extraAssignFunc,
}: {
	array: (string | number | object)[];
	extraAssignFunc?: (key: string, value: any) => any;
}) {
	const newArray: (string | number | object)[] = [];
	array.forEach(value => {
		if (typeof value !== "object") {
			newArray.push(value);
		} else if (Array.isArray(value)) {
			newArray.push(
				deepCloneArray({
					array: value,
					extraAssignFunc,
				})
			);
		} else if (typeof value === "object") {
			newArray.push(
				deepCloneObject({
					target: value,
					extraAssignFunc,
				})
			);
		}
	});

	return newArray;
}

function parentPlaceableId(trace: CloneTreeTrace): string | undefined {
	return trace.findParent(ref => isPartialValidPlaceableReference(ref))?.id;
}

/** An element reached through several references is collected once per reference, but belongs in a list once. */
export function dropDuplicateElements<T extends { readonly id?: string }>(elements: readonly T[]): T[] {
	const byId = new Map<string | undefined, T>();
	for (const element of elements) {
		if (!byId.has(element.id)) {
			byId.set(element.id, element);
		}
	}
	return [...byId.values()];
}

export function cloneInputSource<T>(
	context: CloneContext,
	input?: DeepPartial<InputSource<T>>,
	trace: CloneTreeTrace = new CloneTreeTrace([])
): DeepPartial<InputSource<T>> | undefined {
	if (!input) {
		return undefined;
	}
	let reference = input.reference;

	if (reference) {
		let newReference = parentPlaceableId(trace) ?? context.elementIdMap.get(reference);

		if (!newReference && context.getElement(reference)) {
			// the element this inherits from is cloned later - reserve the id it will pick up then
			newReference = nanoid();
			context.elementIdMap.set(reference, newReference);
		}

		if (!newReference) {
			throw new Error(
				"Could not get parent's placeable reference id from trace or get new reference id from context for reference " +
					reference
			);
		}

		reference = newReference;
	}
	return {
		...input,
		id: nanoid(),
		reference,
	};
}

export function cloneTextProperties(
	context: CloneContext,
	textProperties?: PartialTextProperties
): PartialTextProperties | undefined {
	if (!textProperties) {
		return undefined;
	}

	let textStyleId = textProperties.textStyleId;

	if (textStyleId && context.textStyleIdMap) {
		let textStyleValue = textStyleId.value;
		if (textStyleValue && textStyleValue !== TEXT_STYLE.NO_TEXT_STYLE_FALLBACK_ID) {
			const originalTextStyleValue = textStyleValue;
			textStyleValue = context.textStyleIdMap.get(originalTextStyleValue);

			if (!textStyleValue) {
				throw new Error(
					`Cannot find a new id for text style id ${originalTextStyleValue} while cloning text properties ${textProperties?.id}`
				);
			}
		}
		textStyleId = {
			...cloneInputSource(context, textStyleId),
			value: textStyleValue,
			id: nanoid(),
		};
	} else if (textStyleId) {
		textStyleId = cloneInputSource<string>(context, textStyleId);
	}

	return {
		id: nanoid(),
		bold: cloneInputSource<boolean>(context, textProperties.bold),
		italic: cloneInputSource<boolean>(context, textProperties.italic),
		underlined: cloneInputSource<boolean>(context, textProperties.underlined),
		color: cloneInputSource<string>(context, textProperties.color),
		backgroundColor: cloneInputSource<string>(context, textProperties.backgroundColor),
		alignment: cloneInputSource<Alignment>(context, textProperties.alignment),
		textStyleId,
	};
}

export function cloneBorderProperties(
	context: CloneContext,
	borderProperties?: PartialBorderProperties
): PartialBorderProperties | undefined {
	if (!borderProperties) {
		return undefined;
	}

	return {
		id: nanoid(),
		borderWidth: cloneInputSource<number>(context, borderProperties.borderWidth),
		borderColor: cloneInputSource<string>(context, borderProperties.borderColor),
		borderStyle: cloneInputSource<BorderStyle>(context, borderProperties.borderStyle),
	};
}
