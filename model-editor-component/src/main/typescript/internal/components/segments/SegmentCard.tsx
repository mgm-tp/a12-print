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
import { shallowEqual, useDispatch, useSelector } from "react-redux";

import { Icon, TextField } from "@com.mgmtp.a12.widgets/widgets-core";
import { GlobalRegion, SidebarItem } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import type { DataContext, PartialReference, PartialSegment } from "@com.mgmtp.a12.print/print-model-api/model";
import { PageOrientation, SegmentType } from "@com.mgmtp.a12.print/print-model-api/model";
import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/errors";
import type { DeepPartial } from "@com.mgmtp.a12.print/print-model-api/utils";

import {
	EditorStateActions,
	NavigationActions,
	NavigationSelectors,
	TransactionLogStateActions,
	ValidationCounter,
} from "../../redux/index.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";
import { InteractionLogActions } from "../../redux//interaction-log/index.js";
import type { PrintEngineState } from "../../../a12internal/api/PrintEngineState.js";
import { ValidationSelectors } from "../../redux//validation/selectors.js";
import { RequestApiSelectors } from "../../redux//request-api/selectors.js";
import { EditorComponentContext } from "../../api/context-api.js";
import { ROOT_DATA_CONTEXT_ENTRY } from "../../constant/data-context.js";

import { BadgeGroup } from "../badge/BadgeGroup.js";
import { CustomTextField, DynamicSourceTextField } from "../forms/custom-base-input-components/index.js";
import { RepeatableSettings } from "../custom-input/RepeatableSettings.js";
import { SideBarItemActionButtons } from "../sidebar/SideBarItemActionButtons.js";

import {
	StyledLeftSideSegmentSetting,
	StyledOpenCollapsibleSegment,
	StyledSegmentCard,
	StyledSegmentCardContainer,
	StyledSegmentTitle,
} from "./SegmentCard.styled.js";
import { DinTemplateSegmentItem } from "./din-template-segment-item.js";

export interface SegmentCardProps {
	/** Missing when this card represents a fragment reference whose segment is gone from its fragment model. */
	segment?: PartialSegment;
	isOpenSetting?: boolean;
	setOpenSetting?: (segmentId?: string) => void;
	/** The reference when this card represents a referenced fragment segment. */
	reference?: PartialReference;
	onRemoveReference?: () => void;
	onDuplicateReference?: () => void;
	onUnlinkReference?: () => void;
}

export const SegmentCard: React.FunctionComponent<SegmentCardProps> = React.memo(function SegmentCard({
	segment,
	isOpenSetting = false,
	setOpenSetting,
	reference,
	onRemoveReference,
	onDuplicateReference,
	onUnlinkReference,
}) {
	const dispatch = useDispatch();
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
	const printModelRefs = useSelector(NavigationSelectors.activeEntities);
	const referenceError = useSelector((state: PrintEngineState) =>
		reference ? ValidationSelectors.segmentFragmentReferenceError(state, reference.id) : undefined
	);
	const referenceErrorMessage = errorMessageLocalizer(ValidationSelectors.ownFragmentReferenceErrors(referenceError));
	// The title of a card and a badge take plain text only.
	const referenceErrorTitle = typeof referenceErrorMessage === "string" ? referenceErrorMessage : undefined;
	/* A reference whose segment is missing is selectable as well - the stage then simply stays empty. */
	const entityId = segment?.id ?? reference?.id;

	const openEditor = React.useCallback(() => {
		if (!entityId) {
			return;
		}
		dispatch(
			EditorStateActions.openEditorView({
				...printModelRefs,
				segmentId: entityId,
				currentRefType: SidebarItem.SEGMENT,
			})
		);
	}, [dispatch, entityId, printModelRefs]);

	const isSelectedSegment = React.useMemo(
		() => Boolean(entityId && printModelRefs.segmentId === entityId),
		[printModelRefs.segmentId, entityId]
	);

	return (
		<StyledSegmentCardContainer isSelected={isSelectedSegment} data-testid="segment-card">
			<StyledSegmentCard isSelected={isSelectedSegment} onClick={openEditor}>
				<LeftSideSegmentSetting
					segment={segment}
					reference={reference}
					referenceErrorTitle={referenceErrorTitle}
				/>
				{segment ? (
					<StyledSegmentTitle title={referenceErrorTitle}>{segment.title}</StyledSegmentTitle>
				) : (
					<CustomTextField
						value={reference?.refId}
						onClick={event => event.stopPropagation()}
						errorMessage={referenceErrorMessage}
						hideLabel
						disabled
					/>
				)}
				<RightSideSegmentSetting
					segment={segment}
					isOpenSetting={isOpenSetting}
					setOpenSetting={setOpenSetting}
					reference={reference}
					onRemoveReference={onRemoveReference}
					onDuplicateReference={onDuplicateReference}
					onUnlinkReference={onUnlinkReference}
				/>
			</StyledSegmentCard>
			{isOpenSetting && segment && <CollapsibleSegmentSetting segment={segment} isReadonly={!!reference} />}
		</StyledSegmentCardContainer>
	);
});

