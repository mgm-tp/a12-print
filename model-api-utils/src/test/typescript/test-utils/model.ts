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
	Area,
	BoundingBox,
	ElementType,
	Field,
	Language,
	MeasureUnit,
	Override,
	OverrideType,
	PageOrientation,
	PieChart,
	PrintModel,
	PrintModelContent,
	PrintModelContentGeneral,
	PrintModelElement,
	PrintModelHeader,
	ReferenceType,
	Section,
	SectionsContainer,
	SectionUsage,
	Segment,
	SegmentType,
	SourceType,
	Table,
	TableLayout,
	Text,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { PRINT_MODEL_VERSION } from "@com.mgmtp.a12.print/print-model-api/lib/constant/model.js";
import { PossibleInputSource } from "@com.mgmtp.a12.print/print-model-api/lib/input-source/input-source.js";
import { PRINT_MODEL_CONTENT_GENERAL_LOG_ID } from "@com.mgmtp.a12.print/print-model-api/lib/model/constant.js";

function getMmMeasure(value: number) {
	return {
		id: nanoid(),
		value,
		unit: MeasureUnit.Millimeter,
	};
}

export const printHeader: PrintModelHeader = {
	id: "print-header-id",
	modelType: "print",
	modelVersion: PRINT_MODEL_VERSION,
	description: "general printmodel description",
};

export const general: PrintModelContentGeneral = {
	id: PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
	metadata: {
		id: "mig2m4g42",
		authorComputation: [{ id: "authComp123", operation: '"tony"' }],
		languageComputation: [{ id: "langComp123", operation: '"DE"' }],
		titleComputation: [{ id: "titleComp123", operation: '"myTestPrintModel123"' }],
		descriptionComputation: [{ id: "titleComp123", operation: '"general printmodel description"' }],
	},
	details: {
		id: "mig2m4g42",
		author: "tony",
		language: Language.DE,
	},
	title: "myTestPrintModel123",
	segmentDefaults: {
		id: ",khgpo,hp534",
		fontSize: 12,
		model: "documentModelId123",
	},
	structure: ["myFirstSegment", "mySecondSegment"],
};

export const generalWithSection: PrintModelContentGeneral = {
	id: PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
	metadata: {
		id: "mig2m4g42",
		authorComputation: [{ id: "authComp123", operation: '"tony"' }],
		languageComputation: [{ id: "langComp123", operation: '"DE"' }],
		titleComputation: [{ id: "titleComp123", operation: '"myTestPrintModel123"' }],
		descriptionComputation: [{ id: "titleComp123", operation: '"general printmodel description"' }],
	},
	details: {
		id: "mig2m4g42",
		author: "tony",
		language: Language.DE,
	},
	title: "myTestPrintModel123",
	segmentDefaults: {
		id: ",khgpo,hp534",
		fontSize: 12,
		model: "documentModelId123",
	},
	structure: ["myFirstSegment", "mySecondSegment"],
	sections: ["sectionId"],
};

export const segment1: Segment = {
	id: "myFirstSegment",
	title: "myFirstSegment",
	type: SegmentType.Default,
	defaultSegment: { id: "mjkgo9043kmh53h", pageOrientation: PageOrientation.Portrait },
	elementReferences: [
		{
			id: "ogprwk3hp453h35",
			dimensions: {
				id: "g,rpwh3",
				minHeight: getMmMeasure(6),
				minWidth: getMmMeasure(20),
			},
			position: {
				id: "kgh503h54",
				x: getMmMeasure(5),
				y: getMmMeasure(10),
			},
			refId: "textWithField123",
			screenReadingOrder: {
				id: "gmko35,hp4oj6",
				screenReadingOrderWeight: 0,
			},
			pageBreakBehavior: {
				id: "qzp760d44",
				source: PossibleInputSource.DEFAULT,
				path: "/content/segments/elementReferences/pageBreakBehavior/value/",
			},
		},
		{
			id: "okgh5ohm54h",
			dimensions: {
				id: "hmlonm65o",
				minHeight: getMmMeasure(10),
				minWidth: getMmMeasure(10),
			},
			position: {
				id: "kg0o54khj6",
				x: getMmMeasure(5),
				y: getMmMeasure(10),
			},
			refId: "someTableLayoutId123",
			screenReadingOrder: {
				id: "kgb53kh54",
				screenReadingOrderWeight: 1,
			},
			pageBreakBehavior: {
				id: "tbc912r33",
				source: PossibleInputSource.DEFAULT,
				path: "/content/segments/elementReferences/pageBreakBehavior/value/",
			},
		},
		{
			id: "gk0h5k4h64h",
			dimensions: {
				id: "kg053h5",
				minHeight: getMmMeasure(75),
				minWidth: getMmMeasure(75),
			},
			position: {
				id: "kg053hk53",
				x: getMmMeasure(25),
				y: getMmMeasure(100),
			},
			refId: "somePieChart123",
			screenReadingOrder: {
				id: "gk430hk530",
				screenReadingOrderWeight: 2,
			},
			pageBreakBehavior: {
				id: "sld047f89",
				source: PossibleInputSource.DEFAULT,
				path: "/content/segments/elementReferences/pageBreakBehavior/value/",
			},
		},
	],
};

