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

import type {
	PartialReference,
	PageOrientation,
	Precondition,
	PartialWatermark,
	FragmentModelReference,
} from "@com.mgmtp.a12.print/print-model-api/model";
import { GlobalRegion, SidebarItem } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/errors";
import { Icon, Button, Select } from "@com.mgmtp.a12.widgets/widgets-core";
import type { DeepPartial } from "@com.mgmtp.a12.print/print-model-api/utils";
import type { SelectItem } from "@com.mgmtp.a12.widgets/widgets-core";

import {
	EditorStateActions,
	FragmentActions,
	InteractionLogActions,
	NavigationActions,
	NavigationSelectors,
	RequestApiSelectors,
	TransactionLogStateActions,
	ValidationCounter,
} from "../../redux/index.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";
import { ValidationSelectors } from "../../redux//validation/selectors.js";
import type { PrintEngineState } from "../../../a12internal/api/PrintEngineState.js";
import { EditorComponentContext } from "../../api/context-api.js";

import { BadgeGroup } from "../badge/BadgeGroup.js";
import { CustomTextField, DynamicSourceTextField } from "../forms/custom-base-input-components/index.js";
import { orientationIconMapping } from "../sections/SectionCard.js";
import type { PreconditionRepeatRowType } from "../forms/index.js";
import { PreconditionsRepeat } from "../forms/index.js";
import { FormContainerHeadline } from "../forms/shared-components/FormContainerHeadline.js";
import { CustomInputWrapper } from "../forms/shared-components/CustomInputWrapper.js";
import { PositiveNumberInput, formatLeadingDecimal } from "../custom-input/PositiveNumberInput.js";
import { SideBarItemActionButtons } from "../sidebar/SideBarItemActionButtons.js";

import {
	StyledConditionDescription,
	StyledOpenCollapsibleWatermark,
	StyledWatermarkCard,
	StyledWatermarkCardContainer,
	StyledWatermarkIcon,
	StyledWatermarkInputColumn,
} from "./WatermarkCard.styled.js";

interface WatermarkCardContentProps {
	watermark?: PartialWatermark;
	pageOrientation?: PageOrientation;
	currentWatermarkSetting?: string;
	setCurrentWatermarkSetting: (entityId?: string) => void;
	/** reference to the {@link FragmentModelReference} when this card represents a referenced fragment watermark. */
	reference?: PartialReference;
}