interface LeftSideSegmentSettingProps {
	readonly segment?: PartialSegment;
	readonly reference?: PartialReference;
	readonly referenceErrorTitle?: string;
}

export const LeftSideSegmentSetting = ({ segment, reference, referenceErrorTitle }: LeftSideSegmentSettingProps) => {
	const localizer = PrintLocalizer.useLocalizer();

	const segmentValidationCounter = useSelector((state: PrintEngineState) => {
		if (reference) {
			return ValidationSelectors.segmentFragmentReferenceValidationCounter(state, reference.id);
		}
		if (segment) {
			return ValidationSelectors.segmentValidationCounter(state, segment.id);
		}
		return ValidationCounter.EMPTY_VALIDATION_COUNTER;
	}, shallowEqual);
	const dinTemplateSegmentItem = useSelector((state: PrintEngineState) =>
		segment ? RequestApiSelectors.dinTemplateSegmentItem(state, segment.id) : undefined
	);

	const PageOrientationIcon = React.useMemo(() => {
		if (!segment) {
			// The page orientation is part of the missing segment definition, so there is nothing to show.
			return null;
		}
		const isPortraitOrientation = segment.defaultSegment?.pageOrientation === PageOrientation.Portrait;
		const iconName = isPortraitOrientation ? "description" : "topic";
		const localizedKey = isPortraitOrientation
			? RESOURCE_KEYS.editor.pageOrientation.portrait
			: RESOURCE_KEYS.editor.pageOrientation.landscape;
		return <Icon title={localizer(localizedKey)}>{iconName}</Icon>;
	}, [localizer, segment]);

	const SegmentTypeIcon = React.useMemo(() => {
		return (
			<>
				{segment?.type === SegmentType.Repeatable && (
					<Icon title={localizer(RESOURCE_KEYS.sidebar.segment.repeatable)}>repeat</Icon>
				)}
				{reference && (
					<Icon title={localizer(RESOURCE_KEYS.sidebar.segment.reference.referencedLabel)}>link</Icon>
				)}
				{dinTemplateSegmentItem && (
					<Icon
						title={`${localizer(RESOURCE_KEYS.sidebar.segment.setting.segmentTemplate)}: ${DinTemplateSegmentItem.stringify(dinTemplateSegmentItem)}`}
					>
						link
					</Icon>
				)}
			</>
		);
	}, [reference, dinTemplateSegmentItem, localizer, segment?.type]);

	return (
		<StyledLeftSideSegmentSetting>
			{PageOrientationIcon}
			{SegmentTypeIcon}
			<BadgeGroup validationCounter={segmentValidationCounter} errorTitle={referenceErrorTitle} standalone />
		</StyledLeftSideSegmentSetting>
	);
};

interface RightSideSegmentSettingProps {
	readonly segment?: PartialSegment;
	readonly isOpenSetting: boolean;
	readonly reference?: PartialReference;

	setOpenSetting?: (segmentId?: string) => void;

	onRemoveReference?: () => void;

	onDuplicateReference?: () => void;

	onUnlinkReference?: () => void;
}

export const RightSideSegmentSetting = ({
	segment,
	isOpenSetting,
	setOpenSetting,
	reference,
	onRemoveReference,
	onDuplicateReference,
	onUnlinkReference,
}: RightSideSegmentSettingProps) => {
	const dispatch = useDispatch();

	const duplicateSegmentation = React.useCallback(() => {
		if (!segment) {
			return;
		}
		dispatch(
			InteractionLogActions.start({
				description: RESOURCE_KEYS.interaction.segment.segmentCard.duplicateSegment,
				region: GlobalRegion.SIDEBAR,
				transactionLogActions: [TransactionLogStateActions.duplicateSegment({ data: segment })],
			})
		);
	}, [dispatch, segment]);

	const deleteSegmentation = React.useCallback(() => {
		if (!segment) {
			return;
		}
		dispatch(
			InteractionLogActions.start({
				description: RESOURCE_KEYS.interaction.segment.segmentCard.deleteSegment,
				region: GlobalRegion.SIDEBAR,
				transactionLogActions: [TransactionLogStateActions.removeSegment({ data: { id: segment.id } })],
				affectedItems: [{ type: "segment", id: segment.id }],
			})
		);
	}, [dispatch, segment]);

	const onNavigateToSource = React.useCallback(() => {
		if (!reference) {
			return;
		}
		dispatch(NavigationActions.navigateToFragmentSource({ referenceId: reference.id, entityType: "segment" }));
	}, [dispatch, reference]);

	if (reference && !segment) {
		// There are no settings to open and nothing worth duplicating - the referenced segment is gone.
		return (
			<SideBarItemActionButtons
				entityId={reference.id}
				type="segment"
				deleteItem={onRemoveReference ?? (() => undefined)}
				navigateToSource={onNavigateToSource}
			/>
		);
	}

	if (!segment) {
		return null;
	}

	if (reference) {
		return (
			<SideBarItemActionButtons
				entityId={segment.id}
				type="segment"
				isOpenSetting={isOpenSetting}
				setOpenSetting={setOpenSetting}
				duplicateItem={onDuplicateReference ?? (() => undefined)}
				deleteItem={onRemoveReference ?? (() => undefined)}
				unlinkItem={onUnlinkReference}
				navigateToSource={onNavigateToSource}
			/>
		);
	}

	return (
		<SideBarItemActionButtons
			entityId={segment.id}
			type="segment"
			isOpenSetting={isOpenSetting}
			setOpenSetting={setOpenSetting}
			duplicateItem={duplicateSegmentation}
			deleteItem={deleteSegmentation}
		/>
	);
};

