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
import type { PrintFontMap } from "../../../types/font.js";
import { PRINT_FONT_PREFIX } from "../../constant/default-fonts.js";

import { getDefaultTextStyleFont, getFontByName, getFontFamily, getPrefixedFontFamily } from "../font-utils.js";

describe("font utils", () => {
	const defaultFont = {
		name: "default",
		fontFamily: "default",
		isReconfigured: false,
		isDefault: true,
		url: "default url",
	};
	const openSans = {
		name: "Open Sans",
		fontFamily: "Open Sans",
		isReconfigured: true,
		isDefault: false,
		url: "open sans url",
	};
	const notoSansMono = {
		name: "Noto Sans Mono",
		fontFamily: "Noto Sans Mono",
		isReconfigured: true,
		isDefault: false,
		url: "noto sans url",
	};
	const editorFontState: PrintFontMap = {
		default: defaultFont,
		"Open Sans": openSans,
		"Noto Sans Mono": notoSansMono,
	};

	describe("getFontByName", () => {
		test("should return correct font by font name", () => {
			expect(getFontByName(editorFontState, "Open Sans")).toStrictEqual(openSans);
			expect(getFontByName(editorFontState, "Noto Sans Mono")).toStrictEqual(notoSansMono);
		});

		test("should return undefined if font name is not found", () => {
			expect(getFontByName(editorFontState, "UN_EXISTED_FONT")).toBeUndefined();
		});
	});

	describe("getFontFamily", () => {
		test("should return correct font family by font name", () => {
			expect(getFontFamily(editorFontState, "Open Sans")).toBe("Open Sans");
			expect(getFontFamily(editorFontState, "Noto Sans Mono")).toBe("Noto Sans Mono");
			expect(getFontFamily(editorFontState, "default")).toBe("default");
		});

		test("should return default font family if font name is not found", () => {
			expect(getFontFamily(editorFontState, "UN_EXISTED_FONT")).toBe("default");
		});

		test("should return default font family if font name is not provided", () => {
			expect(getFontFamily(editorFontState)).toBe("default");
		});

		test("should return default font family if font url is not existed", () => {
			const nonUrlFontState: PrintFontMap = {
				"Open Sans": {
					...openSans,
					url: undefined,
				},
			};
			expect(getFontFamily(nonUrlFontState, "Open Sans")).toBe("default");
		});
	});

	describe("getPrefixedFontFamily", () => {
		test("should return correct font name with prefix", () => {
			expect(getPrefixedFontFamily(editorFontState, "Open Sans")).toBe(`${PRINT_FONT_PREFIX}Open Sans`);
			expect(getPrefixedFontFamily(editorFontState, "Noto Sans Mono")).toBe(`${PRINT_FONT_PREFIX}Noto Sans Mono`);
			expect(getPrefixedFontFamily(editorFontState, "default")).toBe(`${PRINT_FONT_PREFIX}default`);
		});

		test("should return default font name with prefix if font name is not found", () => {
			expect(getPrefixedFontFamily(editorFontState, "UN_EXISTED_FONT")).toBe(`${PRINT_FONT_PREFIX}default`);
		});

		test("should return default font name with prefix if font name is not provided", () => {
			expect(getPrefixedFontFamily(editorFontState)).toBe(`${PRINT_FONT_PREFIX}default`);
		});
	});

	describe("getDefaultTextStyleFont", () => {
		test("should return correct Open Sans font", () => {
			expect(getDefaultTextStyleFont(editorFontState)).toStrictEqual(openSans);
		});

		test("should return undefined if Open Sans font is not found", () => {
			expect(getDefaultTextStyleFont({})).toBeUndefined();
		});
	});
});
