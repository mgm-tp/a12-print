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

import type {
	ChartDimensions,
	InputSource,
	PageBreakBehavior,
	Position,
	Area,
	BarChart,
	BoundingBox,
	Expression,
	Line,
	LineChart,
	PartialAnyPrintModelElement,
	PieChart,
	Switch,
	PartialPlaceableReference,
	PartialTextStyle,
	PartialValidPlaceableReference,
	Text,
	Table,
	TableLayout,
	Listing,
	PartialPrintModel,
	PartialLine,
	PartialExpression,
	PartialAnyTopLevelContainerElement,
	OverflowDimensions,
	BoundingBoxDimensions,
	SwitchDimensions,
} from "@com.mgmtp.a12.print/print-model-api/model";
import { BorderStyle } from "@com.mgmtp.a12.print/print-model-api/model";
import {
	ElementType,
	PartialArea,
	PartialBarChart,
	PartialBoundingBox,
	PartialImage,
	PartialLineChart,
	PartialOverride,
	PartialPieChart,
	PartialSwitch,
	PartialText,
	PartialTableLayout,
	PartialTable,
	isPartialSegment,
	isPartialSection,
	isWatermark,
} from "@com.mgmtp.a12.print/print-model-api/model";
import { PRINT_MODEL_METADATA_MAP } from "@com.mgmtp.a12.print/print-model-api/generated";
import { InputSourceGenerator, PossibleInputSource } from "@com.mgmtp.a12.print/print-model-api/input-source";
import type { PrintFontMap } from "@com.mgmtp.a12.print/print-fonts/a12internal";

import type { Wrapper } from "../redux/navigation/types/index.js";
import { CHART_ELEMENTS } from "../constant/elements.js";
import { EditorConst } from "../constant/editor.js";
import type { TextPropertiesPath } from "../types/input-source.js";

import type { OmitId } from "./type-utils.js";
import { createMmMeasure } from "./measure-utils.js";
import { CssUtils, getTextPropertiesStyles, optionalValueToString } from "./css-utils.js";

const { MM_TO_PX } = EditorConst;

export const DEFAULT_IMAGE_HEIGHT = 4;
export const DEFAULT_ELEMENT_HEIGHT = 6;
export const DEFAULT_ELEMENT_WIDTH = 40;
export const DEFAULT_ELEMENT_CONTAINER_HEIGHT = 50;
export const DEFAULT_CHART_HEIGHT = 50;

export namespace ElementsUtils {
	export function createPageBreakBehavior(
		topLevelContainer: PartialAnyTopLevelContainerElement,
		currentWrapper?: Wrapper
	): InputSource<PageBreakBehavior> {
		let path = "";

		if (currentWrapper) {
			if (currentWrapper.type === ElementType.BoundingBox) {
				path =
					PRINT_MODEL_METADATA_MAP.RootGroup.content.elementDefinitions.boundingBox.elementReferences
						.pageBreakBehavior.value.path;
			} else if (currentWrapper.type === ElementType.Area) {
				path =
					PRINT_MODEL_METADATA_MAP.RootGroup.content.elementDefinitions.area.elementReferences
						.pageBreakBehavior.value.path;
			} else if (currentWrapper.type === ElementType.Override) {
				path =
					PRINT_MODEL_METADATA_MAP.RootGroup.content.elementDefinitions.override.boundingBox.elementReferences
						.pageBreakBehavior.value.path;
			}
			const referenceId = currentWrapper.wrapperContext?.placeableReference?.id;

			if (!referenceId) {
				throw new Error("Current wrapper does not have a selected placeable reference ID.");
			}

			return {
				id: nanoid(),
				path,
				source: PossibleInputSource.INHERITED,
				reference: referenceId,
			};
		}

		if (isPartialSegment(topLevelContainer)) {
			path =
				PRINT_MODEL_METADATA_MAP.RootGroup.content.segments.definitions.elementReferences.pageBreakBehavior
					.value.path;
		} else if (isPartialSection(topLevelContainer)) {
			path =
				PRINT_MODEL_METADATA_MAP.RootGroup.content.sections.definitions.elementReferences.pageBreakBehavior
					.value.path;
		} else if (isWatermark(topLevelContainer)) {
			path =
				PRINT_MODEL_METADATA_MAP.RootGroup.content.watermarks.definitions.elementReferences.pageBreakBehavior
					.value.path;
		}

		return {
			id: nanoid(),
			path,
			source: PossibleInputSource.DEFAULT,
		};
	}

