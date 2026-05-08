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
import DraftJs from "draft-js";

import { Icon } from "@com.mgmtp.a12.widgets/widgets-core/lib/icon/index.js";
import { ToolbarButtonInternalProps } from "@com.mgmtp.a12.widgets/widgets-draft-js-editor/lib/static-toolbar-plugin/static-toolbar-buttons/toolbar-button-props.internal.js";
import { EditorButtonInternal } from "@com.mgmtp.a12.widgets/widgets-draft-js-editor/lib/static-toolbar-plugin/static-toolbar-buttons/editor-button.internal.view.js";

import { PrintLocalizer, RESOURCE_KEYS } from "../../../localization/index.js";
import { BACKGROUND_COLOR, removeInlineStylesForSelection, TEXT_COLOR } from "../../../utils/index.js";

import { StyledInput } from "./General.styled.js";
import { ToolbarContext } from "./context.js";
import { activeClassNameGetter } from "./util.js";

const COLOR_BUTTON_MAPPING = {
	TEXT_COLOR: { icon: "format_color_text", labelKey: RESOURCE_KEYS.elementForm.textProperties.color },
	BACKGROUND_COLOR: { icon: "format_color_fill", labelKey: RESOURCE_KEYS.elementForm.textProperties.backgroundColor },
};

export type StyleName = typeof TEXT_COLOR | typeof BACKGROUND_COLOR;

export function createColorButton(styleName: StyleName) {
	const ColorButton = ({ editorState, setEditorState }: ToolbarButtonInternalProps) => {
		const localizer = PrintLocalizer.useLocalizer();
		const { disabled } = React.useContext(ToolbarContext);

		const onColorChange = React.useCallback(
			(event: React.ChangeEvent<HTMLInputElement>) => {
				const newColor = event.target.value;
				if (!editorState || !newColor) {
					return;
				}

				const styleNamePrefix = `${styleName}_VALUE_`;
				let newState = removeInlineStylesForSelection(editorState, styleNamePrefix);
				newState = DraftJs.RichUtils.toggleInlineStyle(newState, styleNamePrefix + newColor);
				newState = DraftJs.EditorState.push(newState, newState.getCurrentContent(), "change-inline-style");
				setEditorState(newState);
			},
			[editorState, setEditorState]
		);

		const onColorButtonClick = React.useCallback(
			(event: React.MouseEvent<HTMLElement>) => {
				event.preventDefault();
				event.stopPropagation();
				if (!editorState) {
					return;
				}
				let nextEditorState = DraftJs.EditorState.forceSelection(editorState, editorState.getSelection());
				nextEditorState = DraftJs.RichUtils.toggleInlineStyle(nextEditorState, styleName);
				nextEditorState = DraftJs.EditorState.push(
					nextEditorState,
					nextEditorState.getCurrentContent(),
					"change-inline-style"
				);
				setEditorState(nextEditorState);
			},
			[editorState, setEditorState]
		);

		const onColorPickerBlur = React.useCallback(() => {
			if (!editorState) {
				return;
			}
			const newEditorState = DraftJs.EditorState.forceSelection(editorState, editorState.getSelection());
			setEditorState(newEditorState);
		}, [editorState, setEditorState]);

		const { icon, labelKey } = COLOR_BUTTON_MAPPING[styleName];
		const isActive = editorState && editorState.getCurrentInlineStyle().has(styleName);
		const colorBefore = getColor(editorState, styleName);
		const color = colorBefore ? colorBefore : styleName === TEXT_COLOR ? "#000000" : "#ffffff";
		return (
			<>
				<EditorButtonInternal
					tabIndex={-1}
					icon={<Icon>{icon}</Icon>}
					isActive={isActive}
					onClick={onColorButtonClick}
					className={activeClassNameGetter(isActive)}
					title={localizer(labelKey)}
					disabled={disabled}
				/>
				<StyledInput
					type="color"
					value={color}
					onChange={onColorChange}
					onBlur={onColorPickerBlur}
					disabled={disabled}
				/>
			</>
		);
	};
	return ColorButton;
}

function getColor(editorState: DraftJs.EditorState | undefined, styleName: StyleName): string | undefined {
	if (!editorState) {
		return;
	}
	const styleNameValue = `${styleName}_VALUE_`;
	const styles = editorState.getCurrentInlineStyle().toArray();
	const color = styles.find(value => value.startsWith(styleNameValue));
	return color?.replace(styleNameValue, "");
}
