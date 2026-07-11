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
import { produce } from "immer";
import type { Action, Reducer } from "redux";

import type { DeepPartial } from "@com.mgmtp.a12.print/print-model-api/utils";
import type { TransactionLogStore } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import { SidebarItem } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import { PrintEngineActions } from "../../store/actions.js";

import { EditorMode } from "../editor-state/state.js";

import { NavigationActions } from "./actions.js";
import type { CanvasTabState, EntityNavStack, EntityStackEntry, NavigationState, WrapperStackEntry } from "./state.js";
import { FULLSCREEN_TABS, isCanvasTab, tabToEntityType } from "./state.js";

const initialCanvasTabState: CanvasTabState = { entities: {} };

const initialState: NavigationState = {
	sidebarState: {
		activeTab: SidebarItem.GENERAL,
		activeCanvasTab: SidebarItem.SEGMENT,
		isOpen: true,
		isFullscreen: false,
	},
	[SidebarItem.SEGMENT]: initialCanvasTabState,
	[SidebarItem.SECTION]: initialCanvasTabState,
	[SidebarItem.WATERMARK]: initialCanvasTabState,
	[SidebarItem.TEXT_STYLES]: {},
};

export const NavigationReducer: Reducer<NavigationState> = (
	state: NavigationState = initialState,
	action: Action
): NavigationState => {
	if (PrintEngineActions.resetState.match(action)) {
		return initialState;
	}
	return produce(state, (draft: NavigationState) => {
		if (PrintEngineActions.removeInvalidSelections.match(action)) {
			return handleSetInvalidState(draft, action.payload);
		}
		if (NavigationActions.setActiveTab.match(action)) {
			return handleSetActiveTab(draft, action.payload);
		}
		if (NavigationActions.setExpandedState.match(action)) {
			return handleSetExpandedState(draft, action.payload);
		}
		if (NavigationActions.setActiveEntity.match(action)) {
			return handleSetActiveEntity(draft, action.payload);
		}
		if (NavigationActions.pushWrapper.match(action)) {
			return handlePushWrapper(draft, action.payload);
		}
		if (NavigationActions.popWrapper.match(action)) {
			return handlePopWrapper(draft, action.payload);
		}
		if (NavigationActions.setCurrentMode.match(action)) {
			return handleSetCurrentMode(draft, action.payload);
		}
		if (NavigationActions.setDetailForm.match(action)) {
			return handleSetDetailForm(draft, action.payload);
		}
		if (NavigationActions.setSelectedElement.match(action)) {
			return handleSetSelectedElement(draft, action.payload);
		}
		if (NavigationActions.pushFormStack.match(action)) {
			return handlePushFormStack(draft, action.payload);
		}
		if (NavigationActions.popFormStack.match(action)) {
			return handlePopFormStack(draft, action.payload);
		}
		if (NavigationActions.replaceOrAddFormByType.match(action)) {
			return handleReplaceOrAddFormByType(draft, action.payload);
		}
		if (NavigationActions.jumpTo.match(action)) {
			return handleJumpTo(draft, action.payload);
		}
		if (NavigationActions.resetEntity.match(action)) {
			return handleResetEntity(draft, action.payload);
		}
		if (NavigationActions.clearActiveEntity.match(action)) {
			return handleClearActiveEntity(draft, action.payload);
		}
		if (NavigationActions.updateWrapperEntry.match(action)) {
			return handleUpdateWrapperEntry(draft, action.payload);
		}
		if (NavigationActions.toggleDetailFormFullscreen.match(action)) {
			return handleToggleDetailFormFullscreen(draft, action.payload);
		}
	});
};

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

function handleSetInvalidState(draft: NavigationState, logStore: TransactionLogStore): void {
	filterCanvasTab(draft[SidebarItem.SEGMENT], logStore.segments.map, logStore.printModelElements);
	filterCanvasTab(draft[SidebarItem.SECTION], logStore.sections?.map ?? {}, logStore.printModelElements);
	filterCanvasTab(draft[SidebarItem.WATERMARK], logStore.watermarks?.map ?? {}, logStore.printModelElements);

	const selectedTextStyleId = draft[SidebarItem.TEXT_STYLES].selectedTextStyleId;
	if (selectedTextStyleId && !(selectedTextStyleId in (logStore.textStyles?.map ?? {}))) {
		draft[SidebarItem.TEXT_STYLES].selectedTextStyleId = undefined;
	}
}

