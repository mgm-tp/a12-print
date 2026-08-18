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

import { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import { PrintModel } from "@com.mgmtp.a12.print/print-model-api/lib/model/print-model.js";
import { Locale } from "@com.mgmtp.a12.utils/utils-localization/lib/main/index.js";
import { PrintModelMarshaller } from "@com.mgmtp.a12.print/print-model-api-utils/lib/marshaller/model-marshaller.js";
import { PrintFontMap } from "@com.mgmtp.a12.print/print-fonts/lib/internal/types/font.js";
import { DocumentModelUtils } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/utils/document-model-utils.js";

import { EditorStateActions, RequestApiActions, ValidationActions } from "../../../../redux/index.js";
import { PrintEditorComponentReducer, PrintEngineState } from "../../../../store/root-reducer.js";
import { RequestApi } from "../../../../api/request-api.js";
import { PrintEditorComponentSagas } from "../../../../sagas/index.js";
import { DEFAULT_FONT_NAME, DEFAULT_TEXT_STYLE_FONT_NAME } from "../../../../constant/textstyle.js";
import createSagaMiddleware from "../../../../redux-saga/index.js";
import { EditorComponentApiActions } from "../../../../api/actions-api.js";
import { DocumentModelDataActions } from "../../../../redux/document-model-data/actions.js";
import { PrintEngineActions } from "../../../../store/actions.js";

import { selectTransactionGroupsForCommit } from "../selectors.js";

import { LogStorage } from "./transaction-log.js";

export function setupStoreLight(
	printModel: PrintModel,
	documentModels: readonly DocumentModel[],
	fontMap: PrintFontMap,
	locale: Locale,
	onChange: (printModel: PrintModel, dirty: boolean) => void
): Store<PrintEngineState> {
	const printModelMarshaller = new PrintModelMarshaller();

	const logStorage = new LogStorage();
	let currentPrintModel = printModel;

	const requestApi: RequestApi = {
		loadDocumentModelIds() {
			return Promise.resolve(Object.values(documentModels).map(({ header }) => header.id));
		},
		loadReferencedDocumentModels(ids: string[]) {
			return Promise.resolve(documentModels.filter(dm => ids.includes(dm.header.id)));
		},
		loadPrintModel() {
			return Promise.resolve({
				printModel: currentPrintModel,
				logPersistentEntries: logStorage.getEntries(),
			});
		},
		setPrintModelReferences() {
			return Promise.resolve(undefined);
		},
		loadTypesettingModel() {
			return Promise.resolve(undefined);
		},
		loadTypesettingModelHeaders() {
			return Promise.resolve([]);
		},
		setPrintModel(printModel, overwriteLog, persistentEntries) {
			if (overwriteLog && persistentEntries) {
				currentPrintModel = printModel;
				logStorage.set(persistentEntries);
			}

			onChange(printModel, false);
			return Promise.resolve({ printModel });
		},
		loadPrintModelIds() {
			return Promise.resolve([]);
		},
		loadDINTemplateSegments() {
			return Promise.resolve([]);
		},
		persistInteractionLog(_printModelId, interactionLogPersistentEntry) {
			logStorage.addInteraction(interactionLogPersistentEntry);
		},
		persistTransactionLog(transactionLogPersistentEntries) {
			transactionLogPersistentEntries.forEach(it => logStorage.addTransaction(it));
		},
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		onValidationStateChange(_validationState) {},
		serializePrintModel(apiObject) {
			const result = printModelMarshaller.serialize(apiObject, documentModels);
			store.dispatch(EditorComponentApiActions.setSerializePrintModelResult(result));
			// This is necessary so that the selectTransactionGroupsForCommit returns the correct result
			store.dispatch(ValidationActions.setErrorMap(result.report.errorMap));

			const changes = selectTransactionGroupsForCommit(store.getState());

			onChange(apiObject, changes.length > 0);
		},
		deserializePrintModel(validatorInput) {
			store.dispatch(
				EditorComponentApiActions.setDeserializePrintModelResult(
					printModelMarshaller.deserialize(validatorInput, documentModels)
				)
			);
		},
	};

	const sagaMiddleware = createSagaMiddleware({
		context: {
			requestApi,
			getLocale() {
				return locale;
			},
		},
	});

	const store = configureStore({
		reducer: PrintEditorComponentReducer.rootReducer,
		middleware: [sagaMiddleware],
		devTools: { name: "Print Editor Component" },
	});

	sagaMiddleware.run(PrintEditorComponentSagas.rootSaga);

	store.dispatch(PrintEngineActions.resetState());
	store.dispatch(RequestApiActions.loadPrintModel(""));
	store.dispatch(RequestApiActions.loadPrintModelIds());

	store.dispatch(EditorStateActions.setFonts(fontMap));
	store.dispatch(ValidationActions.validateTextStyles());
	store.dispatch(
		DocumentModelDataActions.setDocumentModelData(
			documentModels.map(dm => ({
				id: dm.header.id,
				documentModelData: DocumentModelUtils.getDocumentModelData(dm, locale),
			}))
		)
	);

	const defaultFont = Object.values(fontMap).find(it => !it.isDefault && it.fontFamily === DEFAULT_FONT_NAME);

	store.dispatch(
		EditorStateActions.setDefaultTextStyle({
			font: defaultFont?.name ?? DEFAULT_TEXT_STYLE_FONT_NAME,
		})
	);

	return store;
}
