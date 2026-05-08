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
import { call, put, takeLatest } from "typed-redux-saga";
import { Action, AnyAction } from "typescript-fsa";
import { SagaIterator } from "redux-saga";

import { Model } from "@com.mgmtp.a12.base/base-model-api/lib/main/model";

import { GeneratePreviewPayload, PreviewActions } from "../../store/preview";
import { RESOURCE_KEYS } from "../../components/preview/preview-messages";
import { FileService } from "../../services/files-service";

export function* generatePreviewSaga(): SagaIterator {
	yield* takeLatest((action: AnyAction) => PreviewActions.generatePreview.match(action), handleGeneratePreviewSaga);
}

function* handleGeneratePreviewSaga(action: Action<GeneratePreviewPayload>) {
	yield* put(PreviewActions.setPreviewLoading());

	const { caseId, printModelId, documentModel, documentName, locale, timeZone } = action.payload;
	const documentId = getDocumentId(documentModel, documentName);
	if (documentModel && !documentId) {
		yield* put(PreviewActions.setPreviewError(RESOURCE_KEYS.errors.preview.noTestDocument));
		return;
	}
	const data = yield* call(FileService.printWithShell, printModelId, caseId, documentId, locale, timeZone);
	if (!data) {
		yield* put(PreviewActions.setPreviewError(RESOURCE_KEYS.errors.preview.previewNotGenerated));
		return;
	}

	yield* put(
		PreviewActions.setPreviewData({
			previewData: data,
		})
	);
}

function getDocumentId(documentModel: Model | undefined, documentName: string | undefined) {
	const documentModelId = documentModel?.header.id;
	const documentId =
		documentModelId && documentName
			? documentName.split("\\").pop()?.replace(".json", "").replace(documentModelId, "").replace("-", "")
			: "";
	return documentId;
}
