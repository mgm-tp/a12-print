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
import { Action, AnyAction } from "typescript-fsa";
import { SagaIterator } from "redux-saga";
import { put, select, takeEvery } from "typed-redux-saga";

import { ModelReferenceEntity } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { GlobalRegion } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/interaction-log.js";

import { InteractionLogActions, RequestApiActions, TransactionLogStateActions } from "../../redux/index.js";
import { PrintEngineSelectors } from "../../store/selectors.js";
import { RESOURCE_KEYS } from "../../localization/keys.js";
import { SchemaActions } from "../../redux/schema/action.js";
import { DocumentModelDataActions } from "../../redux/document-model-data/actions.js";

export function* addModelReferenceSaga(): SagaIterator {
	yield* takeEvery((action: AnyAction) => SchemaActions.addModelReference.match(action), handleAddModelReferenceSaga);
}

function* handleAddModelReferenceSaga(action: Action<ModelReferenceEntity>) {
	const printHeader = yield* select(PrintEngineSelectors.printHeader);

	yield* put(
		InteractionLogActions.start({
			description: RESOURCE_KEYS.interaction.schema.schemaToolbar.addSchema,
			region: GlobalRegion.SIDEBAR,
			preventUndo: true,
			transactionLogActions: [
				TransactionLogStateActions.updatePrintHeader({
					data: {
						...printHeader,
						modelReferences: [...(printHeader.modelReferences || []), action.payload],
					},
				}),
			],
		})
	);

	if (action.payload.modelType === "document") {
		yield* put(DocumentModelDataActions.loadDocumentModelData(action.payload.reference));
	}
	if (action.payload.modelType === "typesetting") {
		yield* put(RequestApiActions.loadTypesettingModel(action.payload.reference));
	}
}
