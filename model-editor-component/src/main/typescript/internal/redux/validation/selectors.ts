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
import { createSelector } from "reselect";

import type { DeepPartialErrorMap } from "@com.mgmtp.a12.print/print-model-api/errors";
import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/errors";
import type {
	Expression,
	Metadata,
	PrintModelContentGeneral,
	PrintModelElement,
	PrintModelHeader,
	Section,
	Segment,
	Styleable,
	TextStyle,
	Watermark,
} from "@com.mgmtp.a12.print/print-model-api/model";
import { ElementType, PartialArea, PartialBoundingBox } from "@com.mgmtp.a12.print/print-model-api/model";
import { SidebarItem } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import {
	createSliceSelector,
	idInputSelector,
	idInputSelectorSecond,
	PrintEngineSelectors,
} from "../../store/selectors.js";
import type { PrintEngineState } from "../../../a12internal/api/PrintEngineState.js";
import type { AnnotationData } from "../../../internal/components/general/annotations/annotation.js";
import type { PrintModelErrorMap } from "../../../internal/types/index.js";
import type { ValidationState } from "../../../a12internal/api/ValidationState.js";

import { NavigationSelectors } from "../navigation/selectors.js";
import { isBaseElementFormState, isBaseReferenceFormState } from "../navigation/state.js";

import { ValidationCounter } from "./state.js";
import type { Selector } from "./selector-utils.js";
import {
	isAreaErrorMap,
	isBarChartErrorMap,
	isBoundingBoxErrorMap,
	isCalculationErrorMap,
	isExpressionErrorMap,
	isFieldErrorMap,
	isImageErrorMap,
	isLineChartErrorMap,
	isListingErrorMap,
	isOverrideErrorMap,
	isPieChartErrorMap,
	isStyleableElement,
	isSwitchErrorMap,
	isTableErrorMap,
	isTableLayoutErrorMap,
	isTextErrorMap,
} from "./selector-utils.js";

export namespace ValidationSelectors {
	export const validationState = createSliceSelector<ValidationState>(state => state.ValidationState);
	export const validationInteraction = createSelector(
		validationState,
		validationState => validationState.interaction
	);

	export const errorMapState = createSliceSelector<PrintModelErrorMap | undefined>(
		state => state.ValidationState.errorMap
	);

	export const annotation = createSliceSelector<DeepPartialErrorMap<AnnotationData>[] | undefined>(
		state => state.ValidationState.errorMap?.header?.annotations
	);

	const general = createSliceSelector<DeepPartialErrorMap<PrintModelContentGeneral> | undefined>(
		state => state.ValidationState.errorMap?.content?.general
	);

	const textStyles = createSliceSelector<DeepPartialErrorMap<TextStyle>[] | undefined>(
		state => state.ValidationState.errorMap?.content?.textStyles?.definitions
	);

	export const header = createSliceSelector<DeepPartialErrorMap<PrintModelHeader> | undefined>(
		state => state.ValidationState?.errorMap?.header
	);

	export const metadata = createSliceSelector<DeepPartialErrorMap<Metadata> | undefined>(
		state => state.ValidationState.errorMap?.content?.general?.metadata
	);

	export const section = createSelector([errorMapState, idInputSelector], (errorMap, id) => {
		const sections: DeepPartialErrorMap<Section>[] | undefined = errorMap?.content?.sections?.definitions;
		if (!sections || !sections.length) {
			return;
		}
		return sections.find(section => section["@id"] === id);
	});

	export const watermark = createSelector([errorMapState, idInputSelector], (errorMap, id) => {
		const watermarks: DeepPartialErrorMap<Watermark>[] | undefined = errorMap?.content?.watermarks?.definitions;
		if (!watermarks || !watermarks.length) {
			return;
		}
		return watermarks.find(watermark => watermark["@id"] === id);
	});

	export const segment = createSelector([errorMapState, idInputSelector], (errorMap, id) => {
		const segments: DeepPartialErrorMap<Segment>[] | undefined = errorMap?.content?.segments?.definitions;
		if (!segments || !segments.length) {
			return;
		}
		return segments.find(segment => segment["@id"] === id);
	});

