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
import { put, select, takeEvery } from "typed-redux-saga";
import { Action, AnyAction } from "typescript-fsa";

import { SidebarItem } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/index.js";

import { PrintEngineSelectors } from "../../store/selectors.js";
import { NavigationTarget } from "../../types/index.js";
import {
	CommitViewActions,
	DetailViewActions,
	EditorStateActions,
	SidebarActions,
	WrapperActions,
} from "../../redux/index.js";

export function* navigateIntoViewSaga(): SagaIterator {
	yield* takeEvery(
		(action: AnyAction) => CommitViewActions.navigateIntoView.match(action),
		handleNavigateIntoViewSaga
	);
}

function* handleNavigateIntoViewSaga(action: Action<NavigationTarget>) {
	const navigation = action.payload;

	if (!navigation.sidebarTarget) {
		return;
	}
	//open sidebar
	yield* put(SidebarActions.setCurrentView({ selectedItem: navigation.sidebarTarget, isOpen: true }));

	if (!navigation.containerTarget) {
		return;
	}
	if (
		navigation.sidebarTarget !== SidebarItem.SECTION &&
		navigation.sidebarTarget !== SidebarItem.SEGMENT &&
		navigation.sidebarTarget !== SidebarItem.WATERMARK
	) {
		return;
	}
	//open container section, segment, watermark and reset all wrapper
	const printModelRefs = yield* select(PrintEngineSelectors.printModelRefs);
	yield* put(WrapperActions.removeAllWrapperStages({ containerId: navigation.containerTarget }));
	yield* put(
		EditorStateActions.updatePrintModelRefs({
			...printModelRefs,
			[navigation.sidebarTarget + "Id"]: navigation.containerTarget,
			currentRefType: navigation.sidebarTarget,
		})
	);

	if (!navigation.elementTargets?.length) {
		return;
	}

	//select element
	yield* put(DetailViewActions.openElementForm(navigation.elementTargets[0].elementRef));
}
