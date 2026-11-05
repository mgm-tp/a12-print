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
import { nanoid } from "nanoid";

import {
	isSection,
	isSegment,
	isTextStyle,
	isWatermark,
	type PrintModel,
	type Section,
	type Segment,
	SegmentReferencePurpose,
	type TextStyle,
	type Watermark,
	type PrintModelElement,
} from "../../model/index.js";
import { PRINT_MODEL_CONTENT_GENERAL_LOG_ID, PRINT_MODEL_CONTENT_LOG_ID } from "../../model/constant.js";

import { type CloneContext } from "./type.js";
import { clonePrintModelEntity, deepCloneObject, dropDuplicateElements } from "./base.js";
import { cloneTextStyles } from "./text-style.js";
import { cloneSegments } from "./segment.js";
import { cloneSections } from "./section.js";
import { cloneWatermarks } from "./watermark.js";
import { cloneFragmentElements } from "./fragment.js";

export const ERROR_FORBID_COPY_DIN_REFERENCE = "FORBID_COPY_DIN_REFERENCE";
export const ERROR_FORBID_COPY_FRAGMENT_MODEL = "FORBID_COPY_FRAGMENT_MODEL";
export const ERROR_FORBID_COPY_FRAGMENT_REFERENCE = "FORBID_COPY_FRAGMENT_REFERENCE";
export const ERROR_FORBID_COPY_MULTIPLE_DOCUMENT_REFERENCES = "FORBID_COPY_MULTIPLE_DOCUMENT_REFERENCES";

/**
 * Creates a deep copy of a print model. Note that all ids and references will be newly generated. DinTemplate print models are not allowed to be copied.
 */
export function clonePrintModel(printModel: PrintModel, printModelId?: string): PrintModel {
	if (
		printModel.header.modelReferences?.some(reference => reference.purpose === SegmentReferencePurpose.DINTemplate)
	) {
		throw new Error(ERROR_FORBID_COPY_DIN_REFERENCE);
	}

	const elementDefinitionMap = new Map<string, PrintModelElement>();

	const { textStyles, segments, sections, watermarks, elementDefinitions, general } = printModel.content;
	elementDefinitions.forEach(element => {
		elementDefinitionMap.set(element.id, element);
	});
	const clonedElementDefinitions: PrintModelElement[] = [];

	const { newTextStyles, clonedTextStyles, clonedTextStyleReferences, textStyleIdMap } = cloneTextStyles(
		general.textStyles || [],
		textStyles?.definitions || [],
		textStyles?.references || []
	);

	assertArrayType<TextStyle>(clonedTextStyles, isTextStyle, "The textstyles are not invalid");

	const cloneContext: CloneContext = {
		getElement: elementId => elementDefinitionMap.get(elementId),
		cloneObject: clonePrintModelEntity,
		textStyleIdMap,
		// an element can inherit from one that is cloned later, so every element gets its new id up front
		elementIdMap: new Map(elementDefinitions.map(element => [element.id, nanoid()])),
		clonedElements: new Map(),
	};

	const {
		clonedElements: clonedSegmentElements,
		newStructure,
		clonedSegments,
		clonedFragmentReferences,
	} = cloneSegments(
		general.structure || [],
		segments?.definitions || [],
		cloneContext,
		undefined,
		segments?.fragmentReferences || []
	);

	assertArrayType<Segment>(clonedSegments, isSegment, "The segments are not invalid");

	const {
		clonedElements: clonedSectionElements,
		clonedSections,
		newSections,
		clonedSectionReferences,
	} = cloneSections(
		general.sections || [],
		sections?.definitions || [],
		cloneContext,
		undefined,
		sections?.references || []
	);

	assertArrayType<Section>(clonedSections, isSection, "The sections are not invalid");

	const {
		clonedElements: clonedWatermarkElements,
		clonedWatermarks,
		newWatermarks,
		clonedWatermarkReferences,
	} = cloneWatermarks(
		general.watermarks || [],
		watermarks?.definitions || [],
		cloneContext,
		undefined,
		watermarks?.references || []
	);

	assertArrayType<Watermark>(clonedWatermarks, isWatermark, "The watermarks are not invalid");

	const { clonedElements: clonedFragmentElements } = cloneFragmentElements(elementDefinitions, cloneContext);

	clonedElementDefinitions.push(
		...clonedSegmentElements,
		...clonedSectionElements,
		...clonedWatermarkElements,
		...clonedFragmentElements
	);

	return {
		header: {
			...deepCloneObject({ target: printModel.header }),
			id: printModelId || `${printModel.header.id}_copy`,
		},
		content: {
			id: PRINT_MODEL_CONTENT_LOG_ID,
			general: {
				...clonePrintModelEntity(general),
				structure: newStructure,
				textStyles: newTextStyles,
				sections: newSections,
				watermarks: newWatermarks,
				id: PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
			},
			segments: {
				references: [],
				fragmentReferences: clonedFragmentReferences,
				definitions: clonedSegments,
				id: nanoid(),
			},
			sections: {
				definitions: clonedSections,
				references: clonedSectionReferences,
				id: nanoid(),
			},
			watermarks: {
				definitions: clonedWatermarks,
				references: clonedWatermarkReferences,
				id: nanoid(),
			},
			textStyles: {
				definitions: clonedTextStyles,
				references: clonedTextStyleReferences,
				id: nanoid(),
			},
			elementDefinitions: dropDuplicateElements(clonedElementDefinitions),
		},
	};
}

function assertArrayType<T extends object>(
	array: object[],
	typeGuard: (value: object) => boolean,
	errorMessage: string
): asserts array is T[] {
	const check = array.every(typeGuard);
	if (!check) {
		throw Error(errorMessage);
	}
}