const WatermarkCardContent = (props: WatermarkCardContentProps) => {
	const { watermark, pageOrientation, currentWatermarkSetting, setCurrentWatermarkSetting, reference } = props;

	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();
	const error = useSelector((state: PrintEngineState) => ValidationSelectors.watermark(state, watermark?.id));
	const referenceError = useSelector((state: PrintEngineState) =>
		reference ? ValidationSelectors.watermarkReferenceError(state, reference.id) : undefined
	);
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
	const watermarkTitleError = error ? errorMessageLocalizer(error.title?.[ErrorSeverity.ERROR]) : undefined;
	const warningMessage = errorMessageLocalizer(error?.[ErrorSeverity.WARNING]);
	const referenceErrorMessage = errorMessageLocalizer(ValidationSelectors.ownFragmentReferenceErrors(referenceError));

	const [title, setTitle] = React.useState(watermark?.title);
	const [prevTitle, setPrevTitle] = React.useState(watermark?.title);

	if (prevTitle !== watermark?.title) {
		setPrevTitle(watermark?.title);
		setTitle(watermark?.title);
	}

	const handleUpdateTitle = React.useCallback(() => {
		if (!watermark || watermark.title === title) {
			return;
		}
		dispatch(
			InteractionLogActions.start({
				description: RESOURCE_KEYS.interaction.watermark.watermarkCard.changeTitle,
				region: "sidebar",
				transactionLogActions: [
					TransactionLogStateActions.updateWatermark({
						data: {
							...watermark,
							title,
						},
					}),
				],
			})
		);
	}, [dispatch, watermark, title]);

	const onClickDeleteWatermark = React.useCallback(() => {
		if (!watermark) {
			return;
		}
		dispatch(
			InteractionLogActions.start({
				description: RESOURCE_KEYS.interaction.watermark.watermarkCard.deleteWatermark,
				region: "sidebar",
				transactionLogActions: [
					TransactionLogStateActions.removeWatermark({
						data: { id: watermark.id },
					}),
				],
				affectedItems: [{ type: "watermark", id: watermark.id }],
			})
		);
	}, [dispatch, watermark]);

	const onClickRemoveReference = React.useCallback(() => {
		if (!reference) {
			return;
		}
		dispatch(
			InteractionLogActions.start({
				description: RESOURCE_KEYS.interaction.watermark.watermarkCard.removeWatermarkReference,
				region: "sidebar",
				transactionLogActions: [
					TransactionLogStateActions.removeWatermarkReference({
						data: { id: reference.id },
					}),
				],
			})
		);
		setCurrentWatermarkSetting(undefined);
	}, [dispatch, setCurrentWatermarkSetting, reference]);

	const onNavigateToSource = React.useCallback(() => {
		if (!reference) {
			return;
		}
		dispatch(NavigationActions.navigateToFragmentSource({ referenceId: reference.id, entityType: "watermark" }));
	}, [dispatch, reference]);

	const onUnlinkReference = React.useCallback(() => {
		if (!reference?.id) {
			return;
		}
		dispatch(FragmentActions.unlinkReference({ referenceId: reference.id, entityType: "watermark" }));
	}, [dispatch, reference]);

	if (watermark && reference) {
		return (
			<>
				<CustomTextField
					value={watermark.title}
					placeholder={localizer(RESOURCE_KEYS.sidebar.watermark.reference.referencedLabel)}
					onClick={event => event.stopPropagation()}
					errorMessage={referenceErrorMessage}
					hideLabel
					disabled
				/>
				<SideBarItemActionButtons
					entityId={reference.id}
					openEditorEntityId={watermark.id}
					type="watermark"
					setOpenSetting={setCurrentWatermarkSetting}
					isOpenSetting={currentWatermarkSetting === reference.id}
					deleteItem={onClickRemoveReference}
					unlinkItem={onUnlinkReference}
					navigateToSource={onNavigateToSource}
				/>
			</>
		);
	}
	if (!watermark && reference) {
		return (
			<>
				<CustomTextField
					value={reference.refId}
					onClick={event => event.stopPropagation()}
					errorMessage={referenceErrorMessage}
					hideLabel
					disabled
				/>
				<SideBarItemActionButtons
					entityId={reference.id}
					type="watermark"
					deleteItem={onClickRemoveReference}
					unlinkItem={onUnlinkReference}
					navigateToSource={onNavigateToSource}
				/>
			</>
		);
	}
	if (watermark) {
		return (
			<>
				<CustomTextField
					value={title}
					placeholder={localizer(RESOURCE_KEYS.sidebar.watermark.titlePlaceholder)}
					onClick={event => event.stopPropagation()}
					onChange={event => setTitle(event.target.value)}
					onBlur={handleUpdateTitle}
					errorMessage={watermarkTitleError}
					warningMessage={warningMessage}
					hideLabel
				/>
				<SideBarItemActionButtons
					entityId={watermark.id}
					type="watermark"
					setOpenSetting={setCurrentWatermarkSetting}
					isOpenSetting={currentWatermarkSetting === watermark.id}
					deleteItem={onClickDeleteWatermark}
					errorMessage={watermarkTitleError}
				/>
			</>
		);
	}
	if (!pageOrientation) {
		return null;
	}
	return <WatermarkFragmentSelect pageOrientation={pageOrientation} />;
};

