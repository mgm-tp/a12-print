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
import { Reducer } from "redux";

import {
	TransactionLog,
	TransactionLogStore,
} from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/index.js";
import { PrintModelHeader } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import {
	PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
	PRINT_MODEL_HEADER_LOG_ID,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/constant.js";

import {
	RequestApiReducer,
	RequestApiState,
	TransactionLogStateReducer,
	initialStateLogStore,
} from "../../../main/typescript/internal/redux/index.js";

import { renderWithProviders } from "./render-with-provider.js";

export const documentModelHeadersMock = [
	{
		id: "DomainText",
		modelType: "document",
		modelVersion: "28.2.0",
	},
	{
		id: "DomainPerson",
		modelType: "document",
		modelVersion: "28.2.0",
	},
	{
		id: "DomainAddress",
		modelType: "document",
		modelVersion: "28.2.0",
	},
];

export function setupTestWithSchema(ui: React.ReactElement, printModelHeader: Partial<PrintModelHeader>) {
	const initialStateMock: TransactionLogStore = {
		[PRINT_MODEL_HEADER_LOG_ID]: TransactionLog.createStoreEntryPrintModelHeader(
			initialStateLogStore[PRINT_MODEL_HEADER_LOG_ID],
			{ id: PRINT_MODEL_HEADER_LOG_ID, ...printModelHeader },
			"interaction1"
		).storeEntry,
		[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: {
			id: PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
			log: [],
			memoizedObject: { id: PRINT_MODEL_CONTENT_GENERAL_LOG_ID, structure: [] },
		},
		segments: { id: "mgo9q2gjn429oh", map: {}, references: {} },
		printModelElements: {},
	};

	const TransactionLogStateMock: Reducer = (state: TransactionLogStore = initialStateMock, action) =>
		TransactionLogStateReducer(state, action);

	const initialRequestApiState: RequestApiState = {
		documentModelDataMap: {},
		documentModelIds: ["DomainAddress", "DomainPerson", "DomainText"],
		documentModelHeaders: documentModelHeadersMock,
	};

	const RequestApiStateMock: Reducer = (state: RequestApiState = initialRequestApiState, action) =>
		RequestApiReducer(state, action);

	return renderWithProviders(ui, {
		TransactionLogState: TransactionLogStateMock,
		RequestApi: RequestApiStateMock,
	});
}