export const segment2: Segment = {
	id: "mySecondSegment",
	title: "mySecondSegment",
	type: SegmentType.Default,
	defaultSegment: {
		id: "kf40kg30gk530hk5",
		pageOrientation: PageOrientation.Landscape,
	},
	elementReferences: [
		{
			id: "glk50hjk64",
			dimensions: {
				id: "kh96kh046h4",
				minHeight: getMmMeasure(50),
				minWidth: getMmMeasure(100),
			},
			position: {
				id: "9kj5309hk350h53",
				x: getMmMeasure(2),
				y: getMmMeasure(2),
			},
			refId: "someTableId123",
			screenReadingOrder: {
				id: "bk54960kh05kh350",
				screenReadingOrderWeight: 0,
			},
			pageBreakBehavior: {
				id: "vwx635n21",
				source: PossibleInputSource.DEFAULT,
				path: "/content/segments/elementReferences/pageBreakBehavior/value/",
			},
		},
	],
};

export const segments: ReadonlyArray<Segment> = [segment1, segment2];

export const field: Field = {
	id: "Z41gKWNeSEqk0zmQkueXh",
	type: ElementType.Field,
	field: {
		id: "fk530ghk530h",
		model: "DomainPerson",
		path: "general/name",
	},
};

export const textWithField: Text = {
	id: "textWithField123",
	type: ElementType.Text,
	text: {
		id: "gk530hk530kh35",
		text: `<p>Have a nice day, <span entity-id="Z41gKWNeSEqk0zmQkueXh" entity-type="field">DomainPerson/general/name</span>.</p>`,
		entities: [
			{
				id: "kg03kh503hk3",
				refId: "Z41gKWNeSEqk0zmQkueXh",
			},
		],
	},
};

export const textWithoutRefs: Text = {
	id: "textWithoutRefs123",
	type: ElementType.Text,
	text: {
		id: "pwdlq0w3dk201",
		text: "Hello World. This is just a plain text element.",
		entities: [],
	},
};

export const tableLayout: TableLayout = {
	id: "someTableLayoutId123",
	type: ElementType.TableLayout,
	tableLayout: {
		id: "kb0tkn0tp,n64",
		columnCount: 2,
		rowCount: 3,
		cells: [
			{
				id: "gk5309hk503jh5",
				column: 0,
				row: 0,
				refId: "textWithoutRefs123",
			},
		],
	},
};

export const table: Table = {
	id: "someTableId123",
	type: ElementType.Table,
	table: {
		id: "lkbg5ß0l4j6ß04jl64",
		model: "DomainPerson",
		basePath: "general/phone",
		columns: [],
		sumLabel: {
			id: "lkbg5ß0l4j6ß04jl66",
			source: PossibleInputSource.UNSET,
			path: "/content/elementDefinitions/table/sumLabel/value",
		},
		maxRowCount: {
			id: "lkbg5ß0l4j6ß04jl67",
			source: PossibleInputSource.UNSET,
			path: "/content/elementDefinitions/table/maxRowCount/value/",
		},
		headerTextProperties: {
			id: "lkbg5ß0l4j6ß04jl57",
			bold: {
				id: "lkbg5ß0l4j6ß04jl67",
				source: PossibleInputSource.UNSET,
				path: "/content/elementDefinitions/table/headerTextProperties/bold/value/",
			},
			italic: {
				id: "lkbg5ß0l4j6ß04jl67",
				source: PossibleInputSource.UNSET,
				path: "/content/elementDefinitions/table/headerTextProperties/italic/value/",
			},
			underlined: {
				id: "lkbg5ß0l4j6ß04jl67",
				source: PossibleInputSource.UNSET,
				path: "/content/elementDefinitions/table/headerTextProperties/underlined/value/",
			},
			color: {
				id: "lkbg5ß0l4j6ß04jl67",
				source: PossibleInputSource.UNSET,
				path: "/content/elementDefinitions/table/headerTextProperties/color/value/",
			},
			backgroundColor: {
				id: "lkbg5ß0l4j6ß04jl67",
				source: PossibleInputSource.UNSET,
				path: "/content/elementDefinitions/table/headerTextProperties/backgroundColor/value/",
			},
		},
	},
};

