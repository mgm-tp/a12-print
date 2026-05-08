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
import { select, takeLatest, put } from "typed-redux-saga";
import { Action, AnyAction } from "typescript-fsa";

import { SidebarItem } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/index.js";

import { EditorStateActions, SidebarActions } from "../../redux/index.js";
import { PrintEngineSelectors } from "../../store/selectors.js";

export function* setCurrentViewSaga(): SagaIterator {
	yield* takeLatest((action: AnyAction) => SidebarActions.setCurrentView.match(action), handleSetCurrentView);
}

function* handleSetCurrentView(action: Action<SidebarActions.SetCurrentViewPayload>) {
	const { selectedItem } = action.payload;
	const printModelRefs = yield* select(PrintEngineSelectors.printModelRefs);
	if (selectedItem && isEditorContainer(selectedItem)) {
		yield* put(
			EditorStateActions.updatePrintModelRefs({
				...printModelRefs,
				currentRefType: selectedItem,
			})
		);
	}
}

const isEditorContainer = (
	item: SidebarItem
): item is SidebarItem.SEGMENT | SidebarItem.SECTION | SidebarItem.WATERMARK => {
	return [SidebarItem.SEGMENT, SidebarItem.SECTION, SidebarItem.WATERMARK].includes(item);
};
