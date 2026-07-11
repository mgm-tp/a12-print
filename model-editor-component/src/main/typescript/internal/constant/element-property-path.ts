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
import type { BorderPropertiesPath, TextPropertiesPath } from "../types/input-source.js";

export const TEXT_PROPERTIES_PATH: TextPropertiesPath = {
	textStyleId: "textProperties.textStyleId",
	color: "textProperties.color",
	backgroundColor: "textProperties.backgroundColor",
	alignment: "textProperties.alignment",
	bold: "textProperties.bold",
	italic: "textProperties.italic",
	underlined: "textProperties.underlined",
};

export const BORDER_PROPERTIES_PATH: BorderPropertiesPath = {
	borderWidth: "borderProperties.borderWidth",
	borderStyle: "borderProperties.borderStyle",
	borderColor: "borderProperties.borderColor",
};

export const TABLE_PROPERTY_PATH = {
	maxRowCount: "maxRowCount",
	sumLabel: "sumLabel",
	columnWidth: "columns.width",
	columnLabel: "columns.label",
	headerTextProperties: {
		textStyleId: "headerTextProperties.textStyleId",
		color: "headerTextProperties.color",
		backgroundColor: "headerTextProperties.backgroundColor",
		alignment: "headerTextProperties.alignment",
		bold: "headerTextProperties.bold",
		italic: "headerTextProperties.italic",
		underlined: "headerTextProperties.underlined",
	},
};

const LISTING_COLUMN_TEXT_PROPERTIES_PATH: TextPropertiesPath = {
	textStyleId: "columns.textProperties.textStyleId",
	color: "columns.textProperties.color",
	backgroundColor: "columns.textProperties.backgroundColor",
	alignment: "columns.textProperties.alignment",
	bold: "columns.textProperties.bold",
	italic: "columns.textProperties.italic",
	underlined: "columns.textProperties.underlined",
};

const LISTING_COLUMN_BORDER_PROPERTIES_PATH: BorderPropertiesPath = {
	borderWidth: "columns.borderProperties.borderWidth",
	borderStyle: "columns.borderProperties.borderStyle",
	borderColor: "columns.borderProperties.borderColor",
};

export const LISTING_PROPERTY_PATH = {
	headerTextProperties: {
		textStyleId: "headerTextProperties.textStyleId",
		color: "headerTextProperties.color",
		backgroundColor: "headerTextProperties.backgroundColor",
		alignment: "headerTextProperties.alignment",
		bold: "headerTextProperties.bold",
		italic: "headerTextProperties.italic",
		underlined: "headerTextProperties.underlined",
	},
	columns: {
		label: "columns.label",
		width: "columns.width",
		textProperties: LISTING_COLUMN_TEXT_PROPERTIES_PATH,
		borderProperties: LISTING_COLUMN_BORDER_PROPERTIES_PATH,
	},
};

export const TABLE_LAYOUT_PROPERTY_PATH = {
	columnWidth: "columnProperties.width",
	rowMinHeight: "rowProperties.minHeight",
};

export const CHARTS_PROPERTY_PATH = {
	title: "title",
	labelX: "labelX",
	labelY: "labelY",
};
