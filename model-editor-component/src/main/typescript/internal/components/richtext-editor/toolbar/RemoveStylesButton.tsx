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
import { useCallback, useEffect, useState, type FC } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection } from "lexical";
import { $patchStyleText } from "@lexical/selection";

import type { ButtonType } from "@com.mgmtp.a12.widgets/widgets-core";
import { Icon, ToolbarButtonInternal, $isInlineStyleTextNode } from "@com.mgmtp.a12.widgets/widgets-core";

import { PrintLocalizer, RESOURCE_KEYS } from "../../../localization/index.js";

import { STYLE_PROPERTIES } from "../constants.js";

interface RemoveStylesButtonProps {
	onClick: () => void;
	disabled: boolean;
}

const RemoveStylesButtonComponent: FC<RemoveStylesButtonProps> = ({ onClick, disabled }) => {
	const localizer = PrintLocalizer.useLocalizer();

	return (
		<ToolbarButtonInternal
			icon={<Icon>cleaning_services</Icon>}
			title={localizer(RESOURCE_KEYS.editor.richTextEditor.toolbarButton.removeStyles)}
			onClick={onClick}
			{...{ disabled }}
		/>
	);
};

export function createRemoveStylesButton(): ButtonType {
	const RemoveStylesButton: FC = () => {
		const [editor] = useLexicalComposerContext();
		const [hasStyles, setHasStyles] = useState(false);

		const updateState = useCallback(() => {
			editor.read(() => {
				const selection = $getSelection();
				if ($isRangeSelection(selection)) {
					const nodes = selection.getNodes();
					let hasAnyStyle = false;

					for (const node of nodes) {
						if ($isInlineStyleTextNode(node)) {
							const style = node.getStyle();
							const format = node.getFormat();

							if (
								(style &&
									(style.includes(`${STYLE_PROPERTIES.COLOR}:`) ||
										style.includes(`${STYLE_PROPERTIES.BACKGROUND_COLOR}:`))) ||
								format !== 0
							) {
								hasAnyStyle = true;
								break;
							}
						}
					}

					setHasStyles(hasAnyStyle);
				}
			});
		}, [editor]);

		useEffect(() => {
			return editor.registerUpdateListener(() => {
				updateState();
			});
		}, [editor, updateState]);

		const handleClick = useCallback(() => {
			editor.update(() => {
				const selection = $getSelection();
				if ($isRangeSelection(selection)) {
					//remove color
					$patchStyleText(selection, {
						[STYLE_PROPERTIES.COLOR]: null,
						[STYLE_PROPERTIES.BACKGROUND_COLOR]: null,
					});
					//remove format
					const nodes = selection.getNodes();
					for (const node of nodes) {
						if ($isInlineStyleTextNode(node)) {
							node.setFormat(0);
						}
					}
				}
			});
		}, [editor]);

		return <RemoveStylesButtonComponent onClick={handleClick} disabled={!hasStyles} />;
	};

	RemoveStylesButton.displayName = "RemoveStylesButton";

	return {
		component: RemoveStylesButton,
		interaction: { isActive: () => false, isDisabled: () => false },
	};
}
