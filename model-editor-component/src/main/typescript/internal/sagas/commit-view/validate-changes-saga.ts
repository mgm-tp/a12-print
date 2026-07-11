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
import { put, select, takeLatest } from "typed-redux-saga";
import partition from "lodash/partition.js";

import { PrintModelCreator, Log } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import { LoggerFactory } from "@com.mgmtp.a12.utils/utils-logging";
import { PrintModelMarshaller } from "@com.mgmtp.a12.print/print-model-api-utils/marshaller";
import type { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import { PrintEngineSelectors } from "../../store/selectors.js";
import { CommitViewActions } from "../../redux/commit-view/index.js";
import { CommitViewSelectors } from "../../redux/commit-view/selectors.js";
import { DocumentModelDataSelectors } from "../../redux/document-model-data/selectors.js";

const log = LoggerFactory.getLogger("ValidateChangesSaga");

export function* validateChangesSaga(): SagaGenerator<void> {
	yield* takeLatest(CommitViewActions.validateChanges.match, handleValidateChangesSaga);
}

function* handleValidateChangesSaga() {
	const commitInteractionRows = yield* select(CommitViewSelectors.commitInteractionRows);
	const commits = commitInteractionRows?.filter(el => el.state !== "pending");

	const header = yield* select(PrintEngineSelectors.printHeader);
	if (!header.id) {
		return;
	}
	const initialPrintModel = yield* select(CommitViewSelectors.commitViewPrintModel);
	const logPersistentEntries = yield* select(CommitViewSelectors.commitViewLogPersistentEntries);

	if (!initialPrintModel || !logPersistentEntries) {
		log.error(`Failed to load PrintModel with id ${header.id}`);
		return;
	}

	const [entriesToCommit, _] = partition(logPersistentEntries, ({ interactionLogPersistentEntry }) =>
		commits?.some(commit => commit.interactionId === interactionLogPersistentEntry.interactionId)
	);
	const { transactionLogStore } = Log.createStores(entriesToCommit, initialPrintModel);
	const newPrintModel = PrintModelCreator.createCleanModel(transactionLogStore);

	const documentModelReferences = yield* select(PrintEngineSelectors.documentModelReferences);
	const documentModels: DocumentModel[] = [];
	for (const ref of documentModelReferences) {
		const documentModelData = yield* select(DocumentModelDataSelectors.documentModelData, ref.reference);
		if (!documentModelData) {
			continue;
		}
		documentModels.push(documentModelData.model);
	}

	// validate new printmodel
	const marshallerResult = new PrintModelMarshaller().serialize(newPrintModel, {
		html: false,
		references: { documentModels },
	});
	yield* put(CommitViewActions.setCommitViewErrorMap(marshallerResult.report.errorMap));
}
