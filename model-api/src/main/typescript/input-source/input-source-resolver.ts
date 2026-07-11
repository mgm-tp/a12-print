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
import get from "lodash/get.js";

import { LoggerFactory } from "@com.mgmtp.a12.utils/utils-logging";

import {
	type InputSource,
	isInputSource,
	isPartialSection,
	isPartialSegment,
	isPartialWatermark,
	PartialArea,
	PartialBarChart,
	PartialBoundingBox,
	PartialLineChart,
	PartialListing,
	PartialOverride,
	PartialPieChart,
	PartialTable,
	PartialTableLayout,
	PrintModelElement,
	type PrintModelEntity,
} from "../model/index.js";
import {
	isMetadataInstance,
	PRINT_MODEL_METADATA_MAP,
	type PrintEntityMetadata,
} from "../generated/print-model-metadata-map.js";
import { type DeepPartialRecursive } from "../utils/type-utils.js";

import { PossibleInputSource } from "./input-source.js";

const logger = LoggerFactory.getLogger("InputValueSourceResolver");

export interface InputSourceMetadata {
	path: string;
	possibleInputSources: PossibleInputSource[];
}

export interface InheritedValueResolver<T> {
	(
		inputSource: DeepPartialRecursive<InputSource<T>> | undefined,
		element: PrintModelEntity,
		property: string
	): T | undefined;
}

export class InputValueSourceResolver {
	public static getInputSourceMetadata(
		element: PrintModelEntity,
		property: string,
		determineInheritedSource?: (element: PrintModelEntity, inheritedCondition: string) => boolean,
		determineRequiredSource?: (element: PrintModelEntity, requiredCondition: string) => boolean
	): InputSourceMetadata {
		const sources: PossibleInputSource[] = [];
		const metadata = InputValueSourceResolver.getMetadata(element, property);

		if (metadata) {
			sources.push(PossibleInputSource.INPUT);

			const inheritSource = InputValueSourceResolver.resolveInheritSource(
				element,
				metadata,
				determineInheritedSource
			);

			if (inheritSource) {
				sources.push(inheritSource);
			}

			const isActuallyRequired = InputValueSourceResolver.resolveRequiredSource(
				element,
				metadata,
				determineRequiredSource
			);

			if (!isActuallyRequired) {
				sources.push(PossibleInputSource.UNSET);
			}

			if (metadata.defaultValue) {
				sources.push(PossibleInputSource.DEFAULT);
			}
		} else {
			throw new Error("The requested property has no metadata information");
		}

		return {
			path: metadata.path,
			possibleInputSources: sources,
		};
	}
	public static getSourceInputValue<T>(
		inputSource: DeepPartialRecursive<InputSource<T>> | undefined,
		element: PrintModelEntity,
		property: string,
		convertValue: (value?: string) => T | undefined,
		inheritedValueResolver: InheritedValueResolver<T> = () => undefined
	): T | undefined {
		if (!inputSource) {
			return undefined;
		}

		const { source, value } = inputSource;

		const metadata = InputValueSourceResolver.getMetadata(element, property);

		switch (source) {
			case PossibleInputSource.DEFAULT:
				return metadata ? convertValue(metadata.defaultValue) : undefined;
			case PossibleInputSource.UNSET:
				return undefined;
			case PossibleInputSource.INPUT:
				return value as T;
			case PossibleInputSource.INHERITED:
				return inheritedValueResolver(inputSource, element, property);
			default:
				throw new Error(`Source type: ${source} is invalid`);
		}
	}

	public static hasValueForInputSourceDefault(property: string) {
		const metadata = InputValueSourceResolver.getMetadataByProperty(property);
		return metadata?.defaultValue ? true : false;
	}

	public static getSourceStringValue(
		inputSource: DeepPartialRecursive<InputSource<string>> | undefined,
		element: PrintModelEntity,
		property: string,
		inheritedValueResolver?: InheritedValueResolver<string>
	): string | undefined {
		return this.getSourceInputValue(inputSource, element, property, value => value, inheritedValueResolver);
	}

	public static getSourceNumberValue(
		inputSource: DeepPartialRecursive<InputSource<number>> | undefined,
		element: PrintModelEntity,
		property: string,
		inheritedValueResolver?: InheritedValueResolver<number>
	): number | undefined {
		return this.getSourceInputValue(
			inputSource,
			element,
			property,
			value => (value !== undefined ? parseInt(value) : undefined),
			inheritedValueResolver
		);
	}

	public static getSourceBooleanValue(
		inputSource: DeepPartialRecursive<InputSource<boolean>> | undefined,
		element: PrintModelEntity,
		property: string,
		inheritedValueResolver?: InheritedValueResolver<boolean>
	): boolean | undefined {
		return this.getSourceInputValue(
			inputSource,
			element,
			property,
			value => {
				if (value !== undefined) {
					if (value !== "false" && value !== "true") {
						throw Error("Value is not boolean");
					}
					return value === "true";
				}
				return undefined;
			},
			inheritedValueResolver
		);
	}

	private static getMetadataByProperty(property: string) {
		const inputSourceField = get(PRINT_MODEL_METADATA_MAP.RootGroup.content.elementDefinitions, property);
		if (
			inputSourceField &&
			isInputSource<{
				isRequired: boolean;
				path: string;
				defaultValue?: string;
			}>(inputSourceField)
		) {
			if (inputSourceField.value && isMetadataInstance(inputSourceField.value)) {
				return inputSourceField.value;
			}
		}
		return undefined;
	}

