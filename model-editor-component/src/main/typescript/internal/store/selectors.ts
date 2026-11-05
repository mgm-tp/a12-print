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
import sortBy from "lodash/sortBy.js";
import { createSelector } from "reselect";
import { nanoid } from "nanoid";

import type {
	InteractionLogEntry,
	InteractionLogStore,
	InteractionRegion,
	TransactionLogEntry,
	TransactionLogStore,
	TransactionLogStoreEntryMap,
} from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import {
	GlobalRegion,
	SidebarItem,
	SidebarRegion,
	TransactionLog,
	PrintModelCreator,
	getAllInteractionsFromLogStore,
	StageRegion,
} from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import {
	type FragmentModelReference,
	type ModelReferenceEntity,
	type PrintModelFragmentElement,
	PrintModelElement,
	type PartialAnyPrintModelElement,
	PartialAnyTopLevelContainerElement,
	type PartialPlaceableReference,
	type PartialSection,
	type PartialSegment,
	type PartialTextStyle,
	type PartialValidPlaceableReference,
	type PartialWatermark,
	type PlaceableReference,
	type PrintModel,
} from "@com.mgmtp.a12.print/print-model-api/model";
import {
	Area,
	BoundingBox,
	ElementType,
	isPartialSection,
	isPartialSegment,
	isSegment,
	Override,
	PageOrientation,
	PartialArea,
	PartialBoundingBox,
	PartialOverride,
	PartialSwitch,
	SectionUsage,
	SegmentReferenceDirection,
	SegmentReferencePurpose,
	Switch,
	Table,
	TableLayout,
	Text,
	FRAGMENT_MODEL_REFERENCE_PURPOSE,
	PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
	PRINT_MODEL_HEADER_LOG_ID,
	TEXT_STYLE,
} from "@com.mgmtp.a12.print/print-model-api/model";

import type { PrintEngineState } from "../../a12internal/api/PrintEngineState.js";

import type { RequestApiState } from "../redux/request-api/state.js";
import { ElementsUtils } from "../utils/elements-utils.js";
import { byToolboxOrder } from "../constant/elements.js";
import { DEFAULT_TEXT_STYLE_ID, NO_TEXT_STYLE_FALLBACK } from "../constant/textstyle.js";
import { createMmMeasure, createPlainMmMeasure } from "../utils/measure-utils.js";
import { assertExists } from "../utils/type-utils.js";
import { ROOT_DATA_CONTEXT_ENTRY } from "../constant/data-context.js";
import type { DataContextEntry } from "../types/data-context.js";
import { EditorMode, type PrintEditorState } from "../redux/editor-state/state.js";
import type { ConfirmationDialogState } from "../redux/confirmation-dialog/state.js";
import {
	type BaseFormState,
	FULLSCREEN_TABS,
	type NavigationState,
	type Wrapper,
	isElementFormState,
	isElementLibraryFormState,
	isBaseElementFormState,
	isListingColumnFormState,
	isListingFieldCompFormState,
	isListingGroupPropertyCompFormState,
	isListingPropertyCompFormState,
	isPageBreakConfigFormState,
	isBaseReferenceFormState,
	isTableColumnFormState,
	isTextCalculationFormState,
	isTextFieldFormState,
	isVisibilityConfigFormState,
} from "../redux/navigation/state.js";
import { NavigationSelectors } from "../redux/navigation/selectors.js";
import { EditorUtils } from "../utils/editor-utils.js";

import { createSliceSelector, isFpeStore } from "./create-slice-selector.js";
import { STAGE_REGION_MAP } from "./region-stage-map.js";

export type UndoInteractionLogEntry = InteractionLogEntry & { region: InteractionRegion; regionId: string };
type ContainerElement = PartialBoundingBox | PartialOverride | PartialArea | PartialSwitch;

export interface PlaceableWithElement {
	placeable: PartialValidPlaceableReference;
	element: PartialAnyPrintModelElement;
}

export type OrderedSegmentItem =
	| { segment: PartialSegment; reference?: FragmentModelReference }
	| { segment: undefined; reference: FragmentModelReference };

export type HeightChangeMap = Record<
	"segmentsMap" | "sectionsMap" | "watermarksMap" | "wrapperMap" | "fragmentsMap",
	Record<string, PlaceableWithElement[]>
>;

export interface TransactionLogGroup {
	interaction: InteractionLogEntry;
	transactions: TransactionLogEntry[];
}

export function idInputSelector(_: PrintEngineState, id = "") {
	return id;
}

export function idInputSelectorSecond(_: PrintEngineState, _arg: unknown, id = "") {
	return id;
}

export namespace PrintEngineSelectors {
	// top level
	export const state = createSliceSelector<PrintEngineState>(state => state);
	export const printEditorState = createSliceSelector<PrintEditorState>(state => state.PrintEditorState);
	export const transactionLogState = createSliceSelector<TransactionLogStore>(state => state.TransactionLogState);
	export const navigationState = createSliceSelector<NavigationState>(state => state.Navigation);
	export const interactionLogState = createSliceSelector<InteractionLogStore>(state => state.InteractionLogState);
	export const confirmationDialogState = createSliceSelector<ConfirmationDialogState>(
		state => state.ConfirmationDialogState
	);

	// top level nested
	export const isDinEditable = createSelector(printEditorState, editorState => editorState.isDinEditable);

	export const selectedTextStyleId = createSelector(
		printEditorState,
		editorState => editorState.sidebar.selectedTextStyleId
	);

	export const zoomFactor = createSelector(
		printEditorState,
		printEditorState => printEditorState.editorOptions.zoomFactor
	);
	export const showBordersEditor = createSelector(
		printEditorState,
		printEditorState => printEditorState?.editorStates?.showBorders
	);
	export const isMarginVisible = createSelector(
		printEditorState,
		printEditorState => printEditorState?.editorStates?.isMarginVisible
	);
	export const currentElementContainerId = createSelector([NavigationSelectors.activeEntities], printModelRefsState =>
		EditorUtils.getCurrentRefId(printModelRefsState)
	);
	export const wrappers = createSelector(
		[navigationState, NavigationSelectors.activeEntities],
		(nav, refs): ReadonlyArray<Wrapper> => {
			const tab = refs.currentRefType;
			const entityId = EditorUtils.getCurrentRefId(refs);
			if (!entityId) return [];
			const stack = nav[tab].entities[entityId];
			if (!stack || stack.length <= 1) return [];
			return stack.slice(1) as unknown as ReadonlyArray<Wrapper>;
		}
	);
	export const currentWrapperContainerId = createSelector([wrappers], wrapperState => {
		return wrapperState.length > 0 ? wrapperState[wrapperState.length - 1]?.id : undefined;
	});

	export const isCurrentWrapperReferenced = createSelector([wrappers], wrapperState =>
		wrapperState.some(wrapper => !!wrapper.wrapperContext?.placeableReference?.model)
	);

	export const currentWrapperContainer = createSelector([state, currentWrapperContainerId], (state, wrapperId) => {
		return wrapperId ? (printModelElement(state, wrapperId) as ContainerElement) : undefined;
	});

