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
import { MeasureUnit } from "@com.mgmtp.a12.print/print-model-api/model";
import type { MeasureInputSource, PrintModelEntity } from "@com.mgmtp.a12.print/print-model-api/model";
import type { DeepPartialRecursive } from "@com.mgmtp.a12.print/print-model-api/utils";

import {
	changeInputValue,
	changeInputSource,
	changeMeasureInputValue,
	createPlainInputSource,
	changePercentInputSource,
	changeMMInputSource,
	stringifyInputValue,
	parseNumberInputValue,
} from "../input-source-utils.js";

describe("changeInputValue", () => {
	it("sets value on INPUT source", () => {
		const origin = { id: "1", source: PossibleInputSource.INPUT, value: "old" };
		const result = changeInputValue("new", origin);
		expect(result.value).toBe("new");
		expect(result.id).toBe("1");
	});

	it("throws when source is not INPUT", () => {
		const origin = { id: "1", source: PossibleInputSource.INHERITED };
		expect(() => changeInputValue("v", origin as never)).toThrow("Cannot set value for source which is not INPUT");
	});
});

describe("changeInputSource", () => {
	it("returns origin unchanged when source matches", () => {
		const origin = { id: "1", source: PossibleInputSource.INPUT, path: "/p", value: "v" };
		const result = changeInputSource(PossibleInputSource.INPUT, "/p", origin);
		expect(result).toBe(origin);
	});

	it("changes source and clears value", () => {
		const origin = { id: "1", source: PossibleInputSource.INPUT, path: "/p", value: "v" };
		const result = changeInputSource(PossibleInputSource.INHERITED, "/new", origin);
		expect(result.source).toBe(PossibleInputSource.INHERITED);
		expect(result.path).toBe("/new");
		expect(result.value).toBeUndefined();
	});

	it("creates new input source when origin is undefined", () => {
		const result = changeInputSource(PossibleInputSource.INPUT, "/p");
		expect(result.source).toBe(PossibleInputSource.INPUT);
		expect(result.path).toBe("/p");
		expect(result.id).toBeDefined();
	});
});

describe("changeMeasureInputValue", () => {
	it("sets value on INPUT source", () => {
		const origin = {
			id: "1",
			source: PossibleInputSource.INPUT,
			value: 10,
		} as DeepPartialRecursive<MeasureInputSource> & PrintModelEntity;
		const result = changeMeasureInputValue(20, origin);
		expect(result.value).toBe(20);
	});

	it("throws when source is not INPUT", () => {
		const origin = {
			id: "1",
			source: PossibleInputSource.INHERITED,
		} as DeepPartialRecursive<MeasureInputSource> & PrintModelEntity;
		expect(() => changeMeasureInputValue(10, origin)).toThrow();
	});
});

describe("createPlainInputSource", () => {
	it("creates input source with given source and path", () => {
		const result = createPlainInputSource(PossibleInputSource.INPUT, "/path");
		expect(result.source).toBe(PossibleInputSource.INPUT);
		expect(result.path).toBe("/path");
		expect(result.id).toBeDefined();
		expect(typeof result.id).toBe("string");
	});
});

describe("changePercentInputSource", () => {
	it("creates percent input source from scratch", () => {
		const result = changePercentInputSource(PossibleInputSource.INPUT, "/p");
		expect(result.unit).toBe(MeasureUnit.Percent);
		expect(result.source).toBe(PossibleInputSource.INPUT);
	});

	it("changes existing source to percent", () => {
		const origin = {
			id: "1",
			source: PossibleInputSource.INPUT,
			unit: MeasureUnit.Millimeter,
		} as DeepPartialRecursive<MeasureInputSource> & PrintModelEntity;
		const result = changePercentInputSource(PossibleInputSource.INHERITED, "/p", origin);
		expect(result.unit).toBe(MeasureUnit.Percent);
		expect(result.source).toBe(PossibleInputSource.INHERITED);
		expect(result.value).toBeUndefined();
	});
});

describe("changeMMInputSource", () => {
	it("creates mm input source from scratch", () => {
		const result = changeMMInputSource(PossibleInputSource.INPUT, "/p");
		expect(result.unit).toBe(MeasureUnit.Millimeter);
	});

	it("changes existing source to mm", () => {
		const origin = {
			id: "1",
			source: PossibleInputSource.INPUT,
			unit: MeasureUnit.Percent,
		} as DeepPartialRecursive<MeasureInputSource> & PrintModelEntity;
		const result = changeMMInputSource(PossibleInputSource.INHERITED, "/p", origin);
		expect(result.unit).toBe(MeasureUnit.Millimeter);
	});
});

describe("stringifyInputValue", () => {
	it("converts number to string", () => {
		expect(stringifyInputValue(42)).toBe("42");
	});

	it("returns string as-is", () => {
		expect(stringifyInputValue("hello")).toBe("hello");
	});

	it("returns undefined as-is", () => {
		expect(stringifyInputValue(undefined)).toBeUndefined();
	});
});

describe("parseNumberInputValue", () => {
	it("parses string to number", () => {
		expect(parseNumberInputValue("42")).toBe(42);
	});

	it("returns number as-is", () => {
		expect(parseNumberInputValue(42)).toBe(42);
	});

	it("returns undefined for empty string", () => {
		expect(parseNumberInputValue("  ")).toBeUndefined();
	});

	it("returns undefined as-is", () => {
		expect(parseNumberInputValue(undefined)).toBeUndefined();
	});

	it("throws for non-numeric string", () => {
		expect(() => parseNumberInputValue("abc")).toThrow("Cannot convert abc to number");
	});
});
