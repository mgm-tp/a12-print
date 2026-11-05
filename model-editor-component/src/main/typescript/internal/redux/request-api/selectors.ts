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
import type {
	PageOrientation,
	PartialAnyPrintModelElement,
	SectionUsage,
} from "@com.mgmtp.a12.print/print-model-api/model";
import { Log, TransactionLog } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import { FRAGMENT_MODEL_REFERENCE_PURPOSE } from "@com.mgmtp.a12.print/print-model-api/model";

import { createSliceSelector, idInputSelector, PrintEngineSelectors } from "../../store/selectors.js";
import type { PrintEngineState } from "../../../a12internal/api/PrintEngineState.js";
import type { DinTemplateSegmentItem } from "../../../internal/components/segments/din-template-segment-item.js";
import { FragmentUtils } from "../../utils/fragment-utils.js";

import type { RequestApiState } from "./state.js";

export function segmentReferenceItemSelector(_: PrintEngineState, printModelId: string, segmentId: string) {
	return [printModelId, segmentId];
}

export namespace RequestApiSelectors {
	const printEngineState = createSliceSelector<PrintEngineState>(state => state);
	export const requestApiState = createSliceSelector<RequestApiState>(state => state.RequestApi);
	export const printModelHeaders = createSelector([requestApiState], state => state.printModelHeaders);
	export const dinPrintModelIds = createSelector([printModelHeaders], headers =>
		headers
			?.filter(header => !FragmentUtils.isFragmentModelHeader(header))
			?.filter(header => !header.modelReferences?.some(ref => ref.purpose === FRAGMENT_MODEL_REFERENCE_PURPOSE))
			?.map(header => header.id)
	);
	export const selectableDINPrintModelIds: Selector<PrintEngineState, string[] | undefined> = createSelector(
		[dinPrintModelIds, PrintEngineSelectors.dinTemplateModelReferences, PrintEngineSelectors.printHeader],
		(dinPrintModelIds, dinTemplateModelReferences, currentPrintModelHeader) => {
			const usedModelIds = [...dinTemplateModelReferences.map(ref => ref.reference), currentPrintModelHeader.id];
			return (dinPrintModelIds || []).filter(model => !usedModelIds.includes(model));
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
			printModel(state, printModelId)?.content?.segments?.definitions.find(segment => segment.id === segmentId)
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
			return element ? elements.concat(element).concat(entityElements) : elements.concat(entityElements);
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

	export const makeAvailableFragmentSections = () =>
		createSelector(
			[
				printModelData,
				PrintEngineSelectors.fragmentModelReferences,
				(_: PrintEngineState, pageOrientation: PageOrientation) => pageOrientation,
			],
			(pmd, fragmentModelRefs, pageOrientation) =>
				fragmentModelRefs.flatMap(ref => {
					const model = pmd?.[ref.reference];
					if (!model) return [];
					return (model.content?.sections?.definitions || [])
						.filter(s => s.pageOrientation === pageOrientation)
						.map(s => ({ modelId: ref.reference, section: s }));
				})
		);

	export const resolvedSectionReferences = createSelector(
		[printModelData, PrintEngineSelectors.sectionReferences],
		(pmd, references) =>
			references.map(reference => ({
				reference,
				section: pmd?.[reference.model]?.content?.sections?.definitions?.find(s => s.id === reference.refId),
			}))
	);

	export const makeResolvedSectionForSlot = () =>
		createSelector(
			[
				printModelData,
				PrintEngineSelectors.sectionReferences,
				(_: PrintEngineState, pageOrientation: PageOrientation) => pageOrientation,
				(_: PrintEngineState, __: PageOrientation, sectionUsage: SectionUsage | undefined) => sectionUsage,
			],
			(pmd, references, pageOrientation, sectionUsage) => {
				for (const reference of references) {
					const section = pmd?.[reference.model]?.content?.sections?.definitions?.find(
						s => s.id === reference.refId
					);
					const slotUsage = reference.sectionUsage ?? section?.sectionUsage;
					if (section?.pageOrientation === pageOrientation && slotUsage === sectionUsage) {
						return { reference, section };
					}
				}
				return undefined;
			}
		);

	export const availableFragmentTextStyles = createSelector(
		[printModelData, PrintEngineSelectors.fragmentModelReferences, PrintEngineSelectors.textStyleReferences],
		(pmd, fragmentModelRefs, textStyleRefs) => {
			const referencedRefIds = new Set(textStyleRefs.map(r => r.refId));
			return fragmentModelRefs.flatMap(ref => {
				const model = pmd?.[ref.reference];
				if (!model) return [];
				return (model.content?.textStyles?.definitions || [])
					.filter(ts => !referencedRefIds.has(ts.id))
					.map(ts => ({ modelId: ref.reference, textStyle: ts }));
			});
		}
	);

	export const resolvedTextStyleReferences = createSelector(
		[printModelData, PrintEngineSelectors.textStyleReferences],
		(pmd, references) =>
			references.map(reference => ({
				reference,
				textStyle: pmd?.[reference.model]?.content?.textStyles?.definitions?.find(
					ts => ts.id === reference.refId
				),
			}))
	);

	export const availableFragmentSegments = createSelector(
		[printModelData, PrintEngineSelectors.fragmentModelReferences],
		(pmd, fragmentModelRefs) =>
			fragmentModelRefs.flatMap(ref => {
				const model = pmd?.[ref.reference];
				if (!model) return [];
				return (model.content?.segments?.definitions || []).map(segment => ({
					modelId: ref.reference,
					segment,
				}));
			})
	);

	export const resolvedSegmentFragmentReferences = createSelector(
		[printModelData, PrintEngineSelectors.segmentFragmentReferences],
		(pmd, references) =>
			references.map(reference => ({
				reference,
				segment: pmd?.[reference.model]?.content?.segments?.definitions?.find(
					segment => segment.id === reference.refId
				),
			}))
	);

	export const makeAvailableFragmentWatermarksForOrientation = () =>
		createSelector(
			[
				printModelData,
				PrintEngineSelectors.fragmentModelReferences,
				(_: PrintEngineState, pageOrientation: PageOrientation) => pageOrientation,
			],
			(pmd, fragmentModelRefs, pageOrientation) =>
				fragmentModelRefs.flatMap(ref => {
					const model = pmd?.[ref.reference];
					if (!model) return [];
					return (model.content?.watermarks?.definitions || [])
						.filter(w => w.pageOrientation === pageOrientation)
						.map(w => ({ modelId: ref.reference, watermark: w }));
				})
		);

	export const resolvedWatermarkReferences = createSelector(
		[printModelData, PrintEngineSelectors.watermarkReferences],
		(pmd, references) =>
			references.map(reference => ({
				reference,
				watermark: pmd?.[reference.model]?.content?.watermarks?.definitions?.find(
					w => w.id === reference.refId
				),
			}))
	);

	export const makeResolvedWatermarkForOrientation = () =>
		createSelector(
			[
				printModelData,
				PrintEngineSelectors.watermarkReferences,
				(_: PrintEngineState, pageOrientation: PageOrientation) => pageOrientation,
			],
			(pmd, references, pageOrientation) => {
				for (const reference of references) {
					const watermark = pmd?.[reference.model]?.content?.watermarks?.definitions?.find(
						w => w.id === reference.refId
					);
					if (watermark?.pageOrientation === pageOrientation) {
						return { reference, watermark };
					}
				}
				return undefined;
			}
		);
}
