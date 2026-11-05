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
import { call, getContext, select, takeEvery } from "typed-redux-saga";
import type { PayloadAction } from "@reduxjs/toolkit";

import type { EntityInstancePath } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import type { PrintModel, PrintModelContent } from "@com.mgmtp.a12.print/print-model-api/model";

import type { RequestApi } from "../../api/request-api.js";
import { NavigationActions } from "../../redux/index.js";
import { PrintEngineSelectors } from "../../store/selectors.js";
import { RequestApiSelectors } from "../../redux/request-api/selectors.js";
import type { FragmentReferenceEntityType } from "../../redux/confirmation-dialog/state.js";

export function* navigateToFragmentSourceSaga(): SagaGenerator<void> {
	yield* takeEvery(NavigationActions.navigateToFragmentSource.match, handleNavigateToFragmentSource);
}

export function* navigateToPrintModelSaga(): SagaGenerator<void> {
	yield* takeEvery(NavigationActions.navigateToPrintModel.match, handleNavigateToPrintModel);
}

export function* handleNavigateToPrintModel(
	action: PayloadAction<NavigationActions.NavigateToPrintModelPayload>
): SagaGenerator<void> {
	const { printModelId, referenceEntityType, referenceIndex, elementPath } = action.payload;
	const requestApi: RequestApi = yield* getContext<RequestApi>("requestApi");

	if (!requestApi.onNavigateToPrintModel) {
		return;
	}

	// Element usages carry their full path already - nested placements aren't reducible to a flat index.
	const navigationPath =
		referenceEntityType === "element"
			? elementPath
			: buildReferenceNavigationPath(referenceEntityType, referenceIndex);

	yield* call(requestApi.onNavigateToPrintModel, printModelId, navigationPath);
}

function* handleNavigateToFragmentSource(
	action: PayloadAction<NavigationActions.NavigateToFragmentSourcePayload>
): SagaGenerator<void> {
	const { referenceId, entityType, fragmentReference } = action.payload;
	const requestApi: RequestApi = yield* getContext<RequestApi>("requestApi");

	if (!requestApi.onNavigateToPrintModel) {
		return;
	}

	let modelId: string | undefined;
	let refId: string | undefined;

	if (entityType === "section") {
		const sectionRefs = yield* select(PrintEngineSelectors.sectionReferences);
		const ref = sectionRefs.find(r => r.id === referenceId);
		modelId = ref?.model;
		refId = ref?.refId;
	} else if (entityType === "watermark") {
		const watermarkRefs = yield* select(PrintEngineSelectors.watermarkReferences);
		const ref = watermarkRefs.find(r => r.id === referenceId);
		modelId = ref?.model;
		refId = ref?.refId;
	} else if (entityType === "segment") {
		const segmentRefs = yield* select(PrintEngineSelectors.segmentFragmentReferences);
		const ref = segmentRefs.find(r => r.id === referenceId);
		modelId = ref?.model;
		refId = ref?.refId;
	} else if (entityType === "textStyle") {
		const textStyleRefs = yield* select(PrintEngineSelectors.textStyleReferences);
		const ref = textStyleRefs.find(r => r.id === referenceId);
		modelId = ref?.model;
		refId = ref?.refId;
	} else if (entityType === "element") {
		// The caller already has the placeable reference at hand, so it comes in via the payload.
		modelId = fragmentReference?.model;
		refId = fragmentReference?.refId;
	}

	if (!modelId || !refId) {
		return;
	}

	const printModelData = yield* select(RequestApiSelectors.printModelData);
	const fragmentModel = printModelData?.[modelId];
	const navigationPath = buildFragmentNavigationPath(entityType, refId, fragmentModel);

	yield* call(requestApi.onNavigateToPrintModel, modelId, navigationPath);
}

function buildFragmentNavigationPath(
	entityType: FragmentReferenceEntityType,
	refId: string,
	fragmentModel: PrintModel | undefined
): EntityInstancePath | undefined {
	if (!fragmentModel?.content) {
		return undefined;
	}

	if (entityType === "element") {
		const elementDefIndex = fragmentModel.content.elementDefinitions.findIndex(d => d.id === refId);
		if (elementDefIndex < 0) {
			return undefined;
		}
		return [
			{ elementName: "content", index: 1 },
			{ elementName: "elementDefinitions", index: elementDefIndex + 1 },
		];
	}

	let canvasType: Extract<keyof PrintModelContent, "sections" | "watermarks" | "segments" | "textStyles">;
	if (entityType === "section") {
		canvasType = "sections";
	} else if (entityType === "watermark") {
		canvasType = "watermarks";
	} else if (entityType === "textStyle") {
		canvasType = "textStyles";
	} else {
		canvasType = "segments";
	}
	const definitions = fragmentModel.content[canvasType]?.definitions;

	if (!definitions) {
		return undefined;
	}

	const index = definitions.findIndex((d: { id: string }) => d.id === refId);
	if (index < 0) {
		return undefined;
	}

	return [
		{ elementName: "content", index: 1 },
		{ elementName: canvasType, index: index + 1 },
	];
}

/** Points at a fragment reference entry (a usage) in the print model being navigated to, not at a definition. */
export function buildReferenceNavigationPath(
	entityType: FragmentReferenceEntityType | undefined,
	referenceIndex: number | undefined
): EntityInstancePath | undefined {
	if (entityType === undefined || referenceIndex === undefined) {
		return undefined;
	}

	let elementName: string;
	if (entityType === "section") {
		elementName = "sectionReferences";
	} else if (entityType === "watermark") {
		elementName = "watermarkReferences";
	} else if (entityType === "textStyle") {
		elementName = "textStyleReferences";
	} else {
		elementName = "segmentReferences";
	}

	return [
		{ elementName: "content", index: 1 },
		{ elementName, index: referenceIndex + 1 },
	];
}
