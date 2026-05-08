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

import {
	PartialBoundingBox,
	PartialValidPlaceableReference,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

import { EditorUtils, ElementsUtils } from "../../../utils/index.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";
import { EditorContext } from "../../editor-stage/editor-context.js";

import { StyledPageDivider } from "../shared-components/Base.styled.js";

export const useSetupBoundingBoxEditor = (boundingBox: PartialBoundingBox) => {
	const { setElementReferences } = React.useContext(EditorContext);
	const zoomFactor = useSelector(PrintEngineSelectors.zoomFactor);
	const editorDimensions = useSelector(PrintEngineSelectors.editorDimensions);

	const numberOfPages = React.useMemo(() => {
		return EditorUtils.calculateNumberOfPages(
			editorDimensions.minHeight.value,
			boundingBox?.boundingBox?.elementReferences as PartialValidPlaceableReference[]
		);
	}, [boundingBox?.boundingBox?.elementReferences, editorDimensions.minHeight.value]);

	const renderEditorSlots = React.useCallback(
		(_bodyEl?: HTMLDivElement | null, _editorEl?: HTMLDivElement | null, numberOfPages?: number) => {
			const res = [];
			for (let i = 1; i < (numberOfPages || 0); i++) {
				res.push(
					<StyledPageDivider
						numberOfPages={i}
						zoomFactor={zoomFactor}
						editorDimensions={editorDimensions}
						key={i}
						topOffset={0}
					/>
				);
			}
			return res;
		},
		[editorDimensions, zoomFactor]
	);

	React.useEffect(() => {
		setElementReferences(
			ElementsUtils.getElementReferences(boundingBox) as ReadonlyArray<PartialValidPlaceableReference>
		);
	}, [boundingBox, setElementReferences]);

	return {
		numberOfPages,
		renderEditorSlots,
	};
};
