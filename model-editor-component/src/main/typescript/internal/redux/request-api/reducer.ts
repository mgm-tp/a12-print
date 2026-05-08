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

import { TypesettingModel } from "@com.mgmtp.a12.print/print-typesetting/lib/internal/api/model/typesetting-model.js";

import { PrintEngineActions } from "../../store/actions.js";
import { DINTemplateSegment } from "../../api/index.js";

import { RequestApiActions } from "./actions.js";
import { RequestApiState } from "./state.js";

const defaultState: RequestApiState = {
	printModelData: {},
};

export const RequestApiReducer: Reducer<RequestApiState> = (
	state: RequestApiState = defaultState,
	action: Action
): RequestApiState => {
	if (PrintEngineActions.resetState.match(action)) {
		return defaultState;
	}

	if (RequestApiActions.setPrintModelHeaders.match(action)) {
		return {
			...state,
			printModelHeaders: action.payload,
		};
	}

	if (RequestApiActions.setPrintModelData.match(action)) {
		return {
			...state,
			printModelData: {
				...state.printModelData,
				[action.payload.id]: action.payload.printModel,
			},
		};
	}

	if (RequestApiActions.setDocumentModelIds.match(action)) {
		return {
			...state,
			documentModelIds: action.payload,
		};
	}

	if (RequestApiActions.setDINTemplatePrintModels.match(action)) {
		return {
			...state,
			dinTemplatePrintModels: action.payload.reduce(
				(dinTemplatePrintModels: Record<string, DINTemplateSegment[]>, { printModelId, templateSegments }) => {
					dinTemplatePrintModels[printModelId] = templateSegments;
					return dinTemplatePrintModels;
				},
				{}
			),
		};
	}

	if (RequestApiActions.setTypesettingModelHeaders.match(action)) {
		return {
			...state,
			typesettingModelHeaders: action.payload,
		};
	}

	if (RequestApiActions.setTypesettingModels.match(action)) {
		const modelMap: Record<string, TypesettingModel> = action.payload.reduce(
			(acc: Record<string, TypesettingModel>, model) => {
				acc[model.header.id] = model;
				return acc;
			},
			{}
		);
		return {
			...state,
			typesettingModelData: {
				...state.typesettingModelData,
				...modelMap,
			},
		};
	}

	if (RequestApiActions.setTypesettingModel.match(action)) {
		return {
			...state,
			typesettingModelData: {
				...state.typesettingModelData,
				[action.payload.header.id]: action.payload,
			},
		};
	}

	return state;
};
