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

import { Icon } from "@com.mgmtp.a12.widgets/widgets-core/lib/icon/index.js";
import {
	PageOrientation,
	Precondition,
	Watermark,
	PartialWatermark,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { SidebarItem } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/index.js";
import { Button } from "@com.mgmtp.a12.widgets/widgets-core/lib/button/index.js";
import { DeepPartialErrorMap, ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/lib/errors/index.js";
import { ButtonGroup } from "@com.mgmtp.a12.widgets/widgets-core";
import { DeepPartial } from "@com.mgmtp.a12.print/print-model-api/lib/utils/type-utils.js";

import {
	EditorStateActions,
	InteractionLogActions,
	TransactionLogStateActions,
	ValidationCounter,
} from "../../redux/index.js";
import { PrintEngineSelectors } from "../../store/selectors.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";
import { ValidationSelectors } from "../../redux/validation/selectors.js";
import { PrintEngineState } from "../../store/root-reducer.js";

import { BadgeGroup } from "../badge/BadgeGroup.js";
import { CustomTextLineStateless } from "../forms/custom-base-input-components/index.js";
import { orientationIconMapping } from "../sections/SectionCard.js";
import { PreconditionRepeatRowType, PreconditionsRepeat } from "../forms/index.js";
import { PositiveNumberInput, formatLeadingDecimal } from "../custom-input/PositiveNumberInput.js";

import {
	StyledCollapsibleWatermarkTitle,
	StyledConditionDescription,
	StyledFlexContainerCenter,
	StyledOpenCollapsibleWatermark,
	StyledWatermarkAction,
	StyledWatermarkActionColumn,
	StyledWatermarkCard,
	StyledWatermarkCardContainer,
	StyledWatermarkIcon,
	StyledWatermarkInputColumn,
} from "./WatermarkCard.styled.js";

interface WatermarkCardProps {
	watermark?: PartialWatermark;
	pageOrientation: PageOrientation;
}
export const WatermarkCard = (props: WatermarkCardProps) => {
	const { watermark, pageOrientation } = props;
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
	const printModelRefs = useSelector(PrintEngineSelectors.printModelRefs);
	const error = useSelector((state: PrintEngineState) => ValidationSelectors.watermark(state, watermark?.id));
	const watermarkValidationCounter: ValidationCounter = useSelector((state: PrintEngineState) =>
		watermark?.id
			? ValidationSelectors.watermarkValidationCounter(state, watermark?.id)
			: ValidationCounter.createEmpty()
	);
	const [title, setTitle] = React.useState(watermark?.title);
	const [isOpenSetting, setOpenSetting] = React.useState(false);

	const isSelectedWatermark = React.useMemo(() => {
		return Boolean(watermark?.id && printModelRefs?.watermarkId === watermark?.id);
	}, [printModelRefs?.watermarkId, watermark?.id]);

	const onClickAddWatermark = React.useCallback(() => {
		const newWatermarkId = nanoid();
		dispatch(
			InteractionLogActions.start({
				description: RESOURCE_KEYS.interaction.watermark.watermarkCard.addWatermark,
				region: "sidebar",
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
		dispatch(
			EditorStateActions.updatePrintModelRefs({
				...printModelRefs,
				watermarkId: newWatermarkId,
				currentRefType: SidebarItem.WATERMARK,
			})
		);
	}, [dispatch, pageOrientation, printModelRefs]);

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

	const onClickDeleteWatermark = React.useCallback(
		(event: React.MouseEvent<HTMLElement, MouseEvent>) => {
			event.stopPropagation();
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
		},
		[dispatch, watermark]
	);

	const watermarkId = watermark?.id;
	const handleOpenWatermarkEditor = React.useCallback(() => {
		if (!watermarkId) {
			return;
		}
		dispatch(
			EditorStateActions.openEditorView({
				...printModelRefs,
				watermarkId: watermarkId,
				currentRefType: SidebarItem.WATERMARK,
			})
		);
	}, [dispatch, printModelRefs, watermarkId]);

	React.useEffect(() => {
		setTitle(watermark?.title);
	}, [watermark?.title]);

	const watermarkTitleError = error ? errorMessageLocalizer(error.title?.[ErrorSeverity.ERROR]) : undefined;

	const OpenSetting = React.useMemo(() => {
		const handleOpenSetting = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
			event.stopPropagation();
			setOpenSetting(!isOpenSetting);
		};
		return (
			<Button
				icon={<Icon>{isOpenSetting ? "close" : "settings"}</Icon>}
				onClick={handleOpenSetting}
				title={localizer(RESOURCE_KEYS.button[isOpenSetting ? "closeSetting" : "openSetting"])}
			/>
		);
	}, [isOpenSetting, setOpenSetting, localizer]);

	return (
		<StyledWatermarkCardContainer isSelected={isSelectedWatermark}>
			<StyledWatermarkCard onClick={handleOpenWatermarkEditor} isSelected={isSelectedWatermark}>
				<StyledWatermarkIcon>
					<Icon title={localizer(orientationIconMapping[pageOrientation].title)}>
						{orientationIconMapping[pageOrientation].icon}
					</Icon>
					<BadgeGroup validationCounter={watermarkValidationCounter} standalone />
				</StyledWatermarkIcon>

				{watermark ? (
					<>
						<CustomTextLineStateless
							value={title}
							placeholder={localizer(RESOURCE_KEYS.sidebar.watermark.titlePlaceholder)}
							onClick={event => event.stopPropagation()}
							onChange={event => setTitle(event.target.value)}
							onBlur={handleUpdateTitle}
							errorMessage={watermarkTitleError}
							warningMessage={errorMessageLocalizer(error?.[ErrorSeverity.WARNING])}
							hideLabel
						/>
						<StyledWatermarkAction>
							{OpenSetting}
							<Button
								icon={<Icon>square_foot</Icon>}
								onClick={handleOpenWatermarkEditor}
								title={localizer(RESOURCE_KEYS.button.openEditor)}
								disabled={Boolean(watermarkTitleError)}
							/>
							<Button
								destructive
								icon={<Icon>delete</Icon>}
								onClick={onClickDeleteWatermark}
								title={localizer(RESOURCE_KEYS.button.delete)}
							/>
						</StyledWatermarkAction>
					</>
				) : (
					<Button onClick={onClickAddWatermark} title={localizer(RESOURCE_KEYS.button.add)}>
						{localizer(RESOURCE_KEYS.button.add)}
					</Button>
				)}
			</StyledWatermarkCard>
			{isOpenSetting && watermark && (
				<CollapsibleWatermarkSetting watermark={watermark} error={error} setOpenSetting={setOpenSetting} />
			)}
		</StyledWatermarkCardContainer>
	);
};

interface CollapsibleWatermarkSettingProps {
	readonly watermark: PartialWatermark;
	readonly error: DeepPartialErrorMap<Watermark> | undefined;

	setOpenSetting(isOpenSetting: boolean): void;
}

export const CollapsibleWatermarkSetting = ({ watermark, error, setOpenSetting }: CollapsibleWatermarkSettingProps) => {
	const localizer = PrintLocalizer.useLocalizer();
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
	const dispatch = useDispatch();

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
			updateCurrentColumn(
				{
					...watermark,
					opacity: event.target.value !== "" ? Number(event.target.value) : undefined,
				},
				RESOURCE_KEYS.interaction.watermark.watermarkCard.changeOpacity
			);
		},
		[updateCurrentColumn, watermark]
	);

	const formatOnChange = React.useCallback((newValue: string) => {
		return Number.isNaN(Number(newValue)) ? "" : formatLeadingDecimal(newValue);
	}, []);

	const setConditions = React.useCallback(
		(newTableData: PreconditionRepeatRowType[]) => {
			updateCurrentColumn(
				{
					...watermark,
					conditions: newTableData,
				},
				RESOURCE_KEYS.interaction.watermark.watermarkCard.changePreconditions
			);
		},
		[updateCurrentColumn, watermark]
	);

	const opacityError = error ? errorMessageLocalizer(error.opacity?.[ErrorSeverity.ERROR]) : undefined;
	const conditions = (watermark.conditions || []) as DeepPartial<Precondition>[];

	return (
		<StyledOpenCollapsibleWatermark>
			<StyledWatermarkInputColumn>
				<StyledFlexContainerCenter>
					<StyledCollapsibleWatermarkTitle>
						{localizer(RESOURCE_KEYS.sidebar.watermark.setting.opacity)}
					</StyledCollapsibleWatermarkTitle>
					<PositiveNumberInput
						inputProps={{
							type: "number",
							min: 0.1,
							max: 1,
							step: 0.1,
						}}
						value={String(watermark.opacity ?? "")}
						onBlur={onOpacityUpdate}
						errorMessage={opacityError}
						formatOnChange={formatOnChange}
					/>
				</StyledFlexContainerCenter>
				<StyledConditionDescription>
					{localizer(RESOURCE_KEYS.sidebar.watermark.setting.description)}
				</StyledConditionDescription>
				<StyledFlexContainerCenter>
					<StyledCollapsibleWatermarkTitle>
						{localizer(RESOURCE_KEYS.sidebar.watermark.setting.conditions)}
					</StyledCollapsibleWatermarkTitle>
					<PreconditionsRepeat
						tableData={conditions}
						setTableData={setConditions}
						preconditionErrorMap={error?.conditions}
					/>
				</StyledFlexContainerCenter>
			</StyledWatermarkInputColumn>
			<StyledWatermarkActionColumn>
				<ButtonGroup>
					<Button
						icon={<Icon size={"big"}>close</Icon>}
						title={localizer(RESOURCE_KEYS.button.cancel)}
						onClick={() => setOpenSetting(false)}
						secondary
						destructive
					/>
				</ButtonGroup>
			</StyledWatermarkActionColumn>
		</StyledOpenCollapsibleWatermark>
	);
};
