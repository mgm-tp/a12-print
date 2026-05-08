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
export const EditorConst = (() => {
	const PX_STEP = 4;
	const RULER_OFFSET = {
		top: 31,
		left: 31,
	};
	const EDITOR_OFFSET = {
		top: 25,
	};
	const zIndexList = {
		NestedElement: 0,
		ResizeMarginHandler: 1,
		BasicEditor: 10,
		rsLinesRect: 11,
		BrokenElement: 18,
		Section: 19,
		DragSourceItem: 20,
		ResizeHandle: 20,
		SelectRect: 20,
		PlaceableElement: 20,
		ContextMenuList: 25,
		ContextMenu: 25,
		DragLayerContainer: 30,
		BorderLines: 40,
		RsLines: 40,
		PageDivider: 50,
		ElementLibrary: 999,
		HelperLineHandleActive: 999,
		Ruler: 999,
		QuickEditBar: 999,
		Modal: 999,
	};

	const PX_TO_MM = (px: number) => {
		return Math.floor(px / PX_STEP);
	};

	const PX_TO_CM = (px: number) => {
		return Math.floor(px / PX_STEP) / 10;
	};

	const MM_TO_PX = (mm: number) => {
		return mm * PX_STEP;
	};

	const MM_TO_CM = (mm: number) => {
		return mm / 10;
	};

	const CM_TO_MM = (cm: number) => {
		return cm * 10;
	};

	const CM_TO_PX = (cm: number) => {
		return cm * 10 * PX_STEP;
	};

	return {
		PX_TO_MM,
		PX_TO_CM,
		MM_TO_PX,
		MM_TO_CM,
		CM_TO_MM,
		CM_TO_PX,
		getPX_STEP: () => PX_STEP,
		getZIndexList: () => ({ ...zIndexList }),
		getRulerOffset: () => ({ ...RULER_OFFSET }),
		getEditorOffset: () => ({ ...EDITOR_OFFSET }),
	};
})();

export const SUPPORTED_IMAGE_EXTENSIONS = ["image/gif", "image/bmp", "image/jpeg", "image/jpg", "image/png"];
export const SUPPORTED_IMAGE_EXTENSIONS_JOINED = SUPPORTED_IMAGE_EXTENSIONS.join(", ");
export const SUPPORTED_IMAGE_EXTENSIONS_STRING = SUPPORTED_IMAGE_EXTENSIONS.map(memeType =>
	memeType.replace(/^\w+\//g, "")
)
	.join(", ")
	.toUpperCase();
