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
import { Icon } from "@com.mgmtp.a12.widgets/widgets-core";
import { ElementType } from "@com.mgmtp.a12.print/print-model-api/model";
import { InputValueSourceResolver } from "@com.mgmtp.a12.print/print-model-api/input-source";

import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";
import { ElementTypes } from "../../constant/elements.js";
import { CHARTS_PROPERTY_PATH } from "../../constant/element-property-path.js";

import type { BaseElementProps } from "./base.js";
import { StyledDiagramWrapper } from "./Diagram.styled.js";

const DIAGRAM_ICON_MAP = {
	[ElementType.LineChart]: {
		icon: <Icon size="big">{ElementTypes[ElementType.LineChart]?.iconName}</Icon>,
		labelKey: RESOURCE_KEYS.editor.element.LineChart,
	},
	[ElementType.BarChart]: {
		icon: <Icon size="big">{ElementTypes[ElementType.BarChart]?.iconName}</Icon>,
		labelKey: RESOURCE_KEYS.editor.element.BarChart,
	},
	[ElementType.PieChart]: {
		icon: <Icon size="big">{ElementTypes[ElementType.PieChart]?.iconName}</Icon>,
		labelKey: RESOURCE_KEYS.editor.element.PieChart,
	},
};

export type DiagramProps = BaseElementProps;

export const Diagram = ({ styles, element }: DiagramProps) => {
	const localizer = PrintLocalizer.useLocalizer();

	let displayText;
	switch (element.type) {
		case ElementType.LineChart:
			displayText = element.lineChart?.title;
			break;
		case ElementType.BarChart:
			displayText = element.barChart?.title;
			break;
		case ElementType.PieChart:
			displayText = element.pieChart?.title;
			break;
		default:
			throw Error(`Expected element of type BarChart/LineChart/PieChart but got ${element.type}`);
	}
	displayText = InputValueSourceResolver.getSourceStringValue(displayText, element, CHARTS_PROPERTY_PATH.title);

	const { icon, labelKey } = DIAGRAM_ICON_MAP[element.type];

	return (
		<StyledDiagramWrapper style={styles}>
			{icon}
			<div className="-u-margin-l-sm">{displayText || localizer(labelKey)}</div>
		</StyledDiagramWrapper>
	);
};
