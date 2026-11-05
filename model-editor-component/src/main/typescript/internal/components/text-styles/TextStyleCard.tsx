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

import { GlobalRegion } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import { Badge, Icon, Button, PopUpMenu, CssEllipsis } from "@com.mgmtp.a12.widgets/widgets-core";
import type { DeepPartial } from "@com.mgmtp.a12.print/print-model-api/utils";
import type { PartialReference, PartialTextStyle, Semantic } from "@com.mgmtp.a12.print/print-model-api/model";
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
	textStyle?: PartialTextStyle;
	reference?: PartialReference;
	isDefaultTextStyle?: boolean;
	isReadonly?: boolean;
	onRemoveReference?: () => void;
	onUnlinkReference?: () => void;
	navigateToSource?: () => void;
	usageCount?: number;
	onShowUsages?: () => void;
	usagesLoading?: boolean;
	selectionId?: string;
}

export const TextStyleCard = ({
	textStyle,
	reference,
	isDefaultTextStyle = false,
	isReadonly = false,
	onRemoveReference,
	onUnlinkReference,
	navigateToSource,
	usageCount,
	onShowUsages,
	usagesLoading,
	selectionId = textStyle?.id ?? reference?.id,
}: TextStyleCardProps) => {
	const dispatch = useDispatch();

	const ref = React.useRef<HTMLDivElement | null>(null);
	const selectedTextStyleId = useSelector(PrintEngineSelectors.selectedTextStyleId);
	const defaultTextStyle = useSelector(PrintEngineSelectors.defaultTextStyle);

	const fonts = useSelector(PrintEngineSelectors.fonts);
	const isSelected = React.useMemo(
		() => !!selectionId && selectedTextStyleId === selectionId,
		[selectedTextStyleId, selectionId]
	);
	const {
		openMenuLabel,
		duplicateButtonLabel,
		deleteButtonLabel,
		unlinkButtonLabel,
		usagesButtonLabel,
		navigateToSourceLabel,
		semanticButtonTitle,
	} = useButtonLabels(textStyle?.semantic);
	const showUsagesEntry = Boolean(onShowUsages);
	const usagesDisabled = usagesLoading || !usageCount;
	const error = useSelector((state: PrintEngineState) => ValidationSelectors.textStyle(state, textStyle?.id));

	const fontIsNotConfigured = React.useMemo(
		() => isFontNotConfigured(fonts, textStyle?.font),
		[fonts, textStyle?.font]
	);

	const referenceCounter = useSelector((state: PrintEngineState) =>
		reference?.id
			? ValidationSelectors.textStyleReferenceValidationCounter(state, reference?.id)
			: ValidationCounter.EMPTY_VALIDATION_COUNTER
	);
	const referenceError = useSelector((state: PrintEngineState) =>
		reference?.id ? ValidationSelectors.textStyleReferenceError(state, reference.id) : undefined
	);
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
	const localizedReferenceError = errorMessageLocalizer(
		ValidationSelectors.ownFragmentReferenceErrors(referenceError)
	);
	const referenceErrorMessage = typeof localizedReferenceError === "string" ? localizedReferenceError : undefined;

	const isMissingReference = !textStyle;
	// Build the counter immutably: never mutate the object returned by ValidationCounter.from,
	// since it may be a shared reference (would otherwise leak warnings into other cards).
	let additionalWarnings = 0;
	// A missing reference has no text style whose font could be checked - only the reference itself is wrong.
	if (!isMissingReference && fontIsNotConfigured) {
		additionalWarnings += 1;
	}
	const textStyleValidationCounter: ValidationCounter = ValidationCounter.add(
		ValidationCounter.add(ValidationCounter.from(error), {
			error: 0,
			warning: additionalWarnings,
		}),
		referenceCounter
	);

	const isTextStyleUsed = useSelector((state: PrintEngineState) =>
		PrintEngineSelectors.isTextStyleUsedByPrintModel(state, reference?.id ?? textStyle?.id)
	);

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
		if (!textStyle) {
			return;
		}
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
			if (isSelected) {
				dispatch(EditorStateActions.updateSelectedTextStyleId(defaultTextStyle.id));
			}
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.textStyle.textStyleCard.removeTextStyle,
					region: GlobalRegion.SIDEBAR,
					transactionLogActions: [TransactionLogStateActions.removeTextStyle({ data: { id: textStyle.id } })],
					affectedItems: [{ type: "textStyle", id: textStyle.id }],
				})
			);
		}
	}, [dispatch, isTextStyleUsed, textStyle, isSelected, defaultTextStyle.id]);

	const removeReference = React.useCallback(() => {
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
			if (isSelected) {
				dispatch(EditorStateActions.updateSelectedTextStyleId(defaultTextStyle.id));
			}
			onRemoveReference?.();
		}
	}, [dispatch, isTextStyleUsed, onRemoveReference, isSelected, defaultTextStyle.id]);

	const duplicateTextStyle = React.useCallback(() => {
		if (!textStyle) {
			return;
		}
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
		selectionId && dispatch(EditorStateActions.updateSelectedTextStyleId(selectionId));
	}, [dispatch, selectionId]);

	return (
		<StyledTextStyleCard data-testid="text-style-card" isSelected={isSelected} onClick={onTextStyleClick} ref={ref}>
			<StyledTextStyleCardName data-testid="text-style-card-name" title={referenceErrorMessage}>
				<CssEllipsis maxLine={1}>{textStyle?.name ?? reference?.refId}</CssEllipsis>
				<StyledTextStyleCardSemanticHyphen>-</StyledTextStyleCardSemanticHyphen>
				<StyledTextStyleCardSemantic maxLine={1}>{semanticButtonTitle}</StyledTextStyleCardSemantic>
			</StyledTextStyleCardName>
			<BadgeGroup validationCounter={textStyleValidationCounter} errorTitle={referenceErrorMessage} standalone />
			<StyledTextStyleCardButtonGroup alignment="right">
				{!isDefaultTextStyle && !isReadonly && (
					<StyledDragIcon data-testid="drag-icon" size="big">
						drag_handle
					</StyledDragIcon>
				)}
				<PopUpMenu triggerButtonTitle={openMenuLabel} onTriggerElementClick={event => event.stopPropagation()}>
					{navigateToSource && (
						<Button
							label={navigateToSourceLabel}
							title={navigateToSourceLabel}
							icon={<Icon>open_in_new</Icon>}
							onClick={navigateToSource}
						/>
					)}
					{showUsagesEntry && (
						<Button
							label={
								<>
									{usagesButtonLabel}{" "}
									{!usagesLoading && <Badge count={usageCount ?? 0} standalone light />}
								</>
							}
							title={usagesButtonLabel}
							icon={<Icon>open_in_new</Icon>}
							onClick={onShowUsages}
							disabled={usagesDisabled}
						/>
					)}
					{!isReadonly && (
						<Button
							title={duplicateButtonLabel}
							label={duplicateButtonLabel}
							icon={<Icon>content_copy</Icon>}
							onClick={duplicateTextStyle}
						/>
					)}
					{onUnlinkReference && (
						<Button
							title={unlinkButtonLabel}
							label={unlinkButtonLabel}
							icon={<Icon>link_off</Icon>}
							onClick={onUnlinkReference}
						/>
					)}
					<Button
						title={deleteButtonLabel}
						label={deleteButtonLabel}
						onClick={isReadonly ? removeReference : removeTextStyle}
						icon={<Icon variant={"error"}>delete</Icon>}
						destructive
						disabled={isDefaultTextStyle || usagesLoading || Boolean(usageCount)}
					/>
				</PopUpMenu>
			</StyledTextStyleCardButtonGroup>
		</StyledTextStyleCard>
	);
};

function useButtonLabels(semantic: DeepPartial<Semantic> | undefined) {
	const localizer = PrintLocalizer.useLocalizer();

	return React.useMemo(
		() => ({
			openMenuLabel: localizer(RESOURCE_KEYS.button.openMenu),
			duplicateButtonLabel: localizer(RESOURCE_KEYS.button.duplicate),
			deleteButtonLabel: localizer(RESOURCE_KEYS.button.delete),
			unlinkButtonLabel: localizer(RESOURCE_KEYS.button.unlink),
			usagesButtonLabel: localizer(RESOURCE_KEYS.fragmentUsage.modalTitle),
			navigateToSourceLabel: localizer(RESOURCE_KEYS.button.navigateToSource),
			semanticButtonTitle: semantic && localizer(RESOURCE_KEYS.textStyles.semantic[semantic]),
		}),
		[localizer, semantic]
	);
}
