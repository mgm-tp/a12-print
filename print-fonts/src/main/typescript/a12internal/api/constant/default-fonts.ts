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
import type { FontResourceMap } from "../../../types/font.js";
// Important: This font import paths point to where the font is located in the end in the lib folder
import OpenSansRegular from "../../../resources/OpenSans-Regular.ttf";
import NotoSansMonoRegular from "../../../resources/NotoSansMono-Regular.ttf";
import NotoSansSymbols2Regular from "../../../resources/NotoSansSymbols2-Regular.ttf";

export const OPEN_SANS = "Open Sans";
export const NOTO_SANS_MONO = "Noto Sans Mono";
export const NOTO_SANS_SYMBOLS = "Noto Sans Symbols";
export const DEFAULT_FALLBACK_FONT = OPEN_SANS;

export const FONT_EXTENSIONS = ["ttf", "otf", "woff", "woff2"];
export const SUPPORTED_FONTS = ["ttf"];

export const DEFAULT_FONT_NAME = "default";
export const DEFAULT_TEXT_STYLE_FONT_NAME = OPEN_SANS;

export const PRINT_FONT_PREFIX = "print_font_";

export const FONT_RESOURCE_MAP: FontResourceMap = {
	[DEFAULT_FALLBACK_FONT]: {
		src: OpenSansRegular,
		format: "truetype",
	},
	[NOTO_SANS_MONO]: {
		src: NotoSansMonoRegular,
		format: "truetype",
	},
	[NOTO_SANS_SYMBOLS]: {
		src: NotoSansSymbols2Regular,
		format: "truetype",
	},
};

export const DEFAULT_FONTS: FontResourceMap = {
	...FONT_RESOURCE_MAP,
	[DEFAULT_FONT_NAME]: FONT_RESOURCE_MAP[DEFAULT_FALLBACK_FONT],
};
