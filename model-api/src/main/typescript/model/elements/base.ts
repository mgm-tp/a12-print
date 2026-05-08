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
import type { PossibleInputSource } from "../../input-source/input-source.js";

import { isObject } from "../print-model.js";

export interface Placeable {
	readonly position: Position;
	readonly dimensions: Dimensions;
}

export interface Measure extends PrintModelEntity {
	readonly value: number;
	readonly unit: MeasureUnit;
}

export enum MeasureUnit {
	Millimeter = "Millimeter",
	Percent = "Percent",
}

export interface Dimensions extends PrintModelEntity {
	readonly minHeight: Measure;
	readonly minWidth: Measure;
}

export interface Position extends PrintModelEntity {
	readonly x: Measure;
	readonly y: Measure;
}

export interface Hideable {
	readonly hideConditions?: ReadonlyArray<Precondition>;
}

export interface Precondition extends PrintModelEntity {
	readonly precondition: string;
}

export interface ScreenReadingOrderable {
	readonly screenReadingOrder: ScreenReadingOrder;
}

export interface ScreenReadingOrder extends PrintModelEntity {
	readonly screenReadingOrderWeight: number;
}

export enum MarginType {
	IMPLICIT = "Implicit",
	EXPLICIT = "Explicit",
}

export interface Margin extends PrintModelEntity {
	margin: Measure;
	type: MarginType;
}

export interface Margins extends PrintModelEntity {
	top?: Margin;
	bottom?: Margin;
}

export enum PageBreakBehavior {
	AVOID = "Avoid",
	ALLOW = "Allow",
}

export interface RelativeLayout {
	margins?: Margins;
	pageBreakBehavior: InputSource<PageBreakBehavior>;
}

export interface Styleable {
	readonly textProperties?: TextProperties;
	readonly borderProperties?: BorderProperties;
}

export interface TextProperties extends PrintModelEntity {
	readonly textStyleId?: InputSource<string>;
	readonly color?: InputSource<string>;
	readonly backgroundColor?: InputSource<string>;
	readonly bold?: InputSource<boolean>;
	readonly italic?: InputSource<boolean>;
	readonly underlined?: InputSource<boolean>;
	readonly alignment?: InputSource<Alignment>;
}

export enum Alignment {
	Left = "Left",
	Center = "Center",
	Right = "Right",
	Justify = "Justify",
}

export interface BorderProperties extends PrintModelEntity {
	readonly borderWidth?: number;
	readonly borderColor?: string;
	readonly borderStyle?: BorderStyle;
}

export enum BorderStyle {
	Solid = "Solid",
	Dotted = "Dotted",
	Dashed = "Dashed",
}

export interface DisplayOptions extends PrintModelEntity {
	readonly displayType?: DisplayType;
	readonly dateFormat?: string;
	readonly dateRangeFormatStart?: string;
	readonly dateRangeFormatEnd?: string;
	readonly dateRangeDelimiter?: string;
	readonly checkboxChecked?: string;
	readonly checkboxUnchecked?: string;
	readonly suffix?: string;
}

export enum DisplayType {
	Html = "Html",
	Date = "Date",
	DateRange = "DateRange",
	Checkbox = "Checkbox",
}

export interface Attachment extends PrintModelEntity {
	readonly original_filename?: string;
	readonly internal_filename: string;
	readonly content: string;
	readonly attachment_id?: string;
	readonly size: number;
	readonly mime_type: string;
	readonly category?: string;
	readonly description?: string;
}

export interface ComputationAlternative extends PrintModelEntity {
	readonly operation: string;
	readonly precondition?: string;
}

export interface BaseChartProperties extends PrintModelEntity {
	readonly model: string;
	readonly basePath: string;
	readonly title: InputSource<string>;
	readonly dimensions: ChartDimensions;
}

export interface RepeatableChartProperties extends BaseChartProperties {
	readonly labelX: InputSource<string>;
	readonly labelY: InputSource<string>;
	readonly orientation: ChartOrientation;
}

export enum ChartOrientation {
	Horizontal = "Horizontal",
	Vertical = "Vertical",
}

export interface ChartDimensions extends PrintModelEntity {
	readonly height: Measure;
	readonly width: Measure;
}

export interface DataContext extends PrintModelEntity {
	readonly model: string;
	readonly path: string;
	readonly isRepetition: boolean;
}

export interface InputSource<T> extends PrintModelEntity {
	source: PossibleInputSource;
	value?: T;
	path: string;
	reference?: string;
}

export interface MeasureInputSource extends InputSource<number> {
	unit: MeasureUnit;
}

export interface PrintModelEntity {
	readonly id: string;
}

export function isMeasure(obj: unknown): obj is Measure {
	return isObject(obj) && "value" in obj && typeof obj.value === "number" && "unit" in obj;
}

export function isPosition(obj: unknown): obj is Position {
	return isObject(obj) && "x" in obj && isMeasure(obj.x) && "y" in obj && isMeasure(obj.y);
}

export function isDimensions(obj: unknown): obj is Dimensions {
	return (
		isObject(obj) && "minWidth" in obj && isMeasure(obj.minWidth) && "minHeight" in obj && isMeasure(obj.minHeight)
	);
}

export function isInputSource<T>(obj: unknown): obj is InputSource<T> {
	return isObject(obj) && "source" in obj && "path" in obj;
}