interface WatermarkCardProps {
	watermark?: PartialWatermark;
	pageOrientation?: PageOrientation;
	reference?: PartialReference;
}
export const WatermarkCard = (props: WatermarkCardProps) => {
	const { watermark, pageOrientation, reference } = props;

	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();
	const printModelRefs = useSelector(NavigationSelectors.activeEntities);
	const watermarkValidationCounter: ValidationCounter = useSelector((state: PrintEngineState) => {
		if (reference) {
			return ValidationSelectors.watermarkReferenceValidationCounter(state, reference.id);
		}
		if (watermark?.id) {
			return ValidationSelectors.watermarkValidationCounter(state, watermark.id);
		}
		return ValidationCounter.EMPTY_VALIDATION_COUNTER;
	});

	const [currentWatermarkSetting, setCurrentWatermarkSetting] = React.useState<string>();

	/* A reference whose watermark is missing is selectable as well - the stage then simply stays empty. */
	const entityId = watermark?.id ?? reference?.id;

	const isSelectedWatermark = React.useMemo(
		() => Boolean(entityId && printModelRefs?.watermarkId === entityId),
		[printModelRefs?.watermarkId, entityId]
	);

	const handleOpenWatermarkEditor = React.useCallback(() => {
		if (!entityId) {
			return;
		}
		dispatch(
			EditorStateActions.openEditorView({
				...printModelRefs,
				watermarkId: entityId,
				currentRefType: SidebarItem.WATERMARK,
			})
		);
	}, [dispatch, printModelRefs, entityId]);

	const orientation = pageOrientation && orientationIconMapping[pageOrientation];

	return (
		<StyledWatermarkCardContainer data-testid="watermark-card" isSelected={isSelectedWatermark}>
			<StyledWatermarkCard onClick={handleOpenWatermarkEditor} isSelected={isSelectedWatermark}>
				<StyledWatermarkIcon>
					{orientation && <Icon title={localizer(orientation?.title)}>{orientation?.icon}</Icon>}
					{reference && (
						<Icon title={localizer(RESOURCE_KEYS.sidebar.watermark.reference.referencedLabel)}>link</Icon>
					)}
					<BadgeGroup validationCounter={watermarkValidationCounter} standalone />
				</StyledWatermarkIcon>

				<WatermarkCardContent
					watermark={watermark}
					pageOrientation={pageOrientation}
					currentWatermarkSetting={currentWatermarkSetting}
					setCurrentWatermarkSetting={setCurrentWatermarkSetting}
					reference={reference}
				/>
			</StyledWatermarkCard>
			{currentWatermarkSetting && watermark && (
				<CollapsibleWatermarkSetting watermark={watermark} isReadonly={!!reference} />
			)}
		</StyledWatermarkCardContainer>
	);
};

interface CollapsibleWatermarkSettingProps {
	readonly watermark: PartialWatermark;
	readonly isReadonly?: boolean;

	includeTitleInSetting?: boolean;
}

const WatermarkFragmentSelect = ({ pageOrientation }: { pageOrientation: PageOrientation }) => {
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();

	const selectAvailableFragmentWatermarksForOrientation = React.useMemo(
		() => RequestApiSelectors.makeAvailableFragmentWatermarksForOrientation(),
		[]
	);
	const availableFragmentWatermarks = useSelector((state: PrintEngineState) =>
		selectAvailableFragmentWatermarksForOrientation(state, pageOrientation)
	);

	const fragmentWatermarkSelectItems: SelectItem[] = React.useMemo(
		() =>
			availableFragmentWatermarks.map(({ watermark: fragmentWatermark }, index) => ({
				value: `${index}`,
				label: fragmentWatermark.title || fragmentWatermark.id,
			})),
		[availableFragmentWatermarks]
	);

	const onSelectFragmentWatermark = React.useCallback(
		(selectedValue: string) => {
			const item = availableFragmentWatermarks[Number.parseInt(selectedValue, 10)];
			if (!item) {
				return;
			}
			const reference: FragmentModelReference = { id: nanoid(), refId: item.watermark.id, model: item.modelId };
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.watermark.watermarkCard.addWatermarkReference,
					region: GlobalRegion.SIDEBAR,
					transactionLogActions: [
						TransactionLogStateActions.addWatermarkReference({
							data: reference,
						}),
					],
				})
			);
			dispatch(NavigationActions.setActiveEntity({ tab: SidebarItem.WATERMARK, entityId: item.watermark.id }));
		},
		[dispatch, availableFragmentWatermarks]
	);

	const onClickAddWatermark = React.useCallback(() => {
		const newWatermarkId = nanoid();
		dispatch(
			InteractionLogActions.start({
				description: RESOURCE_KEYS.interaction.watermark.watermarkCard.addWatermark,
				region: GlobalRegion.SIDEBAR,
				transactionLogActions: [
					TransactionLogStateActions.addWatermark({
						data: {
							id: newWatermarkId,
							pageOrientation,
							elementReferences: [],
						},
					}),
				],
			})
		);
		dispatch(NavigationActions.setActiveEntity({ tab: SidebarItem.WATERMARK, entityId: newWatermarkId }));
	}, [dispatch, pageOrientation]);

	return (
		<>
			<Button onClick={onClickAddWatermark} title={localizer(RESOURCE_KEYS.button.add)}>
				{localizer(RESOURCE_KEYS.button.add)}
			</Button>
			{availableFragmentWatermarks.length > 0 && (
				<Select
					placeholder={localizer(RESOURCE_KEYS.sidebar.watermark.reference.selectPlaceholder)}
					value=""
					onValueChanged={onSelectFragmentWatermark}
					items={fragmentWatermarkSelectItems}
					fitToParent={false}
				/>
			)}
		</>
	);
};

