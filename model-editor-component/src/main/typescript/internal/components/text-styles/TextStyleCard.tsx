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
import isEmpty from "lodash/isEmpty.js";

import { GlobalRegion } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import { Icon, Button, PopUpMenu, CssEllipsis } from "@com.mgmtp.a12.widgets/widgets-core";
import type { DeepPartial } from "@com.mgmtp.a12.print/print-model-api/utils";
import type { PartialTextStyle } from "@com.mgmtp.a12.print/print-model-api/model";
import { Semantic } from "@com.mgmtp.a12.print/print-model-api/model";
import { isFontNotConfigured } from "@com.mgmtp.a12.print/print-fonts/a12internal";

import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";
import {
	EditorStateActions,
	InteractionLogActions,
	TransactionLogStateActions,
	ValidationCounter,
} from "../../redux/index.js";
import type { PrintEngineState } from "../../../a12internal/api/PrintEngineState.js";
import { ValidationSelectors } from "../../redux//validation/selectors.js";
import { PrintEngineSelectors } from "../../store/selectors.js";
import { EditorComponentApiActions } from "../../../a12internal/api/actions-api.js";
import { DEFAULT_ERROR_TOAST_DURATION } from "../../constant/configs.js";
import { useTypesettingModelData } from "../../hooks/use-typesetting-model-data.js";

import { BadgeGroup } from "../badge/BadgeGroup.js";

import {
	StyledDragIcon,
	StyledTextStyleCard,
	StyledTextStyleCardButtonGroup,
	StyledTextStyleCardName,
	StyledTextStyleCardSemantic,
	StyledTextStyleCardSemanticHyphen,
} from "./TextStyleCard.styled.js";

interface TextStyleCardProps {
	textStyle: PartialTextStyle;
	isDefaultTextStyle?: boolean;
}

export const TextStyleCard = ({ textStyle, isDefaultTextStyle = false }: TextStyleCardProps) => {
	const dispatch = useDispatch();

	const ref = React.useRef<HTMLDivElement | null>(null);
	const selectedTextStyleId = useSelector(PrintEngineSelectors.selectedTextStyleId);

	const fonts = useSelector(PrintEngineSelectors.fonts);
	const isSelected = React.useMemo(() => selectedTextStyleId === textStyle.id, [selectedTextStyleId, textStyle.id]);
	const { openMenuLabel, duplicateButtonLabel, deleteButtonLabel, semanticButtonTitle } = useButtonLabels(
		textStyle.semantic
	);
	const error = useSelector((state: PrintEngineState) => ValidationSelectors.textStyle(state, textStyle?.id));
	const textStyleValidationCounter: ValidationCounter = ValidationCounter.from(error);

	const typesettingModel = useTypesettingModelData(textStyle.typesettingModelName);

	const fontIsNotConfigured = React.useMemo(
		() => isFontNotConfigured(fonts, textStyle.font),
		[fonts, textStyle.font]
	);

	if (fontIsNotConfigured) {
		textStyleValidationCounter.warning += 1;
	}

	if (textStyle.typesettingModelName && !typesettingModel) {
		textStyleValidationCounter.warning += 1;
	}

	const { segmentsMap, sectionsMap, wrapperMap } = useSelector((state: PrintEngineState) =>
		PrintEngineSelectors.elementsAffectedByTextStyleChange(state, textStyle.id)
	);
	const isTextStyleUsed = !isEmpty(segmentsMap) || !isEmpty(sectionsMap) || !isEmpty(wrapperMap);

	React.useEffect(() => {
		if (isSelected && ref.current) {
			ref.current?.scrollIntoView({
				behavior: "smooth",
				block: "center",
				inline: "center",
			});
			ref.current?.focus();
		}
	}, [isSelected]);

	const removeTextStyle = React.useCallback(() => {
		if (isTextStyleUsed) {
			dispatch(
				EditorComponentApiActions.addNotification({
					title: { key: RESOURCE_KEYS.textStyles.notification.preventDelete.title },
					message: { key: RESOURCE_KEYS.textStyles.notification.preventDelete.description },
					severity: "error",
					duration: DEFAULT_ERROR_TOAST_DURATION,
				})
			);
		} else {
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.textStyle.textStyleCard.removeTextStyle,
					region: GlobalRegion.SIDEBAR,
					transactionLogActions: [TransactionLogStateActions.removeTextStyle({ data: { id: textStyle.id } })],
					affectedItems: [{ type: "textStyle", id: textStyle.id }],
				})
			);
		}
	}, [dispatch, isTextStyleUsed, textStyle.id]);

	const duplicateTextStyle = React.useCallback(() => {
		const newTextStyleId = nanoid();
		dispatch(
			InteractionLogActions.start({
				description: RESOURCE_KEYS.interaction.textStyle.textStyleCard.duplicateTextStyle,
				region: GlobalRegion.SIDEBAR,
				transactionLogActions: [
					TransactionLogStateActions.addTextStyle({ data: { ...textStyle, id: newTextStyleId } }),
				],
			})
		);
		dispatch(EditorStateActions.updateSelectedTextStyleId(newTextStyleId));
	}, [dispatch, textStyle]);

	const onTextStyleClick = React.useCallback(() => {
		dispatch(EditorStateActions.updateSelectedTextStyleId(textStyle.id));
	}, [dispatch, textStyle.id]);

	return (
		<StyledTextStyleCard data-testid="text-style-card" isSelected={isSelected} onClick={onTextStyleClick} ref={ref}>
			<StyledTextStyleCardName data-testid="text-style-card-name">
				<CssEllipsis maxLine={1}>{textStyle.name}</CssEllipsis>
				<StyledTextStyleCardSemanticHyphen>-</StyledTextStyleCardSemanticHyphen>
				<StyledTextStyleCardSemantic maxLine={1}>{semanticButtonTitle}</StyledTextStyleCardSemantic>
			</StyledTextStyleCardName>
			<BadgeGroup validationCounter={textStyleValidationCounter} standalone />
			<StyledTextStyleCardButtonGroup alignment="right">
				{!isDefaultTextStyle && (
					<StyledDragIcon data-testid="drag-icon" size="big">
						drag_handle
					</StyledDragIcon>
				)}
				<PopUpMenu triggerButtonTitle={openMenuLabel} onTriggerElementClick={event => event.stopPropagation()}>
					<Button
						title={duplicateButtonLabel}
						label={duplicateButtonLabel}
						icon={<Icon>content_copy</Icon>}
						onClick={duplicateTextStyle}
					/>
					<Button
						title={deleteButtonLabel}
						label={deleteButtonLabel}
						onClick={removeTextStyle}
						icon={<Icon variant={"error"}>delete</Icon>}
						destructive
						disabled={isDefaultTextStyle}
					/>
				</PopUpMenu>
			</StyledTextStyleCardButtonGroup>
		</StyledTextStyleCard>
	);
};

function useButtonLabels(semantic: DeepPartial<Semantic> = Semantic.P) {
	const localizer = PrintLocalizer.useLocalizer();

	return React.useMemo(
		() => ({
			openMenuLabel: localizer(RESOURCE_KEYS.button.openMenu),
			duplicateButtonLabel: localizer(RESOURCE_KEYS.button.duplicate),
			deleteButtonLabel: localizer(RESOURCE_KEYS.button.delete),
			semanticButtonTitle: localizer(RESOURCE_KEYS.textStyles.semantic[semantic]),
		}),
		[localizer, semantic]
	);
}
