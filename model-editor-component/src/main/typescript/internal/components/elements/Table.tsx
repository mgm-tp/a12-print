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
import { useSelector } from "react-redux";

import type { TableColumnReference, PartialBorderProperties } from "@com.mgmtp.a12.print/print-model-api/model";
import { PartialTable, PartialField } from "@com.mgmtp.a12.print/print-model-api/model";
import type { DeepPartial } from "@com.mgmtp.a12.print/print-model-api/utils";
import { InputValueSourceResolver } from "@com.mgmtp.a12.print/print-model-api/input-source";

import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";
import { PrintEngineSelectors } from "../../store/selectors.js";
import type { PrintEngineState } from "../../../a12internal/api/PrintEngineState.js";
import { TABLE_PROPERTY_PATH, TEXT_PROPERTIES_PATH } from "../../constant/element-property-path.js";
import { parseNumberInputValue } from "../../utils/input-source-utils.js";
import { getTextPropertiesStyles } from "../../utils/css-utils.js";
import type { StylableText } from "../../types/styles.js";

import { TypeSettingApplier } from "../typesetting/TypeSettingApplier.js";

import type { BaseElementProps } from "./base.js";
import { StyledTableContainer, StyledTableHeader } from "./Table.styled.js";

type TableProps = BaseElementProps;

export const Table = ({ element, styles }: TableProps) => {
	const localizer = PrintLocalizer.useLocalizer();
	if (!PartialTable.isInstance(element)) {
		throw Error(`Expected element of type Table but got ${element.type}`);
	}
	const { table, borderProperties } = element;
	const columns = table?.columns;

	const headerTextProperties: StylableText = getTextPropertiesStyles(
		element.table?.headerTextProperties,
		element,
		TABLE_PROPERTY_PATH.headerTextProperties
	);

	const textProperties: StylableText = getTextPropertiesStyles(element.textProperties, element, TEXT_PROPERTIES_PATH);

	if (!columns || columns.length === 0) {
		return (
			<div style={styles}>
				<TypeSettingApplier textStyleId={headerTextProperties?.textStyleId}>
					{localizer(RESOURCE_KEYS.editor.element.Table)}
				</TypeSettingApplier>
			</div>
		);
	}

	return (
		<StyledTableContainer data-testid="element-table">
			<thead>
				<tr>
					{columns.map((col, index) =>
						col.refId ? (
							<TableHeader
								tableElement={element}
								col={col}
								textProperties={headerTextProperties}
								fallbackTextProperties={textProperties}
								borderProperties={borderProperties}
								key={`StyledTableHeader-${index}`}
							/>
						) : (
							<EmptyTableHeader
								col={col}
								tableElement={element}
								textProperties={headerTextProperties}
								borderProperties={borderProperties}
								key={`StyledTableHeader-${index}`}
							/>
						)
					)}
				</tr>
			</thead>
		</StyledTableContainer>
	);
};

const EmptyTableHeader = ({ col, tableElement, textProperties, borderProperties }: TableHeaderProps) => {
	const localizer = PrintLocalizer.useLocalizer();
	const labelValue = InputValueSourceResolver.getSourceStringValue(col.label, tableElement, "columns.label");

	const text = labelValue ? labelValue : localizer(RESOURCE_KEYS.elements.table.emptyHeader);
	return (
		<StyledTableHeader width={col.width?.value} textProperties={textProperties} borderProperties={borderProperties}>
			<TypeSettingApplier textStyleId={textProperties?.textStyleId}>{text}</TypeSettingApplier>
		</StyledTableHeader>
	);
};

interface TableHeaderProps {
	tableElement: PartialTable;
	col: DeepPartial<TableColumnReference>;
	textProperties?: StylableText;
	borderProperties?: PartialBorderProperties;
	fallbackTextProperties?: StylableText;
}

const TableHeader = ({
	col,
	tableElement,
	textProperties,
	borderProperties,
	fallbackTextProperties,
}: TableHeaderProps) => {
	const element = useSelector((state: PrintEngineState) =>
		PrintEngineSelectors.printModelElement(state, col.refId || "")
	);

	const labelValue = InputValueSourceResolver.getSourceStringValue(
		col.label,
		tableElement,
		TABLE_PROPERTY_PATH.columnLabel
	);
	const widthValue = InputValueSourceResolver.getSourceNumberValue(
		col.width,
		tableElement,
		TABLE_PROPERTY_PATH.columnWidth
	);

	const text = labelValue
		? labelValue
		: PartialField.isInstance(element)
			? element.field?.path?.split("/").pop() || element.type
			: element.type;

	return (
		<StyledTableHeader
			width={parseNumberInputValue(widthValue)}
			textProperties={textProperties}
			borderProperties={borderProperties}
			fallbackTextProperties={fallbackTextProperties}
		>
			<TypeSettingApplier textStyleId={textProperties?.textStyleId}>{text}</TypeSettingApplier>
		</StyledTableHeader>
	);
};
