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
import { PrintFontMap } from "../../types/font.js";
import { FontResourceMap } from "../../../types/font.js";

import { DEFAULT_FONTS, DEFAULT_FONT_NAME } from "../constant/default-fonts.js";

export function createPrintFontMap(configuredFonts: FontResourceMap): PrintFontMap {
	const resultFonts: PrintFontMap = {};

	for (const [font, resource] of Object.entries(DEFAULT_FONTS)) {
		if (!Object.keys(configuredFonts).includes(font)) {
			configuredFonts[font] = resource;
		}
	}

	for (const [font, resource] of Object.entries(configuredFonts)) {
		const isReconfigured = !Object.keys(DEFAULT_FONTS).includes(font) || DEFAULT_FONTS[font].src !== resource.src;

		resultFonts[font] = {
			name: font,
			fontFamily: font,
			isReconfigured,
			isDefault: font === DEFAULT_FONT_NAME,
			format: resource.format,
			url: resource.src,
		};
	}

	return resultFonts;
}
