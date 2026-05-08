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
import { nanoid } from "nanoid";

import { ButtonGroup } from "@com.mgmtp.a12.widgets/widgets-core/lib/button-group/index.js";
import { CssEllipsis } from "@com.mgmtp.a12.widgets/widgets-core/lib/css-ellipsis/index.js";
import {
	GlobalRegion,
	USED_TEXT_STYLE,
} from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/interaction-log.js";
import { getPrefixedFontFamily } from "@com.mgmtp.a12.print/print-fonts/lib/internal/api/utils/font-utils.js";

import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";
import { InteractionLogActions, TransactionLogStateActions } from "../../redux/index.js";
import { PrintEngineSelectors } from "../../store/selectors.js";
import { PrintEngineState } from "../../store/root-reducer.js";

import { StyledButton } from "../toolbar/Toolbar.styled.js";
import { TypeSettingApplier } from "../typesetting/TypeSettingApplier.js";

import { TextStylesContent } from "./TextStylesContent.js";
import {
	StyledSampleText,
	StyledSampleTextContainer,
	StyledTextStyleContainer,
	StyledTextStyleToolbar,
} from "./TextStyles.styled.js";

export const TextStyles = () => {
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();
	const defaultTextStyle = useSelector(PrintEngineSelectors.defaultTextStyle);

	const addNewTextStyle = React.useCallback(() => {
		dispatch(
			InteractionLogActions.start({
				description: RESOURCE_KEYS.interaction.textStyle.textStyle.add,
				region: GlobalRegion.SIDEBAR,
				preventUndo: USED_TEXT_STYLE,
				transactionLogActions: [
					TransactionLogStateActions.addTextStyle({
						data: {
							...defaultTextStyle,
							id: nanoid(),
							name: localizer(RESOURCE_KEYS.textStyles.newTextStyleName),
						},
					}),
				],
			})
		);
	}, [defaultTextStyle, dispatch, localizer]);

	return (
		<StyledTextStyleContainer>
			<SampleText />
			<TextStylesContent />
			<StyledTextStyleToolbar>
				<ButtonGroup alignment="right">
					<StyledButton
						label={localizer(RESOURCE_KEYS.textStyles.button.addNewTextStyle)}
						onClick={addNewTextStyle}
					/>
				</ButtonGroup>
			</StyledTextStyleToolbar>
		</StyledTextStyleContainer>
	);
};

const SampleText = () => {
	const selectedTextStyleId = useSelector(PrintEngineSelectors.selectedTextStyleId);
	const textStyle = useSelector((state: PrintEngineState) =>
		PrintEngineSelectors.textStyle(state, selectedTextStyleId)
	);

	const fonts = useSelector(PrintEngineSelectors.fonts);

	// Recalculate height once the fontsize/lineHeight is changed
	const cssEllipsisKey = `CssEllipsis-${textStyle.fontSize}-${textStyle.lineHeight}`;

	const styledSampleTextProps = React.useMemo(
		() => ({
			fontFamily: getPrefixedFontFamily(fonts, textStyle.font),
			fontSize: textStyle.fontSize,
			lineHeight: textStyle.lineHeight,
		}),
		[fonts, textStyle.font, textStyle.fontSize, textStyle.lineHeight]
	);
	return (
		<StyledSampleTextContainer>
			<CssEllipsis key={cssEllipsisKey}>
				<StyledSampleText {...styledSampleTextProps}>
					<TypeSettingApplier textStyleId={textStyle.id}>
						Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt
						ut labore et dolore magna aliquyam erat, sed diam voluptua.Lorem ipsum dolor sit amet,
						consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna
						aliquyam erat, sed diam voluptua.Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed
						diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam
						voluptua.Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor
						invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua.
					</TypeSettingApplier>
				</StyledSampleText>
			</CssEllipsis>
		</StyledSampleTextContainer>
	);
};
