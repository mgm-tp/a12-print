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
import { nanoid } from "nanoid";

import { Model } from "@com.mgmtp.a12.base/base-model-api/lib/main/model/index.js";
import {
	DeepPartialErrorMap,
	PrintErrorMap,
} from "@com.mgmtp.a12.print/print-model-api/lib/errors/deep-partial-error-map.js";

import { TypesettingModel } from "../../api/model/index.js";
import { TypesettingModelMarshaller } from "../../api/marshaller/index.js";

import { createTypesettingModel } from "../utils/model.js";
import { PreventLineBreakRuleValidator } from "../utils/custom-validator.js";

import {
	Action,
	isSetSerializedResult,
	isRequiredCustomValidation,
	isRequiredValidation,
	isSetAnnotations,
	isSetOrphan,
	isSetPreventLineBreakRules,
	isSetTypesettingModel,
	isSetWidow,
} from "./action.js";

const typesettingModelMarshaller = new TypesettingModelMarshaller();

interface TypesettingState {
	model?: TypesettingModel;
	deserializeReport?: {
		hasErrors?: boolean;
		errorMap?: DeepPartialErrorMap<TypesettingModel>;
	};
	serializeReport?: {
		hasErrors?: boolean;
		errorMap?: DeepPartialErrorMap<TypesettingModel>;
	};
	customValidation?: {
		hasErrors: boolean;
		preventLineBreakRules: PrintErrorMap[];
	};
}

export function reducer(state: TypesettingState, action: Action<unknown>): TypesettingState {
	let newState = { ...state };

	if (isSetTypesettingModel(action)) {
		newState = {
			...newState,
			model: action.data,
		};
	}
	if (isSetSerializedResult(action)) {
		newState = {
			...newState,
			serializeReport: action.data,
		};
	}

	if (!newState.model) {
		throw new Error("Typesetting is undefined while updating state");
	}
	if (isSetAnnotations(action)) {
		const { data: annotations, onChange } = action;
		newState = {
			...newState,
			model: {
				...newState.model,
				header: { ...newState.model?.header, annotations },
			},
		};
		newState.model && onChange && onChange(newState.model);
	} else if (isSetPreventLineBreakRules(action)) {
		const { data: rules, onChange } = action;
		newState = {
			...newState,
			model: {
				...newState.model,
				content: {
					...newState.model.content,
					preventLineBreakRules: rules,
				},
			},
		};
		newState.model && onChange && onChange(newState.model);
	} else if (isSetOrphan(action)) {
		const { data: value, onChange } = action;
		newState = {
			...newState,
			model: {
				...newState.model,
				content: {
					...newState.model?.content,
					orphan: value,
				},
			},
		};
		newState.model && onChange && onChange(newState.model);
	} else if (isSetWidow(action)) {
		const { data: value, onChange } = action;
		newState = {
			...newState,
			model: {
				...newState.model,
				content: {
					...newState.model?.content,
					widow: value,
				},
			},
		};
		newState.model && onChange && onChange(newState.model);
	}

	if (isRequiredValidation(action)) {
		const serializedResult = typesettingModelMarshaller.serialize(newState.model!);
		const { report } = serializedResult;
		newState = {
			...newState,
			serializeReport: {
				errorMap: report.errorMap,
				hasErrors: !report.noErrorOccurred,
			},
		};
	}
	if (isRequiredCustomValidation(action)) {
		const { errorMap, noErrorOccurred } = PreventLineBreakRuleValidator.validate(
			newState.model!.content.preventLineBreakRules
		);
		newState = {
			...newState,
			customValidation: {
				hasErrors: !noErrorOccurred,
				preventLineBreakRules: errorMap,
			},
		};
	}

	return newState;
}

interface InitializerParams {
	model?: Model;
}
export function createInitialTypesettingState({ model }: InitializerParams): TypesettingState {
	if (!model) {
		const initialModel = createTypesettingModel(nanoid());

		const deserializedResult = typesettingModelMarshaller.deserialize(
			initialModel as unknown as Record<string, unknown>
		);

		return {
			model: deserializedResult.result,
		};
	}

	const { result, report } = typesettingModelMarshaller.deserialize(model as unknown as Record<string, unknown>);

	return {
		model: result,
		deserializeReport: {
			hasErrors: !report.noErrorOccurred,
			errorMap: report.errorMap,
		},
	};
}
