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
import { AnnotationEntity, DeepPartialErrorMap } from "@com.mgmtp.a12.print/print-model-api";

import { PreventLineBreakRule, TypesettingModel } from "../../api/model/index.js";

export const SET_TYPESETTING_MODEL = "SET_TYPESETTING_MODEL";
export const SET_ANNOTATION = "SET_ANNOTATION";
export const SET_PREVENT_LINE_BREAK_RULE = "SET_PREVENT_LINE_BREAK_RULE";
export const SET_SERIALIZED_RESULT = "SET_SERIALIZED_RESULT";
export const SET_ORPHAN = "SET_ORPHAN";
export const SET_WIDOW = "SET_WIDOW";

export type ActionType =
	| typeof SET_TYPESETTING_MODEL
	| typeof SET_ANNOTATION
	| typeof SET_PREVENT_LINE_BREAK_RULE
	| typeof SET_ORPHAN
	| typeof SET_WIDOW
	| typeof SET_SERIALIZED_RESULT;

const editActions = new Set<ActionType>([SET_ANNOTATION, SET_PREVENT_LINE_BREAK_RULE, SET_ORPHAN, SET_WIDOW]);

export type Action<T> = T & {
	type: ActionType;
};

type EditActionPayload<T> = {
	data: T;
	onChange?: (model: TypesettingModel) => void;
};

export const isEditAction = (action: Action<unknown>): action is Action<EditActionPayload<unknown>> => {
	return editActions.has(action.type);
};

export type SetTypesettingModelPayload = {
	data: TypesettingModel;
};
export const isSetTypesettingModel = (action: Action<unknown>): action is Action<SetTypesettingModelPayload> => {
	return action.type === SET_TYPESETTING_MODEL;
};

export type SetAnnotationsPayload = EditActionPayload<AnnotationEntity[]>;

export const isSetAnnotations = (action: Action<unknown>): action is Action<SetAnnotationsPayload> => {
	return action.type === SET_ANNOTATION;
};

export type SetPreventLineBreakRulePayload = EditActionPayload<PreventLineBreakRule[]>;

export const isSetPreventLineBreakRules = (
	action: Action<unknown>
): action is Action<SetPreventLineBreakRulePayload> => {
	return action.type === SET_PREVENT_LINE_BREAK_RULE;
};

export type SetSerializedResultPayload = {
	data: {
		hasErrors?: boolean;
		errorMap?: DeepPartialErrorMap<TypesettingModel>;
	};
};
export const isSetSerializedResult = (action: Action<unknown>): action is Action<SetSerializedResultPayload> => {
	return action.type === SET_SERIALIZED_RESULT;
};

export type SetOrphanWidowPayload = Partial<EditActionPayload<number>>;

export const isSetOrphan = (action: Action<unknown>): action is Action<SetOrphanWidowPayload> => {
	return action.type === SET_ORPHAN;
};

export const isSetWidow = (action: Action<unknown>): action is Action<SetOrphanWidowPayload> => {
	return action.type === SET_WIDOW;
};

export const isRequiredValidation = (action: Action<unknown>) => {
	return isSetTypesettingModel(action) || isSetAnnotations(action) || isSetOrphan(action) || isSetWidow(action);
};

export const isRequiredCustomValidation = (action: Action<unknown>) => {
	return isSetPreventLineBreakRules(action);
};
