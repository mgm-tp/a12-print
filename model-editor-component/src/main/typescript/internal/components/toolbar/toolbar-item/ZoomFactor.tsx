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
import { useDispatch, useSelector } from "react-redux";
import { useTheme } from "styled-components";

import { EditorStateActions } from "../../../redux/index.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";
import { CustomSelect } from "../../forms/custom-base-input-components/index.js";

const ZOOM_ITEMS = [
	{ label: "10%", value: "0.1" },
	{ label: "20%", value: "0.2" },
	{ label: "30%", value: "0.3" },
	{ label: "40%", value: "0.4" },
	{ label: "50%", value: "0.5" },
	{ label: "60%", value: "0.6" },
	{ label: "70%", value: "0.7" },
	{ label: "80%", value: "0.8" },
	{ label: "90%", value: "0.9" },
	{ label: "100%", value: "1" },
	{ label: "110%", value: "1.1" },
	{ label: "120%", value: "1.2" },
	{ label: "130%", value: "1.3" },
	{ label: "140%", value: "1.4" },
	{ label: "150%", value: "1.5" },
];

export const ZoomFactor = () => {
	const dispatch = useDispatch();
	const theme = useTheme();

	const isEditorActive = useSelector(PrintEngineSelectors.isEditorActive);
	const { editorOptions } = useSelector(PrintEngineSelectors.printEditorState);

	const { zoomFactor } = editorOptions;

	const onZoomSelectValueChange = React.useCallback(
		(val: string) => {
			dispatch(
				EditorStateActions.updateEditorOptions({
					zoomFactor: Number(val),
				})
			);
		},
		[dispatch]
	);

	return (
		<CustomSelect
			fitToParent={false}
			items={ZOOM_ITEMS}
			value={String(zoomFactor)}
			onValueChanged={onZoomSelectValueChange}
			inputProps={
				{
					style: { backgroundColor: theme.colors.background.secondaryBackground },
					"data-testid": "zoom-factor",
				} as React.HTMLProps<HTMLSelectElement>
			}
			disabled={!isEditorActive}
		/>
	);
};
