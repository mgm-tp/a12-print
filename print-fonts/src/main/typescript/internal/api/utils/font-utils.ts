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
import { PrintFont, PrintFontMap } from "../../types/font.js";

import { DEFAULT_FONT_NAME, DEFAULT_TEXT_STYLE_FONT_NAME, PRINT_FONT_PREFIX } from "../constant/default-fonts.js";

export const getPrefixedFont = (fontFamily: string) => {
	return `${PRINT_FONT_PREFIX}${fontFamily}`;
};

export const getFontByName = (fonts: PrintFontMap, fontName: string): PrintFont | undefined => {
	return fonts[fontName];
};

export const isFontNotConfigured = (fonts: PrintFontMap, fontName?: string): boolean => {
	const font = fontName ? getFontByName(fonts, fontName) : undefined;
	return !font?.url;
};

export const getFontFamily = (fonts: PrintFontMap, fontName?: string): string => {
	const font = getFontByName(fonts, fontName || "");
	return font?.url ? font.fontFamily : DEFAULT_FONT_NAME;
};

export const getPrefixedFontFamily = (fonts: PrintFontMap, fontName?: string): string => {
	return `${PRINT_FONT_PREFIX}${getFontFamily(fonts, fontName)}`;
};

export const getDefaultTextStyleFont = (fonts: PrintFontMap): PrintFont | undefined => {
	return Object.values(fonts).find(font => font.fontFamily === DEFAULT_TEXT_STYLE_FONT_NAME);
};
