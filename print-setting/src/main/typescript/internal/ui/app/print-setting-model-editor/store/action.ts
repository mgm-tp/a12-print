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
import { PrintError } from "@com.mgmtp.a12.print/print-model-api/lib/errors/index.js";

import { PrintSettingModel } from "../../../../api/model/index.js";

export const SET_PRINT_SETTING_MODEL = "SET_PRINT_SETTING_MODEL";
export const SET_FONT_PATH_ERRORS = "SET_FONT_PATH_ERRORS";

export type SetFontPathErrorsPayload = {
	errors: PrintError[];
};
export type SetPrintSettingModelPayload = {
	data: PrintSettingModel;
};
export const isSetPrintSettingModel = (action: Action<unknown>): action is Action<SetPrintSettingModelPayload> => {
	return action.type === SET_PRINT_SETTING_MODEL;
};

export const isSetInvalidFontPaths = (action: Action<unknown>): action is Action<SetFontPathErrorsPayload> => {
	return action.type === SET_FONT_PATH_ERRORS;
};

export const isRequireValidation = (action: Action<unknown>) => {
	return isSetPrintSettingModel(action);
};

export const isPrintSettingStateAction = (action: Action<unknown>) => {
	return isSetPrintSettingModel(action) || isSetInvalidFontPaths(action);
};

export type ActionType = typeof SET_PRINT_SETTING_MODEL | typeof SET_FONT_PATH_ERRORS;

export type Action<T> = T & {
	type: ActionType;
};