	export const currentCanvasEntityId = createSelector(
		[currentElementContainerId, wrappers],
		(containerId, wrappersState) => {
			return wrappersState.length > 0 ? wrappersState[wrappersState.length - 1]?.id : containerId;
		}
	);

	// raw entries for builder
	const rawPrintHeader = createSelector(transactionLogState, logStore => logStore[PRINT_MODEL_HEADER_LOG_ID]);
	const rawPrintContentGeneral = createSelector(
		transactionLogState,
		logStore => logStore[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]
	);
	const rawSegments = createSelector(transactionLogState, logStore => logStore.segments?.map);
	const rawSegmentReferences = createSelector(transactionLogState, logStore => logStore.segments?.references);
	const rawSections = createSelector(transactionLogState, logStore => logStore.sections?.map);
	const rawWatermarks = createSelector(transactionLogState, logStore => logStore.watermarks?.map);
	export const watermarkReferences = createSelector(transactionLogState, logStore =>
		TransactionLog.selectWatermarkReferences(logStore.watermarks?.referencesEntry)
	);
	export const sectionReferences = createSelector(transactionLogState, logStore =>
		TransactionLog.selectSectionReferences(logStore.sections?.referencesEntry)
	);
	export const textStyleReferences = createSelector(transactionLogState, logStore =>
		TransactionLog.selectTextStyleReferences(logStore.textStyles?.referencesEntry)
	);
	export const segmentFragmentReferences = createSelector(transactionLogState, logStore =>
		TransactionLog.selectSegmentFragmentReferences(logStore.segments?.fragmentReferencesEntry)
	);
	const requestApiState = createSliceSelector<RequestApiState>(state => state.RequestApi);
	const fragmentModelIds = createSelector(requestApiState, state => state.fragmentModelIds);
	const printModelData = createSelector(requestApiState, state => state.printModelData);

	/** All loaded print fragment models the edited print model references. */
	export const fragmentModels = createSelector(
		[fragmentModelIds, printModelData],
		(fragmentModelIds, printModelData): PrintModel[] =>
			(fragmentModelIds || [])
				.map(modelId => printModelData?.[modelId])
				.filter((printModel): printModel is PrintModel => printModel !== undefined)
	);

	// all element definitions stored in the referenced print fragment models
	const rawFragmentModelElements = createSelector(
		[fragmentModelIds, printModelData],
		(fragmentModelIds, printModelData) => {
			const result: TransactionLogStoreEntryMap<PartialAnyPrintModelElement> = {};
			for (const modelId of fragmentModelIds || []) {
				for (const element of printModelData?.[modelId]?.content?.elementDefinitions || []) {
					result[element.id] = {
						id: element.id,
						log: [],
						memoizedObject: element,
						initialObject: element,
					};
				}
			}
			return result;
		}
	);
	const rawPrintModelElements = createSelector(
		[transactionLogState, rawFragmentModelElements],
		(logStore, fragmentElements) => ({
			...fragmentElements,
			...logStore.printModelElements,
		})
	);

	const rawFragmentModelTextStyles = createSelector(
		[fragmentModelIds, printModelData],
		(fragmentModelIds, printModelData) => {
			const result: TransactionLogStoreEntryMap<PartialTextStyle> = {};
			for (const modelId of fragmentModelIds || []) {
				for (const textStyle of printModelData?.[modelId]?.content?.textStyles?.definitions || []) {
					result[textStyle.id] = {
						id: textStyle.id,
						log: [],
						memoizedObject: textStyle,
						initialObject: textStyle,
					};
				}
			}
			return result;
		}
	);

	const rawTextStyles = createSelector(
		[transactionLogState, rawFragmentModelTextStyles],
		(logStore, fragmentTextStyles) => ({
			...fragmentTextStyles,
			...logStore.textStyles?.map,
		})
	);

	// builder select
	export const printHeader = createSelector(rawPrintHeader, header => TransactionLog.selectPrintModelHeader(header));
	export const printModelSubType = createSelector(printHeader, header => header?.modelSubType);
	export const printContentGeneral = createSelector(rawPrintContentGeneral, general =>
		TransactionLog.selectPrintModelContentGeneral(general)
	);
	export const segments = createSelector(
		[rawSegments, printContentGeneral, segmentFragmentReferences, printModelData],
		(segments, printContentGeneral, segmentFragmentRefs, printModelData): PartialSegment[] =>
			(printContentGeneral.structure || []).flatMap<PartialSegment>(segmentId => {
				if (segments && segmentId in segments) {
					return [TransactionLog.selectSegment(segments, segmentId)];
				}
				const ref = segmentFragmentRefs.find(r => r.id === segmentId);
				const resolved = ref
					? printModelData?.[ref.model]?.content?.segments?.definitions?.find(s => s.id === ref.refId)
					: undefined;
				return resolved ? [{ ...resolved, id: segmentId }] : [];
			})
	);
	export const segmentReferences = createSelector([rawSegmentReferences], segmentReferences =>
		Object.keys(segmentReferences || {}).map(id => TransactionLog.selectSegmentReference(segmentReferences, id))
	);
	export const segment = createSelector(
		[rawSegments, idInputSelector, segmentFragmentReferences, printModelData],
		(segments, id, segmentFragmentRefs, printModelData): PartialSegment => {
			if (segments && id in segments) {
				return TransactionLog.selectSegment(segments, id);
			}
			const ref = segmentFragmentRefs.find(r => r.id === id);
			const resolved = ref
				? printModelData?.[ref.model]?.content?.segments?.definitions?.find(s => s.id === ref.refId)
				: undefined;
			if (resolved) {
				return { ...resolved, id };
			}
			// Neither a local nor a resolvable referenced segment - let selectSegment throw as before.
			return TransactionLog.selectSegment(segments, id);
		}
	);

	/**
	 * The segments in the order of `general.structure`, local and referenced fragment segments interleaved. A referenced
	 * segment carries the id of its {@link FragmentModelReference} so each reference is an independent instance. A reference whose segment is gone from its fragment model
	 * keeps its place with an undefined segment, so it stays visible and the structure indices stay correct.
	 */
	export const orderedSegmentItems = createSelector(
		[rawSegments, printContentGeneral, segmentFragmentReferences, printModelData],
		(segments, general, segmentFragmentRefs, printModelData): OrderedSegmentItem[] =>
			(general.structure || []).flatMap<OrderedSegmentItem>(segmentId => {
				if (segments && segmentId in segments) {
					return [{ segment: TransactionLog.selectSegment(segments, segmentId) }];
				}
				const reference = segmentFragmentRefs.find(r => r.id === segmentId);
				if (!reference) {
					return [];
				}
				const resolved = printModelData?.[reference.model]?.content?.segments?.definitions?.find(
					s => s.id === reference.refId
				);
				return [{ segment: resolved ? { ...resolved, id: segmentId } : undefined, reference }];
			})
	);
	export const segmentElements = createSelector(
		[segment, rawPrintModelElements],
		(segment, printModelElements) =>
			segment.elementReferences?.flatMap(ref => {
				const element = printModelElements[ref.refId || ""]?.memoizedObject;
				return element ? [element] : [];
			}) || []
	);

