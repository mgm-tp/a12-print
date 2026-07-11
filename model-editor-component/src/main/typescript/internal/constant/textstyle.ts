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
import type { TextStyle } from "@com.mgmtp.a12.print/print-model-api/model";
import { Semantic, TEXT_STYLE } from "@com.mgmtp.a12.print/print-model-api/model";

export const DEFAULT_FONT_NAME = "default";
export const DEFAULT_TEXT_STYLE_FONT_NAME = "Open Sans";
export const PRINT_FONT_PREFIX = "print_font_";

export const DEFAULT_TEXT_STYLE_ID = "default-text-style-id";
export const DEFAULT_TEXT_STYLE_NAME = "Default Text Style";

export const DEFAULT_TEXT_STYLE: TextStyle = {
	id: DEFAULT_TEXT_STYLE_ID,
	name: DEFAULT_TEXT_STYLE_NAME,
	font: DEFAULT_TEXT_STYLE_FONT_NAME,
	fontSize: 12,
	lineHeight: 18,
	semantic: Semantic.P,
};

export const NO_TEXT_STYLE_FALLBACK_NAME = "No Text Style Fallback";

export const NO_TEXT_STYLE_FALLBACK: TextStyle = {
	...DEFAULT_TEXT_STYLE,
	id: TEXT_STYLE.NO_TEXT_STYLE_FALLBACK_ID,
	name: NO_TEXT_STYLE_FALLBACK_NAME,
	lineHeight: 15.86,
};