interface CollapsibleSegmentSettingProps {
	readonly segment: PartialSegment;
	readonly isReadonly?: boolean;
}

export const CollapsibleSegmentSetting = ({ segment, isReadonly = false }: CollapsibleSegmentSettingProps) => {
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
	const { isFragmentModel } = React.useContext(EditorComponentContext);
	const dinTemplateSegmentItem = useSelector((state: PrintEngineState) =>
		RequestApiSelectors.dinTemplateSegmentItem(state, segment.id)
	);

	const segmentErrorMap = useSelector((state: PrintEngineState) => ValidationSelectors.segment(state, segment.id));

	const titleErrorMessage = React.useMemo(() => {
		const titleErrorMap = segmentErrorMap?.title;
		return titleErrorMap?.[ErrorSeverity.ERROR].length
			? errorMessageLocalizer(titleErrorMap?.[ErrorSeverity.ERROR])
			: undefined;
	}, [errorMessageLocalizer, segmentErrorMap?.title]);

	const onUpdateSegmentTitle = React.useCallback(
		(event: React.FocusEvent<HTMLInputElement>) => {
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.segment.segmentCard.updateSegment,
					region: GlobalRegion.SIDEBAR,
					transactionLogActions: [
						TransactionLogStateActions.updateSegment({
							data: {
								...segment,
								title: event.target.value,
							},
						}),
					],
				})
			);
		},
		[dispatch, segment]
	);

	const onUpdateDataContexts = React.useCallback(
		(updatedDataContexts: DeepPartial<DataContext>[]) => {
			const isRepeatable = updatedDataContexts?.some(context => context.isRepetition);
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.segment.segmentCard.updateSegment,
					region: GlobalRegion.SIDEBAR,
					transactionLogActions: [
						TransactionLogStateActions.updateSegment({
							data: {
								...segment,
								type: !isRepeatable ? SegmentType.Default : SegmentType.Repeatable,
								dataContexts: updatedDataContexts,
							},
						}),
					],
				})
			);
		},
		[dispatch, segment]
	);

	const preventDragEvent = React.useCallback((event: React.MouseEvent<HTMLElement, MouseEvent>) => {
		event.preventDefault();
		event.stopPropagation();
	}, []);

	return (
		<StyledOpenCollapsibleSegment draggable onDragStart={preventDragEvent} isFragmentModel={isFragmentModel}>
			<DynamicSourceTextField
				value={segment.title}
				placeholder={localizer(RESOURCE_KEYS.sidebar.segment.setting.namePlaceholder)}
				onBlur={onUpdateSegmentTitle}
				errorMessage={titleErrorMessage}
				label={localizer(RESOURCE_KEYS.sidebar.segment.setting.name)}
				readonly={isReadonly}
			/>
			{dinTemplateSegmentItem && (
				<TextField
					readonly
					value={DinTemplateSegmentItem.stringify(dinTemplateSegmentItem)}
					label={localizer(RESOURCE_KEYS.sidebar.segment.setting.segmentTemplate)}
				/>
			)}
			{!dinTemplateSegmentItem && (
				<RepeatableSettings
					wrapperDataContext={[ROOT_DATA_CONTEXT_ENTRY]}
					dataContexts={segment?.dataContexts}
					onUpdateDataContexts={onUpdateDataContexts}
					dataContextErrorMap={segmentErrorMap?.dataContexts}
					isReadonly={isReadonly}
				/>
			)}
		</StyledOpenCollapsibleSegment>
	);
};
