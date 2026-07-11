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
import { ElementType, TEXT_STYLE } from "@com.mgmtp.a12.print/print-model-api/model";

import type * as OldModel from "../../../../version-2.1.0/print-model.js";
import { TransformTreeTrace } from "../../../../../utils.ts/tree-trace.js";

import type * as NewModel from "../print-model.js";
import {
	transformExpressionElement,
	transformListingElement,
	transformTableElement,
	transformTextElement,
} from "../elements.js";

describe("Element Text Properties Transform", () => {
	describe("Text Element", () => {
		it("Should transform text properties correctly", () => {
			const input: OldModel.ElementDefinitionsDTO = {
				id: "text",
				type: ElementType.Text,
				textProperties: {
					id: "test",
					textStyleId: "textStyleId",
					alignment: "Center",
				},
			};
			const output = transformTextElement(input);
			expect(output.textProperties?.textStyleId).not.toBeUndefined();
			assertInputGroup(output.textProperties!.textStyleId!, "INPUT", "textStyleId");

			expect(output.textProperties?.alignment).not.toBeUndefined();
			assertInputGroup(output.textProperties!.alignment!, "INPUT", "Center");
		});

		it("Should transform text style as default if it's not existed", () => {
			const input: OldModel.ElementDefinitionsDTO = {
				id: "text",
				type: ElementType.Text,
				textProperties: {
					id: "test",
					alignment: "Center",
				},
			};
			const output = transformTextElement(input);
			expect(output.textProperties?.textStyleId).not.toBeUndefined();
			assertInputGroup(output.textProperties!.textStyleId!, "DEFAULT");

			expect(output.textProperties?.alignment).not.toBeUndefined();
			assertInputGroup(output.textProperties!.alignment!, "INPUT", "Center");
		});

		it("Should set fallback no text style if if text properties is undefined", () => {
			const input: OldModel.ElementDefinitionsDTO = {
				id: "text",
				type: ElementType.Text,
			};
			const output = transformTextElement(input);
			expect(output.textProperties?.textStyleId).not.toBeUndefined();
			assertInputGroup(output.textProperties!.textStyleId!, "INPUT", TEXT_STYLE.NO_TEXT_STYLE_FALLBACK_ID);

			expect(output.textProperties?.alignment).not.toBeUndefined();
			assertInputGroup(output.textProperties!.alignment!, "DEFAULT");
		});
	});

	describe("Table Element", () => {
		it("Should transform text properties correctly", () => {
			const input: OldModel.ElementDefinitionsDTO = {
				id: "table",
				type: ElementType.Table,
				textProperties: {
					id: "123",
					textStyleId: "textstyleId",
					alignment: "Left",
					italic: true,
					bold: false,
					underlined: true,
					color: "#fff",
					backgroundColor: "#eee",
				},
				table: {
					headerTextProperties: {
						id: "345",
						textStyleId: "textstyleId",
						alignment: "Justify",
						italic: false,
						bold: false,
						underlined: true,
						color: "#fff",
						backgroundColor: "#eee",
					},
				},
			};

			const output = transformTableElement(input);

			expect(output.textProperties).not.toBeUndefined();
			assertTextProperties(output.textProperties!, {
				textStyleId: { source: "INPUT", value: input.textProperties?.textStyleId },
				bold: { source: "INPUT", value: input.textProperties?.bold },
				underlined: { source: "INPUT", value: input.textProperties?.underlined },
				italic: { source: "INPUT", value: input.textProperties?.italic },
				alignment: { source: "INPUT", value: input.textProperties?.alignment },
				backgroundColor: { source: "INPUT", value: input.textProperties?.backgroundColor },
				color: { source: "INPUT", value: input.textProperties?.color },
			});

			const headerTextProperties = output.table?.headerTextProperties;
			const expectedHeaderTextProperties = input.table?.headerTextProperties;
			expect(headerTextProperties).not.toBeUndefined();
			assertTextProperties(headerTextProperties!, {
				textStyleId: { source: "INPUT", value: expectedHeaderTextProperties?.textStyleId },
				bold: { source: "INPUT", value: expectedHeaderTextProperties?.bold },
				underlined: { source: "INPUT", value: expectedHeaderTextProperties?.underlined },
				italic: { source: "INPUT", value: expectedHeaderTextProperties?.italic },
				alignment: { source: "INPUT", value: expectedHeaderTextProperties?.alignment },
				backgroundColor: { source: "INPUT", value: expectedHeaderTextProperties?.backgroundColor },
				color: { source: "INPUT", value: expectedHeaderTextProperties?.color },
			});
		});

		it("Should transform text properties as default source if text properties are undefined", () => {
			const input: OldModel.ElementDefinitionsDTO = {
				id: "table",
				type: ElementType.Table,
			};
			const output = transformTableElement(input);

			expect(output.textProperties).not.toBeUndefined();
			assertTextProperties(output.textProperties!, {
				textStyleId: { source: "DEFAULT" },
				bold: { source: "DEFAULT" },
				underlined: { source: "DEFAULT" },
				italic: { source: "DEFAULT" },
				alignment: { source: "DEFAULT" },
				backgroundColor: { source: "DEFAULT" },
				color: { source: "DEFAULT" },
			});

			const headerTextProperties = output.table?.headerTextProperties;
			expect(headerTextProperties).not.toBeUndefined();
			assertTextProperties(headerTextProperties!, {
				textStyleId: { source: "DEFAULT" },
				bold: { source: "DEFAULT" },
				underlined: { source: "DEFAULT" },
				italic: { source: "DEFAULT" },
				alignment: { source: "DEFAULT" },
				backgroundColor: { source: "DEFAULT" },
				color: { source: "DEFAULT" },
			});
		});
	});

	describe("Listing Element", () => {
		it("Should transform text properties correctly", () => {
			const input: OldModel.ElementDefinitionsDTO = {
				id: "listing",
				type: ElementType.Listing,
				textProperties: {
					id: "123",
					textStyleId: "textstyleId",
					alignment: "Left",
					italic: true,
					bold: true,
					underlined: true,
					color: "#fff",
					backgroundColor: "#eee",
				},
				listing: {
					headerTextProperties: {
						id: "345",
						textStyleId: "textstyleId",
						alignment: "Justify",
						italic: false,
						bold: false,
						underlined: false,
						color: "#fff",
						backgroundColor: "#eee",
					},
				},
			};

			const output = transformListingElement(input);

			expect(output.textProperties).not.toBeUndefined();
			assertTextProperties(output.textProperties!, {
				textStyleId: { source: "INPUT", value: input.textProperties?.textStyleId },
				bold: { source: "INPUT", value: input.textProperties?.bold },
				underlined: { source: "INPUT", value: input.textProperties?.underlined },
				italic: { source: "INPUT", value: input.textProperties?.italic },
				alignment: { source: "INPUT", value: input.textProperties?.alignment },
				backgroundColor: { source: "INPUT", value: input.textProperties?.backgroundColor },
				color: { source: "INPUT", value: input.textProperties?.color },
			});

			const headerTextProperties = output.listing?.headerTextProperties;
			const expectedHeaderTextProperties = input.listing?.headerTextProperties;
			expect(headerTextProperties).not.toBeUndefined();
			assertTextProperties(headerTextProperties!, {
				textStyleId: { source: "INPUT", value: expectedHeaderTextProperties?.textStyleId },
				bold: { source: "INPUT", value: expectedHeaderTextProperties?.bold },
				underlined: { source: "INPUT", value: expectedHeaderTextProperties?.underlined },
				italic: { source: "INPUT", value: expectedHeaderTextProperties?.italic },
				alignment: { source: "INPUT", value: expectedHeaderTextProperties?.alignment },
				backgroundColor: { source: "INPUT", value: expectedHeaderTextProperties?.backgroundColor },
				color: { source: "INPUT", value: expectedHeaderTextProperties?.color },
			});
		});

		it("Should transform column's text properties correctly", () => {
			const input: OldModel.ElementDefinitionsDTO = {
				id: "listing",
				type: ElementType.Listing,
				listing: {
					columns: [
						{
							id: "col1",
							hasCustomTextProperties: true,
							textProperties: {
								id: "test",
								textStyleId: "textstyleId",
								alignment: "Left",
								italic: false,
								bold: false,
								underlined: false,
								color: "#fff",
								backgroundColor: "#eee",
							},
						},
						{
							id: "col2",
							hasCustomTextProperties: true,
						},
						{
							id: "col3",
							hasCustomTextProperties: false,
							textProperties: {
								id: "test",
								textStyleId: "textstyleId",
								alignment: "Left",
								italic: false,
								bold: false,
								underlined: false,
								color: "#fff",
								backgroundColor: "#eee",
							},
						},
					],
				},
			};

			const output = transformListingElement(input);

			expect(output.textProperties).not.toBeUndefined();
			assertTextProperties(output.textProperties!, {
				textStyleId: { source: "DEFAULT" },
				bold: { source: "DEFAULT" },
				underlined: { source: "DEFAULT" },
				italic: { source: "DEFAULT" },
				alignment: { source: "DEFAULT" },
				backgroundColor: { source: "DEFAULT" },
				color: { source: "DEFAULT" },
			});

			const headerTextProperties = output.listing?.headerTextProperties;
			expect(headerTextProperties).not.toBeUndefined();
			assertTextProperties(headerTextProperties!, {
				textStyleId: { source: "DEFAULT" },
				bold: { source: "DEFAULT" },
				underlined: { source: "DEFAULT" },
				italic: { source: "DEFAULT" },
				alignment: { source: "DEFAULT" },
				backgroundColor: { source: "DEFAULT" },
				color: { source: "DEFAULT" },
			});

			expect(output.listing?.columns).toHaveLength(3);

			const firstColumn = output.listing!.columns?.[0];
			const expectedTextProperties = input.listing?.columns?.[0]?.textProperties;

			assertTextProperties(firstColumn!.textProperties!, {
				textStyleId: { source: "INPUT", value: expectedTextProperties?.textStyleId },
				bold: { source: "INPUT", value: expectedTextProperties?.bold },
				underlined: { source: "INPUT", value: expectedTextProperties?.underlined },
				italic: { source: "INPUT", value: expectedTextProperties?.italic },
				alignment: { source: "INPUT", value: expectedTextProperties?.alignment },
				backgroundColor: { source: "INPUT", value: expectedTextProperties?.backgroundColor },
				color: { source: "INPUT", value: expectedTextProperties?.color },
			});

			const secondColumn = output.listing!.columns?.[1];
			assertTextProperties(secondColumn!.textProperties!, {
				textStyleId: { source: "DEFAULT" },
				bold: { source: "DEFAULT" },
				underlined: { source: "DEFAULT" },
				italic: { source: "DEFAULT" },
				alignment: { source: "DEFAULT" },
				backgroundColor: { source: "DEFAULT" },
				color: { source: "DEFAULT" },
			});

			expect(output.listing!.columns?.[2]?.textProperties).toBeUndefined();
		});
	});

	describe("Expression Element", () => {
		it("Should transform text properties correctly", () => {
			const input: OldModel.ElementDefinitionsDTO = {
				id: "expression",
				type: ElementType.Expression,
				textProperties: {
					id: "123",
					textStyleId: "textstyleId",
					alignment: "Right",
					italic: false,
					bold: false,
					underlined: false,
					color: "#fff",
					backgroundColor: "#eee",
				},
			};

			const output = transformExpressionElement(input, new TransformTreeTrace([]));
			expect(output.textProperties).not.toBeUndefined();
			assertTextProperties(output.textProperties!, {
				textStyleId: { source: "INPUT", value: input.textProperties?.textStyleId },
				bold: { source: "INPUT", value: input.textProperties?.bold },
				underlined: { source: "INPUT", value: input.textProperties?.underlined },
				italic: { source: "INPUT", value: input.textProperties?.italic },
				alignment: { source: "INPUT", value: input.textProperties?.alignment },
				backgroundColor: { source: "INPUT", value: input.textProperties?.backgroundColor },
				color: { source: "INPUT", value: input.textProperties?.color },
			});
		});

		it("Should transform text properties as inherit if there is a parent in tree trace", () => {
			const parent: OldModel.ElementDefinitionsDTO = {
				id: "table",
				type: ElementType.Table,
			};

			const input: OldModel.ElementDefinitionsDTO = {
				id: "expression",
				type: ElementType.Expression,
			};

			const output = transformExpressionElement(input, new TransformTreeTrace([parent]));

			expect(output.textProperties).not.toBeUndefined();
			assertTextProperties(output.textProperties!, {
				textStyleId: { source: "INHERITED", value: input.textProperties?.textStyleId, reference: parent.id },
				bold: { source: "INHERITED", value: input.textProperties?.bold, reference: parent.id },
				underlined: { source: "INHERITED", value: input.textProperties?.underlined, reference: parent.id },
				italic: { source: "INHERITED", value: input.textProperties?.italic, reference: parent.id },
				alignment: { source: "INHERITED", value: input.textProperties?.alignment, reference: parent.id },
				backgroundColor: {
					source: "INHERITED",
					value: input.textProperties?.backgroundColor,
					reference: parent.id,
				},
				color: { source: "INHERITED", value: input.textProperties?.color, reference: parent.id },
			});
		});
	});
});

