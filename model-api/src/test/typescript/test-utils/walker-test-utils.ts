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
import printModelFixture from "../../resources/print-models/PrintModel-with-text.json" with { type: "json" };
import {
	type PartialArea,
	type PartialBarChart,
	type PartialBoundingBox,
	type PartialCalculation,
	type PartialExpression,
	type PartialField,
	type PartialImage,
	type PartialLine,
	type PartialLineChart,
	type PartialListing,
	type PartialOverride,
	type PartialPieChart,
	type PartialSwitch,
	type PartialTable,
	type PartialTableLayout,
	ChartOrientation,
	ElementType,
	ImageSrcType,
	MeasureUnit,
	PageOrientation,
	PossibleInputSource,
	SectionUsage,
	type PartialPrintModel,
	type PrintModel,
	type PrintModelContent,
	type PartialSegment,
	SegmentType,
	type PartialSection,
	type PartialWatermark,
} from "../../../main/typescript/index.js";

export function deserializeFixture(raw: typeof printModelFixture): PrintModel {
	const model = JSON.parse(JSON.stringify(raw));
	const { general } = model.content;
	general.structure = general.structure.map((s: { id: string }) => s.id);
	general.sections = general.sections.map((s: { id: string }) => s.id);
	general.textStyles = general.textStyles.map((s: { id: string }) => s.id);
	general.watermarks = general.watermarks.map((s: { id: string }) => s.id);
	return model as PrintModel;
}

export function makeMeasure(value: number) {
	return { id: `m-${value}`, value, unit: MeasureUnit.Millimeter };
}

export function makePlaceableRef(id: string, refId: string) {
	return {
		id,
		refId,
		position: { id: `pos-${id}`, x: makeMeasure(10), y: makeMeasure(10) },
		dimensions: { id: `dim-${id}`, minWidth: makeMeasure(50), minHeight: makeMeasure(20) },
		hideConditions: [],
		screenReadingOrder: { id: `sro-${id}`, screenReadingOrderWeight: 0 },
		pageBreakBehavior: { id: `pbb-${id}`, source: PossibleInputSource.DEFAULT, path: "" },
	};
}

