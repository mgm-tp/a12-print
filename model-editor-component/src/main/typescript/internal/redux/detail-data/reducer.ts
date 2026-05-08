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

import { PrintEngineActions } from "../../store/actions.js";

import { EditorMode } from "../editor-state/state.js";

import { DetailDataActions } from "./actions.js";
import { ListingDataReducer, isListingAction } from "./listing/index.js";
import { DetailDataState } from "./state.js";

export const initialDetailDataState: DetailDataState = {};

export const DetailDataReducer: Reducer<DetailDataState> = (
	state: DetailDataState = initialDetailDataState,
	action: Action
): DetailDataState => {
	if (PrintEngineActions.resetState.match(action)) {
		return initialDetailDataState;
	}
	if (DetailDataActions.updateRefId.match(action)) {
		const { containerId } = action.payload;
		return containerId
			? {
					...state,
					[containerId]: {
						...state?.[containerId],
						refId: action.payload.refId,
					},
				}
			: state;
	}
	if (DetailDataActions.remove.match(action)) {
		const { containerId } = action.payload;
		const newState = { ...state };
		delete newState[containerId];

		return containerId ? newState : state;
	}
	if (DetailDataActions.updateAdditionalData.match(action)) {
		const { containerId, ...rest } = action.payload;
		return containerId
			? {
					...state,
					[containerId]: {
						...state[containerId],
						additionalData: rest,
					},
				}
			: state;
	}
	if (DetailDataActions.deleteAdditionalData.match(action)) {
		const { containerId } = action.payload;
		return containerId
			? {
					...state,
					[containerId]: {
						...state[containerId],
						additionalData: undefined,
					},
				}
			: state;
	}
	if (DetailDataActions.updateOpenForm.match(action)) {
		const { containerId } = action.payload;
		return containerId
			? {
					...state,
					[containerId]: {
						...state[containerId],
						isFormOpen: {
							...state[containerId].isFormOpen,
							...action.payload.isFormOpen,
						},
						additionalData: undefined,
						isVisibilityConfig: false,
						placeableRefId: undefined,
					},
				}
			: state;
	}
	if (DetailDataActions.updateFullFormScreen.match(action)) {
		const { containerId } = action.payload;
		return containerId
			? {
					...state,
					[containerId]: {
						...state[containerId],
						isFullScreenForm: action.payload.isFullScreenForm,
					},
				}
			: state;
	}
	if (DetailDataActions.updateEditPositionTextForm.match(action)) {
		const { containerId, editPosition } = action.payload;
		return containerId
			? {
					...state,
					[containerId]: {
						...state[containerId],
						additionalData: {
							text: { ...state[containerId].additionalData?.text, editPosition },
						},
					},
				}
			: state;
	}

	if (DetailDataActions.setViews.match(action)) {
		const { containerId, views } = action.payload;

		return {
			...state,
			[containerId]: {
				...state[containerId],
				formContainers: views,
			},
		};
	}

	if (DetailDataActions.addView.match(action)) {
		const { containerId, view } = action.payload;

		return {
			...state,
			[containerId]: {
				...state[containerId],
				formContainers: [...(state[containerId].formContainers || []), view],
			},
		};
	}

	if (DetailDataActions.replaceLastView.match(action)) {
		const { containerId, view } = action.payload;

		const formContainers = [...(state[containerId].formContainers || [])];
		if (formContainers.length > 1) {
			formContainers[formContainers.length - 1] = view;
		} else {
			formContainers.push(view);
		}

		return {
			...state,
			[containerId]: {
				...state[containerId],
				formContainers,
			},
		};
	}

	if (DetailDataActions.removeView.match(action)) {
		const { containerId, view } = action.payload;
		return {
			...state,
			[containerId]: {
				...state[containerId],
				formContainers: (state[containerId].formContainers || []).filter(v => v !== view),
			},
		};
	}

	if (DetailDataActions.addSubView.match(action)) {
		const { containerId, subView } = action.payload;

		return {
			...state,
			[containerId]: {
				...state[containerId],
				subFormContainer: subView,
			},
		};
	}

	if (DetailDataActions.removeSubView.match(action)) {
		const { containerId } = action.payload;

		return {
			...state,
			[containerId]: {
				...state[containerId],
				subFormContainer: undefined,
			},
		};
	}

	if (DetailDataActions.openVisibilityConfig.match(action)) {
		const { containerId, placeableRefId } = action.payload;
		return {
			...state,
			[containerId]: {
				isFormOpen: {
					...state[containerId]?.isFormOpen,
					[EditorMode.Default]: true,
				},
				formContainers: [],
				isVisibilityConfig: true,
				placeableRefId,
			},
		};
	}

	if (DetailDataActions.openPageBreakConfig.match(action)) {
		const { containerId, placeableRefId } = action.payload;
		return {
			...state,
			[containerId]: {
				...state[containerId],
				isFormOpen: {
					...state[containerId]?.isFormOpen,
					[EditorMode.Layout]: true,
				},
				isPageBreakConfig: true,
				placeableRefId,
			},
		};
	}

	if (isListingAction(state, action)) {
		return ListingDataReducer(state, action);
	}

	if (PrintEngineActions.removeInvalidSelections.match(action)) {
		const transactionLogStore = action.payload;
		const newState = { ...state };

		const allUsedElementIds = new Set(
			Object.values(transactionLogStore.printModelElements).map(el => el.memoizedObject.id)
		);
		for (const [containerId, detailData] of Object.entries(newState)) {
			if (!allUsedElementIds.has(detailData.refId || "") || detailData.additionalData) {
				delete newState[containerId];
			}
		}
		return newState;
	}

	return state;
};
