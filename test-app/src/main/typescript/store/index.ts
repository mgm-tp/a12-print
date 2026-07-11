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
import type { Store } from "@reduxjs/toolkit";
import { configureStore } from "@reduxjs/toolkit";
import createSagaMiddleware from "redux-saga";
import type { Middleware, UnknownAction } from "redux";

import { rootSaga } from "../sagas";

import type { Editor } from "./editor";
import { editorSlice } from "./editor";
import type { App } from "./app";
import { testAppSlice } from "./app";
import type { PrintEngineNotificationStore } from "./notification";
import { notificationSlice } from "./notification";
import type { PreviewState } from "./preview";
import { previewSlice } from "./preview";

const sagaMiddleware = createSagaMiddleware();

/**
 * Middleware that exposes interaction saga timing.
 * Poll globalThis.__lastInteractionStart__ vs globalThis.__lastInteractionAddEntry__
 * to know when the debounced interaction log saga has settled.
 * Also tracks the outer-store persistence debounce via PERSIST_LOGS / setLogPersistentEntries.
 */
const sagaTrackingMiddleware: Middleware = () => next => action => {
	const w = globalThis as unknown as Record<string, number>;
	const type = (action as UnknownAction).type;
	if (type === "Print/InteractionLog/START") {
		w.__lastInteractionStart__ = Date.now();
	}
	// committed to the log
	if (type === "Print/InteractionLog/ADD_LOG_ENTRY") {
		w.__lastInteractionAddEntry__ = Date.now();
	}
	// outer-store persistence pipeline: PERSIST_LOGS starts the debounce,
	// setLogPersistentEntries fires after the 500 ms debounce has settled
	if (type === "PERSIST_LOGS") {
		w.__lastPersistLogsStart__ = Date.now();
	}
	if (type === "editorSlice/setLogPersistentEntries") {
		w.__lastPersistLogsEnd__ = Date.now();
	}
	return next(action);
};

export const store: Store<
	{
		editor: Editor;
		app: App;
		notification: PrintEngineNotificationStore;
		preview: PreviewState;
	},
	UnknownAction
> = configureStore({
	reducer: {
		editor: editorSlice.reducer,
		app: testAppSlice.reducer,
		notification: notificationSlice.reducer,
		preview: previewSlice.reducer,
	},
	devTools: false,
	middleware: getDefaultMiddleware =>
		getDefaultMiddleware({ serializableCheck: false }).concat(sagaTrackingMiddleware, sagaMiddleware),
});

sagaMiddleware.run(rootSaga);
