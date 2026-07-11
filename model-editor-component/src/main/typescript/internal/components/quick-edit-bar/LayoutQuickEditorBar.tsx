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

import type { PartialValidPlaceableReference } from "@com.mgmtp.a12.print/print-model-api/model";

import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";
import { EditorConst } from "../../constant/editor.js";
import type { MarginSide } from "../../types/margin.js";

import { EditorContext } from "../editor-stage/editor-context.js";

import { QuickNumberInput } from "./shares/QuickNumberInput.js";
import { StyledOuterContainer } from "./shares/QuickEditBar.styled.js";

interface LayoutQuickEditorBarProps {
	referenceId?: string;
	onUpdateMargin: (margin: number, side: MarginSide, reference: PartialValidPlaceableReference) => void;
}
const { MM_TO_CM, CM_TO_MM } = EditorConst;

export const LayoutQuickEditorBar = ({ referenceId, onUpdateMargin }: LayoutQuickEditorBarProps) => {
	const localizer = PrintLocalizer.useLocalizer();
	const { elementReferences } = React.useContext(EditorContext);

	const selectedReference = React.useMemo(() => {
		return elementReferences.find(ref => ref.refId === referenceId);
	}, [elementReferences, referenceId]);

	const onBlurMarginInput = React.useCallback(
		(e: React.FocusEvent<HTMLInputElement>, side: MarginSide) => {
			if (!selectedReference) {
				return;
			}
			onUpdateMargin(CM_TO_MM(Number(e.target.value)), side, selectedReference);
		},
		[onUpdateMargin, selectedReference]
	);

	const isDisable = !referenceId;
	const topMarginValue = MM_TO_CM(selectedReference?.margins?.top?.margin?.value || 0);
	const bottomMarginValue = MM_TO_CM(selectedReference?.margins?.bottom?.margin?.value || 0);
	return (
		<StyledOuterContainer>
			<QuickNumberInput
				icon="vertical_align_top"
				label={localizer(RESOURCE_KEYS.layoutEditor.topMenu.topMargin)}
				placeholder={localizer(RESOURCE_KEYS.layoutEditor.topMenu.topMargin)}
				disable={isDisable}
				onBlur={e => onBlurMarginInput(e, "top")}
				value={String(topMarginValue || "")}
				width={120}
			/>
			<QuickNumberInput
				icon="vertical_align_bottom"
				label={localizer(RESOURCE_KEYS.layoutEditor.topMenu.bottomMargin)}
				placeholder={localizer(RESOURCE_KEYS.layoutEditor.topMenu.bottomMargin)}
				disable={isDisable}
				onBlur={e => onBlurMarginInput(e, "bottom")}
				value={String(bottomMarginValue || "")}
				width={120}
			/>
		</StyledOuterContainer>
	);
};
