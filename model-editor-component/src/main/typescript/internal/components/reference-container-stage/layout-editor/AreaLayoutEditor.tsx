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
import * as React from "react";

import type { PartialValidPlaceableReference } from "@com.mgmtp.a12.print/print-model-api/model";
import { PartialArea } from "@com.mgmtp.a12.print/print-model-api/model";

import { PrintEngineSelectors } from "../../../store/selectors.js";
import { StyledAreaDivider } from "../../resizable/AreaResizeHandle.styled.js";
import { EditorConst } from "../../../constant/editor.js";
import { createPlainMmMeasure, ElementsUtils } from "../../../utils/index.js";
import { EditorContext } from "../../editor-stage/editor-context.js";

import { BasicLayoutEditor } from "./BasicLayoutEditor.js";

const { MM_TO_PX } = EditorConst;

export const AreaLayoutEditor = () => {
	const { setElementReferences } = React.useContext(EditorContext);
	const areaContainer = useSelector(PrintEngineSelectors.currentWrapperContainer);
	const editorDimensions = useSelector(PrintEngineSelectors.editorDimensions);

	const {
		editorOptions: { zoomFactor },
	} = useSelector(PrintEngineSelectors.printEditorState);

	if (!areaContainer || !PartialArea.isInstance(areaContainer)) {
		throw Error("The current container is not area");
	}
	const dimensions = areaContainer.area?.dimensions;
	const areaHeight = dimensions?.height?.value || 0;
	const editorHeight = editorDimensions?.minHeight?.value || 0;

	const renderEditorSlots = React.useCallback(() => {
		return (
			areaContainer &&
			PartialArea.isInstance(areaContainer) &&
			editorHeight > areaHeight && <StyledAreaDivider zoomFactor={zoomFactor} top={MM_TO_PX(areaHeight)} />
		);
	}, [areaContainer, areaHeight, editorHeight, zoomFactor]);

	React.useEffect(() => {
		setElementReferences(
			ElementsUtils.getElementReferences(areaContainer) as ReadonlyArray<PartialValidPlaceableReference>
		);
	}, [areaContainer, setElementReferences]);

	const getLimitZone = React.useCallback(
		() => ({
			bottom: createPlainMmMeasure(
				(areaContainer?.area?.dimensions?.height?.value || 0) +
					(areaContainer.area?.dimensions?.overflowHeight?.value || 0)
			),
			top: createPlainMmMeasure(0),
		}),
		[areaContainer.area?.dimensions?.height?.value, areaContainer.area?.dimensions?.overflowHeight?.value]
	);

	return (
		<BasicLayoutEditor
			referenceContainer={areaContainer}
			isActive
			renderEditorSlots={renderEditorSlots}
			borderProperties={areaContainer.borderProperties}
			getLimitZone={getLimitZone}
		/>
	);
};
