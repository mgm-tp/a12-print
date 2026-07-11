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
import { createSelector } from "reselect";

import { SidebarItem } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import type { PrintEngineState } from "../../../a12internal/api/PrintEngineState.js";
import { createSliceSelector } from "../../store/create-slice-selector.js";
import { assertExists } from "../../utils/type-utils.js";

import { EditorMode } from "../editor-state/state.js";

import type { DetailFormState, NavigationState } from "./state.js";
import type { AnyFormState, BaseElementFormState, BaseFormState, BaseReferenceFormState } from "./types/form-state.js";
import { isBaseElementFormState, isBaseReferenceFormState } from "./types/form-state.js";

export namespace NavigationSelectors {
	export const navigationState = createSliceSelector<NavigationState>(state => state.Navigation);

	export const activeTab = createSelector(navigationState, state => state.sidebarState.activeTab);
	export const activeCanvasTab = createSelector(navigationState, state => state.sidebarState.activeCanvasTab);

	const currentCanvasNavigationParts = createSelector([navigationState], navigation => {
		const tab = navigation.sidebarState.activeCanvasTab;
		const tabState = navigation[tab];
		const entityId = tabState.activeEntityId;
		const stack = entityId ? tabState.entities[entityId] : [];
		const currentEntry = stack && stack.length > 0 ? stack.at(-1) : undefined;
		const mode = currentEntry?.currentMode || EditorMode.Default;

		return { tab, entityId, mode, currentEntry };
	});

	export const sidebarState = createSelector(navigationState, navigationState => navigationState.sidebarState);

	export const currentMode = createSelector(
		[(state: PrintEngineState) => currentCanvasNavigationParts(state)],
		(navigationParts): EditorMode => {
			if (!navigationParts) {
				return EditorMode.Default;
			}
			return navigationParts.mode;
		}
	);

	export const activeEntities = createSelector(navigationState, nav => ({
		segmentId: nav[SidebarItem.SEGMENT].activeEntityId || "",
		sectionId: nav[SidebarItem.SECTION].activeEntityId || "",
		watermarkId: nav[SidebarItem.WATERMARK].activeEntityId || "",
		currentRefType: nav.sidebarState.activeCanvasTab,
	}));

	export const detailForm = createSelector(
		[(state: PrintEngineState) => currentCanvasNavigationParts(state)],
		(navigationParts): DetailFormState | undefined => {
			if (!navigationParts) {
				return undefined;
			}
			const { currentEntry, mode } = navigationParts;
			return currentEntry?.modes[mode]?.detailForm;
		}
	);

	export const selectedElementId = createSelector(
		[(state: PrintEngineState) => currentCanvasNavigationParts(state)],
		(navigationParts): string | undefined => {
			if (!navigationParts) {
				return undefined;
			}
			const { currentEntry, mode } = navigationParts;
			return currentEntry?.modes[mode]?.selectedElementId;
		}
	);

	export const canvasNavigationContext = createSelector(
		[(state: PrintEngineState) => currentCanvasNavigationParts(state)],
		navigationParts => {
			assertExists(navigationParts, "Only available on canvas tab");
			const { tab, entityId, mode } = navigationParts;
			return {
				tab,
				entityId,
				mode,
			};
		}
	);

	export const currentCanvasStageContext = createSelector(
		[(state: PrintEngineState) => currentCanvasNavigationParts(state)],
		navigationParts => {
			const { tab, entityId, mode } = navigationParts;

			assertExists(tab);
			assertExists(entityId);
			return {
				tab,
				entityId,
				mode,
			};
		}
	);

	export const currentSubForm = createSelector(
		[(state: PrintEngineState) => currentCanvasNavigationParts(state)],
		(navigationParts): BaseFormState | undefined => {
			if (!navigationParts) {
				return undefined;
			}

			const { currentEntry, mode } = navigationParts;

			const modeState = currentEntry?.modes[mode];
			const detailFormState = modeState?.detailForm;

			if (!detailFormState || detailFormState.formStack.length <= 1) return undefined;
			return detailFormState.formStack.at(-1);
		}
	);

	export const currentForm = createSelector(
		[(state: PrintEngineState) => currentCanvasNavigationParts(state)],
		(navigationParts): BaseFormState | undefined => {
			if (!navigationParts) {
				return undefined;
			}

			const { currentEntry, mode } = navigationParts;

			const modeState = currentEntry?.modes[mode];
			const detailFormState = modeState?.detailForm;

			if (!detailFormState || detailFormState.formStack.length === 0) return undefined;
			return detailFormState.formStack.at(-1);
		}
	);

	export const currentElementForm = createSelector(
		[(state: PrintEngineState) => currentCanvasNavigationParts(state)],
		(navigationParts): BaseElementFormState | undefined => {
			if (!navigationParts) {
				return undefined;
			}

			const { currentEntry, mode } = navigationParts;

			const modeState = currentEntry?.modes[mode];
			const detailFormState = modeState?.detailForm;

			if (!detailFormState || detailFormState.formStack.length === 0) return undefined;
			const form = detailFormState.formStack.at(-1);

			if (!form || !isBaseElementFormState(form)) {
				return undefined;
			}

			return form;
		}
	);

	export const currentReferenceForm = createSelector(
		[(state: PrintEngineState) => currentCanvasNavigationParts(state)],
		(navigationParts): BaseReferenceFormState | undefined => {
			if (!navigationParts) {
				return undefined;
			}

			const { currentEntry, mode } = navigationParts;

			const modeState = currentEntry?.modes[mode];
			const detailFormState = modeState?.detailForm;

			if (!detailFormState || detailFormState.formStack.length === 0) return undefined;
			const form = detailFormState.formStack.at(-1);

			if (!form || !isBaseReferenceFormState(form)) {
				return undefined;
			}

			return form;
		}
	);

	export const firstForm = createSelector(
		[(state: PrintEngineState) => currentCanvasNavigationParts(state)],
		(navigationParts): BaseFormState | undefined => {
			if (!navigationParts) {
				return undefined;
			}

			const { currentEntry, mode } = navigationParts;

			const modeState = currentEntry?.modes[mode];
			const detailFormState = modeState?.detailForm;

			if (!detailFormState || detailFormState.formStack.length === 0) return undefined;
			return detailFormState.formStack[0];
		}
	);

	export const formStateByType = createSelector(
		[
			(state: PrintEngineState) => currentCanvasNavigationParts(state),
			(_: PrintEngineState, type: AnyFormState["type"]) => type,
		],
		(navigationParts, type): BaseFormState | undefined => {
			if (!navigationParts) {
				return undefined;
			}

			const { currentEntry, mode } = navigationParts;

			const modeState = currentEntry?.modes[mode];
			const detailFormState = modeState?.detailForm;

			if (!detailFormState) return undefined;
			return detailFormState.formStack.find(form => form.type === type);
		}
	);
}
