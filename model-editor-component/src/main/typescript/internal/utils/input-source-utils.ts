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

import type { InheritedValueResolver } from "@com.mgmtp.a12.print/print-model-api/input-source";
import { InputValueSourceResolver, PossibleInputSource } from "@com.mgmtp.a12.print/print-model-api/input-source";
import type {
	InputSource,
	MeasureInputSource,
	PrintModelEntity,
	PartialBorderProperties,
	PartialTextProperties,
} from "@com.mgmtp.a12.print/print-model-api/model";
import { MeasureUnit } from "@com.mgmtp.a12.print/print-model-api/model";
import type { DeepPartialRecursive } from "@com.mgmtp.a12.print/print-model-api/utils";

import { getUnitSymbol } from "./measure-utils.js";

export const changeInputValue = <T>(
	value: T | undefined,
	origin: Partial<InputSource<T>> & PrintModelEntity
): Partial<InputSource<T>> & PrintModelEntity => {
	if (origin.source !== PossibleInputSource.INPUT) {
		throw new Error("Cannot set value for source which is not INPUT");
	}

	return {
		...origin,
		value,
	};
};

/**
 * @param inheritedFrom the id an INHERITED source takes its value from - every other source drops it, so a
 * property that no longer inherits stops pointing at something it does not read.
 */
export function changeInputSource<T>(
	source: PossibleInputSource,
	path: string,
	origin?: Partial<InputSource<T>> & PrintModelEntity,
	inheritedFrom?: string
): Partial<InputSource<T | undefined>> & PrintModelEntity {
	if (source === origin?.source) {
		return origin;
	}

	// only an inherited value comes from somewhere else, every other source carries its value itself
	const reference = source === PossibleInputSource.INHERITED ? inheritedFrom : undefined;

	return origin
		? {
				...origin,
				source,
				path,
				value: undefined,
				reference,
			}
		: { ...createPlainInputSource(source, path), reference };
}
export const changeMeasureInputValue = (
	value: number | undefined,
	origin: DeepPartialRecursive<MeasureInputSource> & PrintModelEntity
): DeepPartialRecursive<MeasureInputSource> & PrintModelEntity => {
	if (origin.source !== PossibleInputSource.INPUT) {
		throw new Error("Cannot set value for source which is not INPUT");
	}

	return {
		...origin,
		value,
	};
};

export const createPlainInputSource = (source: PossibleInputSource, path: string): InputSource<undefined> => {
	return {
		source,
		path,
		id: nanoid(),
	};
};

export const changePercentInputSource = (
	source: PossibleInputSource,
	path: string,
	origin?: DeepPartialRecursive<MeasureInputSource> & PrintModelEntity
): DeepPartialRecursive<MeasureInputSource> & PrintModelEntity => {
	const newInputSource = origin
		? {
				...origin,
				source,
				path,
				value: undefined,
			}
		: createPlainInputSource(source, path);

	return { ...newInputSource, unit: MeasureUnit.Percent };
};

export const changeMMInputSource = (
	source: PossibleInputSource,
	path: string,
	origin?: DeepPartialRecursive<MeasureInputSource> & PrintModelEntity
): DeepPartialRecursive<MeasureInputSource> & PrintModelEntity => {
	const newInputSource = origin
		? {
				...origin,
				source,
				path,
				value: undefined,
			}
		: createPlainInputSource(source, path);

	return { ...newInputSource, unit: MeasureUnit.Millimeter };
};

export const stringifyMeasureInputValue = (
	input: (DeepPartialRecursive<MeasureInputSource> & PrintModelEntity) | undefined,
	value?: number
) => {
	if (input?.source === PossibleInputSource.INPUT || input?.source === PossibleInputSource.DEFAULT) {
		if (!input.unit) {
			throw new Error("Unit is undefined");
		}
		return value ? `${value}${getUnitSymbol(input.unit)}` : "";
	}

	return "";
};

export const stringifyInputValue = (value: number | string | undefined) => {
	if (typeof value === "number") {
		return String(value);
	}
	return value;
};

export const parseNumberInputValue = (value: number | string | undefined) => {
	if (typeof value === "string") {
		if (isNaN(Number(value))) {
			throw Error(`Cannot convert ${value} to number`);
		}
		return value.trim() ? Number(value) : undefined;
	}
	return value;
};

export const createTextPropertiesInheritedResolver = (
	textProperties: PartialTextProperties | undefined
): {
	inheritedTextStyleIdResolver: InheritedValueResolver<string>;
	inheritedBoldResolver: InheritedValueResolver<boolean>;
	inheritedItalicResolver: InheritedValueResolver<boolean>;
	inheritedUnderlinedResolver: InheritedValueResolver<boolean>;
	inheritedColorResolver: InheritedValueResolver<string>;
	inheritedBackgroundColorResolver: InheritedValueResolver<string>;
	inheritedAlignmentResolver: InheritedValueResolver<string>;
} => ({
	inheritedTextStyleIdResolver: (_inputSource, el, property) =>
		InputValueSourceResolver.getSourceStringValue(textProperties?.textStyleId, el, property),
	inheritedBoldResolver: (_inputSource, el, property) =>
		InputValueSourceResolver.getSourceBooleanValue(textProperties?.bold, el, property),
	inheritedItalicResolver: (_inputSource, el, property) =>
		InputValueSourceResolver.getSourceBooleanValue(textProperties?.italic, el, property),
	inheritedUnderlinedResolver: (_inputSource, el, property) =>
		InputValueSourceResolver.getSourceBooleanValue(textProperties?.underlined, el, property),
	inheritedColorResolver: (_inputSource, el, property) =>
		InputValueSourceResolver.getSourceStringValue(textProperties?.color, el, property),
	inheritedBackgroundColorResolver: (_inputSource, el, property) =>
		InputValueSourceResolver.getSourceStringValue(textProperties?.backgroundColor, el, property),
	inheritedAlignmentResolver: (_inputSource, el, property) =>
		InputValueSourceResolver.getSourceStringValue(textProperties?.alignment, el, property),
});

export const createBorderPropertiesInheritedResolver = (
	borderProperties: PartialBorderProperties | undefined
): {
	inheritedWidthResolver: InheritedValueResolver<string | number>;
	inheritedStyleResolver: InheritedValueResolver<string>;
	inheritedColorResolver: InheritedValueResolver<string>;
} => ({
	inheritedWidthResolver: (_inputSource, el, property) =>
		InputValueSourceResolver.getSourceInputValue<string | number>(
			borderProperties?.borderWidth,
			el,
			property,
			value => value
		),
	inheritedStyleResolver: (_inputSource, el, property) =>
		InputValueSourceResolver.getSourceStringValue(borderProperties?.borderStyle, el, property),
	inheritedColorResolver: (_inputSource, el, property) =>
		InputValueSourceResolver.getSourceStringValue(borderProperties?.borderColor, el, property),
});
