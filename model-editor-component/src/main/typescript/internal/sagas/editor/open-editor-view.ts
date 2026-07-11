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
import { takeEvery, put, select } from "typed-redux-saga";
import type { PayloadAction } from "@reduxjs/toolkit";

import { SidebarItem } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import type { PrintModelRefs } from "../../redux/editor-state/state.js";
import { EditorStateActions } from "../../redux//editor-state/index.js";
import { NavigationActions, NavigationSelectors } from "../../redux/navigation/index.js";

export function* openEditorView(): SagaGenerator<void> {
	yield* takeEvery(EditorStateActions.openEditorView.match, handleOpenEditorView);
}

function* handleOpenEditorView(action: PayloadAction<PrintModelRefs>) {
	const { isFullscreen } = yield* select(NavigationSelectors.sidebarState);
	if (isFullscreen) {
		yield* put(NavigationActions.setExpandedState({ isFullscreen: false }));
	}

	const { currentRefType, segmentId, sectionId, watermarkId } = action.payload;
	const entityId =
		currentRefType === SidebarItem.SEGMENT
			? segmentId
			: currentRefType === SidebarItem.SECTION
				? sectionId
				: watermarkId;
	if (entityId) {
		yield* put(NavigationActions.setActiveEntity({ tab: currentRefType, entityId }));
	}
}