	export function createNewlyDroppedElement(
		newDragType: ElementType,
		position: OmitId<Position>,
		topLevelContainer: PartialAnyTopLevelContainerElement,
		currentWrapper?: Wrapper
	): { newEl: PartialAnyPrintModelElement; placeableReference: PartialValidPlaceableReference } {
		const id = nanoid();
		const placeableReference: PartialValidPlaceableReference = {
			id: nanoid(),
			refId: id,
			dimensions: {
				id: nanoid(),
				minWidth: createMmMeasure(getInitialWidth(newDragType)),
				minHeight: createMmMeasure(getInitialHeight(newDragType)),
			},
			position: { id: nanoid(), ...position },
			screenReadingOrder: { id: nanoid(), screenReadingOrderWeight: 0 },
			pageBreakBehavior: createPageBreakBehavior(topLevelContainer, currentWrapper),
		};
		const newEl = createPrintModelElement(id, newDragType, placeableReference);
		return { newEl, placeableReference };
	}

	export function isWrapperElement(
		element: PartialAnyPrintModelElement
	): element is PartialBoundingBox | PartialArea | PartialOverride | PartialSwitch {
		return (
			PartialBoundingBox.isInstance(element) ||
			PartialOverride.isInstance(element) ||
			PartialArea.isInstance(element) ||
			PartialSwitch.isInstance(element)
		);
	}

	export function isFixedHeightElement(element: PartialAnyPrintModelElement): boolean {
		return (
			PartialBarChart.isInstance(element) ||
			PartialLineChart.isInstance(element) ||
			PartialPieChart.isInstance(element) ||
			PartialImage.isInstance(element) ||
			PartialBoundingBox.isInstance(element) ||
			PartialArea.isInstance(element) ||
			PartialSwitch.isInstance(element)
		);
	}

	export function isChartElement(element: PartialAnyPrintModelElement): boolean {
		return CHART_ELEMENTS.includes(element.type);
	}

	export function getFixedElementHeight(
		element: PartialAnyPrintModelElement,
		placeable: PartialValidPlaceableReference
	) {
		switch (element.type) {
			case ElementType.BarChart:
				return element.barChart?.dimensions?.height?.value;
			case ElementType.LineChart:
				return element.lineChart?.dimensions?.height?.value;
			case ElementType.PieChart:
				return element.pieChart?.dimensions?.height?.value;
			case ElementType.Image:
				return element.image?.dimensions?.height?.value || placeable.dimensions.minHeight.value;
			default:
				return undefined;
		}
	}

	function getTextElementStyles(
		element: PartialText | PartialExpression,
		propertiesPaths: TextPropertiesPath,
		isLayoutElement: boolean,
		textStyle?: PartialTextStyle,
		fonts?: PrintFontMap
	): React.CSSProperties {
		const textPropertiesInput = element.textProperties;
		const borderProperties = isLayoutElement ? {} : element.borderProperties;
		const fontSize = textStyle?.fontSize ? `${textStyle.fontSize}pt` : "inherit";
		const lineHeight = textStyle?.lineHeight ? `${textStyle.lineHeight}pt` : "inherit";

		const textProperties = getTextPropertiesStyles(textPropertiesInput, element, propertiesPaths);

		return {
			...CssUtils.getCssInlineStyles(
				{ textProperties, borderProperties: borderProperties, textStyle },
				fonts || {}
			),
			height: "100%",
			fontSize,
			lineHeight,
		};
	}

	function getLineElementStyles(element: PartialLine): React.CSSProperties {
		return {
			borderColor: element.borderProperties?.borderColor?.value,
			borderWidth: optionalValueToString(element.borderProperties?.borderWidth?.value, "pt"),
			borderStyle: element.borderProperties?.borderStyle
				? `${element.borderProperties?.borderStyle?.value} none none none`
				: undefined,
		};
	}

	function getImageElementStyles(reference?: PartialPlaceableReference): React.CSSProperties {
		return {
			width: reference?.dimensions?.minWidth?.value ? MM_TO_PX(reference.dimensions?.minWidth?.value) : undefined,
			height: reference?.dimensions?.minHeight?.value
				? MM_TO_PX(reference.dimensions?.minHeight?.value)
				: undefined,
		};
	}

	function getBoxElementStyles(
		element: PartialArea | PartialBoundingBox | PartialSwitch,
		isLayoutElement: boolean
	): React.CSSProperties {
		const borderProperties = isLayoutElement || PartialSwitch.isInstance(element) ? {} : element.borderProperties;
		return {
			...CssUtils.getOutlineStyles(borderProperties),
			...CssUtils.cssBoxStyles,
		};
	}