function assertTextProperties(
	input: NewModel.TextPropertiesDTO,
	expected: Record<
		keyof Omit<NewModel.TextPropertiesDTO, "id">,
		{ source: NewModel.Enumeration_Color_SourceDTO; value?: string | boolean; reference?: string }
	>
) {
	expect(input.textStyleId).not.toBeUndefined();
	assertInputGroup(
		input.textStyleId!,
		expected.textStyleId?.source,
		expected.textStyleId?.value,
		expected.textStyleId?.reference
	);

	expect(input.italic).not.toBeUndefined();
	assertInputGroup(input.italic!, expected.italic?.source, expected.italic?.value, expected.italic?.reference);

	expect(input.bold).not.toBeUndefined();
	assertInputGroup(input.bold!, expected.bold?.source, expected.bold?.value, expected.bold?.reference);

	expect(input.underlined).not.toBeUndefined();
	assertInputGroup(
		input.underlined!,
		expected.underlined?.source,
		expected.underlined?.value,
		expected.underlined?.reference
	);

	expect(input.color).not.toBeUndefined();
	assertInputGroup(input.color!, expected.color?.source, expected.color?.value, expected.color?.reference);

	expect(input.backgroundColor).not.toBeUndefined();
	assertInputGroup(
		input.backgroundColor!,
		expected.backgroundColor?.source,
		expected.backgroundColor?.value,
		expected.backgroundColor?.reference
	);

	expect(input.alignment).not.toBeUndefined();
	assertInputGroup(
		input.alignment!,
		expected.alignment?.source,
		expected.alignment?.value,
		expected.alignment?.reference
	);
}

function assertInputGroup(
	input: NewModel.InputSourceDTO<string | boolean | number>,
	expectSource: NewModel.Enumeration_Color_SourceDTO,
	expectValue?: string | boolean,
	expectReference?: string
) {
	expect(input.path).not.toBeUndefined();
	expect(input.id).not.toBeUndefined();

	expect(input.source).toBe(expectSource);

	if (expectSource === "INPUT") {
		expect(input.value).toBe(expectValue);
	} else {
		expect(input.value).toBeUndefined();
	}

	if (input.source === "INHERITED") {
		expect(input.reference).toBe(expectReference);
	}
}
