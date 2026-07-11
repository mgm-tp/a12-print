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

import { LoggerFactory } from "@com.mgmtp.a12.utils/utils-logging";
import type {
	PrintModel,
	PrintModelElement,
	Reference,
	Section,
	Segment,
	Watermark,
} from "@com.mgmtp.a12.print/print-model-api/model";
import {
	ElementType,
	PartialArea,
	PartialBoundingBox,
	PartialOverride,
	PartialSwitch,
	PartialTable,
	PartialTableLayout,
	PartialText,
} from "@com.mgmtp.a12.print/print-model-api/model";
import type { DeepPartial } from "@com.mgmtp.a12.print/print-model-api/utils";

const log = LoggerFactory.getLogger("PrintModelGarbageCollector");

export namespace PrintModelGarbageCollector {
	export function clean(printModel: PrintModel, isClean: boolean = false): PrintModel {
		return filterOverridePlaceables(filterUnusedObjects(printModel, isClean));
	}

	/**
	 * Unused objects happen through deletion and undo in the Print Model Editor.
	 */
	export function filterUnusedObjects(printModel: PrintModel, isClean: boolean = false): PrintModel {
		const content = printModel.content;
		const { general, segments, sections, watermarks, textStyles, elementDefinitions } = content;
		const usedSegments = segments.definitions.filter(segment => general.structure.includes(segment.id));
		const usedSections = sections?.definitions.filter(section => general.sections?.includes(section.id));
		const usedWatermarks = watermarks?.definitions.filter(watermark => general.watermarks?.includes(watermark.id));
		const usedTextStyles = textStyles?.definitions.filter(textStyle => general.textStyles?.includes(textStyle.id));
		const usedElements = filterUnusedElements(
			elementDefinitions,
			usedSegments,
			usedSections,
			usedWatermarks,
			isClean
		);

		return {
			...printModel,
			content: {
				...content,
				segments: { ...content.segments, definitions: usedSegments },
				sections: usedSections
					? { ...(content.sections || { id: nanoid(), definitions: [] }), definitions: usedSections }
					: undefined,
				watermarks: usedWatermarks
					? { ...(content.watermarks || { id: nanoid(), definitions: [] }), definitions: usedWatermarks }
					: undefined,
				textStyles: usedTextStyles
					? { ...(content.textStyles || { id: nanoid(), definitions: [] }), definitions: usedTextStyles }
					: undefined,
				elementDefinitions: usedElements,
			},
		};
	}

	/**
	 * Overrides are still part of the model. This only removes the placeables. They are added on the initialization
	 * of the print model editor.
	 */
	export function filterOverridePlaceables(printModel: PrintModel): PrintModel {
		const filteredElementIds: string[] = [];
		const filteredElements = printModel.content.elementDefinitions.map(element => {
			if (!PartialOverride.isInstance(element)) {
				return element;
			}
			const elementReferences = (element.override?.boundingBox?.elementReferences || []).filter(ref => {
				if (ref.refId) {
					return (
						printModel.content.elementDefinitions.find(e => e.id === ref.refId)?.type !==
						ElementType.Override
					);
				}
				return true;
			});
			filteredElementIds.push(element.id);
			return {
				...element,
				override: {
					...element.override,
					boundingBox: {
						...element?.override?.boundingBox,
						elementReferences,
					},
				},
			};
		});

		return {
			...printModel,
			content: {
				...printModel.content,
				elementDefinitions: filteredElements,
				segments: {
					...printModel.content.segments,
					definitions: printModel.content.segments.definitions.map(segment => ({
						...segment,
						elementReferences: segment.elementReferences?.filter(
							ref => !filteredElementIds.includes(ref.refId)
						),
					})),
				},
			},
		};
	}
}

function filterUnusedElements(
	elementDefinitions: ReadonlyArray<PrintModelElement>,
	segments: ReadonlyArray<Segment>,
	sections: ReadonlyArray<Section> = [],
	watermarks: ReadonlyArray<Watermark> = [],
	isClean: boolean = false
): PrintModelElement[] {
	const usedElementIds = new Set<string>();
	const containers = [...segments, ...sections, ...watermarks];
	for (const container of containers) {
		if (!container.elementReferences) {
			continue;
		}
		for (const placeable of container.elementReferences) {
			const element = elementDefinitions.find(el => el.id === placeable.refId);
			if (!element) {
				log.error(`Element with id ${placeable.refId} does not exist`);
				continue;
			}
			usedElementIds.add(element.id);
			getNestedElements(element, elementDefinitions, usedElementIds);
		}
	}
	if (isClean) {
		const overrides = elementDefinitions.filter(PartialOverride.isInstance);
		for (const override of overrides) {
			usedElementIds.add(override.id);
			getNestedElements(override, elementDefinitions, usedElementIds);
		}
	}

	return elementDefinitions.filter(el => usedElementIds.has(el.id));
}

function getNestedElements(
	element: PrintModelElement,
	elementDefinitions: ReadonlyArray<PrintModelElement>,
	usedElementIds: Set<string>
): void {
	let elementReferences: ReadonlyArray<DeepPartial<Reference>> = [];
	if (PartialText.isInstance(element)) {
		elementReferences = element.text?.entities || [];
	} else if (PartialTableLayout.isInstance(element)) {
		elementReferences = element.tableLayout?.cells || [];
	} else if (PartialTable.isInstance(element)) {
		elementReferences = element.table?.columns || [];
	} else if (PartialBoundingBox.isInstance(element)) {
		elementReferences = element.boundingBox?.elementReferences || [];
	} else if (PartialOverride.isInstance(element)) {
		elementReferences = element.override?.boundingBox?.elementReferences || [];
	} else if (PartialArea.isInstance(element)) {
		elementReferences = element.area?.elementReferences || [];
	} else if (PartialSwitch.isInstance(element)) {
		elementReferences = element.switch?.cases || [];
	}
	for (const ref of elementReferences) {
		const nestedElement = elementDefinitions.find(el => el.id === ref.refId);
		if (!nestedElement) {
			log.error(`Element with id ${ref.refId} does not exist`);
			continue;
		}
		usedElementIds.add(nestedElement.id);
		getNestedElements(nestedElement, elementDefinitions, usedElementIds);
	}
}