export const CollapsibleWatermarkSetting = ({
	watermark,
	includeTitleInSetting,
	isReadonly = false,
}: CollapsibleWatermarkSettingProps) => {
	const localizer = PrintLocalizer.useLocalizer();
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
	const dispatch = useDispatch();
	const { isFragmentModel } = React.useContext(EditorComponentContext);

	const watermarkErrorMap = useSelector((state: PrintEngineState) =>
		ValidationSelectors.watermark(state, watermark.id)
	);

	const updateCurrentColumn = React.useCallback(
		(newData: PartialWatermark, description: string) => {
			dispatch(
				InteractionLogActions.start({
					description: description,
					region: "sidebar",
					transactionLogActions: [
						TransactionLogStateActions.updateWatermark({
							data: newData,
						}),
					],
				})
			);
		},
		[dispatch]
	);

	const onOpacityUpdate = React.useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			if (isReadonly) {
				return;
			}
			updateCurrentColumn(
				{
					...watermark,
					opacity: event.target.value !== "" ? Number(event.target.value) : undefined,
				},
				RESOURCE_KEYS.interaction.watermark.watermarkCard.changeOpacity
			);
		},
		[isReadonly, updateCurrentColumn, watermark]
	);

	const formatOnChange = React.useCallback((newValue: string) => {
		return Number.isNaN(Number(newValue)) ? "" : formatLeadingDecimal(newValue);
	}, []);

	const setConditions = React.useCallback(
		(newTableData: PreconditionRepeatRowType[]) => {
			if (isReadonly) {
				return;
			}
			updateCurrentColumn(
				{
					...watermark,
					conditions: newTableData,
				},
				RESOURCE_KEYS.interaction.watermark.watermarkCard.changePreconditions
			);
		},
		[isReadonly, updateCurrentColumn, watermark]
	);

	const onUpdateWatermarkTitle = React.useCallback(
		(event: React.FocusEvent<HTMLInputElement>) => {
			if (isReadonly) {
				return;
			}
			const updatedWatermark = { ...watermark, title: event.target.value };
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.fragment.watermark.updateWatermark,
					region: GlobalRegion.SIDEBAR,
					transactionLogActions: [TransactionLogStateActions.updateWatermark({ data: updatedWatermark })],
				})
			);
		},
		[dispatch, isReadonly, watermark]
	);

	const opacityError = watermarkErrorMap
		? errorMessageLocalizer(watermarkErrorMap.opacity?.[ErrorSeverity.ERROR])
		: undefined;
	const conditions = (watermark.conditions || []) as DeepPartial<Precondition>[];

	return (
		<StyledOpenCollapsibleWatermark isFragmentModel={isFragmentModel}>
			{includeTitleInSetting && (
				<DynamicSourceTextField
					value={watermark.title}
					placeholder={localizer(RESOURCE_KEYS.sidebar.watermark.titlePlaceholder)}
					label={localizer(RESOURCE_KEYS.sidebar.watermark.setting.name)}
					onBlur={onUpdateWatermarkTitle}
				/>
			)}
			<FormContainerHeadline label={localizer(RESOURCE_KEYS.sidebar.watermark.setting.headline)} />
			<StyledWatermarkInputColumn>
				<PositiveNumberInput
					label={localizer(RESOURCE_KEYS.sidebar.watermark.setting.opacity)}
					inputProps={{
						type: "number",
						min: 0.1,
						max: 1,
						step: 0.1,
						disabled: isReadonly,
					}}
					value={String(watermark.opacity ?? "")}
					onBlur={onOpacityUpdate}
					errorMessage={opacityError}
					formatOnChange={formatOnChange}
					readonly={isReadonly}
				/>
				<CustomInputWrapper label={localizer(RESOURCE_KEYS.sidebar.watermark.setting.conditions)}>
					<StyledConditionDescription>
						{localizer(RESOURCE_KEYS.sidebar.watermark.setting.description)}
					</StyledConditionDescription>
					<PreconditionsRepeat
						tableData={conditions}
						setTableData={setConditions}
						preconditionErrorMap={watermarkErrorMap?.conditions}
						isReadonly={isReadonly}
					/>
				</CustomInputWrapper>
			</StyledWatermarkInputColumn>
		</StyledOpenCollapsibleWatermark>
	);
};