	private static getElementMetadata(element: PrintModelElement, property: string) {
		let inputSourceField = undefined;

		if (property.startsWith("textProperties") || property.startsWith("borderProperties")) {
			inputSourceField = get(PRINT_MODEL_METADATA_MAP.RootGroup.content.elementDefinitions, property);
		} else if (PartialTable.isInstance(element)) {
			inputSourceField = get(PRINT_MODEL_METADATA_MAP.RootGroup.content.elementDefinitions.table, property);
		} else if (PartialTableLayout.isInstance(element)) {
			inputSourceField = get(PRINT_MODEL_METADATA_MAP.RootGroup.content.elementDefinitions.tableLayout, property);
		} else if (PartialListing.isInstance(element)) {
			inputSourceField = get(PRINT_MODEL_METADATA_MAP.RootGroup.content.elementDefinitions.listing, property);
		} else if (PartialBarChart.isInstance(element)) {
			inputSourceField = get(PRINT_MODEL_METADATA_MAP.RootGroup.content.elementDefinitions.barChart, property);
		} else if (PartialLineChart.isInstance(element)) {
			inputSourceField = get(PRINT_MODEL_METADATA_MAP.RootGroup.content.elementDefinitions.lineChart, property);
		} else if (PartialPieChart.isInstance(element)) {
			inputSourceField = get(PRINT_MODEL_METADATA_MAP.RootGroup.content.elementDefinitions.pieChart, property);
		} else if (PartialBoundingBox.isInstance(element)) {
			inputSourceField = get(PRINT_MODEL_METADATA_MAP.RootGroup.content.elementDefinitions.boundingBox, property);
		} else if (PartialArea.isInstance(element)) {
			inputSourceField = get(PRINT_MODEL_METADATA_MAP.RootGroup.content.elementDefinitions.area, property);
		} else if (PartialOverride.isInstance(element)) {
			inputSourceField = get(
				PRINT_MODEL_METADATA_MAP.RootGroup.content.elementDefinitions.override.boundingBox,
				property
			);
		}
		return inputSourceField;
	}

	private static getSegmentMetadata(property: string) {
		return get(PRINT_MODEL_METADATA_MAP.RootGroup.content.segments.definitions, property);
	}

	private static getSectionMetadata(property: string) {
		return get(PRINT_MODEL_METADATA_MAP.RootGroup.content.sections.definitions, property);
	}

	private static getWatermarkMetadata(property: string) {
		return get(PRINT_MODEL_METADATA_MAP.RootGroup.content.watermarks.definitions, property);
	}

	private static getMetadata(object: PrintModelEntity, property: string): PrintEntityMetadata | undefined {
		let metadata = undefined;
		let inputSourceField = undefined;

		if (PrintModelElement.isInstance(object)) {
			inputSourceField = this.getElementMetadata(object, property);
		} else if (isPartialSegment(object)) {
			inputSourceField = this.getSegmentMetadata(property);
		} else if (isPartialSection(object)) {
			inputSourceField = this.getSectionMetadata(property);
		} else if (isPartialWatermark(object)) {
			inputSourceField = this.getWatermarkMetadata(property);
		}

		if (
			inputSourceField &&
			isInputSource<PrintEntityMetadata>(inputSourceField) &&
			inputSourceField.value &&
			isMetadataInstance(inputSourceField.value)
		) {
			metadata = inputSourceField.value;
		}
		return metadata;
	}

	private static defaultDetermineInheritedSource(element: PrintModelEntity, inheritedCondition: string): boolean {
		const conditions: string[][] = inheritedCondition.split(", ").map((condition: string) => condition.split("="));

		let matchInheritedCondition = true;
		for (let i = 0; i < conditions.length; i++) {
			const [conditionType, conditionValue] = conditions[i];
			if (conditionType === "ElementType") {
				if (PrintModelElement.isInstance(element)) {
					matchInheritedCondition = element.type === conditionValue;
					// Break after the first match for ElementType
					if (matchInheritedCondition) {
						return true;
					}
				} else {
					matchInheritedCondition = false;
					logger.error("ElementType condition can only be applied to PrintModelElement instances");
				}
			}
		}
		return matchInheritedCondition;
	}

	private static resolveInheritSource(
		element: PrintModelEntity,
		{ hasInherited, inheritedCondition }: PrintEntityMetadata,
		determineInheritedSource: (element: PrintModelEntity, inheritedCondition: string) => boolean = this
			.defaultDetermineInheritedSource
	): null | PossibleInputSource.INHERITED {
		if (!hasInherited) {
			return null;
		}

		if (!inheritedCondition) {
			return PossibleInputSource.INHERITED;
		}

		const matchInheritedCondition = determineInheritedSource(element, inheritedCondition);

		return matchInheritedCondition ? PossibleInputSource.INHERITED : null;
	}

	private static defaultDetermineRequiredSource(element: PrintModelEntity, requiredCondition: string): boolean {
		const conditions: string[][] = requiredCondition.split(", ").map((condition: string) => condition.split("="));

		let matchRequiredCondition = true;
		for (let i = 0; i < conditions.length; i++) {
			const [conditionType, conditionValue] = conditions[i];
			if (conditionType === "ElementType") {
				if (PrintModelElement.isInstance(element)) {
					matchRequiredCondition = element.type === conditionValue;
					if (matchRequiredCondition) {
						return true;
					}
				} else {
					matchRequiredCondition = false;
					logger.error("ElementType condition can only be applied to PrintModelElement instances");
				}
			}
		}
		return matchRequiredCondition;
	}

	private static resolveRequiredSource(
		element: PrintModelEntity,
		{ isRequired, requiredCondition }: PrintEntityMetadata,
		determineRequiredSource: (element: PrintModelEntity, requiredCondition: string) => boolean = this
			.defaultDetermineRequiredSource
	): boolean {
		if (!requiredCondition) {
			return isRequired;
		}

		return determineRequiredSource(element, requiredCondition);
	}
}