	export function getElementStyles(
		element: PartialAnyPrintModelElement,
		propertiesPaths: TextPropertiesPath,
		reference?: PartialPlaceableReference,
		isLayoutElement?: boolean,
		textStyle?: PartialTextStyle,
		fonts?: PrintFontMap
	): React.CSSProperties {
		let result: React.CSSProperties = {};

		switch (element.type) {
			case ElementType.Expression:
			case ElementType.Text:
				result = getTextElementStyles(element, propertiesPaths, !!isLayoutElement, textStyle, fonts);
				break;
			case ElementType.Line:
				result = getLineElementStyles(element);
				break;
			case ElementType.Image:
				result = getImageElementStyles(reference);
				break;
			case ElementType.BoundingBox:
			case ElementType.Area:
			case ElementType.Switch:
				result = getBoxElementStyles(element, !!isLayoutElement);
				break;
			case ElementType.Override:
				result = { height: "100%" };
				break;
		}

		if (isLayoutElement && element.type !== ElementType.Text) {
			result["whiteSpace"] = "pre-line";
		}

		return result;
	}

	export function getActualTopPosition(reference: PartialValidPlaceableReference) {
		return reference.position.y.value - (reference.margins?.top?.margin?.value || 0);
	}

	export function getActualBottomPosition(reference: PartialValidPlaceableReference) {
		return (
			reference.position.y.value +
			reference.dimensions.minHeight.value +
			(reference.margins?.bottom?.margin?.value || 0)
		);
	}

	export function getElementReferences(element: PartialAnyPrintModelElement) {
		if (PartialText.isInstance(element)) {
			return element.text?.entities || [];
		}
		if (PartialTableLayout.isInstance(element)) {
			return element.tableLayout?.cells || [];
		}
		if (PartialTable.isInstance(element)) {
			return element.table?.columns || [];
		}
		if (PartialBoundingBox.isInstance(element)) {
			return element.boundingBox?.elementReferences || [];
		}
		if (PartialOverride.isInstance(element)) {
			return element.override?.boundingBox?.elementReferences || [];
		}
		if (PartialArea.isInstance(element)) {
			return element.area?.elementReferences || [];
		}
		if (PartialSwitch.isInstance(element)) {
			return element.switch?.cases || [];
		}
		return [];
	}

	export function getNestedReference(
		reference: PartialAnyPrintModelElement,
		partialPrintModel: PartialPrintModel,
		collectedReferences: string[] = []
	): string[] {
		if (reference) {
			const refs = getElementReferences(reference);

			refs.forEach(ref => {
				if (ref && ref.refId) {
					collectedReferences.push(ref.refId);
					const nestedRef = partialPrintModel.content?.elementDefinitions?.find(el => el.id === ref.refId);
					getNestedReference(
						nestedRef as PartialAnyPrintModelElement,
						partialPrintModel,
						collectedReferences
					);
				}
			});
		}
		return collectedReferences;
	}
}

function createDimensions(
	placeableReference: PartialValidPlaceableReference
): ChartDimensions | OverflowDimensions | BoundingBoxDimensions | SwitchDimensions {
	if (placeableReference.dimensions.minHeight.value === -1) {
		throw new Error("Dimension object is only allowed for fixed height elements");
	}
	return {
		id: nanoid(),
		width: createMmMeasure(placeableReference.dimensions.minWidth.value),
		height: createMmMeasure(placeableReference.dimensions.minHeight.value),
	};
}