	/**
	 * Structure-ordered list of sections (local and referenced fragment sections interleaved).
	 * Referenced items carry the id of their {@link SectionFragmentReference}; the resolved section's
	 * id is overridden with that reference id so each reference is an independent, uniquely keyed instance.
	 */
	export const orderedSectionItems = createSelector(
		[rawSections, printContentGeneral, sectionReferences, printModelData],
		(sections, general, sectionRefs, printModelData): { section: PartialSection; referenceId?: string }[] => {
			const refsById = new Map(sectionRefs.map(r => [r.id, r]));
			return (general.sections || []).flatMap<{ section: PartialSection; referenceId?: string }>(sectionId => {
				if (sections && sectionId in sections) {
					return [{ section: TransactionLog.selectSection(sections, sectionId) }];
				}
				const ref = refsById.get(sectionId);
				const resolved = ref
					? printModelData?.[ref.model]?.content?.sections?.definitions?.find(s => s.id === ref.refId)
					: undefined;
				if (!ref || !resolved) return [];
				const sectionUsage = ref.sectionUsage ?? resolved.sectionUsage;
				return [
					{
						section: { ...resolved, id: sectionId, sectionUsage },
						referenceId: ref.id,
					},
				];
			});
		}
	);

	export const sections = createSelector([orderedSectionItems], (items): PartialSection[] =>
		items.map(item => item.section)
	);
	export const section = createSelector(
		[rawSections, idInputSelector, sectionReferences, printModelData],
		(sections, id, sectionRefs, printModelData): PartialSection => {
			if (sections && id in sections) {
				return TransactionLog.selectSection(sections, id);
			}
			const ref = sectionRefs.find(r => r.id === id);
			const resolved = ref
				? printModelData?.[ref.model]?.content?.sections?.definitions?.find(s => s.id === ref.refId)
				: undefined;
			if (ref && resolved) {
				const sectionUsage = ref.sectionUsage ?? resolved.sectionUsage;
				return { ...resolved, id, sectionUsage };
			}
			return TransactionLog.selectSection(sections, id);
		}
	);

	export const sectionElements = createSelector(
		[section, rawPrintModelElements],
		(section, printModelElements) =>
			section.elementReferences?.flatMap(ref => {
				const element = printModelElements[ref.refId || ""]?.memoizedObject;
				return element ? [element] : [];
			}) || []
	);

	/**
	 * Structure-ordered list of watermarks (local and referenced fragment watermarks interleaved).
	 * Referenced items carry the id of their {@link FragmentModelReference}; the resolved watermark's
	 * id is overridden with that reference id so each reference is an independent, uniquely keyed instance.
	 */
	export const orderedWatermarkItems = createSelector(
		[rawWatermarks, printContentGeneral, watermarkReferences, printModelData],
		(
			watermarks,
			general,
			watermarkRefs,
			printModelData
		): { watermark: PartialWatermark; referenceId?: string }[] => {
			const refsById = new Map(watermarkRefs.map(r => [r.id, r]));
			return (general.watermarks || []).flatMap<{ watermark: PartialWatermark; referenceId?: string }>(
				watermarkId => {
					if (watermarks && watermarkId in watermarks) {
						return [{ watermark: TransactionLog.selectWatermark(watermarks, watermarkId) }];
					}
					const ref = refsById.get(watermarkId);
					const resolved = ref
						? printModelData?.[ref.model]?.content?.watermarks?.definitions?.find(w => w.id === ref.refId)
						: undefined;
					return ref && resolved
						? [{ watermark: { ...resolved, id: watermarkId }, referenceId: ref.id }]
						: [];
				}
			);
		}
	);

	export const watermarks = createSelector([orderedWatermarkItems], (items): PartialWatermark[] =>
		items.map(item => item.watermark)
	);
	export const watermark = createSelector(
		[rawWatermarks, idInputSelector, watermarkReferences, printModelData],
		(watermarks, id, watermarkRefs, printModelData): PartialWatermark => {
			if (watermarks && id in watermarks) {
				return TransactionLog.selectWatermark(watermarks, id);
			}
			const ref = watermarkRefs.find(r => r.id === id);
			const resolved = ref
				? printModelData?.[ref.model]?.content?.watermarks?.definitions?.find(w => w.id === ref.refId)
				: undefined;
			if (resolved) {
				return { ...resolved, id };
			}
			return TransactionLog.selectWatermark(watermarks, id);
		}
	);

	export const watermarkElements = createSelector(
		[watermark, rawPrintModelElements],
		(watermark, printModelElements) =>
			watermark.elementReferences?.flatMap(ref => {
				const element = printModelElements[ref.refId || ""]?.memoizedObject;
				return element ? [element] : [];
			}) || []
	);

	export interface TextStyleEntry {
		textStyle: PartialTextStyle;
		isFragment: boolean;
	}

	/** The text styles available in this model, local ones first. */
	export const textStyleEntries = createSelector(
		[rawTextStyles, printContentGeneral, textStyleReferences, printModelData],
		(textStyles, printContentGeneral, refs, printModelData): TextStyleEntry[] => {
			const local = (printContentGeneral.textStyles || []).flatMap<TextStyleEntry>(textStyleId => {
				if (textStyles && textStyleId in textStyles) {
					return [{ textStyle: TransactionLog.selectTextStyle(textStyles, textStyleId), isFragment: false }];
				}
				return [];
			});
			// A referenced text style is addressed by its reference id, matching the `textStyle` selector.
			const referenced = refs.flatMap<TextStyleEntry>(ref => {
				const resolved = printModelData?.[ref.model]?.content?.textStyles?.definitions?.find(
					textStyle => textStyle.id === ref.refId
				);
				return resolved ? [{ textStyle: { ...resolved, id: ref.id }, isFragment: true }] : [];
			});
			return [...local, ...referenced];
		}
	);

	export const textStyles = createSelector(textStyleEntries, entries => entries.map(({ textStyle }) => textStyle));

	export const defaultTextStyle = createSelector(printEditorState, editorState => editorState.defaultTextStyle);

	export const fonts = createSelector(printEditorState, editorState => editorState.fonts);

	export const textStyle = createSelector(
		[defaultTextStyle, rawTextStyles, idInputSelector, textStyleReferences, printModelData],
		(defaultTextStyleValue, textStyles, id, refs, printModelData) => {
			if (id === DEFAULT_TEXT_STYLE_ID) {
				return defaultTextStyleValue;
			}
			if (id === TEXT_STYLE.NO_TEXT_STYLE_FALLBACK_ID) {
				return NO_TEXT_STYLE_FALLBACK;
			}
			if (textStyles && id in textStyles) {
				return TransactionLog.selectTextStyle(textStyles, id);
			}
			const ref = refs.find(r => r.id === id);
			const resolved = ref
				? printModelData?.[ref.model]?.content?.textStyles?.definitions?.find(ts => ts.id === ref.refId)
				: undefined;
			if (resolved) {
				return { ...resolved, id };
			}
			return defaultTextStyleValue;
		}
	);

	export const printModel = createSelector([transactionLogState], store => {
		return PrintModelCreator.createStoreModel(store);
	});

	export const printModelId = createSelector([printModel], model => {
		return model.header?.id;
	});

	export const printModelElement = createSelector(
		[rawPrintModelElements, idInputSelector],
		(printModelElements, id) => TransactionLog.selectPrintModelElement(printModelElements, id)
	);