	export const textStyle = createSelector([errorMapState, idInputSelector], (errorMap, id) => {
		const textStyles: DeepPartialErrorMap<TextStyle>[] | undefined = errorMap?.content?.textStyles?.definitions;
		if (!textStyles || !textStyles.length) {
			return;
		}
		return textStyles.find(textStyle => textStyle["@id"] === id);
	});

	export const elements = createSelector(
		errorMapState,
		errorMap => (errorMap?.content?.elementDefinitions || []) as DeepPartialErrorMap<PrintModelElement>[]
	);

	export const elementValidationCounterByElement = createSelector(
		[PrintEngineSelectors.state, elements, validationCounterGetter],
		(state, elements, { counterGetter, currentElement }) => {
			let counter: ValidationCounter = ValidationCounter.from(currentElement, counterGetter);
			const id = currentElement["@id"];
			// Additional references
			const elementType = currentElement["@type"] as ElementType;
			if ([ElementType.Text, ElementType.Table].includes(elementType)) {
				const entityIds = PrintEngineSelectors.entityElementIds(state, id);
				elements.forEach(element => {
					if (entityIds.includes(element["@id"] || "")) {
						counter = ValidationCounter.add(counter, ValidationCounter.from(element, counterGetter));
					}
				});
			} else if (
				[
					ElementType.BoundingBox,
					ElementType.Area,
					ElementType.Override,
					ElementType.TableLayout,
					ElementType.Switch,
				].includes(elementType)
			) {
				const entityIds = PrintEngineSelectors.entityElementIds(state, id);
				elements.forEach(element => {
					const elementId = element["@id"] || "";
					if (entityIds.includes(elementId)) {
						if (
							[
								ElementType.BoundingBox,
								ElementType.Override,
								ElementType.Area,
								ElementType.Switch,
								ElementType.Table,
								ElementType.Text,
								ElementType.TableLayout,
							].includes(element["@type"] as ElementType)
						) {
							const elementValidator = elementValidationCounterByElement(state, element, counterGetter);
							counter = ValidationCounter.add(counter, elementValidator);
						} else {
							counter = ValidationCounter.add(counter, ValidationCounter.from(element, counterGetter));
						}
					}
				});
			}

			return counter;
		}
	);

	export const elementValidationCounterById = createSelector(
		[PrintEngineSelectors.state, elements, idInputSelector],
		(state, elements, id) => {
			const currentElement = elements.find(element => id === element["@id"]);
			if (!currentElement) {
				return ValidationCounter.EMPTY_VALIDATION_COUNTER;
			}

			return elementValidationCounterByElement(state, currentElement);
		}
	);

	export const segmentValidationCounter = createSelector(
		[PrintEngineSelectors.state, idInputSelector],
		(state, id) => {
			const currentSegment = PrintEngineSelectors.segment(state, id);
			let counter = ValidationCounter.from(segment(state, id));
			const elementIds = currentSegment?.elementReferences?.map(reference => reference?.refId) || [];
			elementIds.forEach(element => {
				counter = ValidationCounter.add(counter, elementValidationCounterById(state, element));
			});
			return counter;
		}
	);

	export const sectionValidationCounter = createSelector(
		[PrintEngineSelectors.state, idInputSelector],
		(state, id) => {
			const currentSection = PrintEngineSelectors.section(state, id);
			let counter = ValidationCounter.from(section(state, id));
			const elementIds = currentSection?.elementReferences?.map(reference => reference?.refId) || [];
			elementIds.forEach(element => {
				counter = ValidationCounter.add(counter, elementValidationCounterById(state, element));
			});
			return counter;
		}
	);

	export const watermarkValidationCounter = createSelector(
		[PrintEngineSelectors.state, idInputSelector],
		(state, id) => {
			const currentWatermark = PrintEngineSelectors.watermark(state, id);
			let counter = ValidationCounter.from(watermark(state, id));
			const elementIds = currentWatermark?.elementReferences?.map(reference => reference?.refId) || [];
			elementIds.forEach(element => {
				counter = ValidationCounter.add(counter, elementValidationCounterById(state, element));
			});
			return counter;
		}
	);

	const generalTabValidationCounter = createSelector([annotation, general], (annotationErrorMap, generalErrorMap) =>
		ValidationCounter.add(ValidationCounter.from(annotationErrorMap), ValidationCounter.from(generalErrorMap))
	);