function filterCanvasTab(
	tabState: CanvasTabState,
	validEntityIds: Record<string, unknown>,
	validElementIds: Record<string, unknown>
): void {
	for (const entityId of Object.keys(tabState.entities)) {
		if (!(entityId in validEntityIds)) {
			delete tabState.entities[entityId];
			if (tabState.activeEntityId === entityId) {
				tabState.activeEntityId = undefined;
			}
		} else {
			filterFormStackElements(tabState.entities[entityId], validElementIds);
		}
	}
}

function filterFormStackElements(stack: EntityNavStack, validElementIds: Record<string, unknown>): void {
	for (const entry of stack) {
		for (const modeState of Object.values(entry.modes)) {
			if (!modeState?.detailForm) {
				continue;
			}

			modeState.detailForm.formStack = modeState.detailForm.formStack.filter(form => {
				if ("id" in form) {
					return form.id in validElementIds;
				}
				return true;
			}) as typeof modeState.detailForm.formStack;

			if (modeState.selectedElementId && !(modeState.selectedElementId in validElementIds)) {
				modeState.selectedElementId = undefined;
			}

			if (!modeState.detailForm.formStack.length) {
				modeState.detailForm = undefined;
			}
		}
	}
}

function handleSetActiveTab(draft: NavigationState, tab: SidebarItem): void {
	draft.sidebarState.activeTab = tab;
	draft.sidebarState.isFullscreen = FULLSCREEN_TABS.includes(tab);
	if (isCanvasTab(tab)) {
		draft.sidebarState.activeCanvasTab = tab;
	}
}

function handleSetExpandedState(
	draft: NavigationState,
	{ isOpen, isFullscreen }: NavigationActions.SetExpandedStatePayload
): void {
	if (isOpen !== undefined) {
		draft.sidebarState.isOpen = isOpen;
	}
	if (isFullscreen !== undefined) {
		draft.sidebarState.isFullscreen = isFullscreen;
	}
}

function handleSetActiveEntity(
	draft: NavigationState,
	{ tab, entityId }: NavigationActions.SetActiveEntityPayload
): void {
	if (!draft[tab].entities[entityId]) {
		draft[tab].entities[entityId] = [
			{
				id: entityId,
				type: tabToEntityType(tab),
				currentMode: EditorMode.Default,
				modes: {},
			} as EntityStackEntry,
		];
	}
	draft[tab].activeEntityId = entityId;
	draft.sidebarState.activeCanvasTab = tab;
}

function handlePushWrapper(
	draft: NavigationState,
	{ tab, entityId, entry }: NavigationActions.PushWrapperPayload
): void {
	draft[tab].entities[entityId] ??= [];
	draft[tab].entities[entityId].push(entry);
}

function handlePopWrapper(draft: NavigationState, { tab, entityId }: NavigationActions.PopWrapperPayload): void {
	const stack = draft[tab].entities[entityId];
	if (!stack || stack.length <= 1) {
		return;
	}
	stack.pop();
}

function handleSetCurrentMode(
	draft: NavigationState,
	{ tab, entityId, mode }: NavigationActions.SetCurrentModePayload
): void {
	const entry = draft[tab].entities[entityId]?.at(-1);
	if (entry) {
		entry.currentMode = mode;
	}
}

function handleSetDetailForm(
	draft: NavigationState,
	{ tab, entityId, mode, form }: NavigationActions.SetDetailFormPayload
): void {
	const entry = draft[tab].entities[entityId]?.at(-1);
	if (!entry) {
		return;
	}
	if (!entry.modes[mode]) {
		entry.modes[mode] = {};
	}
	entry.modes[mode].detailForm = form;
}

function handleSetSelectedElement(
	draft: NavigationState,
	{ tab, entityId, mode, elementId }: NavigationActions.SetSelectedElementPayload
): void {
	const entry = draft[tab].entities[entityId]?.at(-1);
	if (!entry) {
		return;
	}
	if (!entry.modes[mode]) {
		entry.modes[mode] = {};
	}
	entry.modes[mode].selectedElementId = elementId;
}

