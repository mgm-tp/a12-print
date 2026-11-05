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

import { Events, OverviewEngineActions } from "@com.mgmtp.a12.overviewengine/overviewengine-core";

import { PRINT_EVENT } from "../../../constants.js";

const printDocument = jest.fn();
jest.unstable_mockModule("../../print.js", () => ({ printDocument }));

const { watchOverviewPrintButtonSaga } = await import("../overview-print-button-saga.js");

const ACTIVITY_ID = "activity-1";
const DOCUMENT_ID = "dm-invoice/doc-4711";
const ANNOTATIONS = [{ name: "print_model", value: "InvoicePM" }];

let dispatch: ReturnType<typeof jest.fn>;

function rowButtonAction(event: string = PRINT_EVENT) {
	return OverviewEngineActions.event({
		activityId: ACTIVITY_ID,
		engineAction: Events.onRowButtonClicked({
			documentId: DOCUMENT_ID,
			rowActionModel: { event, annotations: ANNOTATIONS },
		} as never),
	} as never);
}

/**
 * Starts the watcher, feeds it `action` the way the store would and lets the worker run to completion.
 */
async function dispatchToSaga(action: Action, showLoading = true): Promise<void> {
	const channel = stdChannel();
	const task = runSaga(
		{ channel, dispatch, getState: () => ({}), onError: () => undefined },
		watchOverviewPrintButtonSaga,
		showLoading
	);

	channel.put(action);
	await Promise.resolve();

	task.cancel();
	await task.toPromise();
}

beforeEach(() => {
	dispatch = jest.fn();
});

afterEach(() => {
	jest.restoreAllMocks();
});

describe("watchOverviewPrintButtonSaga", () => {
	it("should print the document of the clicked row", async () => {
		await dispatchToSaga(rowButtonAction());

		expect(printDocument).toHaveBeenCalledWith(DOCUMENT_ID, ACTIVITY_ID, true, ANNOTATIONS);
	});

	it("should pass the loading indicator setting through", async () => {
		await dispatchToSaga(rowButtonAction(), false);

		expect(printDocument).toHaveBeenCalledWith(DOCUMENT_ID, ACTIVITY_ID, false, ANNOTATIONS);
	});

	describe("non matching actions", () => {
		it("should ignore a row button that is not wired to the print event", async () => {
			await dispatchToSaga(rowButtonAction("event_delete"));

			expect(printDocument).not.toHaveBeenCalled();
		});

		it("should ignore an Overview Engine event that is not a row button click", async () => {
			await dispatchToSaga(
				OverviewEngineActions.event({
					activityId: ACTIVITY_ID,
					engineAction: { type: "some/other/event", payload: {} },
				} as never)
			);

			expect(printDocument).not.toHaveBeenCalled();
		});

		it("should ignore an action that is not an Overview Engine event", async () => {
			await dispatchToSaga({ type: "some/unrelated/action" });

			expect(printDocument).not.toHaveBeenCalled();
		});
	});
});
