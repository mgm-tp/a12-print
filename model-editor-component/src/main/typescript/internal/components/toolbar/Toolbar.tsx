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
import * as React from "react";

import { ToolbarItem } from "../../types/toolbar-item.js";

import { ElementLibrary } from "../element-library/index.js";

import { HideFrames, ZoomFactor } from "./toolbar-item/index.js";
import { FlexChildContainer, ToolbarContainer } from "./Toolbar.styled.js";
import { MarginToggle } from "./toolbar-item/MarginToggle.js";

type ToolbarItemType = ToolbarItem | React.ReactNode;

interface ToolbarProps {
	leftItems?: ToolbarItemType[];
	rightItems?: ToolbarItemType[];
}

export const Toolbar = (props: ToolbarProps) => {
	const { leftItems, rightItems } = props;

	const renderToolbarItems = React.useCallback(
		(listItems: ToolbarItemType[]) =>
			listItems.map((item, idx) => {
				if (typeof item === "string" && Object.values(ToolbarItem).includes(item as ToolbarItem)) {
					const ToolbarItem = ToolbarItemMap[item as ToolbarItem];
					return <ToolbarItem key={`toolbar-item-${idx}`} />;
				}
				return <React.Fragment key={`toolbar-item-${idx}`}>{item}</React.Fragment>;
			}),
		[]
	);

	return (
		<ToolbarContainer>
			<FlexChildContainer>{leftItems && renderToolbarItems(leftItems)}</FlexChildContainer>
			<FlexChildContainer>{rightItems && renderToolbarItems(rightItems)}</FlexChildContainer>
		</ToolbarContainer>
	);
};

const ToolbarItemMap: Record<ToolbarItem, React.ComponentType> = {
	[ToolbarItem.ElementLibrary]: ElementLibrary,
	[ToolbarItem.ZoomFactor]: ZoomFactor,
	[ToolbarItem.HideFrames]: HideFrames,
	[ToolbarItem.HideMargins]: MarginToggle,
};
