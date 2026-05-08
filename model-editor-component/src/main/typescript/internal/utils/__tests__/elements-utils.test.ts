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
	Alignment,
	BorderStyle,
	ElementType,
	MarginType,
	MeasureUnit,
	PartialAnyPrintModelElement,
	PartialArea,
	PartialBarChart,
	PartialBoundingBox,
	PartialImage,
	PartialLine,
	PartialLineChart,
	PartialOverride,
	PartialPieChart,
	PartialTable,
	PartialTableLayout,
	PartialText,
	Position,
	PartialPlaceableReference,
	PartialTextStyle,
	PartialValidPlaceableReference,
	PartialExpression,
	PartialSegment,
	SegmentType,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { PossibleInputSource } from "@com.mgmtp.a12.print/print-model-api/lib/input-source/input-source.js";

import { TEXT_PROPERTIES_PATH } from "../../constant/element-property-path.js";

import {
	DEFAULT_CHART_HEIGHT,
	DEFAULT_ELEMENT_CONTAINER_HEIGHT,
	DEFAULT_ELEMENT_WIDTH,
	ElementsUtils,
} from "../elements-utils.js";
import { OmitId } from "../type-utils.js";

describe("element utils", () => {
	describe("createNewlyDroppedElement", () => {
		const position: OmitId<Position> = {
			x: {
				id: nanoid(),
				value: 50,
				unit: MeasureUnit.Millimeter,
			},
			y: {
				id: nanoid(),
				value: 100,
				unit: MeasureUnit.Millimeter,
			},
		};

		const segment: PartialSegment = {
			id: nanoid(),
			type: SegmentType.Default,
			elementReferences: [],
			dataContexts: [],
			title: "Segment",
		};

		test("should return correct text element and placeable reference if passing element type is Text", () => {
			const { newEl, placeableReference } = ElementsUtils.createNewlyDroppedElement(
				ElementType.Text,
				position,
				segment
			);
			expect(placeableReference.dimensions.minWidth.value).toEqual(DEFAULT_ELEMENT_WIDTH);
			expect(placeableReference.dimensions.minHeight.value).toEqual(-1);

			expect(newEl.id).toEqual(placeableReference.refId);
			expect(newEl.type).toEqual(ElementType.Text);
		});

		test("should return correct line element and placeable reference if passing element type is Line", () => {
			const { newEl, placeableReference } = ElementsUtils.createNewlyDroppedElement(
				ElementType.Line,
				position,
				segment
			);
			expect(placeableReference.dimensions.minWidth.value).toEqual(DEFAULT_ELEMENT_WIDTH);
			expect(placeableReference.dimensions.minHeight.value).toEqual(-1);

			expect(newEl.id).toEqual(placeableReference.refId);
			expect(newEl.type).toEqual(ElementType.Line);
		});

		test("should return correct table element and placeable reference if passing element type is Table", () => {
			const { newEl, placeableReference } = ElementsUtils.createNewlyDroppedElement(
				ElementType.Table,
				position,
				segment
			);
			expect(placeableReference.dimensions.minWidth.value).toEqual(DEFAULT_ELEMENT_WIDTH);
			expect(placeableReference.dimensions.minHeight.value).toEqual(-1);

			expect(newEl.id).toEqual(placeableReference.refId);
			expect(newEl.type).toEqual(ElementType.Table);
		});

		test("should return correct image element and placeable reference if passing element type is Image", () => {
			const { newEl, placeableReference } = ElementsUtils.createNewlyDroppedElement(
				ElementType.Image,
				position,
				segment
			);
			expect(placeableReference.dimensions.minWidth.value).toEqual(DEFAULT_ELEMENT_WIDTH);
			expect(placeableReference.dimensions.minHeight.value).toEqual(-1);

			expect(newEl.type).toEqual(ElementType.Image);
			expect(newEl.id).toEqual(placeableReference.refId);
		});

		test("should return correct expression element and placeable reference if passing element type is Expression", () => {
			const { newEl, placeableReference } = ElementsUtils.createNewlyDroppedElement(
				ElementType.Expression,
				position,
				segment
			);
			expect(placeableReference.dimensions.minWidth.value).toEqual(DEFAULT_ELEMENT_WIDTH);
			expect(placeableReference.dimensions.minHeight.value).toEqual(-1);

			if (!PartialExpression.isInstance(newEl)) {
				throw Error("The element is not expression");
			}
			expect(newEl.id).toEqual(placeableReference.refId);
			expect(newEl.type).toEqual(ElementType.Expression);
			expect(newEl.expression?.basePath).toEqual("/");
		});

		test("should return correct listing element and placeable reference if passing element type is Listing", () => {
			const { newEl, placeableReference } = ElementsUtils.createNewlyDroppedElement(
				ElementType.Listing,
				position,
				segment
			);
			expect(placeableReference.dimensions.minWidth.value).toEqual(DEFAULT_ELEMENT_WIDTH);
			expect(placeableReference.dimensions.minHeight.value).toEqual(-1);

			expect(newEl.id).toEqual(placeableReference.refId);
			expect(newEl.type).toEqual(ElementType.Listing);
		});

		test("should return correct table layout element and placeable reference if passing element type is TableLayout", () => {
			const { newEl, placeableReference } = ElementsUtils.createNewlyDroppedElement(
				ElementType.TableLayout,
				position,
				segment
			);
			expect(placeableReference.dimensions.minWidth.value).toEqual(DEFAULT_ELEMENT_WIDTH);
			expect(placeableReference.dimensions.minHeight.value).toEqual(-1);

			expect(newEl.id).toEqual(placeableReference.refId);
			expect(newEl.type).toEqual(ElementType.TableLayout);
		});

		test("should return correct line chart element and placeable reference if passing element type is LineChart", () => {
			const { newEl, placeableReference } = ElementsUtils.createNewlyDroppedElement(
				ElementType.LineChart,
				position,
				segment
			);
			expect(placeableReference.dimensions.minWidth.value).toEqual(DEFAULT_ELEMENT_WIDTH);
			expect(placeableReference.dimensions.minHeight.value).toEqual(DEFAULT_CHART_HEIGHT);

			if (!PartialLineChart.isInstance(newEl)) {
				throw Error("The element is not line chart");
			}
			expect(newEl.id).toEqual(placeableReference.refId);
			expect(newEl.type).toEqual(ElementType.LineChart);
			expect(newEl.lineChart?.dimensions?.width?.value).toEqual(placeableReference.dimensions.minWidth.value);
			expect(newEl.lineChart?.dimensions?.height?.value).toEqual(DEFAULT_CHART_HEIGHT);
		});

		test("should return correct bar chart element and placeable reference if passing element type is BarChart", () => {
			const { newEl, placeableReference } = ElementsUtils.createNewlyDroppedElement(
				ElementType.BarChart,
				position,
				segment
			);
			expect(placeableReference.dimensions.minWidth.value).toEqual(DEFAULT_ELEMENT_WIDTH);
			expect(placeableReference.dimensions.minHeight.value).toEqual(DEFAULT_CHART_HEIGHT);

			if (!PartialBarChart.isInstance(newEl)) {
				throw Error("The element is not bar chart");
			}
			expect(newEl.id).toEqual(placeableReference.refId);
			expect(newEl.type).toEqual(ElementType.BarChart);
			expect(newEl.barChart?.dimensions?.width?.value).toEqual(placeableReference.dimensions.minWidth.value);
			expect(newEl.barChart?.dimensions?.height?.value).toEqual(DEFAULT_CHART_HEIGHT);
		});

		test("should return correct pie chart element and placeable reference if passing element type is PieChart", () => {
			const { newEl, placeableReference } = ElementsUtils.createNewlyDroppedElement(
				ElementType.PieChart,
				position,
				segment
			);
			expect(placeableReference.dimensions.minWidth.value).toEqual(DEFAULT_ELEMENT_WIDTH);
			expect(placeableReference.dimensions.minHeight.value).toEqual(DEFAULT_CHART_HEIGHT);

			if (!PartialPieChart.isInstance(newEl)) {
				throw Error("The element is not pie chart");
			}
			expect(newEl.id).toEqual(placeableReference.refId);
			expect(newEl.type).toEqual(ElementType.PieChart);
			expect(newEl.pieChart?.dimensions?.width?.value).toEqual(placeableReference.dimensions.minWidth.value);
			expect(newEl.pieChart?.dimensions?.height?.value).toEqual(DEFAULT_CHART_HEIGHT);
		});

		test("should return correct bounding box element and placeable reference if passing element type is BoundingBox", () => {
			const { newEl, placeableReference } = ElementsUtils.createNewlyDroppedElement(
				ElementType.BoundingBox,
				position,
				segment
			);
			expect(placeableReference.dimensions.minWidth.value).toEqual(DEFAULT_ELEMENT_CONTAINER_HEIGHT);
			expect(placeableReference.dimensions.minHeight.value).toEqual(DEFAULT_ELEMENT_CONTAINER_HEIGHT);

			if (!PartialBoundingBox.isInstance(newEl)) {
				throw Error("The element is not bounding box");
			}

			expect(newEl.id).toEqual(placeableReference.refId);
			expect(newEl.type).toEqual(ElementType.BoundingBox);
			expect(newEl.boundingBox?.dimensions?.height?.value).toEqual(placeableReference.dimensions.minHeight.value);
			expect(newEl.boundingBox?.dimensions?.width?.value).toEqual(placeableReference.dimensions.minWidth.value);
		});

		test("should return correct area element and placeable reference if passing element type is Area", () => {
			const { newEl, placeableReference } = ElementsUtils.createNewlyDroppedElement(
				ElementType.Area,
				position,
				segment
			);
			expect(placeableReference.dimensions.minWidth.value).toEqual(DEFAULT_ELEMENT_CONTAINER_HEIGHT);
			expect(placeableReference.dimensions.minHeight.value).toEqual(DEFAULT_ELEMENT_CONTAINER_HEIGHT);

			if (!PartialArea.isInstance(newEl)) {
				throw Error("The element is not area");
			}

			expect(newEl.id).toEqual(placeableReference.refId);
			expect(newEl.type).toEqual(ElementType.Area);
			expect(newEl.area?.dimensions?.height?.value).toEqual(placeableReference.dimensions.minHeight.value);
			expect(newEl.area?.dimensions?.width?.value).toEqual(placeableReference.dimensions.minWidth.value);
			expect(newEl.area?.dimensions?.overflowHeight?.value).toEqual(0);
		});
	});

	describe("isWrapperElement", () => {
		test("should return false if element is text", () => {
			const textElement = createEmptyElement(ElementType.Text);
			expect(ElementsUtils.isWrapperElement(textElement)).toBe(false);
		});

		test("should return false if element is line", () => {
			const lineElement = createEmptyElement(ElementType.Line);
			expect(ElementsUtils.isWrapperElement(lineElement)).toBe(false);
		});

		test("should return false if element is table", () => {
			const tableElement = createEmptyElement(ElementType.Table);
			expect(ElementsUtils.isWrapperElement(tableElement)).toBe(false);
		});

		test("should return false if element is image", () => {
			const imageElement = createEmptyElement(ElementType.Image);
			expect(ElementsUtils.isWrapperElement(imageElement)).toBe(false);
		});

		test("should return false if element is expression", () => {
			const expressionElement = createEmptyElement(ElementType.Expression);
			expect(ElementsUtils.isWrapperElement(expressionElement)).toBe(false);
		});

		test("should return false if element is listing", () => {
			const listingElement = createEmptyElement(ElementType.Listing);
			expect(ElementsUtils.isWrapperElement(listingElement)).toBe(false);
		});

		test("should return false if element is table layout", () => {
			const tableLayoutElement = createEmptyElement(ElementType.TableLayout);
			expect(ElementsUtils.isWrapperElement(tableLayoutElement)).toBe(false);
		});

		test("should return true if element is bar chart", () => {
			const barChartElement = createEmptyElement(ElementType.BarChart);
			expect(ElementsUtils.isWrapperElement(barChartElement)).toBe(false);
		});

		test("should return true if element is line chart", () => {
			const lineChartElement = createEmptyElement(ElementType.LineChart);
			expect(ElementsUtils.isWrapperElement(lineChartElement)).toBe(false);
		});

		test("should return true if element is pie chart", () => {
			const pieChartElement = createEmptyElement(ElementType.PieChart);
			expect(ElementsUtils.isWrapperElement(pieChartElement)).toBe(false);
		});

		test("should return true if element is area", () => {
			const areaElement = createEmptyElement(ElementType.Area);
			expect(ElementsUtils.isWrapperElement(areaElement)).toBe(true);
		});

		test("should return true if element is bounding box", () => {
			const boundingBoxElement = createEmptyElement(ElementType.BoundingBox);
			expect(ElementsUtils.isWrapperElement(boundingBoxElement)).toBe(true);
		});

		test("should return true if element is override", () => {
			const overrideElement = createEmptyElement(ElementType.Override);
			expect(ElementsUtils.isWrapperElement(overrideElement)).toBe(true);
		});
	});

	describe("isFixedHeightElement", () => {
		test("should return false if element is text", () => {
			const textElement = createEmptyElement(ElementType.Text);
			expect(ElementsUtils.isFixedHeightElement(textElement)).toBe(false);
		});

		test("should return false if element is line", () => {
			const lineElement = createEmptyElement(ElementType.Line);
			expect(ElementsUtils.isFixedHeightElement(lineElement)).toBe(false);
		});

		test("should return false if element is table", () => {
			const tableElement = createEmptyElement(ElementType.Table);
			expect(ElementsUtils.isFixedHeightElement(tableElement)).toBe(false);
		});

		test("should return false if element is expression", () => {
			const expressionElement = createEmptyElement(ElementType.Expression);
			expect(ElementsUtils.isFixedHeightElement(expressionElement)).toBe(false);
		});

		test("should return false if element is listing", () => {
			const listingElement = createEmptyElement(ElementType.Listing);
			expect(ElementsUtils.isFixedHeightElement(listingElement)).toBe(false);
		});

		test("should return false if element is table layout", () => {
			const tableLayoutElement = createEmptyElement(ElementType.TableLayout);
			expect(ElementsUtils.isFixedHeightElement(tableLayoutElement)).toBe(false);
		});

		test("should return true if element is image", () => {
			const imageElement = createEmptyElement(ElementType.Image);
			expect(ElementsUtils.isFixedHeightElement(imageElement)).toBe(true);
		});

		test("should return true if element is line chart", () => {
			const lineChartElement = createEmptyElement(ElementType.LineChart);
			expect(ElementsUtils.isFixedHeightElement(lineChartElement)).toBe(true);
		});

		test("should return true if element is bar chart", () => {
			const barChartElement = createEmptyElement(ElementType.BarChart);
			expect(ElementsUtils.isFixedHeightElement(barChartElement)).toBe(true);
		});

		test("should return true if element is pie chart", () => {
			const pieChartElement = createEmptyElement(ElementType.PieChart);
			expect(ElementsUtils.isFixedHeightElement(pieChartElement)).toBe(true);
		});

		test("should return true if element is bounding box", () => {
			const boundingBoxElement = createEmptyElement(ElementType.BoundingBox);
			expect(ElementsUtils.isFixedHeightElement(boundingBoxElement)).toBe(true);
		});

		test("should return true if element is area", () => {
			const areaElement = createEmptyElement(ElementType.Area);
			expect(ElementsUtils.isFixedHeightElement(areaElement)).toBe(true);
		});

		test("should return false if element is override", () => {
			const overrideElement = createEmptyElement(ElementType.Override);
			expect(ElementsUtils.isFixedHeightElement(overrideElement)).toBe(false);
		});
	});

	describe("getFixedElementHeight", () => {
		const placeable: PartialValidPlaceableReference = createPartialValidReference(0, 0, 50, 50);
		test("should return height of bar chart when element is bar chart", () => {
			const barChartElement: PartialBarChart = {
				id: nanoid(),
				type: ElementType.BarChart,
				barChart: {
					id: nanoid(),
					dimensions: {
						id: nanoid(),
						height: {
							id: "",
							value: 30,
							unit: MeasureUnit.Millimeter,
						},
						width: {
							id: "",
							value: 30,
							unit: MeasureUnit.Millimeter,
						},
					},
				},
			};
			expect(ElementsUtils.getFixedElementHeight(barChartElement, placeable)).toEqual(
				barChartElement.barChart?.dimensions?.height?.value
			);
		});

		test("should return height of line chart when element is line chart", () => {
			const lineChartElement: PartialLineChart = {
				id: nanoid(),
				type: ElementType.LineChart,
				lineChart: {
					id: nanoid(),
					dimensions: {
						id: nanoid(),
						height: {
							id: "",
							value: 30,
							unit: MeasureUnit.Millimeter,
						},
						width: {
							id: "",
							value: 30,
							unit: MeasureUnit.Millimeter,
						},
					},
				},
			};
			expect(ElementsUtils.getFixedElementHeight(lineChartElement, placeable)).toEqual(
				lineChartElement.lineChart?.dimensions?.height?.value
			);
		});

		test("should return height of pie chart when element is pie chart", () => {
			const pieChartElement: PartialPieChart = {
				id: nanoid(),
				type: ElementType.PieChart,
				pieChart: {
					id: nanoid(),
					dimensions: {
						id: nanoid(),
						height: {
							id: "",
							value: 30,
							unit: MeasureUnit.Millimeter,
						},
						width: {
							id: "",
							value: 30,
							unit: MeasureUnit.Millimeter,
						},
					},
				},
			};
			expect(ElementsUtils.getFixedElementHeight(pieChartElement, placeable)).toEqual(
				pieChartElement.pieChart?.dimensions?.height?.value
			);
		});

		test("should return height of image when element is image", () => {
			const imageElement: PartialImage = {
				id: nanoid(),
				type: ElementType.Image,
				image: {
					id: nanoid(),
					dimensions: {
						id: nanoid(),
						height: {
							id: "",
							value: 30,
							unit: MeasureUnit.Millimeter,
						},
						width: {
							id: "",
							value: 30,
							unit: MeasureUnit.Millimeter,
						},
					},
				},
			};
			expect(ElementsUtils.getFixedElementHeight(imageElement, placeable)).toEqual(
				imageElement.image?.dimensions?.height?.value
			);
		});

		test("should return height of placeable when element is image and does not have height", () => {
			const imageElement = createEmptyElement(ElementType.Image);
			expect(ElementsUtils.getFixedElementHeight(imageElement, placeable)).toEqual(
				placeable.dimensions.minHeight.value
			);
		});

		test("should return undefine if element is not fixed element height", () => {
			const notFixedElements = Object.values(ElementType).reduce(
				(elements: PartialAnyPrintModelElement[], type) => {
					if (typeof type === "string" && !ElementsUtils.isFixedHeightElement(createEmptyElement(type))) {
						elements = [...elements, createEmptyElement(type)];
					}
					return elements;
				},
				[]
			);
			notFixedElements.forEach(element => {
				expect(ElementsUtils.getFixedElementHeight(element, placeable)).toEqual(undefined);
			});
		});
	});

	describe("getElementStyles", () => {
		const placeable: PartialValidPlaceableReference = createPartialValidReference(0, 0, 50, 50);
		const textStyle: PartialTextStyle = { id: nanoid(), fontSize: 12, lineHeight: 10 };
		const expectedStyles = {
			height: "100%",
			lineHeight: "inherit",
			fontSize: "inherit",
			borderColor: "#fff",
			borderWidth: "12pt",
			borderStyle: BorderStyle.Solid,
			fontWeight: "bold",
			textDecoration: "underline",
			fontStyle: "italic",
			fontFamily: "print_font_default",
			backgroundColor: "#000",
			color: "#fff",
			textAlign: "right",
		};

		test("should return correct styles for text element with an empty text style", () => {
			const textElement = createElementWithProperties(ElementType.Text);
			expect(
				ElementsUtils.getElementStyles(textElement, TEXT_PROPERTIES_PATH, placeable, false, { id: "" }, {})
			).toStrictEqual(expectedStyles);
		});

		test("should return correct styles for text element with an text style and fonts", () => {
			const font = "Noto Sans Symbols";
			const textElement = createElementWithProperties(ElementType.Text);
			expect(
				ElementsUtils.getElementStyles(
					textElement,
					TEXT_PROPERTIES_PATH,
					placeable,
					false,
					{ ...textStyle, font },
					{
						"Noto Sans Symbols": {
							name: "Noto Sans Symbols",
							fontFamily: "Noto Sans Symbols",
							isReconfigured: false,
							isDefault: false,
							url: "http://example",
						},
					}
				)
			).toStrictEqual({
				...expectedStyles,
				fontSize: `${textStyle.fontSize}pt`,
				lineHeight: `${textStyle.lineHeight}pt`,
				fontFamily: `print_font_${font}`,
			});
		});

		test("should return correct styles if text element is nested element", () => {
			const textElement = createElementWithProperties(ElementType.Text);
			expect(
				ElementsUtils.getElementStyles(textElement, TEXT_PROPERTIES_PATH, placeable, true, textStyle, {})
			).toStrictEqual({
				...expectedStyles,
				fontSize: `${textStyle.fontSize}pt`,
				lineHeight: `${textStyle.lineHeight}pt`,
				borderColor: undefined,
				borderWidth: undefined,
				borderStyle: undefined,
			});
		});

		test("should return correct styles for line element with a border style", () => {
			const lineElement: PartialLine = {
				type: ElementType.Line,
				id: nanoid(),
				borderProperties: {
					id: nanoid(),
					borderStyle: BorderStyle.Solid,
					borderWidth: 12,
					borderColor: "#fff",
				},
			};

			expect(
				ElementsUtils.getElementStyles(lineElement, TEXT_PROPERTIES_PATH, placeable, false, textStyle, {})
			).toEqual({
				borderStyle: `${BorderStyle.Solid} none none none`,
				borderWidth: "12pt",
				borderColor: "#fff",
			});
		});

		test("should return correct styles for line element with none border style", () => {
			const lineElement: PartialLine = {
				type: ElementType.Line,
				id: nanoid(),
				borderProperties: {
					id: nanoid(),
				},
			};
			expect(
				ElementsUtils.getElementStyles(lineElement, TEXT_PROPERTIES_PATH, placeable, false, textStyle, {})
			).toEqual({
				borderStyle: undefined,
			});
		});

		test("should return empty styles for table element", () => {
			const listingElement = createElementWithProperties(ElementType.Table);
			expect(
				ElementsUtils.getElementStyles(listingElement, TEXT_PROPERTIES_PATH, placeable, false, textStyle, {})
			).toStrictEqual({});
		});

		test("should return correct styles for image element", () => {
			const imageElement: PartialImage = {
				type: ElementType.Image,
				id: nanoid(),
				image: {
					id: nanoid(),
					dimensions: {
						id: nanoid(),
						height: {
							id: nanoid(),
							value: 4,
							unit: MeasureUnit.Millimeter,
						},
						width: {
							id: nanoid(),
							value: 5,
							unit: MeasureUnit.Millimeter,
						},
					},
				},
			};
			expect(
				ElementsUtils.getElementStyles(imageElement, TEXT_PROPERTIES_PATH, placeable, false, textStyle, {})
			).toStrictEqual({
				height: 200,
				width: 200,
			});
		});

		test("should return correct styles for expression element with an empty text style", () => {
			const expressionElement = createElementWithProperties(ElementType.Expression);

			expect(
				ElementsUtils.getElementStyles(
					expressionElement,
					TEXT_PROPERTIES_PATH,
					placeable,
					false,
					{ id: "" },
					{}
				)
			).toStrictEqual({
				...expectedStyles,
			});
		});

		test("should return correct styles for expression element with a text style", () => {
			const expressionElement = createElementWithProperties(ElementType.Expression);

			expect(
				ElementsUtils.getElementStyles(expressionElement, TEXT_PROPERTIES_PATH, placeable, false, textStyle, {})
			).toStrictEqual({
				...expectedStyles,
				fontSize: `${textStyle.fontSize}pt`,
				lineHeight: `${textStyle.lineHeight}pt`,
			});
		});

		test("should return empty styles for listing element", () => {
			const listingElement = createElementWithProperties(ElementType.Listing);
			expect(
				ElementsUtils.getElementStyles(listingElement, TEXT_PROPERTIES_PATH, placeable, false, textStyle, {})
			).toStrictEqual({});
		});

		test("should return empty styles for table layout element", () => {
			const tableLayoutElement = createElementWithProperties(ElementType.TableLayout);
			expect(
				ElementsUtils.getElementStyles(
					tableLayoutElement,
					TEXT_PROPERTIES_PATH,
					placeable,
					false,
					textStyle,
					{}
				)
			).toStrictEqual({});
		});

		test("should return empty styles for line chart element", () => {
			const lineChartElement = createElementWithProperties(ElementType.LineChart);
			expect(
				ElementsUtils.getElementStyles(lineChartElement, TEXT_PROPERTIES_PATH, placeable, false, textStyle, {})
			).toStrictEqual({});
		});

		test("should return empty styles for bar chart element", () => {
			const barChartElement = createElementWithProperties(ElementType.BarChart);
			expect(
				ElementsUtils.getElementStyles(barChartElement, TEXT_PROPERTIES_PATH, placeable, false, textStyle, {})
			).toStrictEqual({});
		});

		test("should return empty styles for pie chart element", () => {
			const pieChartElement = createElementWithProperties(ElementType.PieChart);
			expect(
				ElementsUtils.getElementStyles(pieChartElement, TEXT_PROPERTIES_PATH, placeable, false, textStyle, {})
			).toStrictEqual({});
		});

		test("should return correct styles for bounding box element", () => {
			const boundingBoxElement: PartialBoundingBox = {
				type: ElementType.BoundingBox,
				id: nanoid(),
				boundingBox: {
					id: nanoid(),
					dimensions: {
						id: nanoid(),
						height: {
							id: nanoid(),
							value: 4,
							unit: MeasureUnit.Millimeter,
						},
						width: {
							id: nanoid(),
							value: 5,
							unit: MeasureUnit.Millimeter,
						},
					},
				},
				borderProperties: {
					id: nanoid(),
					borderStyle: BorderStyle.Solid,
					borderWidth: 12,
					borderColor: "#fff",
				},
			};

			expect(
				ElementsUtils.getElementStyles(
					boundingBoxElement,
					TEXT_PROPERTIES_PATH,
					placeable,
					false,
					textStyle,
					{}
				)
			).toStrictEqual({
				overflow: "hidden",
				position: "absolute",
				height: "100%",
				width: "100%",
				inset: 0,
				outlineStyle: BorderStyle.Solid,
				outlineColor: "#fff",
				outlineWidth: "12pt",
				outlineOffset: "-12pt",
			});
		});

		test("should return correct styles for area element", () => {
			const areaElement: PartialArea = {
				type: ElementType.Area,
				id: nanoid(),
				area: {
					id: nanoid(),
					dimensions: {
						id: nanoid(),
						height: {
							id: nanoid(),
							value: 5,
							unit: MeasureUnit.Millimeter,
						},
						width: {
							id: nanoid(),
							value: 6,
							unit: MeasureUnit.Millimeter,
						},
					},
				},
				borderProperties: {
					id: nanoid(),
					borderStyle: BorderStyle.Solid,
					borderWidth: 12,
					borderColor: "#fff",
				},
			};
			expect(
				ElementsUtils.getElementStyles(areaElement, TEXT_PROPERTIES_PATH, placeable, false, textStyle, {})
			).toStrictEqual({
				overflow: "hidden",
				position: "absolute",
				height: "100%",
				width: "100%",
				inset: 0,
				outlineStyle: BorderStyle.Solid,
				outlineColor: "#fff",
				outlineWidth: "12pt",
				outlineOffset: "-12pt",
			});
		});

		test("should return correct styles for override element", () => {
			const overrideElement = createEmptyElement(ElementType.Override);
			expect(
				ElementsUtils.getElementStyles(overrideElement, TEXT_PROPERTIES_PATH, placeable, false, textStyle, {})
			).toStrictEqual({
				height: "100%",
			});
		});

		test("should return styles with 'white-space: pre-line' if the element is a nested element and not Text element", () => {
			Object.keys(ElementType).forEach(el => {
				if (el !== ElementType.Text) {
					const element = createEmptyElement(el as ElementType);
					expect(
						ElementsUtils.getElementStyles(element, TEXT_PROPERTIES_PATH, placeable, true, textStyle, {})
							.whiteSpace
					).toEqual("pre-line");
				}
			});
		});
	});

	describe("getElementReferences", () => {
		test("should return entities for text element", () => {
			const entities: PartialPlaceableReference[] = createPartialPlaceableReference(3);
			const textElement: PartialText = {
				type: ElementType.Text,
				id: nanoid(),
				text: {
					id: nanoid(),
					entities,
				},
			};

			expect(ElementsUtils.getElementReferences(textElement)).toStrictEqual(entities);
		});

		test("should return cells for table layout element", () => {
			const cells: PartialPlaceableReference[] = createPartialPlaceableReference(1);
			const tableLayoutElement: PartialTableLayout = {
				type: ElementType.TableLayout,
				id: nanoid(),
				tableLayout: {
					id: nanoid(),
					cells,
				},
			};

			expect(ElementsUtils.getElementReferences(tableLayoutElement)).toStrictEqual(cells);
		});

		test("should return columns for table element", () => {
			const columns: PartialPlaceableReference[] = createPartialPlaceableReference(4);
			const tableElement: PartialTable = {
				type: ElementType.Table,
				id: nanoid(),
				table: {
					id: nanoid(),
					columns,
				},
			};

			expect(ElementsUtils.getElementReferences(tableElement)).toStrictEqual(columns);
		});

		test("should return elementReferences for bounding box element", () => {
			const elementReferences: PartialPlaceableReference[] = createPartialPlaceableReference(3);
			const boundingBoxElement: PartialBoundingBox = {
				type: ElementType.BoundingBox,
				id: nanoid(),
				boundingBox: {
					id: nanoid(),
					elementReferences,
				},
			};

			expect(ElementsUtils.getElementReferences(boundingBoxElement)).toStrictEqual(elementReferences);
		});

		test("should return elementReferences for override element", () => {
			const elementReferences: PartialPlaceableReference[] = createPartialPlaceableReference(2);
			const overrideElement: PartialOverride = {
				type: ElementType.Override,
				id: nanoid(),
				override: {
					id: nanoid(),
					boundingBox: {
						id: nanoid(),
						elementReferences,
					},
				},
			};

			expect(ElementsUtils.getElementReferences(overrideElement)).toStrictEqual(elementReferences);
		});

		test("should return elementReferences for area element", () => {
			const elementReferences: PartialPlaceableReference[] = createPartialPlaceableReference(2);
			const areaElement: PartialArea = {
				type: ElementType.Area,
				id: nanoid(),
				area: {
					id: nanoid(),
					elementReferences,
				},
			};

			expect(ElementsUtils.getElementReferences(areaElement)).toStrictEqual(elementReferences);
		});

		test("should return empty array for expression element", () => {
			const expressionElement = createEmptyElement(ElementType.Expression);
			expect(ElementsUtils.getElementReferences(expressionElement)).toStrictEqual([]);
		});

		test("should return empty array for listing element", () => {
			const listingElement = createEmptyElement(ElementType.Listing);
			expect(ElementsUtils.getElementReferences(listingElement)).toStrictEqual([]);
		});

		test("should return empty array for image element", () => {
			const imageElement = createEmptyElement(ElementType.Image);
			expect(ElementsUtils.getElementReferences(imageElement)).toStrictEqual([]);
		});

		test("should return empty array for line element", () => {
			const lineElement = createEmptyElement(ElementType.Line);
			expect(ElementsUtils.getElementReferences(lineElement)).toStrictEqual([]);
		});

		test("should return empty array for bar chart element", () => {
			const barChartElement = createEmptyElement(ElementType.BarChart);
			expect(ElementsUtils.getElementReferences(barChartElement)).toStrictEqual([]);
		});

		test("should return empty array for line chart element", () => {
			const lineChartElement = createEmptyElement(ElementType.LineChart);
			expect(ElementsUtils.getElementReferences(lineChartElement)).toStrictEqual([]);
		});

		test("should return empty array for pie chart element", () => {
			const pieChartElement = createEmptyElement(ElementType.PieChart);
			expect(ElementsUtils.getElementReferences(pieChartElement)).toStrictEqual([]);
		});
	});

	describe("getActualTopPosition", () => {
		test("should return correct position with margins", () => {
			const reference: PartialValidPlaceableReference = {
				...createPartialValidReference(0, 50, 10, 10),
				margins: {
					id: nanoid(),
					top: {
						id: nanoid(),
						type: MarginType.EXPLICIT,
						margin: {
							id: nanoid(),
							value: 20,
							unit: MeasureUnit.Millimeter,
						},
					},
				},
			};
			expect(ElementsUtils.getActualTopPosition(reference)).toEqual(30);
		});

		test("should return correct position without margins", () => {
			const reference = createPartialValidReference(0, 50, 10, 10);
			expect(ElementsUtils.getActualTopPosition(reference)).toEqual(50);
		});
	});

	describe("getActualBottomPosition", () => {
		test("should return correct position with margins", () => {
			const y = 50;
			const minHeight = 10;
			const bottomMargin = 20;
			const reference: PartialValidPlaceableReference = {
				...createPartialValidReference(0, y, minHeight, 20),
				margins: {
					id: nanoid(),
					bottom: {
						id: nanoid(),
						type: MarginType.EXPLICIT,
						margin: {
							id: nanoid(),
							value: bottomMargin,
							unit: MeasureUnit.Millimeter,
						},
					},
				},
			};
			expect(ElementsUtils.getActualBottomPosition(reference)).toEqual(y + minHeight + bottomMargin);
		});

		test("should return correct position without margins", () => {
			const y = 50;
			const minHeight = 10;
			const reference = createPartialValidReference(0, y, minHeight, 20);
			expect(ElementsUtils.getActualBottomPosition(reference)).toEqual(y + minHeight);
		});
	});
});