export function createComplexPartialModel(): PartialPrintModel {
	const segmentId = "seg-1";
	const sectionId = "sec-1";
	const watermarkId = "wm-1";

	const fieldElement: PartialField = {
		id: "el-field",
		type: ElementType.Field,
		field: { id: "f-1", model: "DomainText", path: "/field" },
		borderProperties: {
			id: "bp-field",
			borderWidth: { id: "bw-1", source: PossibleInputSource.DEFAULT, path: "" },
			borderColor: { id: "bc-1", source: PossibleInputSource.DEFAULT, path: "" },
			borderStyle: { id: "bs-1", source: PossibleInputSource.UNSET, path: "" },
		},
	};

	const calcElement: PartialCalculation = {
		id: "el-calc",
		type: ElementType.Calculation,
		calculation: {
			id: "c-1",
			name: "Calc",
			model: "DomainText",
			computationAlternatives: [{ id: "ca-1", operation: "1+1" }],
		},
	};

	const listingElement: PartialListing = {
		id: "el-listing",
		type: ElementType.Listing,
		listing: { id: "l-1", basePath: "/items", model: "DomainText" },
	};

	const imageElement: PartialImage = {
		id: "el-image",
		type: ElementType.Image,
		image: { id: "img-1", alternativeText: "alt", imageSrcType: ImageSrcType.Static },
	};

	const lineElement: PartialLine = { id: "el-line", type: ElementType.Line };

	const expressionElement: PartialExpression = {
		id: "el-expression",
		type: ElementType.Expression,
		expression: { id: "exp-1", basePath: "/expr", text: "hello", model: "DomainText" },
	};

	const barChartElement: PartialBarChart = {
		id: "el-barchart",
		type: ElementType.BarChart,
		barChart: {
			id: "bar-1",
			basePath: "/bar",
			model: "DomainText",
			dimensions: { id: "bd-1", width: makeMeasure(100), height: makeMeasure(80) },
			orientation: ChartOrientation.Vertical,
		},
	};

	const lineChartElement: PartialLineChart = {
		id: "el-linechart",
		type: ElementType.LineChart,
		lineChart: {
			id: "lc-1",
			basePath: "/lc",
			model: "DomainText",
			dimensions: { id: "lcd-1", width: makeMeasure(100), height: makeMeasure(80) },
			orientation: ChartOrientation.Vertical,
		},
	};

	const pieChartElement: PartialPieChart = {
		id: "el-piechart",
		type: ElementType.PieChart,
		pieChart: {
			id: "pc-1",
			basePath: "/pc",
			model: "DomainText",
			dimensions: { id: "pcd-1", width: makeMeasure(100), height: makeMeasure(80) },
		},
	};

	const tableElement: PartialTable = {
		id: "el-table",
		type: ElementType.Table,
		table: {
			id: "t-1",
			basePath: "/table",
			model: "DomainText",
			columns: [{ id: "col-ref-1", refId: "el-field" }],
		},
	};

	const tableLayoutElement: PartialTableLayout = {
		id: "el-tablelayout",
		type: ElementType.TableLayout,
		tableLayout: {
			id: "tl-1",
			rowCount: 2,
			columnCount: 2,
			cells: [{ id: "cell-ref-1", refId: "el-calc", row: 0, column: 0 }],
		},
	};

	const boundingBoxElement: PartialBoundingBox = {
		id: "el-bbox",
		type: ElementType.BoundingBox,
		boundingBox: {
			id: "bb-1",
			dimensions: { id: "bbd-1", width: makeMeasure(100), height: makeMeasure(50) },
			elementReferences: [makePlaceableRef("bb-ref-1", "el-line")],
		},
	};

	const areaElement: PartialArea = {
		id: "el-area",
		type: ElementType.Area,
		area: {
			id: "a-1",
			dimensions: { id: "ad-1", width: makeMeasure(100), height: makeMeasure(50) },
			elementReferences: [makePlaceableRef("area-ref-1", "el-image")],
		},
	};

	const overrideElement: PartialOverride = {
		id: "el-override",
		type: ElementType.Override,
		override: {
			id: "ov-1",
			refId: "el-bbox",
			boundingBox: {
				id: "ov-bb-1",
				elementReferences: [makePlaceableRef("ov-ref-1", "el-field")],
			},
		},
	};

	const switchElement: PartialSwitch = {
		id: "el-switch",
		type: ElementType.Switch,
		switch: {
			id: "sw-1",
			dimensions: { id: "swd-1", width: makeMeasure(100), height: makeMeasure(50) },
			cases: [{ id: "case-ref-1", refId: "el-calc" }],
		},
	};

	const allElements = [
		fieldElement,
		calcElement,
		listingElement,
		imageElement,
		lineElement,
		expressionElement,
		barChartElement,
		lineChartElement,
		pieChartElement,
		tableElement,
		tableLayoutElement,
		boundingBoxElement,
		areaElement,
		overrideElement,
		switchElement,
	];

	const segment: PartialSegment = {
		id: segmentId,
		title: "Main Segment",
		type: SegmentType.Default,
		elementReferences: allElements.map(el => makePlaceableRef(`ref-${el.id}`, el.id)),
		dataContexts: [],
	};

	const section: PartialSection = {
		id: sectionId,
		title: "Section 1",
		pageOrientation: PageOrientation.Portrait,
		sectionUsage: SectionUsage.First,
		elementReferences: [makePlaceableRef("sec-ref-1", "el-field")],
	};

	const watermark: PartialWatermark = {
		id: watermarkId,
		title: "Watermark 1",
		pageOrientation: PageOrientation.Portrait,
		elementReferences: [makePlaceableRef("wm-ref-1", "el-image")],
	};

	return {
		header: { id: "complex-model", modelType: "print", modelVersion: "4.0.0-rc.1" },
		content: {
			id: "content-1",
			general: {
				id: "general-1",
				metadata: { id: "meta-1", titleComputation: [], descriptionComputation: [] },
				segmentDefaults: { id: "sd-1", fontSize: 12 },
				runtimeVariables: [],
				textStyles: [],
				structure: [segmentId],
				sections: [sectionId],
				watermarks: [watermarkId],
			},
			segments: { id: "segs-1", definitions: [segment], references: [] },
			elementDefinitions: allElements,
			textStyles: { id: "ts-1", definitions: [] },
			sections: { id: "secdefs-1", definitions: [section] },
			watermarks: { id: "wmdefs-1", definitions: [watermark] },
		},
	};
}

export function createComplexModel(): PrintModel {
	const partial = createComplexPartialModel();
	const content = partial.content as PrintModelContent;
	const general = content.general;
	const sections = content.sections;
	if (sections === undefined) {
		throw new Error("sections expected to be defined in complex model");
	}
	const partialSection = sections.definitions?.[0];
	return {
		...partial,
		header: { ...partial.header, description: "" },
		content: {
			...content,
			general: {
				...general,
				metadata: {
					...general.metadata,
					authorComputation: [],
					languageComputation: [],
				},
			},
			sections: {
				id: sections.id,
				definitions: [
					{
						...partialSection,
						sectionUsage: SectionUsage.First,
						pageOrientation: PageOrientation.Portrait,
						headerHeight: { id: "hh-1", value: 10, unit: MeasureUnit.Millimeter },
						footerHeight: { id: "fh-1", value: 15, unit: MeasureUnit.Millimeter },
					},
				],
			},
		},
	} as unknown as PrintModel;
}
