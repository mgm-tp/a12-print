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

import {
	DataContext,
	BoundingBoxDimensions,
	ElementType,
	PageOrientation,
	SectionUsage,
	OverflowDimensions,
	Dimensions,
	PartialSection,
	PartialSegment,
	PartialValidPlaceableReference,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { DeepPartial } from "@com.mgmtp.a12.print/print-model-api/lib/utils/type-utils.js";

import { createPlainMmMeasure } from "../../utils/index.js";
import { WrapperContext } from "../../redux/index.js";

export interface PreviousEditorRef {
	id: string;
	scrollTop: number;
}

export interface IEditorContext {
	elementReferences: ReadonlyArray<PartialValidPlaceableReference>;
	setElementReferences: React.Dispatch<React.SetStateAction<readonly PartialValidPlaceableReference[]>>;
	copyElements: ReadonlyArray<PartialValidPlaceableReference>;
	setCopyElements: React.Dispatch<React.SetStateAction<readonly PartialValidPlaceableReference[]>>;
	openWrapperStage: (
		elementId: string,
		type: ElementType.BoundingBox | ElementType.Area | ElementType.Override | ElementType.Switch,
		dimensions?: DeepPartial<BoundingBoxDimensions> | DeepPartial<OverflowDimensions> | Dimensions,
		dataContexts?: DeepPartial<DataContext>[],
		wrapperContext?: WrapperContext
	) => void;
	openPreviousStage: (referenceContainer: PartialSegment | PartialSection, wrapperId?: string) => void;
	getSection: (pageOrientation: PageOrientation, usage: SectionUsage) => PartialSection | undefined;
	previousEditorRef?: React.MutableRefObject<PreviousEditorRef | null>;
}

export const EDITOR_DIMENSIONS = { minHeight: createPlainMmMeasure(297), minWidth: createPlainMmMeasure(210) };
export const EDITOR_CONTEXT_DEFAULT_VALUE: IEditorContext = {
	elementReferences: [],
	copyElements: [],
	setElementReferences: () => {
		/* empty */
	},
	setCopyElements: () => {
		/* empty */
	},
	openWrapperStage: () => {
		/* empty */
	},
	openPreviousStage: () => {
		/* empty */
	},
	getSection: () => undefined,
};

export const EditorContext = React.createContext<IEditorContext>(EDITOR_CONTEXT_DEFAULT_VALUE);
