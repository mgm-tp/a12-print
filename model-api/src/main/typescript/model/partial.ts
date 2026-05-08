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
import type { DeepPartial } from "../utils/type-utils.js";

import type {
	Area,
	BarChart,
	BoundingBox,
	Calculation,
	Expression,
	Field,
	Image,
	Line,
	LineChart,
	Listing,
	Override,
	PageNumber,
	PageNumberTotal,
	PieChart,
	Switch,
	Table,
	TableLayout,
	Text,
} from "./elements/type/index.js";
import type { PrintModelElement, AnyPrintModelElement } from "./elements/print-model-element.js";
import type { TextProperties, BorderProperties, Measure, PrintModelEntity } from "./elements/index.js";
import { ElementType } from "./elements/print-model-element.js";
import { isPosition, isDimensions } from "./elements/base.js";
import type {
	PrintModel,
	PrintModelContent,
	PrintModelContentGeneral,
	PrintModelHeader,
	Metadata,
	Section,
	Segment,
	SegmentReference,
	TextStyle,
	Watermark,
} from "./print-model.js";
import { SegmentType } from "./print-model.js";
import type { AnyContainerElement, AnyTopLevelContainerElement } from "./reference/reference-container.js";
import type {
	PlaceableReference,
	Reference,
	SwitchCaseReference,
	TableColumnReference,
	TableLayoutCellReference,
} from "./reference/reference.js";
import { isReference } from "./reference/reference.js";

// Top-level partial type
export type PartialPrintModel = DeepPartial<PrintModel>;
export type PartialPrintModelHeader = DeepPartial<PrintModelHeader>;
export type PartialPrintModelContent = DeepPartial<PrintModelContent>;
export type PartialPrintModelContentGeneral = DeepPartial<PrintModelContentGeneral>;
export type PartialMetadata = DeepPartial<Metadata>;
export type PartialSegment = DeepPartial<Segment>;
export type PartialSegmentReference = DeepPartial<SegmentReference>;
export type PartialSection = DeepPartial<Section>;
export type PartialWatermark = DeepPartial<Watermark>;
export type PartialTextStyle = DeepPartial<TextStyle>;

export function isPartialSegment(entry: PrintModelEntity): entry is PartialSegment {
	return (
		"id" in entry &&
		"type" in entry &&
		(entry?.type === SegmentType.Default || entry?.type === SegmentType.Repeatable)
	);
}

export function isPartialSection(entry: PrintModelEntity): entry is PartialSection {
	return "pageOrientation" in entry && "sectionUsage" in entry;
}

export function isPartialWatermark(entry: PrintModelEntity): entry is PartialWatermark {
	return "pageOrientation" in entry && !("sectionUsage" in entry);
}

// Element partial type
export type PartialText = PrintModelElement & DeepPartial<Text>;
export type PartialTable = PrintModelElement & DeepPartial<Table>;
export type PartialTableLayout = PrintModelElement & DeepPartial<TableLayout>;
export type PartialPieChart = PrintModelElement & DeepPartial<PieChart>;
export type PartialPageNumber = PrintModelElement & DeepPartial<PageNumber>;
export type PartialPageNumberTotal = PrintModelElement & DeepPartial<PageNumberTotal>;
export type PartialListing = PrintModelElement & DeepPartial<Listing>;
export type PartialLine = PrintModelElement & DeepPartial<Line>;
export type PartialLineChart = PrintModelElement & DeepPartial<LineChart>;
export type PartialImage = PrintModelElement & DeepPartial<Image>;
export type PartialField = PrintModelElement & DeepPartial<Field>;
export type PartialExpression = PrintModelElement & DeepPartial<Expression>;
export type PartialCalculation = PrintModelElement & DeepPartial<Calculation>;
export type PartialBarChart = PrintModelElement & DeepPartial<BarChart>;
export type PartialBoundingBox = PrintModelElement & DeepPartial<BoundingBox>;
export type PartialOverride = PrintModelElement & DeepPartial<Override>;
export type PartialArea = PrintModelElement & DeepPartial<Area>;
export type PartialSwitch = PrintModelElement & DeepPartial<Switch>;

export type PartialPrintModelElement = DeepPartial<PrintModelElement>;
export type PartialAnyPrintModelElement = PrintModelElement & DeepPartial<AnyPrintModelElement>;
export type PartialAnyContainerElement = DeepPartial<AnyContainerElement>;
export type PartialAnyTopLevelContainerElement = DeepPartial<AnyTopLevelContainerElement>;