	export const wrapperContainerElement = createSelector(
		[rawPrintModelElements, idInputSelector],
		(printModelElements, id) => {
			if (!id) {
				return undefined;
			}
			const wrapperEl = TransactionLog.selectPrintModelElement(printModelElements, id);
			return ElementsUtils.isWrapperElement(wrapperEl) ? wrapperEl : undefined;
		}
	);
	export const multiplePrintModelElements = createSelector(
		[rawPrintModelElements, (state, ids: string[]) => ids],
		(printModelElements, ids) =>
			ids.flatMap(id => {
				const element = printModelElements[id]?.memoizedObject;
				return element ? [element] : [];
			})
	);

	export const printModelElements = createSelector([rawPrintModelElements], printModelElements =>
		Object.keys(printModelElements).map(printModelId =>
			TransactionLog.selectPrintModelElement(printModelElements, printModelId)
		)
	);

	export const fragmentElements = createSelector([transactionLogState], logStore =>
		Object.keys(logStore.printModelElements)
			.map(id => TransactionLog.selectPrintModelElement(logStore.printModelElements, id))
			.filter(el => el?.isFragment)
	);

	export const selectableFragmentElements = createSelector(
		[fragmentModelIds, printModelData],
		(fragmentModelIds, printModelData) => {
			const elements: { model: string; element: PrintModelFragmentElement }[] = [];
			for (const modelId of fragmentModelIds || []) {
				for (const element of printModelData?.[modelId]?.content?.elementDefinitions || []) {
					if (PrintModelElement.isFragmentElement(element)) {
						elements.push({ element, model: modelId });
					}
				}
			}
			// Offer the fragments in the same order as the toolbox elements above them. Sorting here
			// rather than in the model keeps the elementDefinitions index - which validation rule
			// paths and navigation steps address positionally - untouched.
			return elements.sort((a, b) => byToolboxOrder(a.element.type, b.element.type));
		}
	);

	export const fragment = createSelector(
		[segments, sections, watermarks, printModelElements, idInputSelector],
		(segments, sections, watermarks, printModelElements, fragmentId) => {
			const segmentFragment = segments.find(segment => segment.id === fragmentId);
			const sectionFragment = sections.find(section => section.id === fragmentId);
			const watermarkFragment = watermarks.find(watermark => watermark.id === fragmentId);
			const elementFragment = printModelElements.find(element => element?.id === fragmentId);
			return segmentFragment ?? sectionFragment ?? watermarkFragment ?? elementFragment;
		}
	);

	export const printModelIdByReferenceElementId = createSelector(
		[segmentReferences, idInputSelector],
		(segmentReferences, referenceElementId) =>
			segmentReferences.find(segmentReference => segmentReference.id === referenceElementId)?.referenceModel
	);

	// builder computed values
	export const currentSegment = createSelector(
		[requestApiState, rawSegments, NavigationSelectors.activeEntities, segmentFragmentReferences],
		(requestApi, segments, { segmentId }, segmentFragmentRefs) => {
			if (!segmentId) {
				return undefined;
			}
			if (segments && segmentId in segments) {
				return TransactionLog.selectSegment(segments, segmentId);
			}
			const ref = segmentFragmentRefs.find(r => r.id === segmentId);
			if (ref) {
				const resolved = requestApi.printModelData?.[ref.model]?.content?.segments?.definitions?.find(
					s => s.id === ref.refId
				);
				if (resolved) {
					return { ...resolved, id: segmentId };
				}
			}
			return undefined;
		}
	);
	export const wrapperDataContext = createSelector(
		[NavigationSelectors.activeEntities, currentSegment, wrappers],
		({ currentRefType }, currentSegment, wrappers) => {
			const dataContext: DataContextEntry[] = [ROOT_DATA_CONTEXT_ENTRY];

			if (currentRefType !== SidebarItem.SEGMENT && !wrappers.length) {
				return dataContext;
			}

			currentSegment?.dataContexts?.forEach(context => {
				dataContext.push({ group: context?.path || "", isInstance: true });
			});

			wrappers.forEach(wrapper => {
				dataContext.push(
					...(wrapper?.dataContexts || []).map(context => ({ group: context?.path || "", isInstance: true }))
				);
			});

			return dataContext;
		}
	);
	export const repeatableBasePath = createSelector(
		[NavigationSelectors.activeEntities, currentSegment, wrappers],
		({ currentRefType }, currentSegment, wrappers) => {
			let nearestDataContext = null;

			if (currentRefType !== SidebarItem.SEGMENT && !wrappers.length) {
				return undefined;
			}

			nearestDataContext = currentSegment?.dataContexts?.find(dataContext => dataContext.isRepetition);
			for (let i = wrappers.length - 1; i >= 0; i--) {
				const nearestRepeatable = wrappers[i].dataContexts?.find(dataContext => dataContext.isRepetition);
				if (nearestRepeatable) {
					nearestDataContext = nearestRepeatable;
					break;
				}
			}
			if (nearestDataContext) {
				return nearestDataContext.path;
			}

			return undefined;
		}
	);
	export const currentWrapperContext = createSelector([wrappers], wrappers => {
		return wrappers.length > 0 ? wrappers[wrappers.length - 1]?.wrapperContext : undefined;
	});
	export const currentSection = createSelector(
		[requestApiState, rawSections, NavigationSelectors.activeEntities, sectionReferences],
		(requestApi, sections, { sectionId }, sectionRefs) => {
			if (!sectionId) {
				return undefined;
			}
			if (sections && sectionId in sections) {
				return TransactionLog.selectSection(sections, sectionId);
			}
			const ref = sectionRefs.find(r => r.id === sectionId);
			if (ref) {
				const resolved = requestApi.printModelData?.[ref.model]?.content?.sections?.definitions?.find(
					s => s.id === ref.refId
				);
				if (resolved) {
					const sectionUsage = ref.sectionUsage ?? resolved.sectionUsage;
					return { ...resolved, id: sectionId, sectionUsage };
				}
			}
			return undefined;
		}
	);
	export const currentWatermark = createSelector(
		[requestApiState, rawWatermarks, NavigationSelectors.activeEntities, watermarkReferences],
		(requestApi, watermarks, { watermarkId }, watermarkRefs) => {
			if (!watermarkId) {
				return undefined;
			}
			if (watermarks && watermarkId in watermarks) {
				return TransactionLog.selectWatermark(watermarks, watermarkId);
			}
			const ref = watermarkRefs.find(r => r.id === watermarkId);
			if (ref) {
				return requestApi.printModelData?.[ref.model]?.content?.watermarks?.definitions?.find(
					w => w.id === ref.refId
				);
			}
			return undefined;
		}
	);
	export const isCurrentWatermarkReferenced = createSelector(
		[rawWatermarks, NavigationSelectors.activeEntities, watermarkReferences],
		(watermarks, { watermarkId }, watermarkRefs) => {
			if (!watermarkId) return false;
			if (watermarks && watermarkId in watermarks) return false;
			return watermarkRefs.some(r => r.id === watermarkId);
		}
	);
	export const isCurrentSectionReferenced = createSelector(
		[rawSections, NavigationSelectors.activeEntities, sectionReferences],
		(sections, { sectionId }, sectionRefs) => {
			if (!sectionId) return false;
			if (sections && sectionId in sections) return false;
			return sectionRefs.some(r => r.id === sectionId);
		}
	);
	export const isCurrentSegmentReferenced = createSelector(
		[rawSegments, NavigationSelectors.activeEntities, segmentFragmentReferences],
		(segments, { segmentId }, segmentFragmentRefs) => {
			if (!segmentId) return false;
			if (segments && segmentId in segments) return false;
			return segmentFragmentRefs.some(r => r.id === segmentId);
		}
	);
	/** Whether the top level container currently open was pulled in from a print fragment model. */
	export const isCurrentContainerReferenced = createSelector(
		[
			NavigationSelectors.activeEntities,
			isCurrentSegmentReferenced,
			isCurrentSectionReferenced,
			isCurrentWatermarkReferenced,
		],
		({ currentRefType }, isSegmentReferenced, isSectionReferenced, isWatermarkReferenced) => {
			if (currentRefType === SidebarItem.SEGMENT) {
				return isSegmentReferenced;
			}
			if (currentRefType === SidebarItem.SECTION) {
				return isSectionReferenced;
			}
			return currentRefType === SidebarItem.WATERMARK ? isWatermarkReferenced : false;
		}
	);