	const textStylesValidationCounter = createSelector([textStyles], textStylesErrorMap =>
		ValidationCounter.from(textStylesErrorMap)
	);

	export const containerElementValidationCounter = createSelector(
		[
			PrintEngineSelectors.state,
			NavigationSelectors.activeEntities,
			PrintEngineSelectors.currentContainerElement,
			NavigationSelectors.sidebarState,
			generalTabValidationCounter,
			textStylesValidationCounter,
		],
		(
			state,
			{ currentRefType },
			currentContainerElement,
			sidebarState,
			generalTabValidationCounter,
			textStylesValidationCounter
		) => {
			const selectedSidebarItem = sidebarState.activeTab;
			if (selectedSidebarItem === SidebarItem.GENERAL) {
				return generalTabValidationCounter;
			}
			if (selectedSidebarItem === SidebarItem.TEXT_STYLES) {
				return textStylesValidationCounter;
			}
			if ([SidebarItem.SCHEMA, SidebarItem.COMMIT_CHANGES].includes(selectedSidebarItem)) {
				return ValidationCounter.EMPTY_VALIDATION_COUNTER;
			}
			const elementIds = currentContainerElement?.elementReferences?.map(reference => reference?.refId) || [];

			let counter: ValidationCounter;
			if (sidebarState.isOpen) {
				if (currentRefType === SidebarItem.SECTION) {
					counter = ValidationCounter.from(section(state, currentContainerElement?.id));
				} else if (currentRefType === SidebarItem.SEGMENT) {
					counter = ValidationCounter.from(segment(state, currentContainerElement?.id));
				} else {
					counter = ValidationCounter.from(watermark(state, currentContainerElement?.id));
				}
			} else {
				counter = ValidationCounter.EMPTY_VALIDATION_COUNTER;
			}

			elementIds.forEach(element => {
				counter = ValidationCounter.add(counter, elementValidationCounterById(state, element));
			});

			return counter;
		}
	);

	export const sidebarValidationCounter = createSelector(
		[PrintEngineSelectors.state, generalTabValidationCounter, textStylesValidationCounter],
		(state, generalTabValidationCounter, textStylesValidationCounter) => {
			const segments = PrintEngineSelectors.segments(state);
			const sections = PrintEngineSelectors.sections(state);
			const watermarks = PrintEngineSelectors.watermarks(state);
			const emptyValidationCounter = ValidationCounter.EMPTY_VALIDATION_COUNTER;

			return {
				[SidebarItem.GENERAL]: generalTabValidationCounter,
				[SidebarItem.TEXT_STYLES]: textStylesValidationCounter,
				[SidebarItem.SEGMENT]: segments.reduce<ValidationCounter>((result, segment) => {
					result = ValidationCounter.add(result, segmentValidationCounter(state, segment.id));
					return result;
				}, emptyValidationCounter),
				[SidebarItem.SECTION]: sections.reduce<ValidationCounter>((result, section) => {
					result = ValidationCounter.add(result, sectionValidationCounter(state, section.id));
					return result;
				}, emptyValidationCounter),
				[SidebarItem.WATERMARK]: watermarks.reduce<ValidationCounter>((result, watermark) => {
					result = ValidationCounter.add(result, watermarkValidationCounter(state, watermark.id));
					return result;
				}, emptyValidationCounter),
				[SidebarItem.SCHEMA]: emptyValidationCounter,
				[SidebarItem.COMMIT_CHANGES]: emptyValidationCounter,
			};
		}
	);

	export const styleableElements = createSelector(
		ValidationSelectors.elements,
		createElementDefinitionFilter(isStyleableElement)
	) as Selector<DeepPartialErrorMap<Styleable>[]>;

	export const styleableElement = createSelector([styleableElements, idInputSelector], (styleableElements, id) =>
		styleableElements.find(styleableElement => id === styleableElement["@id"])
	);

	export const expressions = createSelector(
		ValidationSelectors.elements,
		createElementDefinitionFilter(isExpressionErrorMap)
	) as Selector<DeepPartialErrorMap<Expression>[]>;

	export const expression = createSelector([expressions, idInputSelector], (expressions, id) =>
		expressions.find(expression => id === expression["@id"])
	);

