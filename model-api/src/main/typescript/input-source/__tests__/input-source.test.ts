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
import {
	type TableLayout,
	type PrintModelElement,
	type ColumnProperties,
	type Table,
	type Text,
	MeasureUnit,
	type InputSource,
	ElementType,
} from "../../model/index.js";

import { InputSourceGenerator, InputValueSourceResolver, PossibleInputSource } from "../index.js";

describe("InputSource", () => {
	describe("InputSourceGenerator", () => {
		test("should generate input source for a given path", () => {
			const inputSource = InputSourceGenerator.generateInputSource<Required<Text>>("textProperties");
			expect(inputSource).toBeDefined();
			expect(inputSource.textProperties).toBeDefined();
			expect(inputSource.textProperties.alignment).toBeDefined();
			expect(inputSource.textProperties.alignment?.source).toBe(PossibleInputSource.DEFAULT);
		});

		test("should ignore specified groups when generating input source", () => {
			const inputSource = InputSourceGenerator.generateInputSource<Table>("table", ["columns"]);
			expect(inputSource).toBeDefined();
			expect(inputSource.table).toBeDefined();
			expect(inputSource.table.sumLabel).toBeDefined();
			expect(inputSource.table.columns).toBeUndefined(); // columns group should be ignored
		});
		test("should upgrade Input Source to Measure Input Source", () => {
			const tableLayoutLifetimeInputSources = InputSourceGenerator.generateInputSourcesForGroup<TableLayout>([
				"tableLayout.columnProperties.width",
			]);
			const widthInputSource = InputSourceGenerator.upgradeToMeasureInputSource(
				(tableLayoutLifetimeInputSources.tableLayout.columnProperties as unknown as ColumnProperties).width,
				MeasureUnit.Percent
			);
			expect(widthInputSource).toBeDefined();
			expect(widthInputSource.unit).toBe(MeasureUnit.Percent);
		});
	});

	describe("InputSourceResolver", () => {
		const textElement: PrintModelElement = { id: "elem-1", type: ElementType.Text };
		const expressionElement: PrintModelElement = { id: "elem-2", type: ElementType.Expression };

		test("getInputSourceMetadata returns metadata with possibleInputSources", () => {
			const metadata = InputValueSourceResolver.getInputSourceMetadata(textElement, "textProperties.alignment");
			expect(metadata.path).toBe("/content/elementDefinitions/textProperties/alignment/value/");
			expect(metadata.possibleInputSources).toContain(PossibleInputSource.INPUT);
			expect(metadata.possibleInputSources).toContain(PossibleInputSource.DEFAULT);
		});

		test("getInputSourceMetadata includes INHERITED when condition matches element type", () => {
			const metadata = InputValueSourceResolver.getInputSourceMetadata(
				expressionElement,
				"textProperties.alignment"
			);
			expect(metadata.possibleInputSources).toContain(PossibleInputSource.INHERITED);
		});

		test("getInputSourceMetadata does not include INHERITED when condition does not match", () => {
			const metadata = InputValueSourceResolver.getInputSourceMetadata(textElement, "textProperties.alignment");
			expect(metadata.possibleInputSources).not.toContain(PossibleInputSource.INHERITED);
		});

		test("getInputSourceMetadata throws for invalid property", () => {
			expect(() => InputValueSourceResolver.getInputSourceMetadata(textElement, "nonexistent.property")).toThrow(
				"The requested property has no metadata information"
			);
		});

		test("getSourceInputValue returns value for INPUT source", () => {
			const inputSource: InputSource<string> = {
				id: "is-1",
				source: PossibleInputSource.INPUT,
				path: "/test/",
				value: "hello",
			};
			const result = InputValueSourceResolver.getSourceInputValue(
				inputSource,
				textElement,
				"textProperties.alignment",
				v => v
			);
			expect(result).toBe("hello");
		});

		test("getSourceInputValue returns default value for DEFAULT source", () => {
			const inputSource: InputSource<string> = {
				id: "is-1",
				source: PossibleInputSource.DEFAULT,
				path: "/test/",
			};
			const result = InputValueSourceResolver.getSourceInputValue(
				inputSource,
				textElement,
				"textProperties.alignment",
				v => v
			);
			expect(result).toBe("Left");
		});

		test("getSourceInputValue returns undefined for UNSET source", () => {
			const inputSource: InputSource<string> = {
				id: "is-1",
				source: PossibleInputSource.UNSET,
				path: "/test/",
			};
			const result = InputValueSourceResolver.getSourceInputValue(
				inputSource,
				textElement,
				"textProperties.alignment",
				v => v
			);
			expect(result).toBeUndefined();
		});

		test("getSourceInputValue returns undefined when inputSource is undefined", () => {
			const result = InputValueSourceResolver.getSourceInputValue(
				undefined,
				textElement,
				"textProperties.alignment",
				v => v
			);
			expect(result).toBeUndefined();
		});

		test("getSourceInputValue uses inheritedValueResolver for INHERITED source", () => {
			const inputSource: InputSource<string> = {
				id: "is-1",
				source: PossibleInputSource.INHERITED,
				path: "/test/",
			};
			let calledWith: unknown[] = [];
			const resolver = (...args: unknown[]) => {
				calledWith = args;
				return "inherited-value";
			};
			const result = InputValueSourceResolver.getSourceInputValue(
				inputSource,
				expressionElement,
				"textProperties.alignment",
				v => v,
				resolver
			);
			expect(result).toBe("inherited-value");
			expect(calledWith).toEqual([inputSource, expressionElement, "textProperties.alignment"]);
		});

		test("hasValueForInputSourceDefault returns true for property with default", () => {
			const result = InputValueSourceResolver.hasValueForInputSourceDefault("textProperties.alignment");
			expect(result).toBe(true);
		});

		test("hasValueForInputSourceDefault returns false for property without default", () => {
			const result = InputValueSourceResolver.hasValueForInputSourceDefault("textProperties.color.source");
			expect(result).toBe(false);
		});

		test("getSourceStringValue returns string value for INPUT source", () => {
			const inputSource: InputSource<string> = {
				id: "is-1",
				source: PossibleInputSource.INPUT,
				path: "/test/",
				value: "Center",
			};
			const result = InputValueSourceResolver.getSourceStringValue(
				inputSource,
				textElement,
				"textProperties.alignment"
			);
			expect(result).toBe("Center");
		});

		test("getSourceStringValue returns default value for DEFAULT source", () => {
			const inputSource: InputSource<string> = {
				id: "is-1",
				source: PossibleInputSource.DEFAULT,
				path: "/test/",
			};
			const result = InputValueSourceResolver.getSourceStringValue(
				inputSource,
				textElement,
				"textProperties.alignment"
			);
			expect(result).toBe("Left");
		});

		test("getSourceNumberValue returns parsed number for INPUT source", () => {
			const inputSource: InputSource<number> = {
				id: "is-1",
				source: PossibleInputSource.INPUT,
				path: "/test/",
				value: 42,
			};
			const result = InputValueSourceResolver.getSourceNumberValue(
				inputSource,
				textElement,
				"textProperties.color"
			);
			expect(result).toBe(42);
		});

		test("getSourceNumberValue returns parsed default value for DEFAULT source", () => {
			const inputSource: InputSource<number> = {
				id: "is-1",
				source: PossibleInputSource.DEFAULT,
				path: "/test/",
			};
			// tableLayout.rowProperties.minHeight has defaultValue "10"
			const tableLayoutElement: PrintModelElement = { id: "tl-1", type: ElementType.TableLayout };
			const result = InputValueSourceResolver.getSourceNumberValue(
				inputSource,
				tableLayoutElement,
				"rowProperties.minHeight"
			);
			expect(result).toBe(10);
		});

		test("getSourceBooleanValue returns true for 'true' string", () => {
			const inputSource: InputSource<boolean> = {
				id: "is-1",
				source: PossibleInputSource.INPUT,
				path: "/test/",
				value: true,
			};
			const result = InputValueSourceResolver.getSourceBooleanValue(
				inputSource,
				textElement,
				"textProperties.bold"
			);
			expect(result).toBe(true);
		});

		test("getSourceBooleanValue returns default value for DEFAULT source", () => {
			const inputSource: InputSource<boolean> = {
				id: "is-1",
				source: PossibleInputSource.DEFAULT,
				path: "/test/",
			};
			const result = InputValueSourceResolver.getSourceBooleanValue(
				inputSource,
				textElement,
				"textProperties.bold"
			);
			expect(result).toBe(false);
		});

		test("getSourceBooleanValue throws for non-boolean string default", () => {
			const inputSource: InputSource<boolean> = {
				id: "is-1",
				source: PossibleInputSource.DEFAULT,
				path: "/test/",
			};
			// alignment has default "Left" which is not a boolean
			expect(() =>
				InputValueSourceResolver.getSourceBooleanValue(inputSource, textElement, "textProperties.alignment")
			).toThrow("Value is not boolean");
		});
	});
});
