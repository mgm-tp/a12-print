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
import { all, put, select, takeLatest } from "typed-redux-saga";
import type { PayloadAction } from "@reduxjs/toolkit";

import { DetailViewActions, NavigationActions, NavigationSelectors } from "../../redux/index.js";
import type { PrintEngineState } from "../../../a12internal/api/PrintEngineState.js";
import { PrintEngineSelectors } from "../../store/selectors.js";
import { assertExists } from "../../utils/type-utils.js";

export function* openDetailViewSaga(): SagaGenerator<void> {
	yield* takeLatest(DetailViewActions.openElementForm.match, handleOpenDetailView);
}

function* handleOpenDetailView(action: PayloadAction<string>) {
	const refId = action.payload;
	const editorMode = yield* select(NavigationSelectors.currentMode);
	const currentElementContainerId = yield* select(PrintEngineSelectors.currentElementContainerId);
	const activeCanvasTab = yield* select(NavigationSelectors.activeCanvasTab);
	const element = yield* select((state: PrintEngineState) => PrintEngineSelectors.printModelElement(state, refId));

	assertExists(element);

	yield* all([
		put(
			NavigationActions.setSelectedElement({
				tab: activeCanvasTab,
				entityId: currentElementContainerId,
				mode: editorMode,
				elementId: refId,
			})
		),
		put(
			NavigationActions.setDetailForm({
				tab: activeCanvasTab,
				entityId: currentElementContainerId,
				mode: editorMode,
				form: {
					formStack: [{ type: element.type, id: refId }],
				},
			})
		),
	]);
}
