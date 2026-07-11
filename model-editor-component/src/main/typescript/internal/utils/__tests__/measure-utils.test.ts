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
import { MeasureUnit } from "@com.mgmtp.a12.print/print-model-api/model";

import {
	changeMmMeasureValue,
	changePartialMmMeasureValue,
	changePartialPercentMeasureValue,
	createMmMeasure,
	createMmMeasureFromPx,
	createPlainMmMeasure,
	createPlainMmMeasureFromPx,
	stringifyMeasure,
} from "../measure-utils.js";

describe("measure utils", () => {
	describe("createMmMeasureFromPx", () => {
		it("should result in mm measure", () => {
			const result = createMmMeasureFromPx(121);
			expect(result.unit).toEqual(MeasureUnit.Millimeter);
			expect(result.value).toBeDefined();
			expect(result.id).toBeDefined();
		});

		it("should return correct value with input as multiples of PX_STEP", () => {
			expect(createMmMeasureFromPx(0).value).toBe(0);
			expect(createMmMeasureFromPx(4).value).toBe(1);
			expect(createMmMeasureFromPx(128).value).toBe(32);
		});

		it("should return correct value with input not as multiples of PX_STEP", () => {
			expect(createMmMeasureFromPx(1).value).toBe(0);
			expect(createMmMeasureFromPx(6).value).toBe(1);
			expect(createMmMeasureFromPx(131).value).toBe(32);
		});
	});

	describe("createPlainMmMeasureFromPx", () => {
		it("should result in mm measure without id", () => {
			const result = createPlainMmMeasureFromPx(121);
			expect(result.unit).toEqual(MeasureUnit.Millimeter);
			expect(result.value).toBeDefined();
		});

		it("should return correct value with input as multiples of PX_STEP", () => {
			expect(createPlainMmMeasureFromPx(0).value).toBe(0);
			expect(createPlainMmMeasureFromPx(8).value).toBe(2);
			expect(createPlainMmMeasureFromPx(32).value).toBe(8);
		});

		it("should return correct value with input not as multiples of PX_STEP", () => {
			expect(createPlainMmMeasureFromPx(2).value).toBe(0);
			expect(createPlainMmMeasureFromPx(5).value).toBe(1);
			expect(createPlainMmMeasureFromPx(129).value).toBe(32);
		});
	});

	describe("createMmMeasure", () => {
		it("should result in mm measure", () => {
			const result = createMmMeasure(20);
			expect(result.unit).toEqual(MeasureUnit.Millimeter);
			expect(result.value).toBeDefined();
			expect(result.id).toBeDefined();
		});

		it("should return correct value", () => {
			expect(createMmMeasure(0).value).toBe(0);
			expect(createMmMeasure(8).value).toBe(8);
		});
	});

	describe("createPlainMmMeasure", () => {
		it("should result in mm measure without id", () => {
			const result = createPlainMmMeasure(20);
			expect(result.unit).toEqual(MeasureUnit.Millimeter);
			expect(result.value).toBeDefined();
		});

		it("should return correct value", () => {
			expect(createPlainMmMeasure(0).value).toBe(0);
			expect(createPlainMmMeasure(4).value).toBe(4);
		});
	});

	describe("changeMmMeasureValue", () => {
		it("should result in mm measure when origin measure is not given", () => {
			const result = changeMmMeasureValue(20);
			expect(result.unit).toEqual(MeasureUnit.Millimeter);
			expect(result.value).toEqual(20);
			expect(result.id).toBeDefined();
		});
		it("should keep measure unit when origin measure is given", () => {
			const percentMeasure = {
				id: "foo-id",
				value: 10,
				unit: MeasureUnit.Percent,
			};
			const percentMeasureChanged = changeMmMeasureValue(20, percentMeasure);
			expect(percentMeasureChanged).toEqual({
				id: "foo-id",
				value: 20,
				unit: MeasureUnit.Percent,
			});

			const mmMeasure = {
				id: "bar-id",
				value: 20,
				unit: MeasureUnit.Millimeter,
			};
			const mmMeasureChanged = changeMmMeasureValue(51, mmMeasure);
			expect(mmMeasureChanged).toEqual({
				id: "bar-id",
				value: 51,
				unit: MeasureUnit.Millimeter,
			});
		});
	});

	describe("changePartialPercentMeasureValue", () => {
		it("should result in percent measure when origin measure is not given", () => {
			const result = changePartialPercentMeasureValue(20);
			expect(result.unit).toEqual(MeasureUnit.Percent);
			expect(result.value).toEqual(20);
			expect(result.id).toBeDefined();
		});
		it("should keep measure unit when origin measure is given", () => {
			const percentMeasure = {
				id: "foo-id",
				unit: MeasureUnit.Percent,
			};
			const percentMeasureChanged = changePartialPercentMeasureValue(20, percentMeasure);
			expect(percentMeasureChanged).toEqual({
				id: "foo-id",
				value: 20,
				unit: MeasureUnit.Percent,
			});

			const mmMeasure = {
				id: "bar-id",
				value: 20,
				unit: MeasureUnit.Millimeter,
			};
			const mmMeasureChanged = changePartialPercentMeasureValue(51, mmMeasure);
			expect(mmMeasureChanged).toEqual({
				id: "bar-id",
				value: 51,
				unit: MeasureUnit.Millimeter,
			});
		});
	});

	describe("changePartialMmMeasureValue", () => {
		it("should result in mm measure when origin measure is not given", () => {
			const result = changePartialMmMeasureValue(20);
			expect(result.unit).toEqual(MeasureUnit.Millimeter);
			expect(result.value).toEqual(20);
			expect(result.id).toBeDefined();
		});
		it("should keep measure unit when origin measure is given", () => {
			const percentMeasure = {
				id: "foo-id",
				unit: MeasureUnit.Percent,
			};
			const percentMeasureChanged = changePartialMmMeasureValue(20, percentMeasure);
			expect(percentMeasureChanged).toEqual({
				id: "foo-id",
				value: 20,
				unit: MeasureUnit.Percent,
			});

			const mmMeasure = {
				id: "bar-id",
				value: 20,
				unit: MeasureUnit.Millimeter,
			};
			const mmMeasureChanged = changePartialMmMeasureValue(51, mmMeasure);
			expect(mmMeasureChanged).toEqual({
				id: "bar-id",
				value: 51,
				unit: MeasureUnit.Millimeter,
			});
		});
	});

	describe("stringifyMeasure", () => {
		it("should return correctly with percent measure", () => {
			const percentMeasure = {
				id: "foo-id",
				value: 20,
				unit: MeasureUnit.Percent,
			};

			expect(stringifyMeasure(percentMeasure)).toEqual("20%");
		});

		it("should return correctly with mm measure", () => {
			const percentMeasure = {
				id: "foo-id",
				value: 12,
				unit: MeasureUnit.Millimeter,
			};

			expect(stringifyMeasure(percentMeasure)).toEqual("12mm");
		});
	});
});