	export const isCurrentTextStyleReferenced = createSelector(
		[selectedTextStyleId, textStyleReferences],
		(textStyleId, textStyleRefs) => {
			if (!textStyleId) return false;
			return textStyleRefs.some(reference => reference.id === textStyleId);
		}
	);

	export const currentFragment = createSelector(
		[state, NavigationSelectors.activeEntities],
		(state, { fragmentId }) => {
			return fragmentId ? fragment(state, fragmentId) : undefined;
		}
	);

	export const currentFragmentElement = createSelector(
		[rawPrintModelElements, NavigationSelectors.activeEntities],
		(printModelElements, { fragmentId }) => {
			if (!fragmentId || !printModelElements || !(fragmentId in printModelElements)) {
				return undefined;
			}
			return TransactionLog.selectPrintModelElement(printModelElements, fragmentId);
		}
	);

	export const currentSubFormElement = createSelector(
		[rawPrintModelElements, NavigationSelectors.currentSubForm],
		(rawPrintModelElements, currentSubForm) => {
			return currentSubForm && isBaseElementFormState(currentSubForm)
				? TransactionLog.selectPrintModelElement(rawPrintModelElements, currentSubForm.id)
				: undefined;
		}
	);

	export const currentFormElement = createSelector(
		[rawPrintModelElements, NavigationSelectors.currentElementForm],
		(rawPrintModelElements, currentForm) => {
			return currentForm
				? TransactionLog.selectPrintModelElement(rawPrintModelElements, currentForm.id)
				: undefined;
		}
	);

	export const rootFormElement = createSelector(
		[rawPrintModelElements, NavigationSelectors.firstForm],
		(rawPrintModelElements, firstForm) => {
			return firstForm && isBaseElementFormState(firstForm)
				? TransactionLog.selectPrintModelElement(rawPrintModelElements, firstForm.id)
				: undefined;
		}
	);

	export const isCurrentElementReferenced = createSelector(
		[rawFragmentModelElements, rootFormElement],
		(fragmentElements, element) => !!element && !!fragmentElements[element.id]
	);

	export const entityElementIds = createSelector([state, idInputSelector], (state, id) => {
		const element = printModelElement(state, id);
		if (element) {
			if (Text.isInstance(element)) {
				return element.text.entities?.map(entity => entity.refId) || [];
			}
			if (Table.isInstance(element)) {
				return element.table?.columns?.map(column => column.refId) || [];
			}
			if (BoundingBox.isInstance(element)) {
				return element.boundingBox?.elementReferences?.map(entity => entity.refId) || [];
			}
			if (Area.isInstance(element)) {
				return element.area?.elementReferences?.map(entity => entity.refId) || [];
			}
			if (Switch.isInstance(element)) {
				return element.switch?.cases?.map(entity => entity.refId) || [];
			}
			if (Override.isInstance(element)) {
				return element.override?.boundingBox?.elementReferences?.map(entity => entity.refId) || [];
			}
			if (TableLayout.isInstance(element)) {
				return element.tableLayout.cells?.map(cell => cell.refId) || [];
			}
		}
		return [];
	});

	export const elementIdsWithoutOverrides = createSelector(multiplePrintModelElements, elements => {
		return elements.reduce<string[]>((res, next) => {
			if (PartialOverride.isInstance(next)) {
				return res;
			}
			return [...res, next.id];
		}, []);
	});

	export const isEditorActive = createSelector(NavigationSelectors.activeEntities, printModelRefs => {
		const { sectionId, segmentId, watermarkId, fragmentId, currentRefType } = printModelRefs;
		return (
			(currentRefType === SidebarItem.SEGMENT && segmentId) ||
			(currentRefType === SidebarItem.SECTION && sectionId) ||
			(currentRefType === SidebarItem.WATERMARK && watermarkId) ||
			(currentRefType === SidebarItem.FRAGMENT && fragmentId)
		);
	});

	export const elementReferences = createSelector(
		[
			NavigationSelectors.activeEntities,
			currentSegment,
			currentSection,
			currentWatermark,
			currentWrapperContainerId,
			rawPrintModelElements,
		],
		(
			{ currentRefType },
			currentSegment,
			currentSection,
			currentWatermark,
			currentWrapperContainerId,
			rawPrintModelElements
		) => {
			if (currentWrapperContainerId) {
				const wrapperEl = TransactionLog.selectPrintModelElement(
					rawPrintModelElements,
					currentWrapperContainerId
				);
				if (PartialBoundingBox.isInstance(wrapperEl)) {
					return (wrapperEl.boundingBox?.elementReferences || []) as PlaceableReference[];
				} else if (PartialOverride.isInstance(wrapperEl)) {
					return (wrapperEl.override?.boundingBox?.elementReferences || []) as PlaceableReference[];
				} else if (PartialArea.isInstance(wrapperEl)) {
					return (wrapperEl.area?.elementReferences || []) as PlaceableReference[];
				} else {
					return [];
				}
			}

			let elementReferences;
			if (currentRefType === SidebarItem.SEGMENT) {
				elementReferences = currentSegment?.elementReferences || [];
			} else if (currentRefType === SidebarItem.SECTION) {
				elementReferences = currentSection?.elementReferences || [];
			} else {
				elementReferences = currentWatermark?.elementReferences || [];
			}

			return elementReferences as PlaceableReference[];
		}
	);

	export const currentContainerElement = createSelector(
		[NavigationSelectors.activeEntities, currentSegment, currentSection, currentWatermark, currentFragment],
		({ currentRefType }, currentSegment, currentSection, currentWatermark, currentFragment) => {
			if (currentRefType === SidebarItem.SEGMENT) {
				return currentSegment;
			} else if (currentRefType === SidebarItem.SECTION) {
				return currentSection;
			} else if (currentRefType === SidebarItem.FRAGMENT) {
				return currentFragment;
			} else {
				return currentWatermark;
			}
		}
	);

