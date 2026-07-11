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
import { ElementType, Field, PrintModelElement, Text, type PartialAnyPrintModelElement } from "../index.js";

const textElement = {
	id: "1",
	type: ElementType.Text,
	text: { id: "2", text: "hello", entities: [] },
} as PartialAnyPrintModelElement;

const fieldElement = {
	id: "3",
	type: ElementType.Field,
	field: { id: "4", model: "someModel", path: "some.path" },
} as PartialAnyPrintModelElement;

describe("PrintModelElement", () => {
	describe("isInstance", () => {
		test("returns true for an object with a valid id and element type", () => {
			expect(PrintModelElement.isInstance({ id: "1", type: ElementType.Text })).toBe(true);
		});

		test("returns false for an object missing id", () => {
			expect(PrintModelElement.isInstance({ type: ElementType.Text })).toBe(false);
		});

		test("returns false for an invalid type value", () => {
			expect(PrintModelElement.isInstance({ id: "1", type: "InvalidType" })).toBe(false);
		});

		test("returns false for a non-object", () => {
			expect(PrintModelElement.isInstance("string")).toBe(false);
			expect(PrintModelElement.isInstance(null)).toBe(false);
		});
	});
});

describe("Text", () => {
	describe("isInstance", () => {
		test("returns true for a valid Text element", () => {
			expect(Text.isInstance(textElement)).toBe(true);
		});

		test("returns false when the type is not Text", () => {
			expect(Text.isInstance(fieldElement)).toBe(false);
		});

		test("returns false when the text sub-property is missing", () => {
			const missingText = { id: "1", type: ElementType.Text } as PartialAnyPrintModelElement;
			expect(Text.isInstance(missingText)).toBe(false);
		});
	});
});

describe("Field", () => {
	describe("isInstance", () => {
		test("returns true for a valid Field element", () => {
			expect(Field.isInstance(fieldElement)).toBe(true);
		});

		test("returns false when the type is not Field", () => {
			expect(Field.isInstance(textElement)).toBe(false);
		});

		test("returns false when field.path is missing", () => {
			const missingPath = { id: "1", type: ElementType.Field } as PartialAnyPrintModelElement;
			expect(Field.isInstance(missingPath)).toBe(false);
		});
	});
});
