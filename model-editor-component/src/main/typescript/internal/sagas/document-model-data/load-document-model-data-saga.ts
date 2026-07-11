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
import type { SagaGenerator } from "typed-redux-saga";
import { call, getContext, put, select, takeEvery } from "typed-redux-saga";
import type { PayloadAction } from "@reduxjs/toolkit";

import { LoggerFactory } from "@com.mgmtp.a12.utils/utils-logging";
import { DocumentModelUtils } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import type { Locale } from "@com.mgmtp.a12.utils/utils-localization";

import type { RequestApi } from "../../api/index.js";
import { DocumentModelDataActions } from "../../redux/document-model-data/actions.js";
import { DocumentModelDataSelectors } from "../../redux/document-model-data/selectors.js";

const log = LoggerFactory.getLogger("LoadDocumentModelDataSaga");

export function* loadDocumentModelDataSaga(): SagaGenerator<void> {
	yield* takeEvery(DocumentModelDataActions.loadDocumentModelData.match, handleLoadDocumentModelDataSaga);
}

function* handleLoadDocumentModelDataSaga(action: PayloadAction<string>): SagaGenerator<void> {
	const id = action.payload;

	const documentModelData = yield* select(DocumentModelDataSelectors.documentModelData, id);

	if (!documentModelData) {
		const requestApi: RequestApi = yield* getContext("requestApi");
		const documentModels = yield* call(requestApi.loadReferencedDocumentModels, [id]);
		if (!documentModels?.length) {
			log.error("No document model available to load document model data");
			return;
		}
		const deserializedDocumentModel = DocumentModelUtils.getDeserializedDocumentModels(documentModels);
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

export function* ensureDocumentModelsLoaded(ids: string[]): SagaGenerator<void> {
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
	const rawDocumentModels = yield* call(requestApi.loadReferencedDocumentModels, unloadedIds);

	if (!rawDocumentModels?.length) {
		log.error("No document models available to load document model data");
		return;
	}

	const getLocale: () => Locale = yield* getContext("getLocale");
	const deserializedModels = DocumentModelUtils.getDeserializedDocumentModels(rawDocumentModels);
	yield* put(
		DocumentModelDataActions.setDocumentModelData(
			deserializedModels.map(model => ({
				id: model.header.id,
				documentModelData: DocumentModelUtils.getDocumentModelData(model, getLocale()),
			}))
		)
	);
}
