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
import type { Selector } from "reselect";
import { createSelector } from "reselect";

import type { Header } from "@com.mgmtp.a12.base/base-model-api";
import type { PartialAnyPrintModelElement } from "@com.mgmtp.a12.print/print-model-api/model";
import { Log, TransactionLog } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import { createSliceSelector, idInputSelector, PrintEngineSelectors } from "../../store/selectors.js";
import type { PrintEngineState } from "../../../a12internal/api/PrintEngineState.js";
import type { DinTemplateSegmentItem } from "../../../internal/components/segments/din-template-segment-item.js";

import type { RequestApiState } from "./state.js";

export function segmentReferenceItemSelector(_: PrintEngineState, printModelId: string, segmentId: string) {
	return [printModelId, segmentId];
}

export namespace RequestApiSelectors {
	const printEngineState = createSliceSelector<PrintEngineState>(state => state);
	export const requestApiState = createSliceSelector<RequestApiState>(state => state.RequestApi);
	export const printModelIds = createSelector([requestApiState], state => state.printModelIds);
	export const selectablePrintModelIds: Selector<PrintEngineState, string[] | undefined> = createSelector(
		[printModelIds, PrintEngineSelectors.dinTemplateModelReferences, PrintEngineSelectors.printHeader],
		(printModelIds, dinTemplateModelReferences, currentPrintModelHeader) => {
			const usedModelIds = [...dinTemplateModelReferences.map(ref => ref.reference), currentPrintModelHeader.id];
			return (printModelIds || []).filter(model => !usedModelIds.includes(model));
		}
	);
	export const referencedPrintModelHeaders: Selector<PrintEngineState, Header[]> = createSelector(
		[requestApiState, PrintEngineSelectors.printModelReferences, PrintEngineSelectors.printHeader],
		(requestApiState, printModelReferences, printHeader) => {
			const existingPrintModelReferences = [
				...printModelReferences.map(({ reference }) => reference),
				printHeader.id,
			];

			return (requestApiState.referencedPrintModelHeaders || []).filter(
				referencedPrintModelHeader => !existingPrintModelReferences.includes(referencedPrintModelHeader.id)
			) as Header[];
		}
	);
	export const documentModelIds = createSelector([requestApiState], state => {
		return state.documentModelIds;
	});
	export const printModelData = createSelector([requestApiState], state => state.printModelData);
	export const printModel = createSelector(
		[printModelData, idInputSelector],
		(printModelData, printModelId) => printModelData?.[printModelId]
	);
	export const segment = createSelector(
		[printEngineState, segmentReferenceItemSelector],
		(state, [printModelId, segmentId]) =>
			printModel(state, printModelId)?.content.segments.definitions.find(segment => segment.id === segmentId)
	);
	export const dinTemplatePrintModels = createSelector(
		[requestApiState],
		state => state.dinTemplatePrintModels || {}
	);
	export const dinTemplateSegmentItems: Selector<PrintEngineState, DinTemplateSegmentItem[]> = createSelector(
		[PrintEngineSelectors.dinTemplateModelReferences, dinTemplatePrintModels],
		(dinTemplateModelReferences, dinTemplatePrintModels) => {
			if (!dinTemplateModelReferences.length) {
				return [];
			}

			return dinTemplateModelReferences.reduce<DinTemplateSegmentItem[]>(
				(templateSegmentItems, { reference }) => {
					const dinTemplateSegments = dinTemplatePrintModels[reference] || [];
					templateSegmentItems.push(
						...dinTemplateSegments.map(({ segmentId, segmentTitle, pageOrientation }) => ({
							segmentId,
							segmentTitle,
							pageOrientation,
							printModelId: reference,
						}))
					);
					return templateSegmentItems;
				},
				[]
			);
		}
	);

	export const dinTemplateSegmentItem = createSelector(
		[printEngineState, dinTemplateSegmentItems, idInputSelector],
		(printEngineState, dinTemplateSegmentItems, segmentId) => {
			const currentSegment = PrintEngineSelectors.segment(printEngineState, segmentId);

			return dinTemplateSegmentItems.find(
				segmentItem => segmentItem.segmentId === currentSegment.dinTemplate?.refId
			);
		}
	);
	export const segmentElements = createSelector([printModel, segment], (printModel, segment) => {
		if (!printModel || !segment) {
			return [];
		}
		const printModelElements = Log.createStores([], printModel).transactionLogStore.printModelElements;
		const elementReferenceIds = segment.elementReferences.map(elementRef => elementRef.refId);
		return elementReferenceIds.reduce((elements: PartialAnyPrintModelElement[], id) => {
			const element = TransactionLog.selectPrintModelElement(printModelElements, id);
			const entityElements = TransactionLog.selectEntityElements(printModelElements, id);
			return elements.concat(element).concat(entityElements);
		}, []);
	});

	export const elementReferences = createSelector([printModel, segment], (printModel, segment) => {
		if (!printModel || !segment) {
			return [];
		}
		return segment.elementReferences;
	});

	export const typesettingModelHeaders = createSelector([requestApiState], state => state.typesettingModelHeaders);

	export const typesettingModelData = createSelector([requestApiState], state => state.typesettingModelData);

	export const typesettingModel = (state: PrintEngineState, modelId: string) =>
		typesettingModelData(state)?.[modelId];

	export const resources = createSelector([requestApiState], state => state.resources);
	export const resourceByName = createSelector(
		[requestApiState, (_: PrintEngineState, name: string) => name],
		(state, name) => state.resources[name]
	);
	export const availableResources = createSelector([requestApiState], state => state.availableResources);
	export const lastUploadedResource = createSelector([requestApiState], state => state.lastUploadedResource);
}