	export const pieChart = createSelector(
		[createElementErrorMap(isPieChartErrorMap), idInputSelector],
		(pieCharts, id) => {
			return pieCharts.find(pieChart => pieChart["@id"] === id);
		}
	);

	export const lineChart = createSelector(
		[createElementErrorMap(isLineChartErrorMap), idInputSelector],
		(lineCharts, id) => {
			return lineCharts.find(lineChart => lineChart["@id"] === id);
		}
	);

	export const barChart = createSelector(
		[createElementErrorMap(isBarChartErrorMap), idInputSelector],
		(barCharts, id) => {
			return barCharts.find(barChart => barChart["@id"] === id);
		}
	);

	export const image = createSelector([createElementErrorMap(isImageErrorMap), idInputSelector], (images, id) => {
		return images.find(image => image["@id"] === id);
	});

	export const textElement = createSelector([createElementErrorMap(isTextErrorMap), idInputSelector], (texts, id) => {
		return texts.find(text => text["@id"] === id);
	});

	export const switchElement = createSelector(
		[createElementErrorMap(isSwitchErrorMap), idInputSelector],
		(switches, id) => {
			return switches.find(el => el["@id"] === id);
		}
	);

	export const field = createSelector([createElementErrorMap(isFieldErrorMap), idInputSelector], (fields, id) => {
		return fields.find(field => field["@id"] === id);
	});

	export const calculation = createSelector(
		[createElementErrorMap(isCalculationErrorMap), idInputSelector],
		(calculations, id) => {
			return calculations.find(calculation => calculation["@id"] === id);
		}
	);

	export const tableLayout = createSelector(
		[createElementErrorMap(isTableLayoutErrorMap), idInputSelector],
		(tableLayouts, id) => {
			return tableLayouts.find(tableLayout => tableLayout["@id"] === id);
		}
	);

	export const table = createSelector([createElementErrorMap(isTableErrorMap), idInputSelector], (tables, id) => {
		return tables.find(table => table["@id"] === id);
	});

	export const listing = createSelector(
		[createElementErrorMap(isListingErrorMap), idInputSelector],
		(listings, id) => {
			return listings.find(listing => listing["@id"] === id);
		}
	);

	export const boundingBox = createSelector(
		[createElementErrorMap(isBoundingBoxErrorMap), idInputSelector],
		(boundingBoxes, id) => {
			return boundingBoxes.find(box => box["@id"] === id);
		}
	);

	export const override = createSelector(
		[createElementErrorMap(isOverrideErrorMap), idInputSelector],
		(overrides, id) => {
			return overrides.find(override => override["@id"] === id);
		}
	);

	export const area = createSelector([createElementErrorMap(isAreaErrorMap), idInputSelector], (areas, id) => {
		return areas.find(area => area["@id"] === id);
	});

	export const currentElementReferences = createSelector(
		[
			PrintEngineSelectors.state,
			PrintEngineSelectors.currentWrapperContainerId,
			NavigationSelectors.activeEntities,
		],
		(state, wrapperId, printModelRefs) => {
			if (wrapperId) {
				const element = PrintEngineSelectors.printModelElement(state, wrapperId);
				if (PartialBoundingBox.isInstance(element)) {
					return boundingBox(state, wrapperId)?.boundingBox?.elementReferences;
				}
				if (PartialArea.isInstance(element)) {
					return area(state, wrapperId)?.area?.elementReferences;
				}
				return override(state, wrapperId)?.override?.boundingBox?.elementReferences;
			}
			const { currentRefType, segmentId, sectionId, watermarkId } = printModelRefs;

			let elementContainerErrorMap;
			if (currentRefType === SidebarItem.SEGMENT) {
				elementContainerErrorMap = segment(state, segmentId);
			} else if (currentRefType === SidebarItem.SECTION) {
				elementContainerErrorMap = section(state, sectionId);
			} else {
				elementContainerErrorMap = watermark(state, watermarkId);
			}
			return elementContainerErrorMap?.elementReferences;
		}
	);

	export const currentPlaceableReference = createSelector(
		[currentElementReferences, idInputSelector],
		(elementReferencesErrorMap, id) => {
			return elementReferencesErrorMap?.find(ref => ref["@id"] === id);
		}
	);

	export const currentPlaceableReferenceValidationCounter = createSelector(
		[currentPlaceableReference],
		placeableReferenceErrorMap => {
			return ValidationCounter.from(placeableReferenceErrorMap);
		}
	);

