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
import { actionCreatorFactory } from "typescript-fsa";

import { InteractionRegion } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/index.js";

import { IEditPosition } from "../../components/richtext-editor/type.js";

import { EditorMode } from "../editor-state/state.js";

import { AdditionalData } from "./state.js";

const factory = actionCreatorFactory("Print/DetailData");

export type PayloadWithContainerId<T extends object = object> = T & { containerId: string };

export namespace DetailDataActions {
	export const updateRefId = factory<PayloadWithContainerId<{ refId: string }>>("UPDATE_REF_ID");

	export const remove = factory<PayloadWithContainerId<object>>("REMOVE");

	export const updateAdditionalData = factory<PayloadWithContainerId<AdditionalData>>("UPDATE_ADDITIONAL_DATA");

	export const deleteAdditionalData = factory<PayloadWithContainerId<object>>("DELETE_ADDITIONAL_DATA");

	export const updateOpenForm =
		factory<PayloadWithContainerId<{ isFormOpen: Partial<Record<EditorMode, boolean>> }>>(
			"UPDATE_OPEN_FORM_DETAIL_DATA"
		);

	export const updateFullFormScreen = factory<PayloadWithContainerId<{ isFullScreenForm: boolean }>>(
		"UPDATE_FULL_FORM_SCREEN_DETAIL_DATA"
	);

	export const updateEditPositionTextForm =
		factory<PayloadWithContainerId<{ editPosition?: IEditPosition }>>("UPDATE_EDIT_POSITION");

	export const setViews = factory<PayloadWithContainerId<{ views: InteractionRegion[] }>>("SET_VIEWS");
	export const addView = factory<PayloadWithContainerId<{ view: InteractionRegion }>>("ADD_VIEW");
	export const replaceLastView = factory<PayloadWithContainerId<{ view: InteractionRegion }>>("REPLACE_LAST_VIEW");
	export const removeView = factory<PayloadWithContainerId<{ view: InteractionRegion }>>("REMOVE_VIEW");

	export const addSubView = factory<PayloadWithContainerId<{ subView: InteractionRegion }>>("ADD_SUB_VIEW");
	export const removeSubView = factory<PayloadWithContainerId<object>>("REMOVE_SUB_VIEW");

	export const openVisibilityConfig =
		factory<PayloadWithContainerId<{ placeableRefId: string }>>("OPEN_VISIBILITY_CONFIG");

	export const openPageBreakConfig =
		factory<PayloadWithContainerId<{ placeableRefId: string }>>("OPEN_PAGE_BREAK_CONFIG");
}
