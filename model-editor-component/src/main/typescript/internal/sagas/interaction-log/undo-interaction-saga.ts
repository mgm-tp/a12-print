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
import isEmpty from "lodash/isEmpty.js";
import { nanoid } from "nanoid";
import type { SagaGenerator } from "typed-redux-saga";
import { call, getContext, put, select, takeEvery } from "typed-redux-saga";

import type { InteractionLogEntry } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import { USED_TEXT_STYLE } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import { EditorComponentApiActions } from "../../../a12internal/api/actions-api.js";
import { RESOURCE_KEYS } from "../../../internal/localization/index.js";
import { InteractionLogActions, TransactionLogStateActions } from "../../redux/index.js";
import type { PrintEngineState } from "../../../a12internal/api/PrintEngineState.js";
import type { UndoInteractionLogEntry } from "../../store/selectors.js";
import { PrintEngineSelectors } from "../../store/selectors.js";
import type { RequestApi } from "../../api/index.js";
import { DEFAULT_ERROR_TOAST_DURATION } from "../../constant/configs.js";

export function* undoInteractionSaga(): SagaGenerator<void> {
	yield* takeEvery(InteractionLogActions.undo.match, handleUndoInteractionSaga);
}

function* handleUndoInteractionSaga(): SagaGenerator<void> {
	const lastSetInteraction = yield* select(PrintEngineSelectors.lastSetInteraction);
	if (!lastSetInteraction) {
		throw Error("Tried to undo but couldn't find any interaction to undo");
	}

	if (lastSetInteraction.preventUndo) {
		const preventUndo = yield* call(checkPreventUndo, lastSetInteraction);
		if (preventUndo) {
			return;
		}
	}

	const requestApi: RequestApi = yield* getContext("requestApi");
	const { region, regionId, ...interactionToUndo } = lastSetInteraction;
	const newId = nanoid();
	const logEntry: InteractionLogEntry = {
		affectedItems: [{ type: "interaction", id: interactionToUndo.interactionId }],
		timestamp: Date.now(),
		interactionId: newId,
		type: "UNDO",
		description: interactionToUndo.description,
	};
	yield* put(
		InteractionLogActions.addLogEntry({
			region,
			regionId,
			logEntry: logEntry,
		})
	);

	const header = yield* select(PrintEngineSelectors.printHeader);
	requestApi.persistInteractionLog(header.id, {
		...logEntry,
		affectedInteractionId: interactionToUndo.interactionId,
		region,
		regionId,
	});

	yield* put(
		TransactionLogStateActions.undo({ interactionId: newId, region, regionId, data: { interactionToUndo } })
	);
}

function* checkPreventUndo(lastSetInteraction: UndoInteractionLogEntry) {
	const { affectedItems, preventUndo } = lastSetInteraction;
	const textStyle = affectedItems.find(item => item.type === "textStyle");
	if (preventUndo !== USED_TEXT_STYLE || !textStyle) {
		return false;
	}
	const { segmentsMap, sectionsMap, wrapperMap } = yield* select((state: PrintEngineState) =>
		PrintEngineSelectors.elementsAffectedByTextStyleChange(state, textStyle.id)
	);
	const isTextStyleUsed = !isEmpty(segmentsMap) || !isEmpty(sectionsMap) || !isEmpty(wrapperMap);
	if (!isTextStyleUsed) {
		return false;
	}
	yield* put(
		EditorComponentApiActions.addNotification({
			title: { key: RESOURCE_KEYS.textStyles.notification.preventUndo.title },
			message: { key: RESOURCE_KEYS.textStyles.notification.preventUndo.description },
			severity: "error",
			duration: DEFAULT_ERROR_TOAST_DURATION,
		})
	);
	return true;
}
