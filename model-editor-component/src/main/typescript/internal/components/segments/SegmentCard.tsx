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

import { Button } from "@com.mgmtp.a12.widgets/widgets-core/lib/button/main/button.view.js";
import { Icon } from "@com.mgmtp.a12.widgets/widgets-core/lib/icon/index.js";
import { PopUpMenu } from "@com.mgmtp.a12.widgets/widgets-core/lib/pop-up-menu/main/pop-up-menu.view.js";
import {
	GlobalRegion,
	SidebarItem,
} from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/index.js";
import {
	DataContext,
	PageOrientation,
	PartialSegment,
	SegmentType,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/lib/errors/index.js";
import { TextLineStateless } from "@com.mgmtp.a12.widgets/widgets-core/lib/input/index.js";
import { DeepPartial } from "@com.mgmtp.a12.print/print-model-api/lib/utils/type-utils.js";

import { EditorStateActions, TransactionLogStateActions, ValidationCounter } from "../../redux/index.js";
import { PrintEngineSelectors } from "../../store/selectors.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";
import { InteractionLogActions } from "../../redux/interaction-log/index.js";
import { PrintEngineState } from "../../store/root-reducer.js";
import { ValidationSelectors } from "../../redux/validation/selectors.js";
import { RequestApiSelectors } from "../../redux/request-api/selectors.js";
import { ROOT_DATA_CONTEXT_ENTRY } from "../../constant/data-context.js";

import { BadgeGroup } from "../badge/BadgeGroup.js";
import { CustomTextLineStateful } from "../forms/custom-base-input-components/index.js";
import { RepeatableSettings } from "../custom-input/RepeatableSettings.js";

import {
	StyledLeftSideSegmentSetting,
	StyledOpenCollapsibleSegment,
	StyledRightSideSegmentSetting,
	StyledSegmentCard,
	StyledSegmentCardContainer,
	StyledSegmentTitle,
} from "./SegmentCard.styled.js";
import { DinTemplateSegmentItem } from "./din-template-segment-item.js";

export interface SegmentCardProps {
	segment: PartialSegment;
	isOpenSetting: boolean;
	setOpenSetting: (segmentId?: string) => void;
}

export const SegmentCard: React.FunctionComponent<SegmentCardProps> = React.memo(function SegmentCard({
	segment,
	isOpenSetting,
	setOpenSetting,
}) {
	const dispatch = useDispatch();
	const printModelRefs = useSelector(PrintEngineSelectors.printModelRefs);

	const openEditor = React.useCallback(() => {
		dispatch(
			EditorStateActions.openEditorView({
				...printModelRefs,
				segmentId: segment.id,
				currentRefType: SidebarItem.SEGMENT,
			})
		);
	}, [dispatch, segment, printModelRefs]);

	const isSelectedSegment = React.useMemo(
		() => printModelRefs.segmentId === segment.id,
		[printModelRefs.segmentId, segment.id]
	);

	return (
		<StyledSegmentCardContainer isSelected={isSelectedSegment} data-testid="segment-card">
			<StyledSegmentCard isSelected={isSelectedSegment} onClick={openEditor}>
				<LeftSideSegmentSetting segment={segment} />
				<StyledSegmentTitle>{segment.title}</StyledSegmentTitle>
				<RightSideSegmentSetting
					segment={segment}
					isOpenSetting={isOpenSetting}
					setOpenSetting={setOpenSetting}
					openEditor={openEditor}
				/>
			</StyledSegmentCard>
			{isOpenSetting && <CollapsibleSegmentSetting segment={segment} />}
		</StyledSegmentCardContainer>
	);
});

interface LeftSideSegmentSettingProps {
	readonly segment: PartialSegment;
}

export const LeftSideSegmentSetting = ({ segment }: LeftSideSegmentSettingProps) => {
	const localizer = PrintLocalizer.useLocalizer();
	const segmentValidationCounter: ValidationCounter = useSelector((state: PrintEngineState) =>
		ValidationSelectors.segmentValidationCounter(state, segment?.id)
	);
	const dinTemplateSegmentItem = useSelector((state: PrintEngineState) =>
		RequestApiSelectors.dinTemplateSegmentItem(state, segment.id)
	);

	const PageOrientationIcon = React.useMemo(() => {
		const isPortraitOrientation = segment.defaultSegment?.pageOrientation === PageOrientation.Portrait;
		const iconName = isPortraitOrientation ? "description" : "topic";
		const localizedKey = isPortraitOrientation
			? RESOURCE_KEYS.editor.pageOrientation.portrait
			: RESOURCE_KEYS.editor.pageOrientation.landscape;
		return <Icon title={localizer(localizedKey)}>{iconName}</Icon>;
	}, [localizer, segment.defaultSegment?.pageOrientation]);

	const SegmentTypeIcon = React.useMemo(() => {
		if (dinTemplateSegmentItem) {
			const localizedSegmentTemplate = localizer(RESOURCE_KEYS.sidebar.segment.setting.segmentTemplate);
			return (
				<Icon
					title={`${localizedSegmentTemplate}: ${DinTemplateSegmentItem.stringify(dinTemplateSegmentItem)}`}
				>
					link
				</Icon>
			);
		}
		if (segment.type === SegmentType.Repeatable) {
			return <Icon title={localizer(RESOURCE_KEYS.sidebar.segment.repeatable)}>repeat</Icon>;
		}
		return null;
	}, [dinTemplateSegmentItem, localizer, segment]);

	return (
		<StyledLeftSideSegmentSetting>
			{PageOrientationIcon}
			{SegmentTypeIcon}
			<BadgeGroup validationCounter={segmentValidationCounter} standalone />
		</StyledLeftSideSegmentSetting>
	);
};

interface RightSideSegmentSettingProps {
	readonly segment: PartialSegment;
	readonly isOpenSetting: boolean;

	setOpenSetting: (segmentId?: string) => void;

	openEditor: () => void;
}

export const RightSideSegmentSetting = ({
	segment,
	isOpenSetting,
	setOpenSetting,
	openEditor,
}: RightSideSegmentSettingProps) => {
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();

	const duplicateSegmentation = React.useCallback(() => {
		dispatch(
			InteractionLogActions.start({
				description: RESOURCE_KEYS.interaction.segment.segmentCard.duplicateSegment,
				region: GlobalRegion.SIDEBAR,
				transactionLogActions: [TransactionLogStateActions.duplicateSegment({ data: segment })],
			})
		);
	}, [dispatch, segment]);

	const deleteSegmentation = React.useCallback(() => {
		dispatch(
			InteractionLogActions.start({
				description: RESOURCE_KEYS.interaction.segment.segmentCard.deleteSegment,
				region: GlobalRegion.SIDEBAR,
				transactionLogActions: [TransactionLogStateActions.removeSegment({ data: { id: segment.id } })],
				affectedItems: [{ type: "segment", id: segment.id }],
			})
		);
	}, [dispatch, segment.id]);

	const OpenSetting = React.useMemo(() => {
		const handleOpenSetting = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
			event.stopPropagation();
			setOpenSetting(isOpenSetting ? undefined : segment.id);
		};
		return (
			<Button
				icon={<Icon>{isOpenSetting ? "close" : "settings"}</Icon>}
				onClick={handleOpenSetting}
				title={localizer(RESOURCE_KEYS.button[isOpenSetting ? "closeSetting" : "openSetting"])}
			/>
		);
	}, [isOpenSetting, localizer, setOpenSetting, segment.id]);

	const duplicateButtonLabel = localizer(RESOURCE_KEYS.button.duplicate);
	const deleteButtonLabel = localizer(RESOURCE_KEYS.button.delete);

	return (
		<StyledRightSideSegmentSetting>
			{OpenSetting}
			<Button
				icon={<Icon>square_foot</Icon>}
				onClick={openEditor}
				title={localizer(RESOURCE_KEYS.button.openEditor)}
			/>
			<PopUpMenu
				triggerButtonTitle={localizer(RESOURCE_KEYS.sidebar.segment.button.menuSetting)}
				onTriggerElementClick={(event: React.MouseEvent<HTMLElement, MouseEvent>) => event.stopPropagation()}
			>
				<Button
					label={duplicateButtonLabel}
					title={duplicateButtonLabel}
					icon={<Icon>content_copy</Icon>}
					onClick={duplicateSegmentation}
				/>
				<Button
					label={deleteButtonLabel}
					title={deleteButtonLabel}
					onClick={deleteSegmentation}
					icon={<Icon variant="error">delete</Icon>}
					destructive
				/>
			</PopUpMenu>
		</StyledRightSideSegmentSetting>
	);
};

interface CollapsibleSegmentSettingProps {
	readonly segment: PartialSegment;
}

export const CollapsibleSegmentSetting = ({ segment }: CollapsibleSegmentSettingProps) => {
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
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
		<StyledOpenCollapsibleSegment draggable onDragStart={preventDragEvent}>
			<CustomTextLineStateful
				value={segment.title}
				placeholder={localizer(RESOURCE_KEYS.sidebar.segment.setting.namePlaceholder)}
				onBlur={onUpdateSegmentTitle}
				errorMessage={titleErrorMessage}
				label={localizer(RESOURCE_KEYS.sidebar.segment.setting.name)}
			/>
			{dinTemplateSegmentItem && (
				<TextLineStateless
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
				/>
			)}
		</StyledOpenCollapsibleSegment>
	);
};
