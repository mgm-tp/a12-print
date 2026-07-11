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
import type { Semantic } from "@com.mgmtp.a12.print/print-model-api/model";
import type { PrintFontMap } from "@com.mgmtp.a12.print/print-fonts/a12internal";

import { actionCreatorFactory } from "../actionCreatorFactory/actionCreatorFactory.js";

import type { HelperLines, PrintModelRefs } from "./state.js";

const factory = actionCreatorFactory("Print/EditorState");

export namespace EditorStateActions {
	export const updateEditorOptions = factory<UpdateEditorOptionsPayload>("UPDATE_EDITOR_OPTIONS");

	export interface UpdateEditorOptionsPayload {
		zoomFactor?: number;
		showHelperLines?: boolean;
		isSnapToHL?: boolean;
	}

	export const update = factory<UpdateEditorStatesPayload>("UPDATE");

	export interface UpdateEditorStatesPayload {
		helperLines?: HelperLines;
		showBorders?: boolean;
		isMarginVisible?: boolean;
	}

	export const openEditorView = factory<PrintModelRefs>("OPEN_EDITOR_VIEW");

	export const updateSelectedTextStyleId = factory<string>("UPDATE_SELECTED_TEXT_STYLE_ID");

	export const setDefaultTextStyle = factory<SetDefaultTextStylePayload>("SET_DEFAULT_TEXT_STYLE");

	export interface SetDefaultTextStylePayload {
		font: string;
		name?: string;
		fontSize?: number;
		lineHeight?: number;
		semantic?: Semantic;
	}

	export const setFonts = factory<PrintFontMap>("SET_FONTS");
}
