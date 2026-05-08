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
import { useDispatch, useSelector } from "react-redux";
import * as React from "react";

import { Toggle } from "@com.mgmtp.a12.widgets/widgets-core/lib/toggle/index.js";

import { PrintEngineSelectors } from "../../../store/selectors.js";
import { EditorMode, EditorStateActions } from "../../../redux/index.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../../localization/index.js";
import { ValidationSelectors } from "../../../redux/validation/selectors.js";
import { ErrorBadge } from "../../badge/ValidationBadge.js";

export const EditorModeToggle = () => {
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();

	const { editorStates } = useSelector(PrintEngineSelectors.printEditorState);
	const allPlaceableRefDefaultCounter = useSelector(ValidationSelectors.allPlaceableRefDefaultCounter);
	const allPlaceableRefLayoutCounter = useSelector(ValidationSelectors.allPlaceableRefLayoutCounter);
	const validationInteraction = useSelector(ValidationSelectors.validationInteraction);

	const { editorMode } = editorStates;

	const defaultTitle = localizer(RESOURCE_KEYS.editor.mode.default);
	const layoutTitle = localizer(RESOURCE_KEYS.editor.mode.layout);

	const onEditorModeChange = React.useCallback(
		(value: EditorMode) => {
			dispatch(
				EditorStateActions.updateEditorMode({
					editorMode: value,
				})
			);
		},
		[dispatch]
	);

	return (
		<Toggle value={editorMode} onValueChanged={onEditorModeChange} block>
			<Toggle.Item value={EditorMode.Default} title={defaultTitle}>
				{defaultTitle}{" "}
				<ErrorBadge
					count={allPlaceableRefDefaultCounter.error}
					standalone
					type={validationInteraction.error}
					className="-u-margin-l-2xs"
				/>
			</Toggle.Item>
			<Toggle.Item value={EditorMode.Layout} title={layoutTitle}>
				{layoutTitle}
				<ErrorBadge
					count={allPlaceableRefLayoutCounter.error}
					standalone
					type={validationInteraction.error}
					className="-u-margin-l-2xs"
				/>
			</Toggle.Item>
		</Toggle>
	);
};
