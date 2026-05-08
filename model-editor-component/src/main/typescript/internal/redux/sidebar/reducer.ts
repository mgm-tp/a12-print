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
import { Action, Reducer } from "redux";

import { SidebarItem } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/index.js";

import { PrintEngineActions } from "../../store/actions.js";

import { SidebarActions } from "./actions.js";
import { SidebarState } from "./state.js";

export const FULLSCREEN_TABS = [SidebarItem.GENERAL, SidebarItem.TEXT_STYLES, SidebarItem.COMMIT_CHANGES];

const initialState: SidebarState = { selectedItem: SidebarItem.GENERAL, isOpen: true, isFullscreen: false };

export const SidebarReducer: Reducer<SidebarState> = (
	state: SidebarState = initialState,
	action: Action
): SidebarState => {
	if (PrintEngineActions.resetState.match(action)) {
		return initialState;
	}
	if (SidebarActions.setCurrentView.match(action)) {
		return { ...state, ...action.payload };
	}
	if (SidebarActions.setExpandedState.match(action)) {
		return { ...state, ...action.payload };
	}
	return state;
};
