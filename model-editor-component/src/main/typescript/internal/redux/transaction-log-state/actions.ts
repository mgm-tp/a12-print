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
import type { PayloadAction, UnknownAction } from "@reduxjs/toolkit";

import type {
	InteractionLogEntry,
	TransactionLogStore,
	InteractionRegion,
	AffectedItem,
} from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import type {
	FragmentModelReference,
	PartialArea,
	PartialBoundingBox,
	PartialOverride,
	PartialSwitch,
	PartialPrintModelContent,
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
	SectionFragmentReference,
	Segment,
	SegmentReference,
	TextStyle,
	Watermark,
} from "@com.mgmtp.a12.print/print-model-api/model";

import type { DinTemplateSegmentItem } from "../../../internal/components/segments/din-template-segment-item.js";

import type { InteractionLogActions } from "../interaction-log/actions.js";
import { actionCreatorFactory } from "../actionCreatorFactory/actionCreatorFactory.js";

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
	export const addSectionReference =
		factory<WithInteractionData<AddSectionReferencePayload>>("ADD_SECTION_REFERENCE");
	export const removeSectionReference =
		factory<WithInteractionData<RemoveSectionReferencePayload>>("REMOVE_SECTION_REFERENCE");
	export const addWatermarkReference =
		factory<WithInteractionData<AddWatermarkReferencePayload>>("ADD_WATERMARK_REFERENCE");
	export const removeWatermarkReference =
		factory<WithInteractionData<RemoveWatermarkReferencePayload>>("REMOVE_WATERMARK_REFERENCE");
	export const addSegmentReference =
		factory<WithInteractionData<AddSegmentReferencePayload>>("ADD_SEGMENT_REFERENCE");
	export const addSegmentFragmentReference = factory<WithInteractionData<AddSegmentFragmentReferencePayload>>(
		"ADD_SEGMENT_FRAGMENT_REFERENCE"
	);
	export const removeSegmentFragmentReference = factory<WithInteractionData<RemoveSegmentFragmentReferencePayload>>(
		"REMOVE_SEGMENT_FRAGMENT_REFERENCE"
	);
	export const addTextStyleReference =
		factory<WithInteractionData<AddTextStyleReferencePayload>>("ADD_TEXT_STYLE_REFERENCE");
	export const removeTextStyleReference =
		factory<WithInteractionData<RemoveTextStyleReferencePayload>>("REMOVE_TEXT_STYLE_REFERENCE");
	export const unlinkSectionReference =
		factory<WithInteractionData<UnlinkSectionReferencePayload>>("UNLINK_SECTION_REFERENCE");
	export const unlinkSegmentFragmentReference = factory<WithInteractionData<UnlinkSegmentFragmentReferencePayload>>(
		"UNLINK_SEGMENT_FRAGMENT_REFERENCE"
	);
	export const unlinkWatermarkReference =
		factory<WithInteractionData<UnlinkWatermarkReferencePayload>>("UNLINK_WATERMARK_REFERENCE");
	export const unlinkTextStyleReference =
		factory<WithInteractionData<UnlinkTextStyleReferencePayload>>("UNLINK_TEXT_STYLE_REFERENCE");
	export const unlinkElementReference =
		factory<WithInteractionData<UnlinkElementReferencePayload>>("UNLINK_ELEMENT_REFERENCE");
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
	export const duplicateSection = factory<WithInteractionData<PartialSection>>("DUPLICATE_SECTION");
	export const duplicateWatermark = factory<WithInteractionData<PartialWatermark>>("DUPLICATE_WATERMARK");
	export const duplicatePrintModelElement = factory<WithInteractionData<PartialAnyPrintModelElement>>(
		"DUPLICATE_PRINT_MODEL_ELEMENT"
	);
	export const removeTextStyle = factory<WithInteractionData<RemoveEntryPayload>>("REMOVE_TEXT_STYLE");
	export const removeSegment = factory<WithInteractionData<RemoveEntryPayload>>("REMOVE_SEGMENT");
	export const removeSection = factory<WithInteractionData<RemoveEntryPayload>>("REMOVE_SECTION");
	export const removeWatermark = factory<WithInteractionData<RemoveEntryPayload>>("REMOVE_WATERMARK");
	export const removeFragmentModelElement =
		factory<WithInteractionData<RemoveEntryPayload>>("REMOVE_PRINT_MODEL_ELEMENT");
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
	export type AddSegmentFragmentReferencePayload = FragmentModelReference;
	export interface RemoveSegmentFragmentReferencePayload {
		id: string;
	}
	export type AddSectionPayload = Section | PartialSection;
	export type AddWatermarkPayload = Watermark | PartialWatermark;
	export type AddSectionReferencePayload = SectionFragmentReference;
	export interface RemoveSectionReferencePayload {
		id: string;
	}
	export type AddWatermarkReferencePayload = FragmentModelReference;
	export interface RemoveWatermarkReferencePayload {
		id: string;
	}
	export type AddTextStyleReferencePayload = FragmentModelReference;
	export interface RemoveTextStyleReferencePayload {
		id: string;
	}
	export type AddTextStylePayload = TextStyle | PartialTextStyle;
	export interface UnlinkReferencePayloadBase {
		referenceId: string;
		fragmentContent: PartialPrintModelContent;
	}
	export type UnlinkSectionReferencePayload = UnlinkReferencePayloadBase;
	export type UnlinkSegmentFragmentReferencePayload = UnlinkReferencePayloadBase;
	export type UnlinkWatermarkReferencePayload = UnlinkReferencePayloadBase;
	export type UnlinkTextStyleReferencePayload = UnlinkReferencePayloadBase;
	export type UnlinkElementReferencePayload = UnlinkReferencePayloadBase;
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

export type AnyTransactionLogAction = PayloadAction<WithInteractionData<object>>;
export type ValidAnyTransactionLogAction = PayloadAction<Required<WithInteractionData<object>>>;

export type UpdateElementsTransactionLogAction = PayloadAction<
	WithInteractionData<TransactionLogStateActions.UpdatePrintModelElementsPayload | PartialValidPlaceableReference[]>
>;

export const TransactionLogStateActionCreators = Object.entries(TransactionLogStateActions)
	.filter(([key]) => key !== "setLogStore") // do not include the setLogStore action
	.map(([, value]) => value);

export function isTransactionLogStateAction(action: UnknownAction): action is AnyTransactionLogAction {
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
