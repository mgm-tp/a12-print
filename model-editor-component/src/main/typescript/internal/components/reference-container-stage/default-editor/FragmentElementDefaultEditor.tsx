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
import { useContext, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";

import type { PartialValidPlaceableReference } from "@com.mgmtp.a12.print/print-model-api/model";

import { EditorContext } from "../../editor-stage/editor-context.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";
import { createMmMeasure } from "../../../utils/measure-utils.js";
import { assertExists } from "../../../utils/type-utils.js";

import { BasicDefaultEditor } from "./BasicDefaultEditor.js";

export const FragmentElementDefaultEditor = () => {
	const { setElementReferences } = useContext(EditorContext);
	const fragmentElement = useSelector(PrintEngineSelectors.currentFragmentElement);

	const fragmentId = fragmentElement?.id;
	const fragmentWidth = fragmentElement?.fragmentDimensions?.width.value;
	const fragmentHeight = fragmentElement?.fragmentDimensions?.height.value;

	const syntheticReference = useMemo((): PartialValidPlaceableReference | undefined => {
		if (!fragmentId) return undefined;

		assertExists(fragmentWidth, "Fragment element must have fragmentDimensions.width set");
		assertExists(fragmentHeight, "Fragment element must have fragmentDimensions.height set");

		// This placement only exists to let the stage render the fragment element; it is never persisted.
		// It has no pageBreakBehavior/hideConditions/etc. because those belong to the real placement created
		// where the fragment is actually placed into a target print model - ElementsUtils.hasResolvablePageBreakBehavior
		// relies on that absence to detect this synthetic placement.
		return {
			id: `${fragmentId}-fragment-stage-placement`,
			refId: fragmentId,
			position: {
				id: `${fragmentId}-fragment-stage-position`,
				x: createMmMeasure(0),
				y: createMmMeasure(0),
			},
			dimensions: {
				id: `${fragmentId}-fragment-stage-dimensions`,
				minWidth: createMmMeasure(fragmentWidth),
				minHeight: createMmMeasure(fragmentHeight),
			},
		};
	}, [fragmentId, fragmentWidth, fragmentHeight]);

	useEffect(() => {
		setElementReferences(syntheticReference ? [syntheticReference] : []);
	}, [syntheticReference, setElementReferences]);

	return <BasicDefaultEditor isActive={!!fragmentElement} />;
};