export const pieChart: PieChart = {
	id: "somePieChart123",
	type: ElementType.PieChart,
	pieChart: {
		id: "kbg05g3kh503h",
		model: "DomainPerson",
		basePath: "general/statistics",
		dimensions: {
			id: "kb053k0nbh5",
			height: getMmMeasure(75),
			width: getMmMeasure(75),
		},
		title: {
			id: "db053k0nbh8",
			source: PossibleInputSource.UNSET,
			path: "/content/elementDefinitions/pieChart/title/value/",
		},
	},
};

export const area: Area = {
	id: "someArea123",
	type: ElementType.Area,
	area: {
		id: "kbg05g3k203h",
		dimensions: {
			id: "kb053k0nbh5",
			height: getMmMeasure(100),
			width: getMmMeasure(100),
			overflowHeight: getMmMeasure(0),
		},
		elementReferences: [
			{
				id: "someId",
				refId: "referencedId",
				dimensions: { id: "someId", minHeight: getMmMeasure(100), minWidth: getMmMeasure(100) },
				position: {
					id: "someId",
					y: getMmMeasure(10),
					x: getMmMeasure(20),
				},
				screenReadingOrder: { id: "someId", screenReadingOrderWeight: 1 },
				pageBreakBehavior: {
					id: "hfj298m60",
					source: PossibleInputSource.DEFAULT,
					path: "/content/segments/elementReferences/pageBreakBehavior/value/",
				},
			},
		],
	},
	borderProperties: {
		id: "someId",
	},
};

export const boundingBox: BoundingBox = {
	id: "someArea123",
	type: ElementType.BoundingBox,
	boundingBox: {
		id: "kbg05g3k203h",
		dimensions: {
			id: "kb053k0nbh5",
			height: getMmMeasure(100),
			width: getMmMeasure(100),
		},
		elementReferences: [
			{
				id: "someId",
				refId: "referencedId",
				dimensions: { id: "someId", minHeight: getMmMeasure(100), minWidth: getMmMeasure(100) },
				position: {
					id: "someId",
					y: getMmMeasure(30),
					x: getMmMeasure(50),
				},
				screenReadingOrder: { id: "someId", screenReadingOrderWeight: 1 },
				pageBreakBehavior: {
					id: "rqb451t78",
					source: PossibleInputSource.DEFAULT,
					path: "/content/segments/elementReferences/pageBreakBehavior/value/",
				},
			},
		],
	},
	borderProperties: {
		id: "someId",
	},
};

export const override: Override = {
	id: "someArea123",
	type: ElementType.Override,
	override: {
		id: "kbg05g3k203h",
		refId: "referenceId",
		boundingBox: {
			id: "someId",
			elementReferences: [
				{
					id: "someId",
					refId: "referencedId",
					dimensions: { id: "someId", minHeight: getMmMeasure(100), minWidth: getMmMeasure(100) },
					position: {
						id: "someId",
						y: getMmMeasure(30),
						x: getMmMeasure(50),
					},
					screenReadingOrder: { id: "someId", screenReadingOrderWeight: 1 },
					pageBreakBehavior: {
						id: "yuz806b12",
						source: PossibleInputSource.DEFAULT,
						path: "/content/segments/elementReferences/pageBreakBehavior/value/",
					},
				},
			],
		},
		overrideType: OverrideType.BoundingBox,
		source: {
			id: "someId",
			sourceType: SourceType.Reference,
			referenceElementId: "referenceSegmentId",
			referenceType: ReferenceType.Segment,
		},
	},
};

export const elementDefinitions: ReadonlyArray<PrintModelElement> = [
	textWithField,
	textWithoutRefs,
	field,
	tableLayout,
	pieChart,
	table,
];

export const section: Section = {
	id: "sectionId",
	title: "section",
	sectionUsage: SectionUsage.First,
	pageOrientation: PageOrientation.Portrait,
	footerHeight: {
		id: "id",
		unit: MeasureUnit.Millimeter,
		value: 12,
	},
	headerHeight: {
		id: "id",
		unit: MeasureUnit.Millimeter,
		value: 52,
	},
	elementReferences: [],
};

export const sectionContainer: SectionsContainer = {
	id: "sectionContainerId",
	definitions: [section],
};

export const printContent: PrintModelContent = {
	id: PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
	general,
	segments: {
		id: "gkl05phk,46p0j6",
		definitions: segments,
		references: [],
	},
	elementDefinitions,
};

export const printContentWithSection: PrintModelContent = {
	id: PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
	general: generalWithSection,
	segments: {
		id: "gkl05phk,46p0j6",
		definitions: segments,
		references: [],
	},
	elementDefinitions,
	sections: sectionContainer,
};

export const printModel: PrintModel = {
	header: printHeader,
	content: printContent,
};

export const printModelWithSection: PrintModel = {
	header: printHeader,
	content: printContentWithSection,
};
