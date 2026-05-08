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

import { ElementType } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { TransactionLogStore } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/transaction-log.js";

import { PrintEngineActions } from "../../store/actions.js";

import { PayloadWithContainerId } from "../detail-data/actions.js";

import { WrapperActions } from "./actions.js";
import { WrapperState } from "./state.js";

const defaultWrapperState: WrapperState = {};

export const WrapperReducer: Reducer<WrapperState> = (state = defaultWrapperState, action: Action): WrapperState => {
	if (PrintEngineActions.resetState.match(action)) {
		return defaultWrapperState;
	}
	if (WrapperActions.addWrapperStage.match(action)) {
		return handleAddWrapperStage(state, action.payload);
	}
	if (WrapperActions.updateWrapperStage.match(action)) {
		return handleUpdateWrapperStage(state, action.payload);
	}
	if (WrapperActions.removeWrapperStage.match(action)) {
		return handleRemoveWrapperStage(state, action.payload);
	}
	if (WrapperActions.removeAllWrapperStages.match(action)) {
		const { containerId } = action.payload;
		const newState = { ...state };
		delete newState[containerId];
		return newState;
	}
	if (PrintEngineActions.removeInvalidSelections.match(action)) {
		return handleRemoveInvalidSelections(state, action.payload);
	}
	return state;
};

function handleAddWrapperStage(state: WrapperState, payload: WrapperActions.WrapperStagePayload) {
	const { containerId, id, type, dimensions, dataContexts, wrapperContext } = payload;
	return containerId && id
		? {
				...state,
				[containerId]: state?.[containerId]
					? [...state[containerId], { id, type, dimensions, dataContexts, wrapperContext }]
					: [{ id, type, dimensions, dataContexts, wrapperContext }],
			}
		: state;
}

function handleUpdateWrapperStage(state: WrapperState, payload: WrapperActions.WrapperStagePayload) {
	const { containerId, id, ...restProperties } = payload;
	return containerId && id
		? {
				...state,
				[containerId]: state?.[containerId]
					? state[containerId].map(wrapper =>
							wrapper.id === id ? { ...wrapper, ...restProperties } : wrapper
						)
					: [{ id, ...restProperties }],
			}
		: state;
}
function handleRemoveWrapperStage(state: WrapperState, payload: PayloadWithContainerId<{ id: string }>) {
	const { containerId, id } = payload;
	if (containerId === id) {
		const newState = { ...state };
		delete newState[containerId];
		return newState;
	}
	const elIndex = state[containerId].findIndex(box => box.id === id);
	return state[containerId] && id
		? {
				...state,
				[containerId]: state[containerId].filter((id, index) => index <= elIndex),
			}
		: state;
}
function handleRemoveInvalidSelections(state: WrapperState, payload: TransactionLogStore) {
	const transactionLogStore = payload;
	const newState = { ...state };

	const allUsedWrapperElementIds = new Set(
		Object.values(transactionLogStore.printModelElements)
			.filter(el =>
				[ElementType.BoundingBox, ElementType.Override, ElementType.Area, ElementType.Switch].includes(
					el.memoizedObject.type
				)
			)
			.map(el => el.memoizedObject.id)
	);
	for (const [containerId, wrappers] of Object.entries(newState)) {
		const validWrappers = wrappers.filter(wrapper => allUsedWrapperElementIds.has(wrapper.id));
		if (validWrappers.length > 0) {
			newState[containerId] = validWrappers;
		} else {
			delete newState[containerId];
		}
	}

	return newState;
}
