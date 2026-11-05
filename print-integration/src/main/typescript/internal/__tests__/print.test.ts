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
import { jest } from "@jest/globals";

import type { Annotation } from "@com.mgmtp.a12.base/base-model-api";

import type { PrintIntegrationError as PrintIntegrationErrorType } from "../../errors.js";
import type { PrintJsonRpc2Request } from "../../request.js";

const busyAction = (busy: boolean) => ({ type: "application/setBusy", payload: busy });
const errorAction = (payload: unknown) => ({ type: "activity/error", payload });

// Only the client-core members the production code actually uses; mocking the module
// keeps the selector and the dispatched actions under the test's control.
jest.unstable_mockModule("@com.mgmtp.a12.client/client-core", () => ({
	ActivityActions: { error: errorAction },
	ApplicationActions: { setBusy: busyAction },
	LocaleSelectors: { locale: () => () => "de" },
}));

// Imported after the mock registration - a static import would load the real module first.
const { runSaga } = await import("redux-saga");
const { Dispatcher } = await import("@com.mgmtp.a12.dataservices/dataservices-access");
const { PRINT_MODEL_ANNOTATION_NAME } = await import("../../constants.js");
const { PRINT_RPC_METHOD } = await import("../../request.js");
const { PrintIntegrationError, PrintIntegrationErrorCode } = await import("../../errors.js");
const { printDocument } = await import("../print.js");

const ACTIVITY_ID = "activity-1";
const DOCUMENT_ID = "dm-invoice/doc-4711";
const PRINT_MODEL_ID = "pm-invoice";
const DOWNLOAD_URL = "http://host/content/4711";

const printModelAnnotation = { name: PRINT_MODEL_ANNOTATION_NAME, value: PRINT_MODEL_ID } as Annotation;

let dispatch: ReturnType<typeof jest.fn>;
let windowOpen: ReturnType<typeof jest.fn>;
/** The JSON-RPC requests the production code actually put on the wire. */
let sentRequests: PrintJsonRpc2Request[];

/** Replaces the REST transport by `respond`, which sees the deserialized outgoing requests. */
function mockRest(respond: (requests: PrintJsonRpc2Request[]) => unknown): void {
	jest.spyOn(Dispatcher, "rest").mockImplementation((async (payload: { body: string }) => {
		const requests = JSON.parse(payload.body) as PrintJsonRpc2Request[];
		sentRequests.push(...requests);
		return respond(requests);
	}) as never);
}

function okResponse(id: string | number | null, result: unknown = DOWNLOAD_URL) {
	return { id, jsonrpc: "2.0", result };
}

/** Answers every incoming request successfully - the default for tests that are not about the response. */
function mockSuccessfulRest(result: unknown = DOWNLOAD_URL): void {
	mockRest(requests => [okResponse(requests[0].id, result)]);
}

/** The activity error action the production code is expected to dispatch for `errorCode`. */
function expectedErrorAction(errorCode: string) {
	return errorAction({
		activityId: ACTIVITY_ID,
		operationType: "loading",
		error: expect.objectContaining({ errorCode }),
	});
}

/** The error carried by the dispatched activity error action. */
function dispatchedError(): PrintIntegrationErrorType {
	const errorActions = dispatch.mock.calls
		.map(([action]) => action as ReturnType<typeof errorAction>)
		.filter(action => action.type === "activity/error");
	expect(errorActions).toHaveLength(1);
	return (errorActions[0].payload as { error: PrintIntegrationErrorType }).error;
}

/** Runs the print saga to completion, feeding its effects from the test's dispatch and state. */
function runPrintDocument(...args: Parameters<typeof printDocument>): Promise<unknown> {
	return runSaga({ dispatch, getState: () => ({}), onError: () => undefined }, printDocument, ...args).toPromise();
}

beforeEach(() => {
	sentRequests = [];
	dispatch = jest.fn();
	windowOpen = jest.spyOn(window, "open").mockReturnValue({} as Window) as unknown as ReturnType<typeof jest.fn>;
});

afterEach(() => {
	jest.restoreAllMocks();
});