function createPrintModelElement(
	id: string,
	type: ElementType,
	placeableReference: PartialValidPlaceableReference
): PartialAnyPrintModelElement {
	const baseValues: PartialAnyPrintModelElement = { id, type, borderProperties: { id: nanoid() } };

	if (CHART_ELEMENTS.includes(type)) {
		return createChartPrintModelElement(type, baseValues, placeableReference);
	}
	if (type === ElementType.Text) {
		const defaultTextProperties =
			InputSourceGenerator.generateInputSource<Required<Text>>("textProperties").textProperties;
		const defaultBorderProperties =
			InputSourceGenerator.generateInputSource<Text>("borderProperties").borderProperties;
		return {
			...baseValues,
			borderProperties: defaultBorderProperties,
			textProperties: {
				id: defaultTextProperties.id,
				textStyleId: defaultTextProperties.textStyleId,
				alignment: defaultTextProperties.alignment,
			},
		} as Text;
	}
	if (type === ElementType.Table) {
		const { columns, ...restProperties } = InputSourceGenerator.generateInputSource<Table>("table", [
			"columns",
		]).table;

		const defaultTextProperties = InputSourceGenerator.generateInputSource<Table>("textProperties").textProperties;
		const defaultBorderProperties =
			InputSourceGenerator.generateInputSource<Table>("borderProperties").borderProperties;
		return {
			...baseValues,
			borderProperties: defaultBorderProperties,
			table: {
				...restProperties,
			},
			textProperties: defaultTextProperties,
		} as Table;
	}
	if (type === ElementType.Listing) {
		const listingInputSources = InputSourceGenerator.generateInputSource<Listing>("listing", ["columns"]).listing;
		const defaultTextProperties =
			InputSourceGenerator.generateInputSource<Listing>("textProperties").textProperties;
		const defaultBorderProperties =
			InputSourceGenerator.generateInputSource<Listing>("borderProperties").borderProperties;
		return {
			...baseValues,
			borderProperties: defaultBorderProperties,
			listing: {
				...listingInputSources,
			},
			textProperties: defaultTextProperties,
		} as Listing;
	}
	if (type === ElementType.BoundingBox) {
		const defaultBorderProperties =
			InputSourceGenerator.generateInputSource<BoundingBox>("borderProperties").borderProperties;
		return {
			...baseValues,
			borderProperties: defaultBorderProperties,
			boundingBox: {
				id: nanoid(),
				dimensions: createDimensions(placeableReference),
				elementReferences: [],
			},
		} as BoundingBox;
	}
	if (type === ElementType.Area) {
		const defaultBorderProperties =
			InputSourceGenerator.generateInputSource<Area>("borderProperties").borderProperties;
		return {
			...baseValues,
			borderProperties: defaultBorderProperties,
			area: {
				id: nanoid(),
				dimensions: {
					...createDimensions(placeableReference),
					overflowHeight: createMmMeasure(0),
				},
				elementReferences: [],
			},
		} as Area;
	}
	if (type === ElementType.Switch) {
		return {
			...baseValues,
			switch: {
				id: nanoid(),
				dimensions: createDimensions(placeableReference),
			},
		} as Switch;
	}
	if (type === ElementType.Expression) {
		const defaultTextProperties =
			InputSourceGenerator.generateInputSource<Expression>("textProperties").textProperties;
		const defaultBorderProperties =
			InputSourceGenerator.generateInputSource<Expression>("borderProperties").borderProperties;
		return {
			...baseValues,
			borderProperties: defaultBorderProperties,
			textProperties: defaultTextProperties,
			expression: {
				id: nanoid(),
				basePath: "/",
			},
		} as Expression;
	}
	if (type === ElementType.Line) {
		const defaultBorderProperties =
			InputSourceGenerator.generateInputSource<Line>("borderProperties").borderProperties;
		return {
			...baseValues,
			borderProperties: {
				...defaultBorderProperties,
				borderStyle: {
					...defaultBorderProperties!.borderStyle,
					source: PossibleInputSource.INPUT,
					value: BorderStyle.Solid,
				},
			},
		} as Line;
	}
	if (type === ElementType.TableLayout) {
		const defaultBorderProperties =
			InputSourceGenerator.generateInputSource<TableLayout>("borderProperties").borderProperties;
		return {
			...baseValues,
			borderProperties: defaultBorderProperties,
		} as TableLayout;
	}

	return baseValues;
}

function createChartPrintModelElement(
	type: ElementType,
	baseValues: PartialAnyPrintModelElement,
	placeableReference: PartialValidPlaceableReference
): PartialAnyPrintModelElement {
	switch (type) {
		case ElementType.PieChart: {
			const pieChartInputSources =
				InputSourceGenerator.generateInputSource<Omit<PieChart, "dimensions">>("pieChart").pieChart;
			return {
				...baseValues,
				pieChart: {
					...pieChartInputSources,
					dimensions: createDimensions(placeableReference),
				},
			} as PieChart;
		}
		case ElementType.LineChart: {
			const lineChartInputSources =
				InputSourceGenerator.generateInputSource<Omit<LineChart, "dimensions">>("lineChart").lineChart;
			return {
				...baseValues,
				lineChart: {
					...lineChartInputSources,
					dimensions: createDimensions(placeableReference),
				},
			} as LineChart;
		}
		case ElementType.BarChart: {
			const barChartInputSources = InputSourceGenerator.generateInputSource<BarChart>("barChart").barChart;
			return {
				...baseValues,
				barChart: {
					...barChartInputSources,
					dimensions: createDimensions(placeableReference),
				},
			} as BarChart;
		}
		default:
			throw new Error(`Unsupported chart type: ${type}`);
	}
}

function getInitialWidth(type: ElementType): number {
	if (isBoxType(type)) {
		return DEFAULT_ELEMENT_CONTAINER_HEIGHT;
	}
	return DEFAULT_ELEMENT_WIDTH;
}

function getInitialHeight(type: ElementType): number {
	if (isChartType(type)) {
		return DEFAULT_CHART_HEIGHT;
	}
	if (isBoxType(type)) {
		return DEFAULT_ELEMENT_CONTAINER_HEIGHT;
	}
	// height needs to be measured
	return -1;
}

function isChartType(type: ElementType) {
	return CHART_ELEMENTS.includes(type);
}

function isBoxType(type: string): boolean {
	return type === ElementType.BoundingBox || type === ElementType.Area || type === ElementType.Switch;
}
