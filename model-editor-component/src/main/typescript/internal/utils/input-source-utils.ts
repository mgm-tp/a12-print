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

import { PossibleInputSource } from "@com.mgmtp.a12.print/print-model-api/lib/input-source/input-source.js";
import {
	InputSource,
	MeasureInputSource,
	MeasureUnit,
	PrintModelEntity,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { DeepPartialRecursive } from "@com.mgmtp.a12.print/print-model-api/lib/utils/type-utils.js";

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

export function changeInputSource<T>(
	source: PossibleInputSource,
	path: string,
	origin?: Partial<InputSource<T>> & PrintModelEntity
): Partial<InputSource<T | undefined>> & PrintModelEntity {
	if (source === origin?.source) {
		return origin;
	}

	return origin
		? {
				...origin,
				source,
				path,
				value: undefined,
			}
		: createPlainInputSource(source, path);
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