describe("printDocument", () => {
	it("should open the returned download url and toggle the busy indicator", async () => {
		mockSuccessfulRest();

		await runPrintDocument(DOCUMENT_ID, ACTIVITY_ID, true, [printModelAnnotation]);

		expect(windowOpen).toHaveBeenCalledWith(DOWNLOAD_URL, "_blank");
		expect(dispatch).toHaveBeenNthCalledWith(1, busyAction(true));
		expect(dispatch).toHaveBeenNthCalledWith(2, busyAction(false));
	});

	it("should send a PRINT request carrying the document, the print model and the current locale", async () => {
		mockSuccessfulRest();

		await runPrintDocument(DOCUMENT_ID, ACTIVITY_ID, true, [printModelAnnotation]);

		expect(sentRequests).toHaveLength(1);
		expect(sentRequests[0]).toMatchObject({
			jsonrpc: "2.0",
			method: PRINT_RPC_METHOD,
			params: { printModelId: PRINT_MODEL_ID, docRef: DOCUMENT_ID },
		});
		expect(sentRequests[0].id).toMatch(new RegExp(`^${PRINT_RPC_METHOD}_`));
	});

	it("should pick the print model out of a list of unrelated annotations", async () => {
		mockSuccessfulRest();

		await runPrintDocument(DOCUMENT_ID, ACTIVITY_ID, true, [
			{ name: "some_other_annotation", value: "irrelevant" } as Annotation,
			printModelAnnotation,
		]);

		expect(sentRequests[0].params.printModelId).toBe(PRINT_MODEL_ID);
	});

	it("should not touch the busy indicator when the loading indicator is disabled", async () => {
		mockSuccessfulRest();

		await runPrintDocument(DOCUMENT_ID, ACTIVITY_ID, false, [printModelAnnotation]);

		expect(dispatch).not.toHaveBeenCalled();
		expect(windowOpen).toHaveBeenCalledWith(DOWNLOAD_URL, "_blank");
	});

	describe("error handling", () => {
		it("should report a missing print model annotation as an activity error", async () => {
			mockSuccessfulRest();

			await runPrintDocument(DOCUMENT_ID, ACTIVITY_ID, true, []);

			expect(dispatch).toHaveBeenCalledWith(
				expectedErrorAction(PrintIntegrationErrorCode.MODELLING_INFORMATION_MISSING)
			);
			expect(sentRequests).toHaveLength(0);
			expect(windowOpen).not.toHaveBeenCalled();
		});

		it("should report an activity error when no annotations are passed at all", async () => {
			mockSuccessfulRest();

			await runPrintDocument(DOCUMENT_ID, ACTIVITY_ID, true, undefined);

			expect(dispatch).toHaveBeenCalledWith(
				expectedErrorAction(PrintIntegrationErrorCode.MODELLING_INFORMATION_MISSING)
			);
		});

		it("should name the expected annotation in the reported error", async () => {
			mockSuccessfulRest();

			await runPrintDocument(DOCUMENT_ID, ACTIVITY_ID, true, []);

			const error = dispatchedError();
			expect(PrintIntegrationError.ModellingInformationMissing.isInstance(error)).toBe(true);
			expect(error.message).toContain(PRINT_MODEL_ANNOTATION_NAME);
		});

		it("should still reset the busy indicator when an activity error is reported", async () => {
			mockSuccessfulRest();

			await runPrintDocument(DOCUMENT_ID, ACTIVITY_ID, true, []);

			expect(dispatch).toHaveBeenNthCalledWith(1, busyAction(true));
			expect(dispatch).toHaveBeenNthCalledWith(3, busyAction(false));
		});

		it("should report a single response outside of a batch as a wrong server response", async () => {
			mockRest(requests => okResponse(requests[0].id));

			await runPrintDocument(DOCUMENT_ID, ACTIVITY_ID, true, [printModelAnnotation]);

			expect(dispatch).toHaveBeenCalledWith(expectedErrorAction(PrintIntegrationErrorCode.WRONG_SERVER_RESPONSE));
			expect(windowOpen).not.toHaveBeenCalled();
		});

		it("should report an empty batch as a wrong server response", async () => {
			mockRest(() => []);

			await runPrintDocument(DOCUMENT_ID, ACTIVITY_ID, true, [printModelAnnotation]);

			expect(dispatch).toHaveBeenCalledWith(expectedErrorAction(PrintIntegrationErrorCode.WRONG_SERVER_RESPONSE));
			expect(windowOpen).not.toHaveBeenCalled();
		});

		it("should report a batch holding more than the print response as a wrong server response", async () => {
			mockRest(requests => [okResponse(requests[0].id), okResponse("PRINT_someone-elses-id")]);

			await runPrintDocument(DOCUMENT_ID, ACTIVITY_ID, true, [printModelAnnotation]);

			expect(dispatch).toHaveBeenCalledWith(expectedErrorAction(PrintIntegrationErrorCode.WRONG_SERVER_RESPONSE));
			expect(windowOpen).not.toHaveBeenCalled();
		});

		it("should report a result that is not a download url as a wrong server response", async () => {
			mockSuccessfulRest({ url: DOWNLOAD_URL });

			await runPrintDocument(DOCUMENT_ID, ACTIVITY_ID, true, [printModelAnnotation]);

			expect(dispatch).toHaveBeenCalledWith(expectedErrorAction(PrintIntegrationErrorCode.WRONG_SERVER_RESPONSE));
			expect(PrintIntegrationError.WrongServerResponseError.isInstance(dispatchedError())).toBe(true);
			expect(windowOpen).not.toHaveBeenCalled();
		});

		it("should report a JSON-RPC error response as a server error", async () => {
			const serverError = { code: -32603, message: "Print Model not found", data: undefined };
			mockRest(requests => [{ id: requests[0].id, jsonrpc: "2.0", error: serverError }]);

			await runPrintDocument(DOCUMENT_ID, ACTIVITY_ID, true, [printModelAnnotation]);

			expect(dispatch).toHaveBeenCalledWith(expectedErrorAction(PrintIntegrationErrorCode.SERVER_ERROR));
			expect(windowOpen).not.toHaveBeenCalled();

			const error = dispatchedError();
			expect(PrintIntegrationError.ServerError.isInstance(error)).toBe(true);
			expect((error as PrintIntegrationErrorType.ServerError).error).toEqual(serverError);
		});

		it("should report a window open error when the browser refuses to open the download url", async () => {
			mockSuccessfulRest();
			windowOpen.mockReturnValue(null);

			await runPrintDocument(DOCUMENT_ID, ACTIVITY_ID, true, [printModelAnnotation]);

			expect(dispatch).toHaveBeenCalledWith(expectedErrorAction(PrintIntegrationErrorCode.WINDOW_OPEN_ERROR));
			expect(PrintIntegrationError.WindowOpenError.isInstance(dispatchedError())).toBe(true);
			expect(windowOpen).toHaveBeenCalledWith(DOWNLOAD_URL, "_blank");
		});

		it("should not let a blocked window reject the saga", async () => {
			mockSuccessfulRest();
			windowOpen.mockReturnValue(null);

			await expect(
				runPrintDocument(DOCUMENT_ID, ACTIVITY_ID, true, [printModelAnnotation])
			).resolves.toBeUndefined();
		});

		it("should still reset the busy indicator when the window cannot be opened", async () => {
			mockSuccessfulRest();
			windowOpen.mockReturnValue(null);

			await runPrintDocument(DOCUMENT_ID, ACTIVITY_ID, true, [printModelAnnotation]);

			expect(dispatch).toHaveBeenNthCalledWith(1, busyAction(true));
			expect(dispatch).toHaveBeenLastCalledWith(busyAction(false));
		});

		it("should reset the busy indicator when the transport itself fails", async () => {
			jest.spyOn(Dispatcher, "rest").mockRejectedValue(new Error("network down") as never);

			await expect(runPrintDocument(DOCUMENT_ID, ACTIVITY_ID, true, [printModelAnnotation])).rejects.toThrow(
				"network down"
			);

			expect(dispatch).toHaveBeenNthCalledWith(1, busyAction(true));
			expect(dispatch).toHaveBeenNthCalledWith(2, busyAction(false));
		});
	});
});
