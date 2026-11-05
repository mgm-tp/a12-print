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
import type { Action } from "redux";
import { runSaga, stdChannel } from "redux-saga";

import { ActivityActions, ActivitySelectors } from "@com.mgmtp.a12.client/client-core";
import {
	Commands,
	Events,
	FormEngineActions,
	FormEngineSelectors,
	ModelSelectors,
	UiStateSelectors,
} from "@com.mgmtp.a12.formengine/formengine-core";

import { PRINT_EVENT } from "../../../constants.js";
import { PrintIntegrationError, PrintIntegrationErrorCode } from "../../../errors.js";

const printDocument = jest.fn();
jest.unstable_mockModule("../../print.js", () => ({ printDocument }));

const { watchFormPrintButtonSaga } = await import("../form-print-button-saga.js");

const ACTIVITY_ID = "activity-1";
const DOCUMENT_ID = "dm-invoice/doc-4711";
const BUTTON_PATH = [{ elementName: "print-button" }];

let dispatch: ReturnType<typeof jest.fn>;

function printButtonAction(name: string = PRINT_EVENT) {
	return FormEngineActions.event({
		activityId: ACTIVITY_ID,
		engineEvent: Events.eventButton({ name, buttonPath: BUTTON_PATH }),
	} as never);
}

/** The full validation the saga is expected to trigger before printing. */
function expectedValidateFullAction() {
	return FormEngineActions.command({
		activityId: ACTIVITY_ID,
		engineEvent: Commands.validateFull({}),
	} as never);
}

/** The save the saga is expected to trigger for a dirty activity. */
function expectedSaveStartedAction() {
	return ActivityActions.save.started({ activityId: ACTIVITY_ID });
}

/** The activity error action the saga is expected to dispatch for `errorCode`. */
function expectedErrorAction(errorCode: string) {
	return ActivityActions.error({
		activityId: ACTIVITY_ID,
		operationType: "loading",
		error: expect.objectContaining({ errorCode }) as never,
	});
}

/** A validation entry as it is held in the ui state of the Form Engine. */
function validationEntry(severity: "ERROR" | "WARNING" | "INFO") {
	return { validationMessages: [{ severity }] };
}

/**
 * Makes the engine state resolvable and mocks what the saga reads from it: the clicked print
 * button in the Form Model and the current validation messages.
 */
function mockEngineState({ button = {}, messages = {} }: { button?: object; messages?: object } = {}) {
	jest.spyOn(FormEngineSelectors, "engineState").mockReturnValue((() => ({})) as never);
	jest.spyOn(UiStateSelectors, "messages").mockReturnValue((() => messages) as never);
	jest.spyOn(ModelSelectors, "formModel").mockReturnValue((() => ({
		// A button panel is the smallest Form Model element the button path resolution traverses.
		type: "ButtonPanel",
		button: [{ name: "print-button", type: "EVENT", ...button }],
	})) as never);
}

/**
 * Starts the watcher, feeds it `action` the way the store would and lets the worker run to
 * completion. The `followUps` are dispatched afterwards, e.g. to complete a pending save.
 */
async function dispatchToSaga(
	action: Action,
	{ showLoading = true, validateAndSave = true, followUps = [] as Action[] } = {}
): Promise<void> {
	const channel = stdChannel();
	const task = runSaga(
		{ channel, dispatch, getState: () => ({}), onError: () => undefined },
		watchFormPrintButtonSaga,
		showLoading,
		validateAndSave
	);

	channel.put(action);
	await Promise.resolve();

	for (const followUp of followUps) {
		channel.put(followUp);
		await Promise.resolve();
	}

	task.cancel();
	await task.toPromise();
}

beforeEach(() => {
	dispatch = jest.fn();
	// The button annotations are resolved from the Form Model; leaving the engine state out
	// keeps this suite focused on the saga itself.
	jest.spyOn(FormEngineSelectors, "engineState").mockReturnValue((() => undefined) as never);
	jest.spyOn(FormEngineSelectors, "dataState").mockReturnValue((() => ({
		document: { id: DOCUMENT_ID },
	})) as never);
	jest.spyOn(ActivitySelectors, "dirty").mockReturnValue((() => false) as never);
});

afterEach(() => {
	jest.restoreAllMocks();
});