	export const elementDefaultStageValidationCounterById = createSelector(
		[PrintEngineSelectors.state, elements, idInputSelector],
		(state, elements, id) => {
			const currentElement = elements.find(element => id === element["@id"]);
			if (!currentElement) {
				return ValidationCounter.EMPTY_VALIDATION_COUNTER;
			}

			return elementValidationCounterByElement(state, currentElement, placeableDefaultStageCounterGetter);
		}
	);

	export const elementLayoutStageValidationCounterById = createSelector(
		[PrintEngineSelectors.state, elements, idInputSelector],
		(state, elements, id) => {
			const currentElement = elements.find(element => id === element["@id"]);
			if (!currentElement) {
				return ValidationCounter.EMPTY_VALIDATION_COUNTER;
			}

			return elementValidationCounterByElement(state, currentElement, placeableLayoutStageCounterGetter);
		}
	);

	export const placeableRefLayoutCounter = createSelector([currentPlaceableReference], placeableReferenceErrorMap => {
		return ValidationCounter.from(placeableReferenceErrorMap?.pageBreakBehavior);
	});

	export const placeableRefDefaultCounter = createSelector(
		[currentPlaceableReference],
		placeableReferenceErrorMap => {
			if (!placeableReferenceErrorMap) return ValidationCounter.EMPTY_VALIDATION_COUNTER;
			const positionErrors = ValidationCounter.from(placeableReferenceErrorMap.position);
			const hideConditionsErrors = ValidationCounter.from(placeableReferenceErrorMap.hideConditions);
			return ValidationCounter.add(positionErrors, hideConditionsErrors);
		}
	);

	export const allPlaceableRefLayoutCounter = createSelector(
		[PrintEngineSelectors.state, currentElementReferences, PrintEngineSelectors.elementReferences],
		(state, elementReferencesErrorMap, elementReferences) => {
			let validationCounter = ValidationCounter.EMPTY_VALIDATION_COUNTER;

			elementReferencesErrorMap?.forEach(el => {
				validationCounter = ValidationCounter.add(
					validationCounter,
					ValidationCounter.from(el.pageBreakBehavior)
				);
			});

			elementReferences.forEach(el => {
				validationCounter = ValidationCounter.add(
					validationCounter,
					elementLayoutStageValidationCounterById(state, el.refId)
				);
			});

			return validationCounter;
		}
	);

	export const allPlaceableRefDefaultCounter = createSelector(
		[PrintEngineSelectors.state, currentElementReferences, PrintEngineSelectors.elementReferences],
		(state, elementReferencesErrorMap, elementReferences) => {
			let validationCounter = ValidationCounter.EMPTY_VALIDATION_COUNTER;

			elementReferencesErrorMap?.forEach(el => {
				validationCounter = ValidationCounter.add(validationCounter, ValidationCounter.from(el.position));
				validationCounter = ValidationCounter.add(validationCounter, ValidationCounter.from(el.hideConditions));
			});

			elementReferences.forEach(el => {
				validationCounter = ValidationCounter.add(
					validationCounter,
					elementDefaultStageValidationCounterById(state, el.refId)
				);
			});

			return validationCounter;
		}
	);

	export const formHeaderValidationCounter = createSelector(
		[PrintEngineSelectors.state, NavigationSelectors.currentForm],
		(state, currentForm) => {
			if (!currentForm) {
				return;
			}
			if (isBaseReferenceFormState(currentForm)) {
				return elementDefaultStageValidationCounterById(state, currentForm.referenceId);
			}

			if (isBaseElementFormState(currentForm)) {
				return elementValidationCounterById(state, currentForm.id);
			}
			throw new Error("Unknow form state");
		}
	);

	export const elementDefaultStageValidationCounter = createSelector(
		[PrintEngineSelectors.state, elements, idInputSelector, idInputSelectorSecond],
		(state, elements, placeableRefId, refId) => {
			const currentElement = elements.find(element => refId === element["@id"]);
			const placeableCounter = placeableRefDefaultCounter(state, placeableRefId);

			if (!currentElement) {
				return placeableCounter;
			}

			if (currentElement["@type"] === ElementType.TableLayout) {
				return ValidationCounter.add(placeableCounter, ValidationCounter.from(currentElement));
			}
			return ValidationCounter.add(
				placeableCounter,
				elementValidationCounterByElement(state, currentElement, placeableDefaultStageCounterGetter)
			);
		}
	);

