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
import { PRINT_MODEL_ANNOTATION_NAME } from "../constants.js";
import { PrintIntegrationBaseError, PrintIntegrationError, PrintIntegrationErrorCode } from "../errors.js";

const serverError = {
	errorCode: PrintIntegrationErrorCode.SERVER_ERROR,
	name: `PRINT_INTEGRATION_ERROR/${PrintIntegrationErrorCode.SERVER_ERROR}`,
	message: "The print service failed",
	error: { code: -32603, message: "Print Model not found", data: undefined },
};

describe("PrintIntegrationError", () => {
	it("should be a regular Error carrying its error code", () => {
		const error = PrintIntegrationError.WrongServerResponseError();

		expect(error).toBeInstanceOf(Error);
		expect(error.errorCode).toBe(PrintIntegrationErrorCode.WRONG_SERVER_RESPONSE);
		expect(error.name).toBe(`PRINT_INTEGRATION_ERROR/${PrintIntegrationErrorCode.WRONG_SERVER_RESPONSE}`);
		expect(error.message).toBeTruthy();
	});

	it("should name the expected annotation in the modelling information message", () => {
		expect(PrintIntegrationError.ModellingInformationMissing().message).toContain(PRINT_MODEL_ANNOTATION_NAME);
		expect(PrintIntegrationError.ModellingInformationMissing().errorCode).toBe(
			PrintIntegrationErrorCode.MODELLING_INFORMATION_MISSING
		);
	});

	it("should create a missing document error", () => {
		const error = PrintIntegrationError.MissingDocumentInFormError();

		expect(error.errorCode).toBe(PrintIntegrationErrorCode.MISSING_DOCUMENT_IN_FORM);
		expect(error.message).toContain("document");
	});

	it("should create a new instance on every call", () => {
		expect(PrintIntegrationError.WrongServerResponseError()).not.toBe(
			PrintIntegrationError.WrongServerResponseError()
		);
	});

	describe("isInstance", () => {
		it("should accept every error created by this module", () => {
			expect(PrintIntegrationError.isInstance(PrintIntegrationError.WrongServerResponseError())).toBe(true);
			expect(PrintIntegrationError.isInstance(PrintIntegrationError.ModellingInformationMissing())).toBe(true);
			expect(PrintIntegrationError.isInstance(PrintIntegrationError.MissingDocumentInFormError())).toBe(true);
			expect(PrintIntegrationError.isInstance(serverError)).toBe(true);
		});

		it("should reject values that are no print integration errors", () => {
			expect(PrintIntegrationError.isInstance(new Error("boom"))).toBe(false);
			expect(PrintIntegrationError.isInstance({ name: "some error", errorCode: "SOME_OTHER_CODE" })).toBe(false);
			expect(PrintIntegrationError.isInstance(undefined)).toBe(false);
			expect(PrintIntegrationError.isInstance(null)).toBe(false);
			expect(PrintIntegrationError.isInstance("SERVER_ERROR")).toBe(false);
		});
	});

	describe("the type guards of the single errors", () => {
		it("should only accept the error they belong to", () => {
			const wrongResponse = PrintIntegrationError.WrongServerResponseError();

			expect(PrintIntegrationError.WrongServerResponseError.isInstance(wrongResponse)).toBe(true);
			expect(PrintIntegrationError.ModellingInformationMissing.isInstance(wrongResponse)).toBe(false);
			expect(PrintIntegrationError.MissingDocumentInFormError.isInstance(wrongResponse)).toBe(false);
			expect(PrintIntegrationError.ServerError.isInstance(wrongResponse)).toBe(false);
		});

		it("should reject arbitrary values", () => {
			expect(PrintIntegrationError.MissingDocumentInFormError.isInstance(new Error("boom"))).toBe(false);
			expect(PrintIntegrationError.MissingDocumentInFormError.isInstance(undefined)).toBe(false);
		});
	});

	describe("ServerError.isInstance", () => {
		it("should accept a server error carrying the JSON-RPC error", () => {
			expect(PrintIntegrationError.ServerError.isInstance(serverError)).toBe(true);
		});

		it("should reject a server error without a JSON-RPC error", () => {
			const { error: _error, ...withoutRpcError } = serverError;

			expect(PrintIntegrationError.ServerError.isInstance(withoutRpcError)).toBe(false);
		});

		it("should reject an error with a different error code", () => {
			expect(
				PrintIntegrationError.ServerError.isInstance({
					...serverError,
					errorCode: PrintIntegrationErrorCode.WRONG_SERVER_RESPONSE,
				})
			).toBe(false);
		});
	});
});

describe("PrintIntegrationBaseError.isInstance", () => {
	it("should accept anything carrying a name and an error code", () => {
		expect(PrintIntegrationBaseError.isInstance(PrintIntegrationError.WrongServerResponseError())).toBe(true);
		expect(PrintIntegrationBaseError.isInstance({ name: "foreign error", errorCode: "FOREIGN" })).toBe(true);
	});

	it("should reject values without an error code", () => {
		expect(PrintIntegrationBaseError.isInstance(new Error("boom"))).toBe(false);
		expect(PrintIntegrationBaseError.isInstance({})).toBe(false);
		expect(PrintIntegrationBaseError.isInstance(undefined)).toBe(false);
	});
});