function handlePushFormStack(
	draft: NavigationState,
	{ tab, entityId, mode, form }: NavigationActions.PushFormStackPayload
): void {
	const entry = draft[tab].entities[entityId]?.at(-1);
	if (!entry) {
		return;
	}
	if (!entry.modes[mode]) {
		entry.modes[mode] = {};
	}
	const modeState = entry.modes[mode];
	if (modeState.detailForm) {
		modeState.detailForm.formStack.push(form);
	} else {
		modeState.detailForm = { formStack: [form] } as NonNullable<typeof modeState.detailForm>;
	}
}

function handlePopFormStack(
	draft: NavigationState,
	{ tab, entityId, mode }: NavigationActions.PopFormStackPayload
): void {
	const formStack = draft[tab].entities[entityId]?.at(-1)?.modes[mode]?.detailForm?.formStack;
	if (!formStack || formStack.length <= 1) {
		return;
	}
	formStack.pop();
}

function handleReplaceOrAddFormByType(
	draft: NavigationState,
	{ tab, entityId, mode, form }: NavigationActions.ReplaceOrAddFormByTypePayload
): void {
	const formStack = draft[tab].entities[entityId]?.at(-1)?.modes[mode]?.detailForm?.formStack;
	if (!formStack || formStack.length === 0) {
		return;
	}
	const existingIndex = formStack.findIndex(f => f.type === form.type);
	if (existingIndex !== -1) {
		formStack[existingIndex] = form;
	} else {
		formStack.push(form);
	}
}

function handleJumpTo(draft: NavigationState, payload: DeepPartial<NavigationState>): void {
	if (payload.sidebarState) {
		Object.assign(draft.sidebarState, payload.sidebarState);
	}

	for (const tab of [SidebarItem.SEGMENT, SidebarItem.SECTION, SidebarItem.WATERMARK] as const) {
		const update = payload[tab];
		if (!update) {
			continue;
		}
		if (update.activeEntityId !== undefined) {
			draft[tab].activeEntityId = update.activeEntityId as string;
		}
		if (update.entities) {
			Object.assign(draft[tab].entities, update.entities as Record<string, EntityNavStack>);
		}
	}

	const textStylesUpdate = payload[SidebarItem.TEXT_STYLES];
	if (textStylesUpdate) {
		Object.assign(draft[SidebarItem.TEXT_STYLES], textStylesUpdate);
	}
}

function handleResetEntity(draft: NavigationState, { tab, entityId }: NavigationActions.ResetEntityPayload): void {
	const existingRoot = draft[tab].entities[entityId]?.[0];
	draft[tab].activeEntityId = entityId;
	draft[tab].entities[entityId] = [
		{
			id: entityId,
			type: tabToEntityType(tab),
			currentMode: existingRoot?.currentMode ?? EditorMode.Default,
			modes: {},
		},
	];
}

function handleClearActiveEntity(draft: NavigationState, { tab }: NavigationActions.ClearActiveEntityPayload): void {
	draft[tab].activeEntityId = undefined;
}

function handleUpdateWrapperEntry(
	draft: NavigationState,
	{ tab, entityId, id, dimensions, dataContexts }: NavigationActions.UpdateWrapperEntryPayload
): void {
	const stack = draft[tab].entities[entityId];
	if (!stack) {
		return;
	}
	const entry = stack.find(e => e.id === id) as WrapperStackEntry | undefined;
	if (!entry) {
		return;
	}
	entry.dimensions = dimensions;
	if (dataContexts !== undefined) {
		entry.dataContexts = dataContexts;
	}
}

function handleToggleDetailFormFullscreen(
	draft: NavigationState,
	{ tab, entityId, mode }: NavigationActions.ToggleDetailFormFullscreenPayload
): void {
	const detailForm = draft[tab].entities[entityId]?.at(-1)?.modes[mode]?.detailForm;
	if (detailForm) {
		detailForm.isFullScreen = !detailForm.isFullScreen;
	}
}
