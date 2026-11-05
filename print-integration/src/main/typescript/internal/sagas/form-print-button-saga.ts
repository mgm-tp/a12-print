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
import type { Action } from "redux";
import { call, fork, join, put, type SagaGenerator, select, take, takeEvery } from "typed-redux-saga";

import type { EngineStore, FormModel } from "@com.mgmtp.a12.formengine/formengine-core";
import {
	Commands,
	Events,
	findElementByFormModelPath,
	FormEngineActions,
	FormEngineSelectors,
	ModelSelectors,
	UiStateSelectors,
} from "@com.mgmtp.a12.formengine/formengine-core";
import { ActivityActions, ActivitySelectors } from "@com.mgmtp.a12.client/client-core";

import { PRINT_EVENT } from "../../constants.js";
import { PrintIntegrationError } from "../../errors.js";

import { printDocument } from "../print.js";

type FormEngineEventAction = ReturnType<typeof FormEngineActions.event>;
type ButtonPath = ReturnType<typeof Events.eventButton>["payload"]["buttonPath"];
type SaveDoneAction = ReturnType<typeof ActivityActions.save.done>;
type SaveFailedAction = ReturnType<typeof ActivityActions.save.failed>;

export function* watchFormPrintButtonSaga(showLoading: boolean, validateAndSave: boolean): SagaGenerator<void> {
	yield* takeEvery(FormEngineActions.event.match, handleEvent, showLoading, validateAndSave);
}

function* handleEvent(
	showLoading: boolean,
	validateAndSave: boolean,
	action: FormEngineEventAction
): SagaGenerator<void> {
	const { activityId, engineEvent } = action.payload;

	if (!Events.eventButton.match(engineEvent) || engineEvent.payload.name !== PRINT_EVENT) {
		return;
	}

	const printButton = yield* call(resolveButton, activityId, engineEvent.payload.buttonPath);

	let savedDocumentId: string | undefined;

	if (validateAndSave) {
		if (printButton?.validation !== "full") {
			yield* put(
				FormEngineActions.command({
					activityId,
					engineEvent: Commands.validateFull({}),
				})
			);
		}

		const hasErrors = yield* call(hasValidationErrors, activityId);

		if (hasErrors) {
			return;
		}

		const isDirty = yield* select(ActivitySelectors.dirty(activityId));

		if (isDirty) {
			const saveResult = yield* call(saveActivity, activityId);

			if (saveResult === undefined) {
				return;
			}

			savedDocumentId = saveResult.payload.result.instance;
		}
	}

	const documentId = savedDocumentId ?? (yield* call(resolveDocumentId, activityId));

	if (documentId === undefined) {
		yield* put(
			ActivityActions.error({
				activityId,
				operationType: "loading",
				error: PrintIntegrationError.MissingDocumentInFormError(),
			})
		);
		return;
	}

	yield* call(printDocument, documentId, activityId, showLoading, printButton?.annotations);
}

/**
 * Resolves the clicked button in the Form Model of the given activity. The button carries
 * the print modelling as annotations as well as its own validation configuration.
 */
function* resolveButton(activityId: string, buttonPath: ButtonPath): SagaGenerator<FormModel.ButtonType | undefined> {
	const engineState = yield* select(FormEngineSelectors.engineState(activityId));

	if (engineState === undefined) {
		return undefined;
	}

	return findElementByFormModelPath(ModelSelectors.formModel()(engineState), buttonPath) as
		FormModel.ButtonType | undefined;
}

/**
 * Checks the current validation state of the given activity for blocking messages,
 * i.e. validation errors and parse errors. Warnings and infos do not block the print.
 */
function* hasValidationErrors(activityId: string): SagaGenerator<boolean> {
	const engineState = yield* select(FormEngineSelectors.engineState(activityId));

	if (engineState === undefined) {
		return false;
	}

	const messages = UiStateSelectors.messages()(engineState);

	return Object.values(messages).some(
		(entry: EngineStore.Validation.Entry | undefined) =>
			entry !== undefined &&
			(entry.parseError !== undefined || entry.validationMessages.some(message => message.severity === "ERROR"))
	);
}

function* resolveDocumentId(activityId: string): SagaGenerator<string | undefined> {
	const dataState = yield* select(FormEngineSelectors.dataState(activityId));
	const { id } = dataState.document as {
		id?: string;
	};

	return id;
}

/**
 * Triggers a save for the given activity and waits until the asynchronous save has finished.
 *
 * @returns the save.done action if the activity was saved successfully, undefined otherwise
 */
function* saveActivity(activityId: string): SagaGenerator<SaveDoneAction | undefined> {
	const waitingTask = yield* fork(waitForSaveFinished, activityId);

	yield* put(ActivityActions.save.started({ activityId }));

	const result = yield* join(waitingTask);

	return ActivityActions.save.done.match(result) ? result : undefined;
}

function* waitForSaveFinished(activityId: string): SagaGenerator<SaveDoneAction | SaveFailedAction> {
	return yield* take(isSaveFinished(activityId));
}

function isSaveFinished(activityId: string) {
	return (action: Action): action is SaveDoneAction | SaveFailedAction =>
		(ActivityActions.save.done.match(action) || ActivityActions.save.failed.match(action)) &&
		action.payload.params.activityId === activityId;
}
