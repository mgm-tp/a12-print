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
import { call, put, type SagaGenerator, select } from "typed-redux-saga";

import type { Annotation } from "@com.mgmtp.a12.base/base-model-api";
import { Dispatcher, JsonRpc2Request, JsonRpc2Response } from "@com.mgmtp.a12.dataservices/dataservices-access";
import { ActivityActions, ApplicationActions, LocaleSelectors } from "@com.mgmtp.a12.client/client-core";
import { Locale } from "@com.mgmtp.a12.utils/utils-localization";

import { PRINT_MODEL_ANNOTATION_NAME } from "../constants.js";
import { PRINT_RPC_METHOD, type PrintJsonRpc2Request, PrintJsonRpc2Response } from "../request.js";
import { PrintIntegrationError, PrintIntegrationErrorCode } from "../errors.js";

export function* printDocument(
	documentId: string,
	activityId: string,
	showLoading: boolean,
	annotations?: Annotation[]
): SagaGenerator<void> {
	if (showLoading) {
		yield* put(ApplicationActions.setBusy(true));
	}

	try {
		const locale = yield* select(LocaleSelectors.locale());
		const printModelId = annotations?.find(annotation => PRINT_MODEL_ANNOTATION_NAME === annotation.name)?.value;

		if (!printModelId) {
			yield* put(
				ActivityActions.error(toActivityError(activityId, PrintIntegrationError.ModellingInformationMissing()))
			);
			return;
		}

		const requestId = generateOperationId(PRINT_RPC_METHOD);
		const printRequest: PrintJsonRpc2Request = {
			id: requestId,
			jsonrpc: "2.0",
			method: PRINT_RPC_METHOD,
			params: { printModelId, docRef: documentId, locale: Locale.toString(locale) },
		};

		const rpcRequest = JsonRpc2Request.build([printRequest]);
		const responses = yield* call(
			Dispatcher.rest,
			{
				...rpcRequest,
				customHeaders: [...(rpcRequest.customHeaders ?? []), ["Accept-Language", locale.language]],
			},
			responseChecker
		);

		if (!Array.isArray(responses) || responses.length !== 1) {
			yield* put(
				ActivityActions.error(toActivityError(activityId, PrintIntegrationError.WrongServerResponseError()))
			);
			return;
		}
		const response = responses[0];

		if (JsonRpc2Response.error.isInstance(response)) {
			yield* put(ActivityActions.error(toActivityError(activityId, toServerError(response))));
			return;
		}

		if (!PrintJsonRpc2Response.isInstance(response)) {
			yield* put(
				ActivityActions.error(toActivityError(activityId, PrintIntegrationError.WrongServerResponseError()))
			);
			return;
		}

		if (window.open(response.result, "_blank") === null) {
			yield* put(ActivityActions.error(toActivityError(activityId, PrintIntegrationError.WindowOpenError())));
			return;
		}
	} finally {
		if (showLoading) {
			yield* put(ApplicationActions.setBusy(false));
		}
	}
}

function generateOperationId(method: string): string {
	return `${method}_${crypto.randomUUID()}`;
}

function responseChecker(value: unknown): value is JsonRpc2Response | JsonRpc2Response[] {
	return (
		JsonRpc2Response.isInstance(value) ||
		(Array.isArray(value) && value.every(val => JsonRpc2Response.isInstance(val)))
	);
}

function toActivityError(activityId: string, error: PrintIntegrationError): ActivityActions.ErrorPayload<unknown> {
	return {
		activityId,
		operationType: "loading",
		error,
	};
}

function toServerError(response: JsonRpc2Response): PrintIntegrationError.ServerError {
	return {
		error: response.error!,
		errorCode: PrintIntegrationErrorCode.SERVER_ERROR,
		name: `PRINT_INTEGRATION_ERROR/${PrintIntegrationErrorCode.SERVER_ERROR}`,
		message: `Print Service encountered some errors and was unable to complete the requests. See "error" field for more details.`,
	};
}
