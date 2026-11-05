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
import type { Activity } from "@com.mgmtp.a12.client/client-core";
import { JsonRpc2Response } from "@com.mgmtp.a12.dataservices/dataservices-access";

import { PRINT_MODEL_ANNOTATION_NAME } from "./constants.js";

export interface PrintIntegrationBaseError extends Error, Activity.Error.Base {
	readonly message: string;
}

export class PrintIntegrationError<ErrorCode extends string = PrintIntegrationErrorCode>
	extends Error
	implements PrintIntegrationBaseError
{
	errorCode: ErrorCode;

	constructor(
		params: Error & {
			errorCode: ErrorCode;
		}
	) {
		super(params.message);
		this.name = params.name;
		this.errorCode = params.errorCode;
	}
}

export namespace PrintIntegrationBaseError {
	export function isInstance(object: unknown): object is PrintIntegrationBaseError {
		return !!object && typeof object === "object" && "errorCode" in object && "name" in object;
	}
}

export enum PrintIntegrationErrorCode {
	SERVER_ERROR = "SERVER_ERROR",
	WRONG_SERVER_RESPONSE = "WRONG_SERVER_RESPONSE",
	MODELLING_INFORMATION_MISSING = "MODELLING_INFORMATION_MISSING",
	MISSING_DOCUMENT_IN_FORM = "MISSING_DOCUMENT_IN_FORM",
	WINDOW_OPEN_ERROR = "WINDOW_OPEN_ERROR",
}

export namespace PrintIntegrationError {
	export function isInstance(object: unknown): object is PrintIntegrationError {
		return (
			PrintIntegrationBaseError.isInstance(object) &&
			Object.keys(PrintIntegrationErrorCode).includes(object.errorCode)
		);
	}

	export interface ServerError extends PrintIntegrationError<PrintIntegrationErrorCode.SERVER_ERROR> {
		readonly error: JsonRpc2Response.JsonRpc2Error;
	}

	export namespace ServerError {
		export function isInstance(object: unknown): object is ServerError {
			return (
				PrintIntegrationBaseError.isInstance(object) &&
				object.errorCode === PrintIntegrationErrorCode.SERVER_ERROR &&
				"error" in object &&
				JsonRpc2Response.JsonRpc2Error.isInstance(object.error)
			);
		}
	}

	export const WrongServerResponseError = createError(
		PrintIntegrationErrorCode.WRONG_SERVER_RESPONSE,
		"The server did not respond with the expected PDF URL"
	);

	export const ModellingInformationMissing = createError(
		PrintIntegrationErrorCode.MODELLING_INFORMATION_MISSING,
		`The print model id needs to be set in an annotation with the name ${PRINT_MODEL_ANNOTATION_NAME}`
	);

	export const MissingDocumentInFormError = createError(
		PrintIntegrationErrorCode.MISSING_DOCUMENT_IN_FORM,
		"No document could be found in the current form activity."
	);

	export const WindowOpenError = createError(
		PrintIntegrationErrorCode.WINDOW_OPEN_ERROR,
		"The PDF cannot be downloaded"
	);
}

/**
 * A utility function to create error creators and their type guards
 */
function createError<Code extends PrintIntegrationErrorCode, Params extends unknown[] = unknown[]>(
	errorCode: Code,
	errorMessage: string
): ErrorConstructor<Code, Params> & ErrorTypeGuard<PrintIntegrationError<Code>> {
	const result = (): PrintIntegrationError<Code> => {
		return new PrintIntegrationError<Code>({
			errorCode,
			name: createName(errorCode),
			message: errorMessage,
		});
	};

	result.isInstance = (object: unknown): object is PrintIntegrationError<Code> =>
		PrintIntegrationError.isInstance(object) && object.errorCode === errorCode;

	return result;
}

export type ErrorConstructor<Code extends PrintIntegrationErrorCode, Params extends unknown[]> = (
	...params: Params
) => PrintIntegrationError<Code>;

export interface ErrorTypeGuard<Error extends PrintIntegrationError> {
	isInstance(object: unknown): object is Error;
}

const createName = (errorCode: PrintIntegrationErrorCode, ...subtypes: string[]) =>
	["PRINT_INTEGRATION_ERROR", errorCode, ...subtypes].join("/");