	export const isSegmentStage = createSelector(
		[currentWrapperContainer, currentContainerElement],
		(currentWrapperContainer, currentContainerElement) => {
			return !currentWrapperContainer && currentContainerElement && isPartialSegment(currentContainerElement);
		}
	);

	export const segmentSection = createSelector(
		[sections, currentSegment, segments, isSegmentStage],
		(sections, currentSegment, segments, isSegmentStage) => {
			if (!isSegmentStage) {
				return undefined;
			}
			const currentPageOrientation = currentSegment?.defaultSegment?.pageOrientation;
			const isFirst = segments.findIndex(segment => segment.id === currentSegment?.id) === 0;
			const usage = isFirst ? SectionUsage.First : SectionUsage.Remaining;

			let appliedSection = sections?.find(section => {
				return section.pageOrientation === currentPageOrientation && section.sectionUsage === usage;
			});

			if (isFirst && !appliedSection) {
				appliedSection = sections?.find(section => {
					return (
						section.pageOrientation === currentPageOrientation &&
						section.sectionUsage === SectionUsage.Remaining
					);
				});
			}

			return appliedSection;
		}
	);

	export const currentContainerElementReferences = createSelector(
		[state, currentContainerElement, currentWrapperContainer],
		(_state, container, wrapper) => {
			if (wrapper) {
				return getElementReferences(wrapper);
			}
			if (container && PartialAnyTopLevelContainerElement.isInstance(container)) {
				return container?.elementReferences;
			}
			// For non-wrappers getElementReferences returns internal form structure (e.g. table columns without
			// refId), which would crash the printModelElement lookup in currentContainerPrintModelElements.
			if (container && ElementsUtils.isWrapperElement(container)) {
				return ElementsUtils.getElementReferences(container);
			}
			return [];
		}
	);

	export const currentContainerPrintModelElements = createSelector(
		[rawPrintModelElements, currentContainerElementReferences],
		(printModelElements, currentContainerElementReferences) => {
			// An external fragment reference may still be loading - skip it instead of crashing; it reappears
			// once its fragment model's async load completes.
			return currentContainerElementReferences
				?.filter(ref => !ref.model || (ref.refId || "") in printModelElements)
				.map(ref => TransactionLog.selectPrintModelElement(printModelElements, ref.refId || ""));
		}
	);

	export const isAnyOverrideSelected = createSelector(
		[currentContainerPrintModelElements, (_: unknown, selected: string[]) => selected],
		(printModelElements, selected) => {
			return selected.some(id => printModelElements?.find(el => el?.id === id && PartialOverride.isInstance(el)));
		}
	);

	export const hasOnlyContainerElement = createSelector(
		[currentContainerPrintModelElements, (_: unknown, selected: string[]) => selected],
		(printModelElements, selected) => {
			return (
				selected.length === 1 &&
				!!printModelElements?.find(
					el =>
						el?.id === selected[0] &&
						(PartialOverride.isInstance(el) ||
							PartialArea.isInstance(el) ||
							PartialBoundingBox.isInstance(el) ||
							PartialSwitch.isInstance(el))
				)
			);
		}
	);

	export const currentPageOrientation = createSelector(
		[NavigationSelectors.activeEntities, currentSegment, currentSection, currentWatermark],
		({ currentRefType }, currentSegment, currentSection, currentWatermark) => {
			if (currentRefType === SidebarItem.SEGMENT) {
				return currentSegment?.defaultSegment?.pageOrientation;
			} else if (currentRefType === SidebarItem.SECTION) {
				return currentSection?.pageOrientation;
			} else {
				return currentWatermark?.pageOrientation;
			}
		}
	);

	const currentFragmentElementWidth = createSelector([currentFragmentElement], fragmentElement => {
		if (!fragmentElement) {
			return undefined;
		}
		assertExists(fragmentElement.fragmentDimensions, "Fragment element must have fragmentDimensions set");
		return fragmentElement.fragmentDimensions.width.value;
	});
	const currentFragmentElementHeight = createSelector([currentFragmentElement], fragmentElement => {
		if (!fragmentElement) {
			return undefined;
		}
		assertExists(fragmentElement.fragmentDimensions, "Fragment element must have fragmentDimensions set");
		return fragmentElement.fragmentDimensions.height.value;
	});

	export const editorDimensions = createSelector(
		[
			currentPageOrientation,
			wrappers,
			NavigationSelectors.activeEntities,
			currentFragmentElementWidth,
			currentFragmentElementHeight,
		],
		(pageContainer, wrappers, { currentRefType }, fragmentWidth, fragmentHeight) => {
			if (
				currentRefType === SidebarItem.FRAGMENT &&
				wrappers.length === 0 &&
				fragmentWidth !== undefined &&
				fragmentHeight !== undefined
			) {
				return {
					minWidth: createPlainMmMeasure(fragmentWidth),
					minHeight: createPlainMmMeasure(fragmentHeight),
				};
			}

			const EDITOR_DIMENSIONS = { minHeight: createPlainMmMeasure(297), minWidth: createPlainMmMeasure(210) };

			const getDefaultWidth = () => {
				return pageContainer === PageOrientation.Portrait
					? EDITOR_DIMENSIONS.minWidth
					: EDITOR_DIMENSIONS.minHeight;
			};

			const getDefaultHeight = () => {
				return pageContainer === PageOrientation.Portrait
					? EDITOR_DIMENSIONS.minHeight
					: EDITOR_DIMENSIONS.minWidth;
			};

			const currentWrapper = wrappers?.[wrappers.length - 1];

			const minWidth = currentWrapper?.dimensions?.width ?? getDefaultWidth();
			const minHeight = currentWrapper?.dimensions?.height ?? getDefaultHeight();

			return {
				minWidth,
				minHeight,
			};
		}
	);

	export const elementsAffectedByTextStyleChange = createSelector(
		[segments, sections, watermarks, fragmentElements, rawPrintModelElements, idInputSelector],
		(allSegments, allSections, allWatermarks, allFragmentElements, rawElements, textStyleId) => {
			const result = [...allSegments, ...allSections, ...allWatermarks].reduce<HeightChangeMap>(
				(res, container) => {
					let containerMap;

					if (isPartialSection(container)) {
						containerMap = res.sectionsMap;
					} else if (isPartialSegment(container)) {
						containerMap = res.segmentsMap;
					} else {
						containerMap = res.watermarksMap;
					}

					const filteredPlaceablesWithElement = container.elementReferences
						?.map(el => {
							const element = TransactionLog.selectPrintModelElement(rawElements, el.refId || "");
							if (ElementsUtils.isWrapperElement(element)) {
								addWrapperElements(element, res.wrapperMap, rawElements, textStyleId);
							}
							return { placeable: el as PartialValidPlaceableReference, element };
						})
						.filter(el => el.element && isTextStyleUsed(el.element, textStyleId, rawElements)) as {
						placeable: PartialValidPlaceableReference;
						element: PartialAnyPrintModelElement;
					}[];
					if (filteredPlaceablesWithElement?.length) {
						containerMap[container.id] = filteredPlaceablesWithElement;
					}
					return res;
				},
				{ segmentsMap: {}, sectionsMap: {}, watermarksMap: {}, fragmentsMap: {}, wrapperMap: {} }
			);

			// Standalone isFragment root elements sit in no container, so the reduce above misses them.
			for (const element of allFragmentElements) {
				if (element && isTextStyleUsed(element, textStyleId, rawElements)) {
					assertExists(element.fragmentDimensions, "Fragment element must have fragmentDimensions set");
					result.fragmentsMap[element.id] = [
						{
							element,
							placeable: {
								id: nanoid(),
								refId: element.id,
								position: { id: nanoid(), x: createMmMeasure(0), y: createMmMeasure(0) },
								dimensions: {
									id: nanoid(),
									minWidth: createMmMeasure(element.fragmentDimensions.width.value),
									minHeight: createMmMeasure(element.fragmentDimensions.height.value),
								},
							},
						},
					];
				}
			}

			return result;
		}
	);

