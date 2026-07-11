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

import { Icon, Button } from "@com.mgmtp.a12.widgets/widgets-core";
import type { PartialSection } from "@com.mgmtp.a12.print/print-model-api/model";
import { PageOrientation, SectionUsage } from "@com.mgmtp.a12.print/print-model-api/model";
import { GlobalRegion, SidebarItem } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/errors";

import {
	EditorStateActions,
	InteractionLogActions,
	NavigationActions,
	NavigationSelectors,
	TransactionLogStateActions,
	ValidationCounter,
} from "../../redux/index.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";
import { ValidationSelectors } from "../../redux//validation/selectors.js";
import type { PrintEngineState } from "../../../a12internal/api/PrintEngineState.js";
import { createMmMeasure } from "../../utils/index.js";

import { BadgeGroup } from "../badge/BadgeGroup.js";
import { DynamicSourceTextField } from "../forms/custom-base-input-components/index.js";

import { StyledSectionAction, StyledSectionCard, StyledSectionIcon } from "./SectionCard.styled.js";

export const DEFAULT_HEIGHT = 20;

interface SectionCardProps {
	section?: PartialSection;
	pageOrientation: PageOrientation;
	sectionUsage: SectionUsage;
}

export const SectionCard = (props: SectionCardProps) => {
	const { section, pageOrientation, sectionUsage } = props;
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
	const printModelRefs = useSelector(NavigationSelectors.activeEntities);
	const error = useSelector((state: PrintEngineState) => ValidationSelectors.section(state, section?.id));
	const sectionValidationCounter: ValidationCounter = useSelector((state: PrintEngineState) =>
		section?.id
			? ValidationSelectors.sectionValidationCounter(state, section?.id)
			: ValidationCounter.EMPTY_VALIDATION_COUNTER
	);

	const isSelectedSection = React.useMemo(() => {
		return Boolean(section?.id && printModelRefs?.sectionId === section?.id);
	}, [printModelRefs?.sectionId, section?.id]);

	const onClickAddSection = React.useCallback(() => {
		const newSectionId = nanoid();
		dispatch(
			InteractionLogActions.start({
				description: RESOURCE_KEYS.interaction.section.sectionCard.addSection,
				region: GlobalRegion.SIDEBAR,
				transactionLogActions: [
					TransactionLogStateActions.addSection({
						data: {
							id: newSectionId,
							sectionUsage,
							pageOrientation,
							footerHeight: createMmMeasure(DEFAULT_HEIGHT),
							headerHeight: createMmMeasure(DEFAULT_HEIGHT),
							elementReferences: [],
						},
					}),
				],
			})
		);
		dispatch(NavigationActions.setActiveEntity({ tab: SidebarItem.SECTION, entityId: newSectionId }));
	}, [dispatch, pageOrientation, sectionUsage]);

	const handleUpdateTitle = React.useCallback(
		(event: React.FocusEvent<HTMLInputElement>) => {
			if (!section) {
				return;
			}
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.section.sectionCard.changeTitle,
					region: GlobalRegion.SIDEBAR,
					transactionLogActions: [
						TransactionLogStateActions.updateSection({
							data: {
								...section,
								title: event.target.value,
							},
						}),
					],
				})
			);
		},
		[dispatch, section]
	);

	const onClickDeleteSection = React.useCallback(
		(event: React.MouseEvent<HTMLElement, MouseEvent>) => {
			event.stopPropagation();
			if (!section) {
				return;
			}
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.section.sectionCard.deleteSection,
					region: GlobalRegion.SIDEBAR,
					transactionLogActions: [
						TransactionLogStateActions.removeSection({
							data: { id: section.id },
						}),
					],
					affectedItems: [
						{
							type: "section",
							id: section.id,
						},
					],
				})
			);
		},
		[dispatch, section]
	);

	const sectionId = section?.id;
	const handleOpenSectionEditor = React.useCallback(() => {
		if (!sectionId) {
			return;
		}
		dispatch(
			EditorStateActions.openEditorView({
				...printModelRefs,
				sectionId: sectionId,
				currentRefType: SidebarItem.SECTION,
			})
		);
	}, [dispatch, printModelRefs, sectionId]);

	const sectionTitleError = errorMessageLocalizer(error?.title?.[ErrorSeverity.ERROR]);

	return (
		<StyledSectionCard data-testid="section-card" onClick={handleOpenSectionEditor} isSelected={isSelectedSection}>
			<StyledSectionIcon>
				<Icon title={localizer(orientationIconMapping[pageOrientation].title)}>
					{orientationIconMapping[pageOrientation].icon}
				</Icon>
				{sectionUsage === SectionUsage.Remaining && (
					<Icon title={localizer(RESOURCE_KEYS.sidebar.section.type.remaining)}>repeat</Icon>
				)}
				<BadgeGroup validationCounter={sectionValidationCounter} standalone />
			</StyledSectionIcon>

			{section ? (
				<>
					<DynamicSourceTextField
						value={section.title}
						placeholder={localizer(RESOURCE_KEYS.sidebar.section.titlePlaceholder)}
						onClick={event => event.stopPropagation()}
						onBlur={handleUpdateTitle}
						errorMessage={sectionTitleError}
						warningMessage={errorMessageLocalizer(error?.[ErrorSeverity.WARNING])}
						hideLabel
					/>
					<StyledSectionAction>
						<Button
							icon={<Icon>square_foot</Icon>}
							onClick={handleOpenSectionEditor}
							title={localizer(RESOURCE_KEYS.button.openEditor)}
							disabled={Boolean(sectionTitleError)}
						/>
						<Button
							destructive
							icon={<Icon>delete</Icon>}
							onClick={onClickDeleteSection}
							title={localizer(RESOURCE_KEYS.button.delete)}
						/>
					</StyledSectionAction>
				</>
			) : (
				<Button onClick={onClickAddSection} title={localizer(RESOURCE_KEYS.button.add)}>
					{localizer(RESOURCE_KEYS.button.add)}
				</Button>
			)}
		</StyledSectionCard>
	);
};

export const orientationIconMapping: Record<PageOrientation, { icon: string; title: string }> = {
	[PageOrientation.Landscape]: {
		icon: "topic",
		title: RESOURCE_KEYS.editor.pageOrientation.landscape,
	},
	[PageOrientation.Portrait]: {
		icon: "description",
		title: RESOURCE_KEYS.editor.pageOrientation.portrait,
	},
};