// Base partial type
export type PartialReference = DeepPartial<Reference>;
export type PartialTableColumnReference = DeepPartial<TableColumnReference>;
export type PartialSwitchCaseReference = DeepPartial<SwitchCaseReference>;
export type PartialTableLayoutCellReference = DeepPartial<TableLayoutCellReference>;

export type PartialPlaceableReference = DeepPartial<PlaceableReference>;
export type PartialTextProperties = DeepPartial<TextProperties>;
export type PartialBorderProperties = DeepPartial<BorderProperties>;
export type PartialSegmentReferences = DeepPartial<SegmentReference>;
export interface PartialValidPlaceableReference extends PartialPlaceableReference {
	readonly refId: string;
	readonly position: { readonly id: string; readonly x: Measure; readonly y: Measure };
	readonly dimensions: { readonly id: string; readonly minWidth: Measure; readonly minHeight: Measure };
}
export function isPartialValidPlaceableReference(
	ref: PartialPlaceableReference
): ref is PartialValidPlaceableReference {
	return isPosition(ref.position) && isDimensions(ref.dimensions) && isReference(ref);
}

export namespace PartialText {
	export function isInstance(element: PrintModelElement): element is PartialText {
		return element.type === ElementType.Text;
	}
}

export namespace PartialTable {
	export function isInstance(element: PrintModelElement): element is PartialTable {
		return element.type === ElementType.Table;
	}
}

export namespace PartialTableLayout {
	export function isInstance(element: PrintModelElement): element is PartialTableLayout {
		return element.type === ElementType.TableLayout;
	}
}

export namespace PartialPieChart {
	export function isInstance(element: PrintModelElement): element is PartialPieChart {
		return element.type === ElementType.PieChart;
	}
}

export namespace PartialPageNumber {
	export function isInstance(element: PrintModelElement): element is PartialPageNumber {
		return element.type === ElementType.PageNumber;
	}
}

export namespace PartialPageNumberTotal {
	export function isInstance(element: PrintModelElement): element is PartialPageNumberTotal {
		return element.type === ElementType.PageNumberTotal;
	}
}

export namespace PartialListing {
	export function isInstance(element: PrintModelElement): element is PartialListing {
		return element.type === ElementType.Listing;
	}
}

export namespace PartialLine {
	export function isInstance(element: PrintModelElement): element is PartialLine {
		return element.type === ElementType.Line;
	}
}

export namespace PartialLineChart {
	export function isInstance(element: PrintModelElement): element is PartialLineChart {
		return element.type === ElementType.LineChart;
	}
}

export namespace PartialImage {
	export function isInstance(element: PrintModelElement): element is PartialImage {
		return element.type === ElementType.Image;
	}
}

export namespace PartialField {
	export function isInstance(element: PrintModelElement): element is PartialField {
		return element.type === ElementType.Field;
	}
}

export namespace PartialExpression {
	export function isInstance(element: PrintModelElement): element is PartialExpression {
		return element.type === ElementType.Expression;
	}
}

export namespace PartialCalculation {
	export function isInstance(element: PrintModelElement): element is PartialCalculation {
		return element.type === ElementType.Calculation;
	}
}

export namespace PartialBarChart {
	export function isInstance(element: PrintModelElement): element is PartialBarChart {
		return element.type === ElementType.BarChart;
	}
}

export namespace PartialBoundingBox {
	export function isInstance(element: PrintModelElement): element is PartialBoundingBox {
		return element.type === ElementType.BoundingBox;
	}
}

export namespace PartialOverride {
	export function isInstance(element: PrintModelElement): element is PartialOverride {
		return element.type === ElementType.Override;
	}
}

export namespace PartialArea {
	export function isInstance(element: PrintModelElement): element is PartialArea {
		return element.type === ElementType.Area;
	}
}

export namespace PartialSwitch {
	export function isInstance(element: PartialAnyPrintModelElement): element is PartialSwitch {
		return element.type === ElementType.Switch;
	}
}

export namespace PartialAnyTopLevelContainerElement {
	export function isInstance(
		element: PartialAnyPrintModelElement | PartialAnyTopLevelContainerElement
	): element is PartialAnyTopLevelContainerElement {
		if (isPartialSegment(element) || isPartialSection(element) || isPartialWatermark(element)) {
			return true;
		}
		return false;
	}
}
