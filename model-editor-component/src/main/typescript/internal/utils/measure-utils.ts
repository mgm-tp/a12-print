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

import { Measure, MeasureUnit, PrintModelEntity } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { DeepPartialRecursive } from "@com.mgmtp.a12.print/print-model-api/lib/utils/type-utils.js";

import { EditorConst } from "../constant/editor.js";

import { OmitId } from "./type-utils.js";

export interface PlainMeasurePosition {
	x: OmitId<Measure>;
	y: OmitId<Measure>;
}

export interface PlainMeasureDimensions {
	minWidth: OmitId<Measure>;
	minHeight: OmitId<Measure>;
}

export function createMmMeasureFromPx(pixel: number): Measure {
	const millimeter = EditorConst.PX_TO_MM(pixel);
	return createMmMeasure(millimeter);
}

export function createPlainMmMeasureFromPx(pixel: number): OmitId<Measure> {
	const millimeter = EditorConst.PX_TO_MM(pixel);
	return createPlainMmMeasure(millimeter);
}

export function createMmMeasure(millimeter: number): Measure {
	return createMeasure(MeasureUnit.Millimeter, millimeter);
}

export function createPlainMmMeasure(millimeter: number): OmitId<Measure> {
	return createMeasureWithoutId(MeasureUnit.Millimeter, millimeter);
}

export function changeMmMeasureValue(value: number, origin?: Measure): Measure {
	return origin
		? {
				...origin,
				value: value,
			}
		: createMmMeasure(value);
}

export function changePartialPercentMeasureValue(
	value: number,
	origin?: DeepPartialRecursive<Measure> & PrintModelEntity
): DeepPartialRecursive<Measure> & PrintModelEntity {
	return origin
		? {
				...origin,
				value,
			}
		: createPercentMeasure(value);
}

export function changePartialMmMeasureValue(
	value: number,
	origin?: DeepPartialRecursive<Measure> & PrintModelEntity
): DeepPartialRecursive<Measure> & PrintModelEntity {
	return origin
		? {
				...origin,
				value: value,
			}
		: createMmMeasure(value);
}

export function stringifyMeasure({ value, unit }: Measure): string {
	return `${value ?? ""}${unit === MeasureUnit.Percent ? "%" : "mm"}`;
}

export function getUnitSymbol(unit: MeasureUnit) {
	return MEASURE_UNIT_MAP[unit];
}

function createPercentMeasure(percent: number): Measure {
	return createMeasure(MeasureUnit.Percent, percent);
}

function createMeasure(unit: MeasureUnit, value: number): Measure {
	return {
		id: nanoid(),
		value: value,
		unit: unit,
	};
}

function createMeasureWithoutId(unit: MeasureUnit, value: number): OmitId<Measure> {
	return {
		value: value,
		unit: unit,
	};
}

const MEASURE_UNIT_MAP = {
	[MeasureUnit.Percent]: "%",
	[MeasureUnit.Millimeter]: "mm",
};
