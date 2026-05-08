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
import { Locale } from "@com.mgmtp.a12.utils/utils-localization/lib/main/index.js";
import { Model } from "@com.mgmtp.a12.base/base-model-api/lib/main/model/index.js";
import { DeepPartialErrorMap } from "@com.mgmtp.a12.print/print-model-api/lib/errors/index.js";

import { PrintSettingModelMarshaller } from "../../../../api/marshaller/print-setting-marshaller.js";
import { createPrintSettingModel } from "../../../utils/index.js";
import { expandFontErrorMap } from "../../../utils/font-path.js";
import { PrintSettingModel } from "../../../../api/model/print-setting-model.js";

import {
	Action,
	isPrintSettingStateAction,
	isRequireValidation,
	isSetPrintSettingModel,
	isSetInvalidFontPaths,
} from "./action.js";

const printSettingModelMarshaller = new PrintSettingModelMarshaller();

interface PrintSettingState {
	model?: PrintSettingModel;
	deserializeReport?: {
		hasErrors?: boolean;
		errorMap?: DeepPartialErrorMap<PrintSettingModel>;
	};
	serializeReport?: {
		hasErrors?: boolean;
		errorMap?: DeepPartialErrorMap<PrintSettingModel>;
	};
}

export function reducer(state: PrintSettingState, action: Action<unknown>): PrintSettingState {
	let nextState = state;

	if (!isPrintSettingStateAction(action)) {
		throw new Error(`Unknown action type: ${action.type}`);
	}

	if (isSetPrintSettingModel(action)) {
		nextState = {
			...state,
			model: action.data,
		};
	}

	if (isRequireValidation(action) && nextState.model) {
		const serializedResult = printSettingModelMarshaller.serialize(nextState.model, []);
		const { report } = serializedResult;
		nextState = {
			...nextState,
			serializeReport: {
				hasErrors: !report.noErrorOccurred,
				errorMap: report.errorMap,
			},
		};
	}

	if (isSetInvalidFontPaths(action)) {
		if (!action.errors.length) {
			return nextState;
		}

		const finalErrorMap = expandFontErrorMap(nextState.serializeReport?.errorMap, action.errors);

		nextState = {
			...nextState,
			serializeReport: {
				hasErrors: true,
				errorMap: finalErrorMap,
			},
		};
	}

	return nextState;
}

interface InitializerParams {
	locale: Locale;
	model?: Model;
}
export function createInitialPrintSettingState({ model }: InitializerParams): PrintSettingState {
	if (!model) {
		const initialModel = createPrintSettingModel();

		const deserializedResult = printSettingModelMarshaller.deserialize(
			initialModel as unknown as Record<string, unknown>,
			[]
		);
		return {
			model: deserializedResult.result,
		};
	}

	const { result, report } = printSettingModelMarshaller.deserialize(model as unknown as Record<string, unknown>, []);

	return {
		model: result,
		deserializeReport: {
			hasErrors: !report.noErrorOccurred,
			errorMap: report.errorMap,
		},
	};
}
