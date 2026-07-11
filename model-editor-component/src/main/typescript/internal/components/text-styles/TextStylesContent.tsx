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

import { GlobalRegion } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import type { PartialTextStyle } from "@com.mgmtp.a12.print/print-model-api/model";

import { PrintEngineSelectors } from "../../store/selectors.js";
import { EditorStateActions, InteractionLogActions, TransactionLogStateActions } from "../../redux/index.js";
import { RESOURCE_KEYS } from "../../localization/index.js";
import { TEXT_STYLE_CARD } from "../../constant/drag.js";

import { DragListItemWrapper } from "../drag-and-drop/index.js";

import { TextStyleCard } from "./TextStyleCard.js";
import { TextStyleEditor } from "./TextStyleEditor.js";
import { StyledTextStyleContentWrapper, StyledTextStyleDragListWrapper } from "./TextStylesContent.styled.js";

export const TextStylesContent = () => {
	const dispatch = useDispatch();
	const defaultTextStyle = useSelector(PrintEngineSelectors.defaultTextStyle);
	const textStyles = useSelector(PrintEngineSelectors.textStyles);
	const selectedTextStyleId = useSelector(PrintEngineSelectors.selectedTextStyleId);
	const selectedTextStyle =
		textStyles.find((textStyle: PartialTextStyle) => textStyle.id === selectedTextStyleId) || defaultTextStyle;

	const onMoveItem = React.useCallback(
		(item: PartialTextStyle, currentIndex: number, targetIndex: number) => {
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.textStyle.textStyleContent.reorderTextStyle,
					region: GlobalRegion.SIDEBAR,
					transactionLogActions: [
						TransactionLogStateActions.moveTextStyle({ data: { currentIndex, targetIndex } }),
					],
				})
			);
		},
		[dispatch]
	);

	React.useEffect(() => {
		if (selectedTextStyleId !== defaultTextStyle.id && !textStyles.find(el => el.id === selectedTextStyleId)) {
			dispatch(EditorStateActions.updateSelectedTextStyleId(defaultTextStyle.id));
		}
	}, [defaultTextStyle.id, dispatch, selectedTextStyleId, textStyles]);

	return (
		<StyledTextStyleContentWrapper>
			<StyledTextStyleDragListWrapper>
				<TextStyleCard textStyle={defaultTextStyle} isDefaultTextStyle={true} />
				{textStyles.map((item: PartialTextStyle, index: number) => (
					<DragListItemWrapper
						key={item.id}
						onMoveItem={onMoveItem}
						index={index}
						item={item}
						type={TEXT_STYLE_CARD}
					>
						<TextStyleCard textStyle={item} />
					</DragListItemWrapper>
				))}
			</StyledTextStyleDragListWrapper>
			<TextStyleEditor textStyle={selectedTextStyle} />
		</StyledTextStyleContentWrapper>
	);
};