	export const isTextStyleUsedByPrintModel = createSelector(
		[transactionLogState, idInputSelector],
		({ printModelElements }, textStyleId) =>
			Object.keys(printModelElements).some(id => {
				const element = TransactionLog.selectPrintModelElement(printModelElements, id);
				return !!element && isTextStyleUsed(element, textStyleId, printModelElements);
			})
	);

	export const isIncomingDinTemplatePrintModel = createSelector(
		[segmentReferences, NavigationSelectors.activeEntities],
		(segmentReferences, { segmentId }) =>
			Boolean(segmentId) &&
			segmentReferences.find(
				ref =>
					ref.purpose === SegmentReferencePurpose.DINTemplate &&
					ref.direction === SegmentReferenceDirection.IncomingReference
			) !== undefined
	);
	export const isDinTemplateSegmentEditor = createSelector(
		[currentContainerElement, currentWrapperContainerId],
		(containerElement, currentWrapperContainerId) => {
			return (
				isSegment(containerElement) && containerElement.dinTemplate !== undefined && !currentWrapperContainerId
			);
		}
	);

	export const referenceSegments = createSelector(segments, allSegments => {
		return allSegments.filter(el => el.dinTemplate);
	});

	// builder select nested values
	export const documentModel = createSelector(printContentGeneral, general => general?.segmentDefaults?.model);
	export const modelReferences = createSelector(
		printHeader,
		header => sortBy(header?.modelReferences || [], ["reference"]) as ModelReferenceEntity[]
	);
	export const documentModelReferences = createSelector([modelReferences], modelReferences =>
		modelReferences.filter(reference => reference.modelType === "document")
	);
	export const printModelReferences = createSelector([modelReferences], modelReferences =>
		modelReferences.filter(
			reference => reference.modelType === "print" && reference.purpose !== FRAGMENT_MODEL_REFERENCE_PURPOSE
		)
	);

	export const typesettingModelReferences = createSelector([modelReferences], modelReferences =>
		modelReferences.filter(reference => reference.modelType === "typesetting")
	);
	export const fragmentModelReferences = createSelector([modelReferences], modelReferences =>
		modelReferences.filter(
			reference => reference.modelType === "print" && reference.purpose === FRAGMENT_MODEL_REFERENCE_PURPOSE
		)
	);
	export const dinTemplateModelReferences = createSelector([printModelReferences], printModelReferences =>
		printModelReferences.filter(reference => reference.purpose === SegmentReferencePurpose.DINTemplate)
	);
	export const defaultModelReference = createSelector(
		documentModelReferences,
		references => references[0]?.reference
	);
	export const segmentReferenceByPrintModelId = createSelector(
		[segmentReferences, idInputSelector],
		(segmentReferences, printModelId) => {
			return segmentReferences.find(segmentReference => segmentReference.referenceModel === printModelId);
		}
	);

	// undo-redo
	export const currentViewInteractionList = createSelector(
		[
			NavigationSelectors.sidebarState,
			NavigationSelectors.detailForm,
			NavigationSelectors.currentForm,
			NavigationSelectors.currentMode,
			interactionLogState,
			currentCanvasEntityId,
			selectedTextStyleId,
			currentWrapperContainer,
		],
		(
			sidebarState,
			detailForm,
			currentForm,
			currentMode,
			interactionState,
			curContainerId,
			selectedTextStyleId,
			wrapperElement
		) => {
			const fullLogEntryList: UndoInteractionLogEntry[] = [];
			const { isFullscreen, isOpen, activeTab } = sidebarState;

			function handleSideContentFullscreen() {
				if (activeTab === SidebarItem.TEXT_STYLES) {
					fullLogEntryList.push(
						...(interactionState.textStyles[selectedTextStyleId]?.map((entry: InteractionLogEntry) => ({
							...entry,
							region: SidebarRegion.TEXT_STYLES as InteractionRegion,
							regionId: selectedTextStyleId,
						})) || [])
					);
				}
				fullLogEntryList.push(
					...interactionState.sidebar[activeTab].map((entry: InteractionLogEntry) => ({
						...entry,
						region: GlobalRegion.SIDEBAR as InteractionRegion,
						regionId: activeTab,
					}))
				);
			}

			function handleSidebarOpen() {
				fullLogEntryList.push(
					...interactionState.sidebar[activeTab].map((entry: InteractionLogEntry) => ({
						...entry,
						region: GlobalRegion.SIDEBAR as InteractionRegion,
						regionId: activeTab,
					}))
				);
			}

			function handleCurrentContainer() {
				const isFormOpen = Boolean(detailForm);

				const isSwitchStage = wrapperElement && PartialSwitch.isInstance(wrapperElement);
				const isStageOpen = !detailForm?.isFullScreen || !isFormOpen;

				if (isSwitchStage) {
					fullLogEntryList.push(
						...(interactionState.switchStage[wrapperElement.id] || []).map(
							(entry: InteractionLogEntry) => ({
								...entry,
								region: StageRegion.SWITCH as InteractionRegion,
								regionId: wrapperElement.id,
							})
						)
					);
				} else if (isStageOpen) {
					const stageRegion = STAGE_REGION_MAP[
						currentMode as keyof typeof STAGE_REGION_MAP
					] as StageRegion.RegionKeys;
					fullLogEntryList.push(
						...(interactionState[stageRegion][curContainerId] || []).map((entry: InteractionLogEntry) => ({
							...entry,
							region: stageRegion as InteractionRegion,
							regionId: curContainerId,
						}))
					);
				}

				const regionId = currentForm ? getRegionId(currentForm) : undefined;

				if (regionId && currentForm && [EditorMode.Default, EditorMode.Layout].includes(currentMode)) {
					const tempFormRegion = (
						isElementFormState(currentForm) || isBaseReferenceFormState(currentForm)
							? GlobalRegion.FORM
							: currentForm.type
					) as InteractionRegion;

					fullLogEntryList.push(
						...(interactionState[tempFormRegion][regionId] || []).map((entry: InteractionLogEntry) => ({
							...entry,
							region: tempFormRegion,
							regionId,
						}))
					);
				}
			}

			if (FULLSCREEN_TABS.includes(activeTab) || (isOpen && isFullscreen)) {
				handleSideContentFullscreen();
				return fullLogEntryList.sort((a, b) => a.timestamp - b.timestamp);
			}

			if (isOpen) {
				handleSidebarOpen();
			}

			if (curContainerId) {
				handleCurrentContainer();
			}
			return fullLogEntryList.sort((a, b) => a.timestamp - b.timestamp);
		}
	);

