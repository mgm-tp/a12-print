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
import type { DataContext, Measure } from "@com.mgmtp.a12.print/print-model-api/model";
import type { DeepPartial } from "@com.mgmtp.a12.print/print-model-api/utils";
import type { SidebarItem } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import type { EntityInstancePath } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import type { OmitId } from "../../utils/type-utils.js";

import type { EditorMode } from "../editor-state/state.js";
import { actionCreatorFactory } from "../actionCreatorFactory/actionCreatorFactory.js";

import type { AnyFormState, CanvasTab, DetailFormState, NavigationState, WrapperStackEntry } from "./state.js";

const factory = actionCreatorFactory("Print/Navigation");

export namespace NavigationActions {
	export interface SetExpandedStatePayload {
		isOpen?: boolean;
		isFullscreen?: boolean;
	}

	export interface SetActiveEntityPayload {
		tab: CanvasTab;
		entityId: string;
	}

	export interface PushWrapperPayload {
		tab: CanvasTab;
		entityId: string;
		entry: WrapperStackEntry;
	}

	export interface PopWrapperPayload {
		tab: CanvasTab;
		entityId: string;
	}

	export interface SetCurrentModePayload {
		tab: CanvasTab;
		entityId: string;
		mode: EditorMode;
	}

	export interface SetDetailFormPayload {
		tab: CanvasTab;
		entityId: string;
		mode: EditorMode;
		form: DetailFormState | undefined;
	}

	export interface SetSelectedElementPayload {
		tab: CanvasTab;
		entityId: string;
		mode: EditorMode;
		elementId: string | undefined;
	}

	export interface PushFormStackPayload {
		tab: CanvasTab;
		entityId: string;
		mode: EditorMode;
		form: AnyFormState;
	}

	export interface PopFormStackPayload {
		tab: CanvasTab;
		entityId: string;
		mode: EditorMode;
	}

	export interface ReplaceOrAddFormByTypePayload {
		tab: CanvasTab;
		entityId: string;
		mode: EditorMode;
		form: AnyFormState;
	}

	export interface ResetEntityPayload {
		tab: CanvasTab;
		entityId: string;
	}

	export interface ClearActiveEntityPayload {
		tab: CanvasTab;
	}

	export interface UpdateWrapperEntryPayload {
		tab: CanvasTab;
		entityId: string;
		id: string;
		dimensions: { width: OmitId<Measure>; height: OmitId<Measure> };
		dataContexts?: DeepPartial<DataContext>[];
	}

	export interface ToggleDetailFormFullscreenPayload {
		tab: CanvasTab;
		entityId: string;
		mode: EditorMode;
	}

	export interface NavigateFromPathPayload {
		path: EntityInstancePath;
		target?: { type: SidebarItem; id: string };
	}

	export const setActiveTab = factory<SidebarItem>("SET_ACTIVE_TAB");
	export const setExpandedState = factory<SetExpandedStatePayload>("SET_EXPANDED_STATE");
	export const setActiveEntity = factory<SetActiveEntityPayload>("SET_ACTIVE_ENTITY");
	export const pushWrapper = factory<PushWrapperPayload>("PUSH_WRAPPER");
	export const popWrapper = factory<PopWrapperPayload>("POP_WRAPPER");
	export const setCurrentMode = factory<SetCurrentModePayload>("SET_CURRENT_MODE");
	export const setDetailForm = factory<SetDetailFormPayload>("SET_DETAIL_FORM");
	export const setSelectedElement = factory<SetSelectedElementPayload>("SET_SELECTED_ELEMENT");
	export const pushFormStack = factory<PushFormStackPayload>("PUSH_FORM_STACK");
	export const popFormStack = factory<PopFormStackPayload>("POP_FORM_STACK");
	export const replaceOrAddFormByType = factory<ReplaceOrAddFormByTypePayload>("REPLACE_OR_ADD_FORM_BY_TYPE");
	export const jumpTo = factory<DeepPartial<NavigationState>>("JUMP_TO");
	export const resetEntity = factory<ResetEntityPayload>("RESET_ENTITY");
	export const clearActiveEntity = factory<ClearActiveEntityPayload>("CLEAR_ACTIVE_ENTITY");
	export const updateWrapperEntry = factory<UpdateWrapperEntryPayload>("UPDATE_WRAPPER_ENTRY");
	export const toggleDetailFormFullscreen = factory<ToggleDetailFormFullscreenPayload>(
		"TOGGLE_DETAIL_FORM_FULLSCREEN"
	);
	export const navigateFromPath = factory<NavigateFromPathPayload>("NAVIGATE_FROM_LINK");
}
