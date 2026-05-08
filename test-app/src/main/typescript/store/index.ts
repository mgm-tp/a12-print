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
import { configureStore, Store } from "@reduxjs/toolkit";
import createSagaMiddleware from "redux-saga";
import { AnyAction } from "redux";

import { rootSaga } from "../sagas";

import { Editor, editorSlice } from "./editor";
import { App, testAppSlice } from "./app";
import { notificationSlice, PrintEngineNotificationStore } from "./notification";
import { previewSlice, PreviewState } from "./preview";

const sagaMiddleware = createSagaMiddleware();

export const store: Store<
	{
		editor: Editor;
		app: App;
		notification: PrintEngineNotificationStore;
		preview: PreviewState;
	},
	AnyAction
> = configureStore({
	reducer: {
		editor: editorSlice.reducer,
		app: testAppSlice.reducer,
		notification: notificationSlice.reducer,
		preview: previewSlice.reducer,
	},
	devTools: false,
	middleware: getDefaultMiddleware => getDefaultMiddleware({ serializableCheck: false }).concat(sagaMiddleware),
});

sagaMiddleware.run(rootSaga);
