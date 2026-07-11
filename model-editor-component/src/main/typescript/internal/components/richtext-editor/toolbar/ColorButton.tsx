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
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import type { RangeSelection } from "lexical";
import { $getSelection, $isRangeSelection } from "lexical";
import { $patchStyleText } from "@lexical/selection";
import { type FC, useCallback, useEffect, useState, useRef } from "react";

import type { BaseToolbarButtonProps, ButtonType } from "@com.mgmtp.a12.widgets/widgets-core";
import { $isInlineStyleTextNode, ToolbarButtonInternal, Icon } from "@com.mgmtp.a12.widgets/widgets-core";

import { PrintLocalizer, RESOURCE_KEYS } from "../../../localization/index.js";

import { STYLE_PROPERTIES } from "../constants.js";
import { getColorProperties } from "../nodes/print-text-node.js";

import { ColorButtonInputStyled } from "./ColorButtonInput.styled.js";

export enum ColorButtonType {
	TEXT_COLOR,
	BACKGROUND_COLOR,
}

const COLOR_BUTTON_MAPPING = {
	[ColorButtonType.TEXT_COLOR]: {
		icon: "format_color_text",
		labelKey: RESOURCE_KEYS.elementForm.textProperties.color,
		defaultColor: "#000000",
		styleProperty: STYLE_PROPERTIES.COLOR,
	},
	[ColorButtonType.BACKGROUND_COLOR]: {
		icon: "format_color_fill",
		labelKey: RESOURCE_KEYS.elementForm.textProperties.backgroundColor,
		defaultColor: "#ffffff",
		styleProperty: STYLE_PROPERTIES.BACKGROUND_COLOR,
	},
} as const;

function extractColorFromSelection(
	selection: RangeSelection,
	styleProperty: string
): { hasStyle: boolean; foundColor: string | null } {
	const nodes = selection.getNodes();
	let hasStyle = false;
	let foundColor: string | null = null;

	for (const node of nodes) {
		if (!$isInlineStyleTextNode(node)) continue;

		const nodeStyle = node.getStyle() || "";
		if (!nodeStyle.includes(styleProperty)) continue;

		const { bgColor, textColor } = getColorProperties(nodeStyle);
		if (styleProperty === STYLE_PROPERTIES.BACKGROUND_COLOR && bgColor) {
			hasStyle = true;
			foundColor = bgColor;
		} else if (styleProperty === STYLE_PROPERTIES.COLOR && textColor) {
			hasStyle = true;
			foundColor = textColor;
		}
	}

	return { hasStyle, foundColor };
}

export function createColorButton(type: ColorButtonType): ButtonType {
	const { icon, labelKey, defaultColor, styleProperty } = COLOR_BUTTON_MAPPING[type];

	const EditorButton: FC<BaseToolbarButtonProps> = props => {
		const [editor] = useLexicalComposerContext();
		const localizer = PrintLocalizer.useLocalizer();
		const [isFormatApplied, setIsFormatApplied] = useState(false);
		const [currentColor, setCurrentColor] = useState<string>(defaultColor);
		const colorInputRef = useRef<HTMLInputElement>(null);

		const updateState = useCallback(() => {
			editor.read(() => {
				const selection = $getSelection();
				if (!$isRangeSelection(selection)) return;

				const { hasStyle, foundColor } = extractColorFromSelection(selection, styleProperty);
				setIsFormatApplied(hasStyle);
				setCurrentColor(foundColor || defaultColor);
			});
		}, [editor]);

		useEffect(() => {
			return editor.registerUpdateListener(() => {
				updateState();
			});
		}, [editor, updateState]);

		const handleColorChange = useCallback(
			(event: React.ChangeEvent<HTMLInputElement>) => {
				const newColor = event.target.value;
				if (!newColor) return;

				editor.update(
					() => {
						const selection = $getSelection();
						if ($isRangeSelection(selection)) {
							$patchStyleText(selection, { [styleProperty]: newColor });
						}
					},
					{
						onUpdate: () => {
							setIsFormatApplied(true);
							setCurrentColor(newColor);
						},
					}
				);
			},
			[editor]
		);

		const handleButtonClick = useCallback(() => {
			if (isFormatApplied) {
				editor.update(
					() => {
						const selection = $getSelection();
						if ($isRangeSelection(selection)) {
							$patchStyleText(selection, { [styleProperty]: null });
						}
					},
					{
						onUpdate: () => {
							setIsFormatApplied(false);
							setCurrentColor(defaultColor);
						},
					}
				);
			} else {
				colorInputRef.current?.click();
			}
		}, [editor, isFormatApplied]);

		return (
			<>
				<ToolbarButtonInternal
					{...props}
					icon={<Icon style={isFormatApplied ? { color: currentColor } : undefined}>{icon}</Icon>}
					title={localizer(labelKey)}
					onClick={handleButtonClick}
					{...{ active: isFormatApplied }}
				/>
				<ColorButtonInputStyled ref={colorInputRef} value={currentColor} onChange={handleColorChange} />
			</>
		);
	};

	EditorButton.displayName = `ColorButton(${type})`;

	return { component: EditorButton, interaction: { isActive: () => false, isDisabled: () => false } };
}
