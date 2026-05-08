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
import { css } from "styled-components";

import { Alignment, BorderProperties, BorderStyle } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { DeepPartialRecursive } from "@com.mgmtp.a12.print/print-model-api/lib/utils/type-utils.js";

import { Font } from "../../types/index.js";

import { CssUtils, getTextAlignment, optionalValueToString } from "../css-utils.js";

import getCssStyles = CssUtils.getCssStyles;
import StyleProperties = CssUtils.StyleProperties;

describe("css utils", () => {
	const properties: CssUtils.StyleProperties = {
		textStyle: {
			font: "TestFont1",
			fontSize: 16,
			lineHeight: 4,
		},
	};

	const fonts: Record<string, Font> = {
		TestFont1: {
			name: "TestFont1",
			fontFamily: "TestFont",
			isReconfigured: false,
			isDefault: false,
			url: "http://url.de",
		},
		TestFont2: { name: "TestFont2", fontFamily: "TestFont", isReconfigured: false, isDefault: false },
	};

	describe("getCssStyles", () => {
		it("should correctly export style properties to CSS", () => {
			expect(getCssStyles(properties, fonts)).toMatchSnapshot();
		});

		it("should add additional properties at start of the styles", () => {
			expect(getCssStyles(properties, fonts, { width: "auto" })[1]).toEqual("width: auto;");
		});
	});

	describe("getCssInlineStyles", () => {
		it("should correctly export style properties to object", () => {
			const styles: StyleProperties = {
				textStyle: {
					font: "TestFont1",
					fontSize: 16,
					lineHeight: 2,
				},
				textProperties: {
					bold: true,
					italic: true,
					underlined: true,
					alignment: Alignment.Left,
					backgroundColor: "blue",
					color: "yellow",
				},
				borderProperties: {
					borderStyle: BorderStyle.Solid,
					borderColor: "black",
					borderWidth: 12,
				},
			};

			expect(CssUtils.getCssInlineStyles(styles, fonts)).toMatchSnapshot();
		});

		it("should leave empty values as undefined in the resulting object", () => {
			const styles: StyleProperties = {
				textStyle: {
					font: "TestFont1",
					lineHeight: 2,
				},
				textProperties: {
					alignment: Alignment.Left,
					backgroundColor: "blue",
					color: "yellow",
					italic: false,
				},
				borderProperties: {
					borderStyle: BorderStyle.Solid,
					borderColor: "black",
				},
			};

			const result = CssUtils.getCssInlineStyles(styles, fonts);
			expect(result.fontSize).toEqual(undefined);
			expect(result.fontWeight).toEqual(undefined);
			expect(result.fontStyle).toEqual(undefined);
			expect(result.textDecoration).toEqual(undefined);
			expect(result.borderWidth).toEqual(undefined);
		});

		it("should return font with print prefix", () => {
			const styles: StyleProperties = {
				textStyle: {
					font: "TestFont1",
					lineHeight: 2,
				},
				textProperties: {
					alignment: Alignment.Left,
					backgroundColor: "blue",
					color: "yellow",
					italic: false,
				},
				borderProperties: {
					borderStyle: BorderStyle.Solid,
					borderColor: "black",
				},
			};

			expect(CssUtils.getCssInlineStyles(styles, fonts).fontFamily).toEqual(`print_font_TestFont`);
		});

		it("should return default font when no font url", () => {
			const styles: StyleProperties = {
				textStyle: {
					font: "TestFont2",
					lineHeight: 2,
				},
				textProperties: {
					alignment: Alignment.Left,
					backgroundColor: "blue",
					color: "yellow",
					italic: false,
				},
				borderProperties: {
					borderStyle: BorderStyle.Solid,
					borderColor: "black",
				},
			};

			expect(CssUtils.getCssInlineStyles(styles, fonts).fontFamily).toEqual(`print_font_default`);
		});

		it("should return default font font not exist", () => {
			const styles: StyleProperties = {
				textStyle: {
					font: "TestFont3",
					lineHeight: 2,
				},
				textProperties: {
					alignment: Alignment.Left,
					backgroundColor: "blue",
					color: "yellow",
					italic: false,
				},
				borderProperties: {
					borderStyle: BorderStyle.Solid,
					borderColor: "black",
				},
			};

			expect(CssUtils.getCssInlineStyles(styles, fonts).fontFamily).toEqual(`print_font_default`);
		});
	});

	describe("getOutlineStyles", () => {
		const BORDER_COLOR_TEST = "black";
		const BORDER_WIDTH = 2;

		it("should correctly export BorderProperties to OutlineStyle", () => {
			const properties: DeepPartialRecursive<BorderProperties> = {
				borderStyle: BorderStyle.Solid,
				borderColor: BORDER_COLOR_TEST,
				borderWidth: BORDER_WIDTH,
			};

			expect(CssUtils.getOutlineStyles(properties)).toEqual({
				outlineStyle: "Solid",
				outlineColor: BORDER_COLOR_TEST,
				outlineWidth: `${BORDER_WIDTH}pt`,
				outlineOffset: `-${BORDER_WIDTH}pt`,
			});
		});

		it("should leave width and offset undefined if no width is set", () => {
			const properties2: DeepPartialRecursive<BorderProperties> = {
				borderStyle: BorderStyle.Solid,
				borderColor: BORDER_COLOR_TEST,
			};

			expect(CssUtils.getOutlineStyles(properties2)).toEqual({
				outlineStyle: "Solid",
				outlineColor: BORDER_COLOR_TEST,
				outlineWidth: undefined,
				outlineOffset: undefined,
			});
		});
	});

	describe("getTextAlignment", () => {
		it("should know center alignment", () => {
			expect(getTextAlignment(Alignment.Center)).toEqual("center");
		});
		it("should know left alignment", () => {
			expect(getTextAlignment(Alignment.Left)).toEqual("left");
		});
		it("should know justify alignment", () => {
			expect(getTextAlignment(Alignment.Justify)).toEqual("justify");
		});
		it("should know right alignment", () => {
			expect(getTextAlignment(Alignment.Right)).toEqual("right");
		});
		it("should otherwise be undefined", () => {
			expect(getTextAlignment(undefined)).toEqual(undefined);
		});
	});

	describe("transformOrientation", () => {
		it("should translate to (-100%,-100%) on bottom-end", () => {
			expect(CssUtils.transformOrientation("bottom-end").toString().trim()).toEqual(
				css`
					transform: translate(-100%, -100%);
				`
					.toString()
					.trim()
			);
		});

		it("should translate to (0, -100%) on bottom-start", () => {
			expect(CssUtils.transformOrientation("bottom-start").toString().trim()).toEqual(
				css`
					transform: translate(0, -100%);
				`
					.toString()
					.trim()
			);
		});

		it("should translate to (-100%,0) on top-end", () => {
			expect(CssUtils.transformOrientation("top-end").toString().trim()).toEqual(
				css`
					transform: translate(-100%, 0);
				`
					.toString()
					.trim()
			);
		});

		it("should translate to (0,0) on default", () => {
			const defaultResult = css`
				transform: translate(0, 0);
			`
				.toString()
				.trim();
			expect(CssUtils.transformOrientation("left").toString().trim()).toEqual(defaultResult);
			expect(CssUtils.transformOrientation("left-start").toString().trim()).toEqual(defaultResult);
			expect(CssUtils.transformOrientation("top").toString().trim()).toEqual(defaultResult);
			expect(CssUtils.transformOrientation("top-start").toString().trim()).toEqual(defaultResult);
		});
	});

	describe("optionalValueToString", () => {
		it("should return string as value", () => {
			expect(optionalValueToString("12", "%")).toEqual("12%");
		});
		it("should return number as value", () => {
			expect(optionalValueToString(12, "%")).toEqual("12%");
		});
		it("should return Alignment as value", () => {
			expect(optionalValueToString(Alignment.Center, "%")).toEqual("Center%");
		});
		it("should return undefined if value is not set", () => {
			expect(optionalValueToString(undefined, "%")).toEqual(undefined);
		});
	});
});
