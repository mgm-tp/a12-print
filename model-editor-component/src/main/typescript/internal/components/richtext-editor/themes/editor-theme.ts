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
import type { EditorThemeClasses } from "lexical";
import { createGlobalStyle } from "styled-components";
import type { Styles } from "styled-components/dist/types.js";

import { ElementType } from "@com.mgmtp.a12.print/print-model-api/model";

export const EDITOR_THEME_CLASSES: EditorThemeClasses = {
	[ElementType.Field]: "editor-field",
	[ElementType.Calculation]: "editor-calculation",
	[ElementType.PageNumber]: "editor-page-number",
	[ElementType.PageNumberTotal]: "editor-page-number-total",
};

const commonStyles = {
	userSelect: "all",
	cursor: "pointer",
	"padding-left": "1px",
	"padding-right": "1px",
};

export enum EntityBackgroundColor {
	Field = "#b5e4fd",
	Calculation = "#ffb580",
	PageNumber = "#297a24",
	// eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
	PageNumberTotal = "#297a24",
}

export enum EntityColor {
	Field = "#0277bd",
	Calculation = "#f58230",
	PageNumber = "#076701",
	// eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
	PageNumberTotal = "#076701",
}

export const EditorThemeStyles = createGlobalStyle({
	".editor-field": {
		...commonStyles,
		backgroundColor: EntityBackgroundColor.Field,
		color: EntityColor.Field,
	},
	".editor-calculation": {
		...commonStyles,
		backgroundColor: EntityBackgroundColor.Calculation,
		color: EntityColor.Calculation,
	},
	".editor-page-number": {
		...commonStyles,
		backgroundColor: EntityBackgroundColor.PageNumber,
		color: "#ffffff",
	},
	".editor-page-number-total": {
		...commonStyles,
		backgroundColor: EntityBackgroundColor.PageNumberTotal,
		color: "#ffffff",
	},
} as Styles<object>);
