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
import { DefaultRootState } from "react-redux";
import { createSelector } from "reselect";

import {
	GlobalRegion,
	InteractionLogEntry,
	InteractionLogStore,
	InteractionRegion,
	ListingRegion,
	SidebarItem,
	SidebarRegion,
	StageRegion,
	TableRegion,
	TextRegion,
	TransactionLog,
	TransactionLogEntry,
	TransactionLogStore,
	TransactionLogStoreEntryMap,
} from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/index.js";
import { ModelReference } from "@com.mgmtp.a12.base/base-model-api/lib/main/header/index.js";
import {
	Area,
	BoundingBox,
	ElementType,
	isPartialSection,
	isPartialSegment,
	isSegment,
	Override,
	PageOrientation,
	PartialAnyPrintModelElement,
	PartialArea,
	PartialBoundingBox,
	PartialOverride,
	PartialPlaceableReference,
	PartialSwitch,
	PartialValidPlaceableReference,
	PlaceableReference,
	SectionUsage,
	SegmentReferenceDirection,
	SegmentReferencePurpose,
	Switch,
	Table,
	TableLayout,
	Text,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { PrintModelCreator } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/print-model-creator/index.js";
import { getAllInteractionsFromLogStore } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/utils/transaction-log-utils.js";
import {
	PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
	PRINT_MODEL_HEADER_LOG_ID,
	TEXT_STYLE,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/constant.js";

import { WrapperState } from "../redux/wrapper/state.js";
import { SidebarState } from "../redux/sidebar/state.js";
import { FULLSCREEN_TABS } from "../redux/sidebar/reducer.js";
import { PrintModelRefs, PrintEditorState, EditorMode } from "../redux/editor-state/state.js";
import { DetailData, DetailDataState } from "../redux/detail-data/state.js";
import { ConfirmationDialogState } from "../redux/confirmation-dialog/state.js";
import { getListingRegionId } from "../components/forms/listing-form-container/utils.js";
import { getTableRegionId } from "../components/forms/table-form-container/utils.js";
import { ElementsUtils } from "../utils/elements-utils.js";
import { DEFAULT_TEXT_STYLE_ID, NO_TEXT_STYLE_FALLBACK } from "../constant/textstyle.js";
import { createPlainMmMeasure } from "../utils/measure-utils.js";
import { ROOT_DATA_CONTEXT_ENTRY } from "../constant/data-context.js";
import { DataContextEntry } from "../types/data-context.js";

import { PrintEngineState } from "./root-reducer.js";
import { STAGE_REGION_MAP } from "./region-stage-map.js";

type Selector<T> = (state: PrintEngineState) => T;
export type UndoInteractionLogEntry = InteractionLogEntry & { region: InteractionRegion; regionId: string };
type ContainerElement = PartialBoundingBox | PartialOverride | PartialArea | PartialSwitch;

export interface PlaceableWithElement {
	placeable: PartialValidPlaceableReference;
	element: PartialAnyPrintModelElement;
}

export type HeightChangeMap = Record<
	"segmentsMap" | "sectionsMap" | "watermarksMap" | "wrapperMap",
	Record<string, PlaceableWithElement[]>
>;

export interface TransactionLogGroup {
	interaction: InteractionLogEntry;
	transactions: TransactionLogEntry[];
}

const DEFAULT_PRINT_MODEL_REF: PrintModelRefs = {
	segmentId: "",
	sectionId: "",
	watermarkId: "",
	currentRefType: SidebarItem.SEGMENT,
};

function isFpeStore(slice: PrintEngineState | DefaultRootState): slice is PrintEngineState {
	return (
		slice instanceof Object &&
		"PrintEditorState" in slice &&
		"DetailData" in slice &&
		"Sidebar" in slice &&
		"TransactionLogState" in slice &&
		"RequestApi" in slice &&
		"InteractionLogState" in slice
	);
}

export function createSliceSelector<T>(selector: (state: PrintEngineState) => T): Selector<T> {
	return store => {
		if (isFpeStore(store)) {
			return selector(store);
		}
		throw new Error("Current store is not Print Model Editor store");
	};
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
	export const detailData = createSliceSelector<DetailDataState>(state => state.DetailData);
	export const printEditorState = createSliceSelector<PrintEditorState>(state => state.PrintEditorState);
	export const sidebar = createSliceSelector<SidebarState>(state => state.Sidebar);
	export const transactionLogState = createSliceSelector<TransactionLogStore>(state => state.TransactionLogState);
	export const wrapperState = createSliceSelector<WrapperState>(state => state.Wrapper);
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

	export const printModelRefs = createSelector(
		printEditorState,
		printEditorState => printEditorState.printModelRefs || DEFAULT_PRINT_MODEL_REF
	);
	export const editorMode = createSelector(
		printEditorState,
		printEditorState => printEditorState.editorStates.editorMode
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
	export const currentElementContainerId = createSelector([printModelRefs], printModelRefsState => {
		const { sectionId, segmentId, watermarkId, currentRefType } = printModelRefsState;
		if (currentRefType === SidebarItem.SEGMENT) {
			return segmentId;
		} else if (currentRefType === SidebarItem.SECTION) {
			return sectionId;
		} else {
			return watermarkId;
		}
	});
	export const wrappers = createSelector([currentElementContainerId, wrapperState], (containerId, wrapperState) => {
		return wrapperState[containerId] || [];
	});
	export const currentWrapperContainerId = createSelector([wrappers], wrapperState => {
		return wrapperState.length > 0 ? wrapperState[wrapperState.length - 1]?.id : undefined;
	});

	export const currentWrapperContainer = createSelector([state, currentWrapperContainerId], (state, wrapperId) => {
		return wrapperId ? (printModelElement(state, wrapperId) as ContainerElement) : undefined;
	});

	export const currentDetailDataId = createSelector(
		[currentElementContainerId, wrappers],
		(containerId, wrappersState) => {
			return wrappersState.length > 0 ? wrappersState[wrappersState.length - 1]?.id : containerId;
		}
	);
	export const currentDetailData = createSelector(
		[detailData, currentDetailDataId],
		(detailDataState, currentDetailDataId) => {
			return currentDetailDataId ? detailDataState[currentDetailDataId] : undefined;
		}
	);

	export const editPositionTextDetailData = createSelector(currentDetailData, currentDetailDataState => {
		return currentDetailDataState?.additionalData?.text?.editPosition;
	});

	export const additionalData = createSelector(
		currentDetailData,
		currentDetailDataState => currentDetailDataState?.additionalData
	);
	export const detailDataRefId = createSelector(
		currentDetailData,
		currentDetailDataState => currentDetailDataState?.refId
	);

	export const hideConditionsFormData = createSelector(currentDetailData, detailData => ({
		isVisibilityConfig: detailData?.isVisibilityConfig,
		placeabeRefId: detailData?.placeableRefId,
	}));

	export const pageBreakConfigFormData = createSelector(currentDetailData, detailData => ({
		isPageBreakConfig: detailData?.isPageBreakConfig,
		placeabeRefId: detailData?.placeableRefId,
	}));

	// raw entries for builder
	const rawPrintHeader = createSelector(transactionLogState, logStore => logStore[PRINT_MODEL_HEADER_LOG_ID]);
	const rawPrintContentGeneral = createSelector(
		transactionLogState,
		logStore => logStore[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]
	);
	const rawSegments = createSelector(transactionLogState, logStore => logStore.segments.map);
	const rawSegmentReferences = createSelector(transactionLogState, logStore => logStore.segments.references);
	const rawSections = createSelector(transactionLogState, logStore => logStore.sections?.map);
	const rawWatermarks = createSelector(transactionLogState, logStore => logStore.watermarks?.map);
	const rawPrintModelElements = createSelector(transactionLogState, logStore => logStore.printModelElements);
	const rawTextStyles = createSelector(transactionLogState, logStore => logStore.textStyles?.map);

	// builder select
	export const printHeader = createSelector(rawPrintHeader, header => TransactionLog.selectPrintModelHeader(header));
	export const printContentGeneral = createSelector(rawPrintContentGeneral, general =>
		TransactionLog.selectPrintModelContentGeneral(general)
	);
	export const segments = createSelector(
		[rawSegments, printContentGeneral],
		(segments, printContentGeneral) =>
			printContentGeneral.structure?.map(segmentId => TransactionLog.selectSegment(segments, segmentId)) || []
	);
	export const segmentReferences = createSelector([rawSegmentReferences], segmentReferences =>
		Object.keys(segmentReferences).map(id => TransactionLog.selectSegmentReference(segmentReferences, id))
	);
	export const segment = createSelector([rawSegments, idInputSelector], (segments, id) =>
		TransactionLog.selectSegment(segments, id)
	);
	export const segmentElements = createSelector(
		[segment, rawPrintModelElements],
		(segment, printModelElements) =>
			segment.elementReferences?.map(ref =>
				TransactionLog.selectPrintModelElement(printModelElements, ref.refId || "")
			) || []
	);

	export const sections = createSelector(
		[rawSections, printContentGeneral],
		(sections, general) => general.sections?.map(id => TransactionLog.selectSection(sections, id)) || []
	);
	export const section = createSelector([rawSections, idInputSelector], (sections, id) =>
		TransactionLog.selectSection(sections, id)
	);

	export const sectionElements = createSelector(
		[section, rawPrintModelElements],
		(section, printModelElements) =>
			section.elementReferences?.map(ref =>
				TransactionLog.selectPrintModelElement(printModelElements, ref.refId || "")
			) || []
	);

	export const watermarks = createSelector(
		[rawWatermarks, printContentGeneral],
		(watermarks, general) => general.watermarks?.map(id => TransactionLog.selectWatermark(watermarks, id)) || []
	);
	export const watermark = createSelector([rawWatermarks, idInputSelector], (watermarks, id) =>
		TransactionLog.selectWatermark(watermarks, id)
	);

	export const watermarkElements = createSelector(
		[watermark, rawPrintModelElements],
		(watermark, printModelElements) =>
			watermark.elementReferences?.map(ref =>
				TransactionLog.selectPrintModelElement(printModelElements, ref.refId || "")
			) || []
	);

	export const textStyles = createSelector(
		[rawTextStyles, printContentGeneral],
		(textStyles, printContentGeneral) =>
			printContentGeneral.textStyles?.map(textStyleId =>
				TransactionLog.selectTextStyle(textStyles, textStyleId)
			) || []
	);
	export const defaultTextStyle = createSelector(printEditorState, editorState => editorState.defaultTextStyle);

	export const fonts = createSelector(printEditorState, editorState => editorState.fonts);

	export const textStyle = createSelector(
		[defaultTextStyle, rawTextStyles, idInputSelector],
		(defaultTextStyleValue, textStyles, id) => {
			if (id === DEFAULT_TEXT_STYLE_ID) {
				return defaultTextStyleValue;
			}
			if (id === TEXT_STYLE.NO_TEXT_STYLE_FALLBACK_ID) {
				return NO_TEXT_STYLE_FALLBACK;
			}
			return TransactionLog.selectTextStyle(textStyles, id);
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
		(printModelElements, ids) => ids.map(id => TransactionLog.selectPrintModelElement(printModelElements, id))
	);

	export const printModelElements = createSelector([rawPrintModelElements], printModelElements =>
		Object.keys(printModelElements).map(printModelId =>
			TransactionLog.selectPrintModelElement(printModelElements, printModelId)
		)
	);

	export const printModelIdByReferenceElementId = createSelector(
		[segmentReferences, idInputSelector],
		(segmentReferences, referenceElementId) =>
			segmentReferences.find(segmentReference => segmentReference.id === referenceElementId)?.referenceModel
	);

	// builder computed values
	export const currentSegment = createSelector([state, printModelRefs], (state, { segmentId }) => {
		return segmentId ? segment(state, segmentId) : undefined;
	});
	export const wrapperDataContext = createSelector(
		[printModelRefs, currentSegment, wrappers],
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
		[printModelRefs, currentSegment, wrappers],
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
	export const currentSection = createSelector([state, printModelRefs], (state, { sectionId }) => {
		return sectionId ? section(state, sectionId) : undefined;
	});
	export const currentWatermark = createSelector([state, printModelRefs], (state, { watermarkId }) => {
		return watermarkId ? watermark(state, watermarkId) : undefined;
	});
	export const detailPrintModelElement = createSelector(
		[rawPrintModelElements, detailDataRefId],
		(rawPrintModelElements, refId) => {
			return refId ? TransactionLog.selectPrintModelElement(rawPrintModelElements, refId) : undefined;
		}
	);

	export const textEntityElement = createSelector(
		[rawPrintModelElements, additionalData],
		(rawPrintElements, additionalData) => {
			const refId = additionalData?.text?.refId;
			return refId ? TransactionLog.selectPrintModelElement(rawPrintElements, refId) : undefined;
		}
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

	export const isEditorActive = createSelector(printModelRefs, printModelRefs => {
		const { sectionId, segmentId, watermarkId, currentRefType } = printModelRefs;
		return (
			(currentRefType === SidebarItem.SEGMENT && segmentId) ||
			(currentRefType === SidebarItem.SECTION && sectionId) ||
			(currentRefType === SidebarItem.WATERMARK && watermarkId)
		);
	});

	export const elementReferences = createSelector(
		[
			printModelRefs,
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
		[printModelRefs, currentSegment, currentSection, currentWatermark],
		({ currentRefType }, currentSegment, currentSection, currentWatermark) => {
			if (currentRefType === SidebarItem.SEGMENT) {
				return currentSegment;
			} else if (currentRefType === SidebarItem.SECTION) {
				return currentSection;
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
		(state, container, wrapper) => {
			return wrapper ? getElementReferences(wrapper) : container?.elementReferences;
		}
	);

	export const currentContainerPrintModelElements = createSelector(
		[state, currentContainerElementReferences],
		(state, currentContainerElementReferences) => {
			return currentContainerElementReferences?.map(ref => printModelElement(state, ref.refId));
		}
	);

	export const isAnyOverrideSelected = createSelector(
		[currentContainerPrintModelElements, (_: unknown, selected: string[]) => selected],
		(printModelElements, selected) => {
			return selected.some(id => printModelElements?.find(el => el.id === id && PartialOverride.isInstance(el)));
		}
	);

	export const hasOnlyContainerElement = createSelector(
		[currentContainerPrintModelElements, (_: unknown, selected: string[]) => selected],
		(printModelElements, selected) => {
			return (
				selected.length === 1 &&
				!!printModelElements?.find(
					el =>
						el.id === selected[0] &&
						(PartialOverride.isInstance(el) ||
							PartialArea.isInstance(el) ||
							PartialBoundingBox.isInstance(el) ||
							PartialSwitch.isInstance(el))
				)
			);
		}
	);

	export const currentPageOrientation = createSelector(
		[printModelRefs, currentSegment, currentSection, currentWatermark],
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

	export const editorDimensions = createSelector([currentPageOrientation, wrappers], (pageContainer, wrappers) => {
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
	});

	export const elementsAffectedByTextStyleChange = createSelector(
		[segments, sections, watermarks, rawPrintModelElements, idInputSelector],
		(allSegments, allSections, allWatermarks, rawElements, textStyleId) => {
			return [...allSegments, ...allSections, ...allWatermarks].reduce<HeightChangeMap>(
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
						.filter(el => isTextStyleUsed(el.element, textStyleId, rawElements));
					if (filteredPlaceablesWithElement?.length) {
						containerMap[container.id] = filteredPlaceablesWithElement;
					}
					return res;
				},
				{ segmentsMap: {}, sectionsMap: {}, watermarksMap: {}, wrapperMap: {} }
			);
		}
	);

	export const isIncomingDinTemplatePrintModel = createSelector(
		[segmentReferences, printModelRefs],
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
		header => sortBy(header?.modelReferences || [], ["reference"]) as ModelReference[]
	);
	export const documentModelReferences = createSelector([modelReferences], modelReferences =>
		modelReferences.filter(reference => reference.modelType === "document")
	);
	export const printModelReferences = createSelector([modelReferences], modelReferences =>
		modelReferences.filter(reference => reference.modelType === "print")
	);

	export const typesettingModelReferences = createSelector([modelReferences], modelReferences =>
		modelReferences.filter(reference => reference.modelType === "typesetting")
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
			sidebar,
			interactionLogState,
			currentDetailDataId,
			currentDetailData,
			selectedTextStyleId,
			editorMode,
			currentWrapperContainer,
		],
		(
			sidebarState,
			interactionState,
			curContainerId,
			curDetailData,
			selectedTextStyleId,
			editorMode,
			wrapperElement
		) => {
			const fullLogEntryList: UndoInteractionLogEntry[] = [];
			const { isFullscreen, isOpen, selectedItem } = sidebarState;

			function handleSideContentFullscreen() {
				if (selectedItem === SidebarItem.TEXT_STYLES) {
					fullLogEntryList.push(
						...(interactionState.textStyles[selectedTextStyleId]?.map(entry => ({
							...entry,
							region: SidebarRegion.TEXT_STYLES as InteractionRegion,
							regionId: selectedTextStyleId,
						})) || [])
					);
				}
				fullLogEntryList.push(
					...interactionState.sidebar[selectedItem].map(entry => ({
						...entry,
						region: GlobalRegion.SIDEBAR as InteractionRegion,
						regionId: selectedItem,
					}))
				);
			}

			function handleSidebarOpen() {
				fullLogEntryList.push(
					...interactionState.sidebar[selectedItem].map(entry => ({
						...entry,
						region: GlobalRegion.SIDEBAR as InteractionRegion,
						regionId: selectedItem,
					}))
				);
			}

			function handleCurrentContainer() {
				const { isFullScreenForm, refId, formContainers, subFormContainer, placeableRefId } =
					curDetailData || {};
				const isFormOpen = Object.values(curDetailData?.isFormOpen || {}).filter(Boolean).length > 0;

				const currentFormContainer = formContainers?.slice()?.pop();
				const formRegion = subFormContainer || currentFormContainer;

				const isSwitchStage = wrapperElement && PartialSwitch.isInstance(wrapperElement);
				const isStageOpen = !isFullScreenForm || !isFormOpen;

				if (isSwitchStage) {
					fullLogEntryList.push(
						...(interactionState.switchStage[wrapperElement.id] || []).map(entry => ({
							...entry,
							region: StageRegion.SWITCH as InteractionRegion,
							regionId: wrapperElement.id,
						}))
					);
				} else if (isStageOpen) {
					const stageRegion = STAGE_REGION_MAP[editorMode] as StageRegion.RegionKeys;
					fullLogEntryList.push(
						...(interactionState[stageRegion][curContainerId] || []).map(entry => ({
							...entry,
							region: stageRegion as InteractionRegion,
							regionId: curContainerId,
						}))
					);
				}

				if (isFormOpen && [EditorMode.Default, EditorMode.Layout].includes(editorMode)) {
					const regionId =
						refId && formRegion ? getRegionId(formRegion, refId, curDetailData) : placeableRefId || "";
					const tempFormRegion = formRegion || GlobalRegion.FORM;

					fullLogEntryList.push(
						...(interactionState[tempFormRegion][regionId] || []).map(entry => ({
							...entry,
							region: tempFormRegion,
							regionId,
						}))
					);
				}
			}

			if (FULLSCREEN_TABS.includes(selectedItem) || (isOpen && isFullscreen)) {
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
		.filter(el => isTextStyleUsed(el.element, textStyleId, rawElements));
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
		if (PartialArea.isInstance(area) && area.area?.elementReferences) {
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
				const textElement = TransactionLog.selectPrintModelElement(rawElements, cell.refId || "");
				return (textElement as Text).textProperties?.textStyleId?.value === textStyleId;
			});
		case ElementType.Table:
			return element.table?.headerTextProperties?.textStyleId?.value === textStyleId;
		case ElementType.Listing:
			return element.listing?.headerTextProperties?.textStyleId?.value === textStyleId;
		default:
			return "textProperties" in element && element.textProperties?.textStyleId?.value === textStyleId;
	}
}

function getRegionId(region: InteractionRegion, refId: string, currentDetailData?: DetailData) {
	let regionId;

	switch (region) {
		case ListingRegion.LISTING_COLUMN_FORM:
		case ListingRegion.FIELD_COMPUTATION_FORM:
		case ListingRegion.PROPERTY_COMPUTATION_FORM:
			regionId = getListingRegionId(region, currentDetailData);
			break;
		case TableRegion.TABLE_COLUMN_FORM:
			regionId = getTableRegionId(currentDetailData);
			break;
		case TextRegion.TEXT_FROM_FIELD:
		case TextRegion.TEXT_FROM_CALCULATION:
			if (!currentDetailData?.additionalData?.text?.refId) {
				throw new Error("Text region id does not exist");
			}
			regionId = currentDetailData?.additionalData?.text?.refId;
			break;
		default:
			regionId = refId;
			break;
	}

	return regionId;
}
