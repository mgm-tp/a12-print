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
import { JsonRpc2Request, JsonRpc2Response } from "@com.mgmtp.a12.dataservices/dataservices-access";

export const PRINT_RPC_METHOD = "PRINT";

export function isInstance(obj: unknown): obj is PrintJsonRpc2Request {
	return JsonRpc2Request.isInstance(obj) && obj.method === PRINT_RPC_METHOD;
}

export interface PrintJsonRpc2Request extends JsonRpc2Request {
	readonly method: typeof PRINT_RPC_METHOD;
	readonly params: {
		printModelId: string;
		docRef: string;
		locale: string;
	};
}

export interface PrintJsonRpc2Response extends JsonRpc2Response {
	readonly result: string;
}

export namespace PrintJsonRpc2Response {
	export function isInstance(obj: unknown): obj is PrintJsonRpc2Response {
		return JsonRpc2Response.ok.isInstance(obj) && typeof obj.result === "string";
	}
}
