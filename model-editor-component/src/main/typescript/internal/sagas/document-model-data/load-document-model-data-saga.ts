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
import { SagaIterator } from "redux-saga";
import { call, getContext, put, SagaGenerator, select, takeEvery } from "typed-redux-saga";
import { Action, AnyAction } from "typescript-fsa";

import { LoggerFactory } from "@com.mgmtp.a12.utils/utils-logging";
import { DocumentModelUtils } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/utils/document-model-utils.js";
import { Locale } from "@com.mgmtp.a12.utils/utils-localization/lib/main/index.js";

import { RequestApi } from "../../api/index.js";
import { DocumentModelDataActions } from "../../redux/document-model-data/actions.js";
import { DocumentModelDataSelectors } from "../../redux/document-model-data/selectors.js";

const log = LoggerFactory.getLogger("LoadDocumentModelDataSaga");

export function* loadDocumentModelDataSaga(): SagaIterator {
	yield* takeEvery(
		(action: AnyAction) => DocumentModelDataActions.loadDocumentModelData.match(action),
		handleLoadDocumentModelDataSaga
	);
}

function* handleLoadDocumentModelDataSaga(action: Action<string>): SagaIterator {
	const id = action.payload;

	const documentModelData = yield* select(DocumentModelDataSelectors.documentModelData, id);

	if (!documentModelData) {
		const requestApi: RequestApi = yield* getContext("requestApi");
		const documentModel = yield* call(requestApi.loadReferencedDocumentModels, [id]);
		if (!documentModel) {
			log.error("No document model available to load document model data");
			return;
		}
		const deserializedDocumentModel = DocumentModelUtils.getDeserializedDocumentModels(documentModel);
		const getLocale: () => Locale = yield* getContext("getLocale");
		const documentModelDataEntry = DocumentModelUtils.getDocumentModelData(
			deserializedDocumentModel[0],
			getLocale()
		);

		yield* put(
			DocumentModelDataActions.setDocumentModelData([
				{
					id,
					documentModelData: documentModelDataEntry,
				},
			])
		);
	}
}

export function* batchLoadDocumentModelDataSaga(): SagaGenerator<void> {
	yield* takeEvery(
		(action: AnyAction) => DocumentModelDataActions.batchLoadDocumentModelData.match(action),
		handleBatchLoadDocumentModelDataSaga
	);
}

function* handleBatchLoadDocumentModelDataSaga(action: Action<string[]>): SagaGenerator<void> {
	const ids = action.payload;

	const unloadedIds: string[] = [];
	for (const id of ids) {
		const isLoaded = yield* select(DocumentModelDataSelectors.documentModelData, id);
		if (!isLoaded) {
			unloadedIds.push(id);
		}
	}

	if (!unloadedIds.length) {
		return;
	}

	const requestApi: RequestApi = yield* getContext("requestApi");
	const documentModels = yield* call(requestApi.loadReferencedDocumentModels, unloadedIds);

	if (!documentModels?.length) {
		log.error("No document models available to load document model data");
		return;
	}

	const getLocale: () => Locale = yield* getContext("getLocale");
	const deserializedModels = DocumentModelUtils.getDeserializedDocumentModels(documentModels);

	yield* put(
		DocumentModelDataActions.setDocumentModelData(
			deserializedModels.map(model => ({
				id: model.header.id,
				documentModelData: DocumentModelUtils.getDocumentModelData(model, getLocale()),
			}))
		)
	);
}
