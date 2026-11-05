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
import { isInstance, PRINT_RPC_METHOD, PrintJsonRpc2Response } from "../request.js";

const validRequest = {
	id: "PRINT_1",
	jsonrpc: "2.0",
	method: PRINT_RPC_METHOD,
	params: { printModelId: "pm-1", docRef: "dm-1/doc-1", locale: "en" },
};

describe("request", () => {
	describe("isInstance", () => {
		it("should accept a well formed print request", () => {
			expect(isInstance(validRequest)).toBe(true);
		});

		it.each([
			["a request with a different method", { ...validRequest, method: "ADD_DOCUMENT" }],
			["a request without a method", { id: "PRINT_1", jsonrpc: "2.0", params: {} }],
			["a non-object value", "PRINT"],
			["null", null],
			["undefined", undefined],
		])("should reject %s", (_name, value) => {
			expect(isInstance(value)).toBe(false);
		});
	});

	describe("PrintJsonRpc2Response.isInstance", () => {
		it("should accept a successful response carrying a string result", () => {
			expect(
				PrintJsonRpc2Response.isInstance({ id: "PRINT_1", jsonrpc: "2.0", result: "http://host/file" })
			).toBe(true);
		});

		it("should reject a successful response whose result is not a string", () => {
			expect(PrintJsonRpc2Response.isInstance({ id: "PRINT_1", jsonrpc: "2.0", result: { url: "x" } })).toBe(
				false
			);
		});

		it("should reject an error response", () => {
			expect(
				PrintJsonRpc2Response.isInstance({
					id: "PRINT_1",
					jsonrpc: "2.0",
					error: { code: -32603, message: "boom", data: undefined },
				})
			).toBe(false);
		});

		it.each([
			["a non-object value", "http://host/file"],
			["null", null],
			["undefined", undefined],
		])("should reject %s", (_name, value) => {
			expect(PrintJsonRpc2Response.isInstance(value)).toBe(false);
		});
	});
});