	export const elementLayoutStageValidationCounter = createSelector(
		[PrintEngineSelectors.state, elements, idInputSelector, idInputSelectorSecond],
		(state, elements, placeableRefId, refId) => {
			const currentElement = elements.find(element => refId === element["@id"]);
			const placeableCounter = placeableRefLayoutCounter(state, placeableRefId);

			if (!currentElement) {
				return placeableCounter;
			}

			return ValidationCounter.add(
				placeableCounter,
				elementValidationCounterByElement(state, currentElement, placeableLayoutStageCounterGetter)
			);
		}
	);
}

export function elementDefinitionsSelector<T extends DeepPartialErrorMap<PrintModelElement>>(
	test: (element: DeepPartialErrorMap<PrintModelElement>) => element is T
): (state: PrintEngineState) => T[] | undefined {
	return state => {
		const elements = ValidationSelectors.elements(state);
		if (!elements.length) {
			return [];
		}
		return (elements.filter(element => test(element)) || []) as T[];
	};
}

export function createElementDefinitionFilter<T extends DeepPartialErrorMap<PrintModelElement>>(
	test: (element: DeepPartialErrorMap<PrintModelElement>) => element is T
) {
	return (elements: DeepPartialErrorMap<PrintModelElement>[]) => {
		return elements.filter(element => test(element)) || [];
	};
}

export function createElementErrorMap<T extends DeepPartialErrorMap<PrintModelElement>>(
	test: (element: DeepPartialErrorMap<PrintModelElement>) => element is T
) {
	return createSelector(ValidationSelectors.elements, createElementDefinitionFilter(test)) as Selector<T[]>;
}

const counterGetterCache = new WeakMap<
	DeepPartialErrorMap<PrintModelElement>,
	Map<
		((error: DeepPartialErrorMap<unknown>) => ValidationCounter) | undefined,
		{
			currentElement: DeepPartialErrorMap<PrintModelElement>;
			counterGetter?: (error: DeepPartialErrorMap<unknown>) => ValidationCounter;
		}
	>
>();

function validationCounterGetter(
	_: PrintEngineState,
	currentElement: DeepPartialErrorMap<PrintModelElement>,
	counterGetter?: (error: DeepPartialErrorMap<unknown>) => ValidationCounter
) {
	let elementCache = counterGetterCache.get(currentElement);
	if (!elementCache) {
		elementCache = new Map();
		counterGetterCache.set(currentElement, elementCache);
	}

	let cachedResult = elementCache.get(counterGetter);
	if (!cachedResult) {
		cachedResult = { currentElement, counterGetter };
		elementCache.set(counterGetter, cachedResult);
	}
	return cachedResult;
}

function placeableDefaultStageCounterGetter(error: DeepPartialErrorMap<unknown>): ValidationCounter {
	if (
		error["@type"] &&
		[ElementType.BoundingBox, ElementType.Override, ElementType.Area].includes(error["@type"] as ElementType)
	) {
		let errorCount = 0;
		error[ErrorSeverity.ERROR]?.forEach(err => {
			if (!err.parameters?.rulePath?.endsWith("elementReferences/pageBreakBehavior/valueFilled")) {
				errorCount++;
			}
		});

		return {
			error: errorCount,
			warning: error[ErrorSeverity.WARNING].length,
		};
	}
	return ValidationCounter.defaultCounterGetter(error);
}

function placeableLayoutStageCounterGetter(error: DeepPartialErrorMap<unknown>): ValidationCounter {
	if (
		error["@type"] &&
		[ElementType.BoundingBox, ElementType.Override, ElementType.Area].includes(error["@type"] as ElementType)
	) {
		let errorCount = 0;
		error[ErrorSeverity.ERROR]?.forEach(err => {
			if (err.parameters?.rulePath?.endsWith("elementReferences/pageBreakBehavior/valueFilled")) {
				errorCount++;
			}
		});

		return {
			error: errorCount,
			warning: 0,
		};
	}
	return ValidationCounter.EMPTY_VALIDATION_COUNTER;
}
