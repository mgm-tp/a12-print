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
import type {
	PartialAnyPrintModelElement,
	PartialArea,
	PartialBoundingBox,
	PartialOverride,
	PartialSection,
	PartialSegment,
	PartialWatermark,
	PartialValidPlaceableReference,
	BorderProperties,
} from "@com.mgmtp.a12.print/print-model-api/model";
import type { DeepPartialRecursive } from "@com.mgmtp.a12.print/print-model-api/utils";

import type { LimitZone, MarginSide } from "../../types/margin.js";

export interface BaseReferencesRendererProps {
	elementReferences: readonly PartialValidPlaceableReference[];
}

export interface BaseEditorProps {
	referenceContainer?:
		PartialSegment | PartialSection | PartialBoundingBox | PartialOverride | PartialArea | PartialWatermark;
	borderProperties?: DeepPartialRecursive<BorderProperties>;
	numberOfPages?: number;
	isActive?: boolean;
	renderEditorSlots?: (
		bodyEl?: HTMLDivElement | null,
		editorEl?: HTMLDivElement | null,
		numberOfPages?: number
	) => React.ReactNode;
	renderTopSlots?: (
		bodyEl?: HTMLDivElement | null,
		editorEl?: HTMLDivElement | null,
		numberOfPages?: number
	) => React.ReactNode;
}

export interface DefaultReferencesRendererProps extends BaseReferencesRendererProps {
	onClick: (event: React.MouseEvent<HTMLDivElement>, reference: PartialValidPlaceableReference) => void;
	onDoubleClick: (reference: PartialValidPlaceableReference) => void;
	selected: string[];
	collisionsList: string[];
	outOfBoxList: string[];
	isMultiDrag: boolean;
	hovered: PartialValidPlaceableReference | null;
	setHovered: React.Dispatch<React.SetStateAction<PartialValidPlaceableReference | null>>;
	isResizing: boolean;
	canDrag: boolean;
	setIsDraggingGL: (value: boolean) => void;
	numberOfPages: number;
}

export interface DefaultEditorProps extends BaseEditorProps {
	renderElementReferences?: (props: DefaultReferencesRendererProps) => React.ReactNode;
}

export interface LayoutReferencesRendererProps extends BaseReferencesRendererProps {
	getLimitZone?: (reference: PartialValidPlaceableReference) => LimitZone;
	customGetLimitElement?: (
		elementReferences: readonly PartialValidPlaceableReference[],
		current: PartialValidPlaceableReference
	) => Array<number | undefined>;
	onClick: (reference: PartialValidPlaceableReference) => void;
	onDoubleClick: (reference: PartialValidPlaceableReference) => void;
	onHoverChange: (reference?: PartialValidPlaceableReference) => void;
	selectedReferenceId?: string;
	hoveredReferenceId?: string;
	onUpdateMargin: (margin: number, side: MarginSide, reference: PartialValidPlaceableReference) => void;
	numberOfPages: number;
}

export interface LayoutEditorProps extends BaseEditorProps {
	getLimitZone?: (reference: PartialValidPlaceableReference) => LimitZone;
	customGetLimitElement?: (
		elementReferences: readonly PartialValidPlaceableReference[],
		current: PartialValidPlaceableReference
	) => Array<number | undefined>;
	renderElementReferences?: (props: LayoutReferencesRendererProps) => React.ReactNode;
}

export interface DefaultPlaceableElementProps {
	item: PartialValidPlaceableReference;
	element: PartialAnyPrintModelElement;
	onClick: (event: React.MouseEvent<HTMLDivElement>, reference: PartialValidPlaceableReference) => void;
	onDoubleClick: (reference: PartialValidPlaceableReference) => void;
	isSelected: boolean;
	isColliding: boolean;
	isOutsideBox: boolean;
	isMultiDrag: boolean;
	hovered: PartialValidPlaceableReference | null;
	setHovered: React.Dispatch<React.SetStateAction<PartialValidPlaceableReference | null>>;
	isResizing: boolean;
	isDragging: boolean;
	offsetTop?: number;
	zIndex?: number;
}