describe("watchFormPrintButtonSaga", () => {
	it("should print the document of the current activity on a print button event", async () => {
		await dispatchToSaga(printButtonAction());

		expect(printDocument).toHaveBeenCalledWith(DOCUMENT_ID, ACTIVITY_ID, true, undefined);
	});

	it("should pass the loading indicator setting through", async () => {
		await dispatchToSaga(printButtonAction(), { showLoading: false });

		expect(printDocument).toHaveBeenCalledWith(DOCUMENT_ID, ACTIVITY_ID, false, undefined);
	});

	describe("non matching actions", () => {
		it("should ignore a button event that is not the print event", async () => {
			await dispatchToSaga(printButtonAction("event_save"));

			expect(printDocument).not.toHaveBeenCalled();
			expect(dispatch).not.toHaveBeenCalled();
		});

		it("should ignore a Form Engine event that is not a button event", async () => {
			await dispatchToSaga(
				FormEngineActions.event({
					activityId: ACTIVITY_ID,
					engineEvent: { type: "some/other/event", payload: {} },
				} as never)
			);

			expect(printDocument).not.toHaveBeenCalled();
			expect(dispatch).not.toHaveBeenCalled();
		});

		it("should ignore an action that is not a Form Engine event", async () => {
			await dispatchToSaga({ type: "some/unrelated/action" });

			expect(printDocument).not.toHaveBeenCalled();
			expect(dispatch).not.toHaveBeenCalled();
		});
	});

	describe("validation", () => {
		it("should trigger a full validation before printing", async () => {
			await dispatchToSaga(printButtonAction());

			expect(dispatch).toHaveBeenCalledWith(expectedValidateFullAction());
			expect(printDocument).toHaveBeenCalled();
		});

		it("should not print if the full validation reports an error", async () => {
			mockEngineState({ messages: { "invoice.amount": validationEntry("ERROR") } });

			await dispatchToSaga(printButtonAction());

			expect(printDocument).not.toHaveBeenCalled();
		});

		it("should not print if the full validation reports a parse error", async () => {
			mockEngineState({
				messages: { "invoice.amount": { validationMessages: [], parseError: { value: "abc" } } },
			});

			await dispatchToSaga(printButtonAction());

			expect(printDocument).not.toHaveBeenCalled();
		});

		it("should print if the full validation reports warnings and infos only", async () => {
			mockEngineState({
				messages: {
					"invoice.amount": validationEntry("WARNING"),
					"invoice.date": validationEntry("INFO"),
				},
			});

			await dispatchToSaga(printButtonAction());

			expect(printDocument).toHaveBeenCalledWith(DOCUMENT_ID, ACTIVITY_ID, true, undefined);
		});

		it("should not save a dirty activity if the full validation reports an error", async () => {
			jest.spyOn(ActivitySelectors, "dirty").mockReturnValue((() => true) as never);
			mockEngineState({ messages: { "invoice.amount": validationEntry("ERROR") } });

			await dispatchToSaga(printButtonAction());

			expect(dispatch).not.toHaveBeenCalledWith(expectedSaveStartedAction());
		});
	});

	describe("saving", () => {
		beforeEach(() => {
			jest.spyOn(ActivitySelectors, "dirty").mockReturnValue((() => true) as never);
		});

		it("should save a dirty activity and print after the save has finished", async () => {
			await dispatchToSaga(printButtonAction(), {
				followUps: [ActivityActions.save.done({ params: { activityId: ACTIVITY_ID }, result: {} })],
			});

			expect(dispatch).toHaveBeenCalledWith(expectedSaveStartedAction());
			expect(printDocument).toHaveBeenCalledWith(DOCUMENT_ID, ACTIVITY_ID, true, undefined);
		});

		it("should print the document created by the first save even if the data state is not updated yet", async () => {
			// A document that has never been saved has no id in the Form Engine data state; the id
			// the server assigned is only reported by the save result.
			jest.spyOn(FormEngineSelectors, "dataState").mockReturnValue((() => ({ document: {} })) as never);

			await dispatchToSaga(printButtonAction(), {
				followUps: [
					ActivityActions.save.done({
						params: { activityId: ACTIVITY_ID },
						result: { instance: DOCUMENT_ID },
					}),
				],
			});

			expect(printDocument).toHaveBeenCalledWith(DOCUMENT_ID, ACTIVITY_ID, true, undefined);
		});

		it("should not print while the save is still pending", async () => {
			await dispatchToSaga(printButtonAction());

			expect(dispatch).toHaveBeenCalledWith(expectedSaveStartedAction());
			expect(printDocument).not.toHaveBeenCalled();
		});

		it("should not print if the save failed", async () => {
			await dispatchToSaga(printButtonAction(), {
				followUps: [
					ActivityActions.save.failed({
						params: { activityId: ACTIVITY_ID },
						error: new Error("save failed"),
					}),
				],
			});

			expect(printDocument).not.toHaveBeenCalled();
		});

		it("should ignore the save result of another activity", async () => {
			await dispatchToSaga(printButtonAction(), {
				followUps: [ActivityActions.save.done({ params: { activityId: "activity-2" }, result: {} })],
			});

			expect(printDocument).not.toHaveBeenCalled();
		});

		it("should not save an activity that is not dirty", async () => {
			jest.spyOn(ActivitySelectors, "dirty").mockReturnValue((() => false) as never);

			await dispatchToSaga(printButtonAction());

			expect(dispatch).not.toHaveBeenCalledWith(expectedSaveStartedAction());
			expect(printDocument).toHaveBeenCalled();
		});
	});

	describe("button with its own validation", () => {
		it("should not validate again if the button is modelled with the validation full", async () => {
			mockEngineState({ button: { validation: "full" } });

			await dispatchToSaga(printButtonAction());

			expect(dispatch).not.toHaveBeenCalledWith(expectedValidateFullAction());
			expect(printDocument).toHaveBeenCalledWith(DOCUMENT_ID, ACTIVITY_ID, true, undefined);
		});

		it("should still check the validation state of a button modelled with the validation full", async () => {
			mockEngineState({
				button: { validation: "full" },
				messages: { "invoice.amount": validationEntry("ERROR") },
			});

			await dispatchToSaga(printButtonAction());

			expect(printDocument).not.toHaveBeenCalled();
		});

		it("should still save a dirty activity for a button modelled with the validation full", async () => {
			jest.spyOn(ActivitySelectors, "dirty").mockReturnValue((() => true) as never);
			mockEngineState({ button: { validation: "full" } });

			await dispatchToSaga(printButtonAction(), {
				followUps: [ActivityActions.save.done({ params: { activityId: ACTIVITY_ID }, result: {} })],
			});

			expect(dispatch).toHaveBeenCalledWith(expectedSaveStartedAction());
			expect(printDocument).toHaveBeenCalledWith(DOCUMENT_ID, ACTIVITY_ID, true, undefined);
		});

		it("should validate fully if the button is modelled with the validation partial", async () => {
			mockEngineState({ button: { validation: "partial" } });

			await dispatchToSaga(printButtonAction());

			expect(dispatch).toHaveBeenCalledWith(expectedValidateFullAction());
		});

		it("should validate fully if the button is modelled without a validation", async () => {
			mockEngineState();

			await dispatchToSaga(printButtonAction());

			expect(dispatch).toHaveBeenCalledWith(expectedValidateFullAction());
		});

		it("should pass the annotations of the resolved button to the print", async () => {
			const annotations = [{ name: "print_model", value: "ptm-invoice" }];
			mockEngineState({ button: { validation: "full", annotations } });

			await dispatchToSaga(printButtonAction());

			expect(printDocument).toHaveBeenCalledWith(DOCUMENT_ID, ACTIVITY_ID, true, annotations);
		});
	});

	describe("disabled validate and save", () => {
		it("should print without validating the form", async () => {
			await dispatchToSaga(printButtonAction(), { validateAndSave: false });

			expect(dispatch).not.toHaveBeenCalledWith(expectedValidateFullAction());
			expect(printDocument).toHaveBeenCalledWith(DOCUMENT_ID, ACTIVITY_ID, true, undefined);
		});

		it("should print even if the form still holds validation errors", async () => {
			mockEngineState({ messages: { "invoice.amount": validationEntry("ERROR") } });

			await dispatchToSaga(printButtonAction(), { validateAndSave: false });

			expect(printDocument).toHaveBeenCalledWith(DOCUMENT_ID, ACTIVITY_ID, true, undefined);
		});

		it("should print a dirty activity without saving it", async () => {
			jest.spyOn(ActivitySelectors, "dirty").mockReturnValue((() => true) as never);

			await dispatchToSaga(printButtonAction(), { validateAndSave: false });

			expect(dispatch).not.toHaveBeenCalledWith(expectedSaveStartedAction());
			expect(printDocument).toHaveBeenCalledWith(DOCUMENT_ID, ACTIVITY_ID, true, undefined);
		});
	});

	describe("error handling", () => {
		beforeEach(() => {
			jest.spyOn(FormEngineSelectors, "dataState").mockReturnValue((() => ({ document: {} })) as never);
		});

		it("should report a missing document as an activity error instead of printing", async () => {
			await dispatchToSaga(printButtonAction());

			expect(printDocument).not.toHaveBeenCalled();
			expect(dispatch).toHaveBeenCalledWith(
				expectedErrorAction(PrintIntegrationErrorCode.MISSING_DOCUMENT_IN_FORM)
			);
		});

		it("should report the missing document error as a print integration error", async () => {
			await dispatchToSaga(printButtonAction());

			const errorAction = dispatch.mock.calls
				.map(([action]) => action)
				.find(ActivityActions.error.match) as ReturnType<typeof ActivityActions.error>;
			expect(PrintIntegrationError.MissingDocumentInFormError.isInstance(errorAction.payload.error)).toBe(true);
		});
	});
});
