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
import { all, call, getContext, put, takeLatest } from "typed-redux-saga";
import type { PayloadAction } from "@reduxjs/toolkit";

import { LoggerFactory } from "@com.mgmtp.a12.utils/utils-logging";
import type { Header } from "@com.mgmtp.a12.base/base-model-api";
import type { FragmentModelReference, PrintModel } from "@com.mgmtp.a12.print/print-model-api/model";
import { FRAGMENT_MODEL_REFERENCE_PURPOSE } from "@com.mgmtp.a12.print/print-model-api/model";
import {
	extendContainerReferencesBasePath,
	getElementDefinitionBasePath,
	getTopLevelContainerBasePath,
} from "@com.mgmtp.a12.print/print-model-api/walker";

import type { RequestApi } from "../../api/index.js";
import { FragmentUsageActions } from "../../redux/index.js";
import type {
	FragmentReferenceEntityType,
	FragmentUsagePrintModelInfo,
} from "../../redux/confirmation-dialog/state.js";

import { findElementFragmentPlacements } from "./find-element-fragment-placements.js";

const log = LoggerFactory.getLogger("LoadFragmentUsageMapSaga");

export function* loadFragmentUsageMapSaga(): SagaGenerator<void> {
	yield* takeLatest(FragmentUsageActions.loadUsageMap.match, handleLoadFragmentUsageMap);
}

export function* handleLoadFragmentUsageMap(action: PayloadAction<string>): SagaGenerator<void> {
	const fragmentModelId = action.payload;
	const requestApi: RequestApi = yield* getContext("requestApi");

	try {
		const headers: Header[] = yield* call(requestApi.loadPrintModelHeaders);
		const candidateIds = headers
			.filter(header => header.id !== fragmentModelId)
			.filter(header => referencesFragmentModel(header, fragmentModelId))
			.map(header => header.id);

		const printModels = yield* all(candidateIds.map(id => call(loadCandidate, requestApi, id)));

		const usageByEntityId: Record<string, FragmentUsagePrintModelInfo[]> = {};
		for (const printModel of printModels) {
			if (!printModel) {
				continue;
			}
			addUsages(usageByEntityId, printModel, fragmentModelId);
			addElementUsages(usageByEntityId, printModel, fragmentModelId);
		}

		yield* put(FragmentUsageActions.setUsageMap(usageByEntityId));
	} catch (error) {
		log.error(`Could not build the fragment usage map for fragment model ${fragmentModelId}`, error);
		yield* put(FragmentUsageActions.setUsageMapError());
	}
}

export function referencesFragmentModel(header: Header, fragmentModelId: string): boolean {
	return (header.modelReferences || []).some(
		ref =>
			ref.modelType === "print" &&
			ref.purpose === FRAGMENT_MODEL_REFERENCE_PURPOSE &&
			ref.reference === fragmentModelId
	);
}

function* loadCandidate(requestApi: RequestApi, printModelId: string): SagaGenerator<PrintModel | undefined> {
	const response = yield* call(requestApi.loadPrintModel, printModelId);
	return response?.printModel;
}

export function addUsages(
	usageByEntityId: Record<string, FragmentUsagePrintModelInfo[]>,
	printModel: PrintModel,
	fragmentModelId: string
): void {
	const referenceGroups: {
		entityType: FragmentReferenceEntityType;
		references: readonly FragmentModelReference[] | undefined;
	}[] = [
		{ entityType: "segment", references: printModel.content.segments?.fragmentReferences },
		{ entityType: "section", references: printModel.content.sections?.references },
		{ entityType: "watermark", references: printModel.content.watermarks?.references },
		{ entityType: "textStyle", references: printModel.content.textStyles?.references },
	];

	for (const { entityType, references } of referenceGroups) {
		(references || []).forEach((reference, referenceIndex) => {
			if (reference.model !== fragmentModelId) {
				return;
			}
			const entry: FragmentUsagePrintModelInfo = {
				printModelId: printModel.header.id,
				referenceEntityType: entityType,
				referenceIndex,
			};
			usageByEntityId[reference.refId] = [...(usageByEntityId[reference.refId] || []), entry];
		});
	}
}

/** Adds the usages of element placements, which unlike the other types carry a full elementPath. */
export function addElementUsages(
	usageByEntityId: Record<string, FragmentUsagePrintModelInfo[]>,
	printModel: PrintModel,
	fragmentModelId: string
): void {
	const printModelId = printModel.header.id;

	for (const match of findElementFragmentPlacements(printModel, fragmentModelId)) {
		const containerPath =
			match.location.kind === "wrapper"
				? getElementDefinitionBasePath(match.location.container, match.location.containerIndex)
				: getTopLevelContainerBasePath(match.location.container, match.location.containerIndex);
		const elementPath = extendContainerReferencesBasePath(
			match.location.container,
			containerPath,
			match.referenceIndex
		).toEntityInstancePath();
		const entry: FragmentUsagePrintModelInfo = { printModelId, referenceEntityType: "element", elementPath };
		usageByEntityId[match.reference.refId] = [...(usageByEntityId[match.reference.refId] || []), entry];
	}
}