	export const undoRedoButtonState = createSelector(currentViewInteractionList, fullLogEntryList => {
		const undoInteractionIds: string[] = [];
		const redoInteractionIds: string[] = [];
		let isUndoDisabled = undefined;
		let isRedoDisabled = undefined;
		for (let i = fullLogEntryList.length - 1; i >= 0; i--) {
			const logEntry = fullLogEntryList[i];
			if (logEntry.preventUndo === true) {
				continue;
			}

			if (logEntry.type === "SET") {
				if (!undoInteractionIds.includes(logEntry.interactionId)) {
					isUndoDisabled = false;
					break;
				}
			} else if (logEntry.type === "REDO") {
				redoInteractionIds.push(logEntry.affectedItems[0].id);
			} else if (logEntry.type === "UNDO") {
				if (!redoInteractionIds.includes(logEntry.interactionId)) {
					isRedoDisabled = false;
					undoInteractionIds.push(logEntry.affectedItems[0].id);
				}
			}
		}
		isUndoDisabled ??= true;
		isRedoDisabled ??= true;
		return { isUndoDisabled, isRedoDisabled };
	});

	export const lastSetInteraction = createSelector(currentViewInteractionList, fullLogEntryList => {
		const undoInteractionIds: string[] = [];
		const redoInteractionIds: string[] = [];
		for (let i = fullLogEntryList.length - 1; i >= 0; i--) {
			const logEntry = fullLogEntryList[i];
			if (logEntry.preventUndo === true) {
				continue;
			}

			if (logEntry.type === "SET") {
				if (!undoInteractionIds.includes(logEntry.interactionId)) {
					return logEntry;
				}
			} else if (logEntry.type === "REDO") {
				redoInteractionIds.push(logEntry.affectedItems[0].id);
			} else if (logEntry.type === "UNDO") {
				if (!redoInteractionIds.includes(logEntry.interactionId)) {
					undoInteractionIds.push(logEntry.affectedItems[0].id);
				}
			}
		}
		return undefined;
	});

	export const lastUndoInteraction = createSelector(currentViewInteractionList, fullLogEntryList => {
		const redoInteractionIds: string[] = [];
		for (let i = fullLogEntryList.length - 1; i >= 0; i--) {
			const logEntry = fullLogEntryList[i];
			if (logEntry.type === "SET") {
				return undefined;
			} else if (logEntry.type === "REDO") {
				redoInteractionIds.push(logEntry.affectedItems[0].id);
			} else if (logEntry.type === "UNDO") {
				if (!redoInteractionIds.includes(logEntry.interactionId)) {
					return logEntry;
				}
			}
		}
		return undefined;
	});

	// commit changes
	export const allInteractions = createSelector(interactionLogState, interactionState => {
		return getAllInteractionsFromLogStore(interactionState);
	});
}

function getElementReferences(wrapper: ContainerElement) {
	if (PartialBoundingBox.isInstance(wrapper)) {
		return wrapper.boundingBox?.elementReferences || [];
	}
	if (PartialOverride.isInstance(wrapper)) {
		return wrapper.override?.boundingBox?.elementReferences || [];
	}
	if (PartialArea.isInstance(wrapper)) {
		return wrapper.area?.elementReferences || [];
	}
	if (PartialSwitch.isInstance(wrapper)) {
		return wrapper.switch?.cases || [];
	}
	return [];
}

function addWrapperElements(
	wrapper: ContainerElement,
	wrapperMap: Record<string, PlaceableWithElement[]>,
	rawElements: TransactionLogStoreEntryMap<PartialAnyPrintModelElement>,
	textStyleId: string
) {
	const elementReferences = PartialSwitch.isInstance(wrapper)
		? getElementReferencesFromSwitch(wrapper, rawElements)
		: getElementReferences(wrapper);

	const filtered = elementReferences
		.map(el => {
			const element = TransactionLog.selectPrintModelElement(rawElements, el.refId || "");
			if (ElementsUtils.isWrapperElement(element)) {
				addWrapperElements(element, wrapperMap, rawElements, textStyleId);
			}
			return { placeable: el as PartialValidPlaceableReference, element };
		})
		.filter(el => el.element && isTextStyleUsed(el.element, textStyleId, rawElements)) as {
		placeable: PartialValidPlaceableReference;
		element: PartialAnyPrintModelElement;
	}[];
	if (filtered.length > 0) {
		wrapperMap[wrapper.id] = filtered;
	}
}

function getElementReferencesFromSwitch(
	switchElement: PartialSwitch,
	rawElements: TransactionLogStoreEntryMap<PartialAnyPrintModelElement>
): PartialPlaceableReference[] {
	return (switchElement.switch?.cases || []).reduce<PartialPlaceableReference[]>((res, next) => {
		const area = TransactionLog.selectPrintModelElement(rawElements, next.refId || "");
		if (area && PartialArea.isInstance(area) && area.area?.elementReferences) {
			res.push(...area.area.elementReferences);
		}
		return res;
	}, []);
}

function isTextStyleUsed(
	element: PartialAnyPrintModelElement,
	textStyleId: string,
	rawElements: TransactionLogStoreEntryMap<PartialAnyPrintModelElement>
) {
	switch (element.type) {
		case ElementType.TableLayout:
			return element.tableLayout?.cells?.some(cell => {
				const textElement = TransactionLog.selectPrintModelElement(rawElements, cell.refId || "") as
					Text | undefined;
				return textElement?.textProperties?.textStyleId?.value === textStyleId;
			});
		case ElementType.Table:
			return element.table?.headerTextProperties?.textStyleId?.value === textStyleId;
		case ElementType.Listing:
			return element.listing?.headerTextProperties?.textStyleId?.value === textStyleId;
		default:
			return element && "textProperties" in element && element.textProperties?.textStyleId?.value === textStyleId;
	}
}

function getRegionId(currentForm: BaseFormState) {
	if (isElementLibraryFormState(currentForm)) {
		// The Element Library form owns no interactions, so it contributes no region.
		return undefined;
	}

	if (isListingColumnFormState(currentForm)) {
		return currentForm.columnId;
	}

	if (isListingFieldCompFormState(currentForm)) {
		return currentForm.fieldCompId;
	}

	if (isListingPropertyCompFormState(currentForm)) {
		return currentForm.propertyCompId;
	}

	if (isListingGroupPropertyCompFormState(currentForm)) {
		return currentForm.propertyCompId;
	}

	if (isTableColumnFormState(currentForm)) {
		return currentForm.columnId;
	}

	if (isVisibilityConfigFormState(currentForm) || isPageBreakConfigFormState(currentForm)) {
		return currentForm.referenceId;
	}

	if (
		isElementFormState(currentForm) ||
		isTextCalculationFormState(currentForm) ||
		isTextFieldFormState(currentForm)
	) {
		return currentForm.id;
	}

	throw new Error("Unknown form state");
}

export { createSliceSelector, isFpeStore };
export type { Selector } from "./create-slice-selector.js";