function createEmptyElement(type: ElementType): PartialAnyPrintModelElement {
	return {
		id: nanoid(),
		type: type,
	};
}

function createElementWithProperties(type: ElementType): PartialAnyPrintModelElement {
	return {
		type: type,
		id: nanoid(),
		borderProperties: {
			id: nanoid(),
			borderStyle: BorderStyle.Solid,
			borderWidth: 12,
			borderColor: "#fff",
		},
		textProperties: {
			id: nanoid(),
			color: {
				id: "nz0ZXHR730XA_ajw5afbT",
				path: "/content/elementDefinitions/table/headerTextProperties/color/value/",
				source: PossibleInputSource.INPUT,
				value: "#fff",
			},
			backgroundColor: {
				id: "Y9uyNsluzTZwOt9Ub0iF4",
				path: "/content/elementDefinitions/table/headerTextProperties/backgroundColor/value/",
				source: PossibleInputSource.INPUT,
				value: "#000",
			},
			alignment: {
				id: "m_BlwcJI7C41oXzIaK9tI",
				path: "/content/elementDefinitions/table/headerTextProperties/alignment/value/",
				source: PossibleInputSource.INPUT,
				value: Alignment.Right,
			},
			bold: {
				id: "oJTiaBnpuIPk6WjYeaSlw",
				path: "/content/elementDefinitions/table/headerTextProperties/bold/value/",
				source: PossibleInputSource.INPUT,
				value: true,
			},
			italic: {
				id: "O0Q6bW6RgVy0AJYg5bPxb",
				path: "/content/elementDefinitions/table/headerTextProperties/italic/value/",
				source: PossibleInputSource.INPUT,
				value: true,
			},
			underlined: {
				id: "pzKKjFPHYQTA4moxL8Uif",
				path: "/content/elementDefinitions/table/headerTextProperties/underlined/value/",
				source: PossibleInputSource.INPUT,
				value: true,
			},
		},
	};
}

function createPartialPlaceableReference(length: number): PartialPlaceableReference[] {
	return new Array(length).fill({
		id: nanoid(),
		refId: nanoid(),
	});
}

function createPartialValidReference(
	x: number,
	y: number,
	minHeight: number,
	minWidth: number
): PartialValidPlaceableReference {
	return {
		id: nanoid(),
		refId: nanoid(),
		position: {
			id: nanoid(),
			y: {
				id: nanoid(),
				value: y,
				unit: MeasureUnit.Millimeter,
			},
			x: {
				id: nanoid(),
				value: x,
				unit: MeasureUnit.Millimeter,
			},
		},
		dimensions: {
			id: nanoid(),
			minHeight: {
				id: nanoid(),
				value: minHeight,
				unit: MeasureUnit.Millimeter,
			},
			minWidth: {
				id: nanoid(),
				value: minWidth,
				unit: MeasureUnit.Millimeter,
			},
		},
	};
}
