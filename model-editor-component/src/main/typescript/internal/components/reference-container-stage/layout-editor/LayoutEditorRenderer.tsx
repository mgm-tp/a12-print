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
import { useSelector } from "react-redux";

import { SidebarItem } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import { ElementType } from "@com.mgmtp.a12.print/print-model-api/model";

import { PrintEngineSelectors } from "../../../store/selectors.js";
import { ElementsUtils } from "../../../utils/index.js";
import { NavigationSelectors } from "../../../redux/index.js";

import { SegmentLayoutEditor } from "./SegmentLayoutEditor.js";
import { SectionLayoutEditor } from "./SectionLayoutEditor.js";
import { BoundingBoxLayoutEditor } from "./BoundingBoxLayoutEditor.js";
import { AreaLayoutEditor } from "./AreaLayoutEditor.js";
import { OverrideLayoutEditor } from "./OverrideLayoutEditor.js";
import { WatermarkLayoutEditor } from "./WatermarkLayoutEditor.js";

const EditorProvider: Record<string, React.ComponentType> = {
	[SidebarItem.SEGMENT]: SegmentLayoutEditor,
	[SidebarItem.SECTION]: SectionLayoutEditor,
	[SidebarItem.WATERMARK]: WatermarkLayoutEditor,
	[ElementType.BoundingBox]: BoundingBoxLayoutEditor,
	[ElementType.Area]: AreaLayoutEditor,
	[ElementType.Override]: OverrideLayoutEditor,
};

export const LayoutEditorRenderer = React.memo(function DefaultEditorRenderer() {
	const printModelRefs = useSelector(NavigationSelectors.activeEntities);
	const currentWrapperContainer = useSelector(PrintEngineSelectors.currentWrapperContainer);
	let editorType;

	if (currentWrapperContainer && ElementsUtils.isWrapperElement(currentWrapperContainer)) {
		editorType = currentWrapperContainer.type;
	} else {
		editorType = printModelRefs.currentRefType;
	}
	const Editor = EditorProvider[editorType] || SegmentLayoutEditor;

	return <Editor />;
});
