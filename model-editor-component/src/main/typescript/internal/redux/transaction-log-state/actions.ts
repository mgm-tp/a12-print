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
import { Action, AnyAction, actionCreatorFactory } from "typescript-fsa";

import {
	InteractionLogEntry,
	TransactionLogStore,
	InteractionRegion,
	AffectedItem,
} from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/index.js";
import {
	PartialArea,
	PartialBoundingBox,
	PartialOverride,
	PartialSwitch,
	PartialPrintModelContentGeneral,
	PartialPrintModelHeader,
	PartialSection,
	PartialSegment,
	PartialSegmentReference,
	PartialTextStyle,
	PartialValidPlaceableReference,
	PartialWatermark,
	AnyPrintModelElement,
	PartialAnyPrintModelElement,
	PrintModelContentGeneral,
	PrintModelHeader,
	Section,
	Segment,
	SegmentReference,
	TextStyle,
	Watermark,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

import { DinTemplateSegmentItem } from "../../components/segments/din-template-segment-item.js";

import { InteractionLogActions } from "../interaction-log/actions.js";

const factory = actionCreatorFactory("Print/TransactionLogState");

export type WithInteractionData<T extends object> = { data: T } & {
	interactionId?: string;
	region?: InteractionRegion;
	regionId?: string;
	affectedItems?: AffectedItem[];
};

export namespace TransactionLogStateActions {
	export const setLogStore = factory<TransactionLogStore>("SET_LOG_STORE");

	export const addSegment = factory<WithInteractionData<AddSegmentPayload>>("ADD_SEGMENT");
	export const addReferenceSegment =
		factory<WithInteractionData<AddReferenceSegmentPayload>>("ADD_REFERENCE_SEGMENT");
	export const addSection = factory<WithInteractionData<AddSectionPayload>>("ADD_SECTION");
	export const addWatermark = factory<WithInteractionData<AddWatermarkPayload>>("ADD_WATERMARK");
	export const addSegmentReference =
		factory<WithInteractionData<AddSegmentReferencePayload>>("ADD_SEGMENT_REFERENCE");
	export const addTextStyle = factory<WithInteractionData<AddTextStylePayload>>("ADD_TEXT_STYLE");
	export const updatePrintHeader = factory<WithInteractionData<UpdatePrintHeaderPayload>>("UPDATE_PRINT_HEADER");
	export const updatePrintContentGeneral =
		factory<WithInteractionData<UpdatePrintContentGeneralPayload>>("UPDATE_PRINT_CONTENT_GENERAL");
	export const updateSegment = factory<WithInteractionData<UpdateSegmentPayload>>("UPDATE_SEGMENT");
	export const updateSegments = factory<WithInteractionData<UpdateSegmentPayload[]>>("UPDATE_SEGMENTS");
	export const updateSection = factory<WithInteractionData<UpdateSectionPayload>>("UPDATE_SECTION");
	export const updateWatermark = factory<WithInteractionData<UpdateWatermarkPayload>>("UPDATE_WATERMARK");
	export const updateTextStyle = factory<WithInteractionData<UpdateTextStylePayload>>("UPDATE_TEXT_STYLE");
	export const reorderStructure = factory<WithInteractionData<ReorderStructurePayload>>("REORDER_STRUCTURE");
	export const moveTextStyle = factory<WithInteractionData<ReorderStructurePayload>>("MOVE_TEXT_STYLE");
	export const updatePrintModelElements =
		factory<WithInteractionData<UpdatePrintModelElementsPayload>>("UPDATE_PRINT_MODEL_ELEMENT");
	export const updateBoundingBox = factory<WithInteractionData<PartialBoundingBox>>(
		"UPDATE_PRINT_MODEL_BOUNDING_BOX"
	);
	export const updateOverride = factory<WithInteractionData<PartialOverride>>("UPDATE_PRINT_MODEL_OVERRIDE");
	export const updateArea = factory<WithInteractionData<PartialArea>>("UPDATE_PRINT_MODEL_AREA");
	export const updateSwitch = factory<WithInteractionData<PartialSwitch>>("UPDATE_PRINT_MODEL_SWITCH");
	export const duplicateSegment = factory<WithInteractionData<PartialSegment>>("DUPLICATE_SEGMENT");
	export const removeTextStyle = factory<WithInteractionData<RemoveEntryPayload>>("REMOVE_TEXT_STYLE");
	export const removeSegment = factory<WithInteractionData<RemoveEntryPayload>>("REMOVE_SEGMENT");
	export const removeSection = factory<WithInteractionData<RemoveEntryPayload>>("REMOVE_SECTION");
	export const removeWatermark = factory<WithInteractionData<RemoveEntryPayload>>("REMOVE_WATERMARK");
	export const copyPrintModelElements =
		factory<WithInteractionData<CopyPrintModelElementsPayload>>("COPY_PRINT_MODEL_ELEMENTS");
	export const updateReferenceContainer =
		factory<WithInteractionData<UpdateReferenceContainer>>("UPDATE_REFERENCE_CONTAINER");
	export const updateReferenceElements =
		factory<WithInteractionData<PartialValidPlaceableReference[]>>("UPDATE_REFERENCE_ELEMENTS");
	export const updateReferenceElement =
		factory<WithInteractionData<PartialValidPlaceableReference>>("UPDATE_REFERENCE_ELEMENT");
	export const undo = factory<WithInteractionData<UndoPayload>>("UNDO");
	export const redo = factory<WithInteractionData<RedoPayload>>("REDO");
	export const updateElementHeightsTextStyle = factory<
		WithInteractionData<InteractionLogActions.UpdateElementHeightTextStylePayload>
	>("UPDATE_ELEMENT_HEIGHTS_TEXT_STYLE");
	export const syncOverrides = factory<WithInteractionData<SyncOverridesPayload>>("SYNC_OVERRIDES");

	export interface UndoPayload {
		interactionToUndo: InteractionLogEntry;
	}

	export interface RedoPayload {
		interactionToRedo: InteractionLogEntry;
		interactionToRestore: InteractionLogEntry;
	}

	export type UpdateReferenceContainer = PartialSegment | PartialSection;
	export type UpdatePrintModelElementsPayload = (PartialAnyPrintModelElement | AnyPrintModelElement)[];
	export type AddSegmentPayload = Segment | PartialSegment;
	export type AddReferenceSegmentPayload = {
		segment: Segment | PartialSegment;
		dinTemplateSegmentItem: DinTemplateSegmentItem;
	};
	export type AddSegmentReferencePayload = SegmentReference | PartialSegmentReference;
	export type AddSectionPayload = Section | PartialSection;
	export type AddWatermarkPayload = Watermark | PartialWatermark;
	export type AddTextStylePayload = TextStyle | PartialTextStyle;
	export type UpdatePrintHeaderPayload = PrintModelHeader | PartialPrintModelHeader;
	export type UpdatePrintContentGeneralPayload = PrintModelContentGeneral | PartialPrintModelContentGeneral;
	export type UpdateSegmentPayload = Segment | PartialSegment;
	export type UpdateSectionPayload = Section | PartialSection;
	export type UpdateWatermarkPayload = Watermark | PartialWatermark;
	export type UpdateTextStylePayload = TextStyle | PartialTextStyle;

	export interface ReorderStructurePayload {
		currentIndex: number;
		targetIndex: number;
	}

	export interface RemoveEntryPayload {
		id: string;
	}

	export interface CopyPrintModelElementsPayload {
		referenceIdMap?: Map<string, string>;
		newReferenceElements: PartialValidPlaceableReference[];
		copyElementIdsList: CopyElementIds[];
	}

	export interface CopyElementIds {
		copyId: string;
		newId: string;
	}

	export interface SyncOverridesPayload {
		updatedOverrides: PartialOverride[];
		newOverrides: PartialOverride[];
		deletedOverrides: PartialOverride[];
	}
}

export type AnyTransactionLogAction = Action<WithInteractionData<object>>;
export type ValidAnyTransactionLogAction = Action<Required<WithInteractionData<object>>>;

export type UpdateElementsTransactionLogAction = Action<
	WithInteractionData<TransactionLogStateActions.UpdatePrintModelElementsPayload | PartialValidPlaceableReference[]>
>;

export const TransactionLogStateActionCreators = Object.entries(TransactionLogStateActions)
	.filter(([key]) => key !== "setLogStore") // do not include the setLogStore action
	.map(([, value]) => value);

export function isTransactionLogStateAction(action: AnyAction): action is AnyTransactionLogAction {
	return TransactionLogStateActionCreators.some(actionCreator => actionCreator.match(action));
}

export function isValidAnyTransactionLogAction(
	action: AnyTransactionLogAction
): action is ValidAnyTransactionLogAction {
	return (
		action.payload.interactionId !== undefined &&
		action.payload.region !== undefined &&
		action.payload.regionId !== undefined
	);
}
