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

import { Icon, Button, Select } from "@com.mgmtp.a12.widgets/widgets-core";
import type { SelectItem } from "@com.mgmtp.a12.widgets/widgets-core";
import type { PartialReference, PartialSection } from "@com.mgmtp.a12.print/print-model-api/model";
import { PageOrientation, SectionUsage } from "@com.mgmtp.a12.print/print-model-api/model";
import { GlobalRegion, SidebarItem } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/errors";

import {
	EditorStateActions,
	FragmentActions,
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
import { RequestApiSelectors } from "../../redux/request-api/selectors.js";

import { BadgeGroup } from "../badge/BadgeGroup.js";
import { DynamicSourceTextField } from "../forms/custom-base-input-components/index.js";
import { SideBarItemActionButtons } from "../sidebar/SideBarItemActionButtons.js";

import { StyledSectionCard, StyledSectionIcon } from "./SectionCard.styled.js";

export const DEFAULT_HEIGHT = 20;

interface SectionCardProps {
	section?: PartialSection;
	/** Unset for a reference whose section is gone - the slot it belongs to is part of the missing definition. */
	pageOrientation?: PageOrientation;
	sectionUsage?: SectionUsage;
	/** The {@link SectionFragmentReference} when this card represents a referenced fragment section. */
	reference?: PartialReference;
}

export const SectionCard = (props: SectionCardProps) => {
	const { section, pageOrientation, sectionUsage, reference } = props;

	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
	const printModelRefs = useSelector(NavigationSelectors.activeEntities);
	const error = useSelector((state: PrintEngineState) => ValidationSelectors.section(state, section?.id));
	const sectionValidationCounter: ValidationCounter = useSelector((state: PrintEngineState) => {
		if (reference) {
			return ValidationSelectors.sectionReferenceValidationCounter(state, reference.id);
		}
		if (section?.id) {
			return ValidationSelectors.sectionValidationCounter(state, section.id);
		}
		return ValidationCounter.EMPTY_VALIDATION_COUNTER;
	});
	const referenceError = useSelector((state: PrintEngineState) =>
		reference ? ValidationSelectors.sectionReferenceError(state, reference.id) : undefined
	);
	const referenceErrorMessage = errorMessageLocalizer(ValidationSelectors.ownFragmentReferenceErrors(referenceError));

	/* A reference whose section is missing is selectable as well - the stage then simply stays empty. */
	const entityId = section?.id ?? reference?.id;

	const isSelectedSection = React.useMemo(
		() => Boolean(entityId && printModelRefs?.sectionId === entityId),
		[printModelRefs?.sectionId, entityId]
	);

	const onClickRemoveReference = React.useCallback(() => {
		if (!reference) {
			return;
		}
		dispatch(
			InteractionLogActions.start({
				description: RESOURCE_KEYS.interaction.section.sectionCard.removeSectionReference,
				region: GlobalRegion.SIDEBAR,
				transactionLogActions: [
					TransactionLogStateActions.removeSectionReference({
						data: { id: reference.id },
					}),
				],
			})
		);
	}, [dispatch, reference]);

	const onNavigateToSource = React.useCallback(() => {
		if (!reference) {
			return;
		}
		dispatch(NavigationActions.navigateToFragmentSource({ referenceId: reference.id, entityType: "section" }));
	}, [dispatch, reference]);

	const onUnlinkReference = React.useCallback(() => {
		if (!reference?.id) {
			return;
		}
		dispatch(FragmentActions.unlinkReference({ referenceId: reference.id, entityType: "section" }));
	}, [dispatch, reference]);

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

	const onClickDeleteSection = React.useCallback(() => {
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
	}, [dispatch, section]);

	const handleOpenSectionEditor = React.useCallback(() => {
		if (!entityId) {
			return;
		}
		dispatch(
			EditorStateActions.openEditorView({
				...printModelRefs,
				sectionId: entityId,
				currentRefType: SidebarItem.SECTION,
			})
		);
	}, [dispatch, printModelRefs, entityId]);

	const sectionTitleError = errorMessageLocalizer(error?.title?.[ErrorSeverity.ERROR]);
	const orientation = pageOrientation && orientationIconMapping[pageOrientation];

	const renderCardContent = () => {
		if (reference && section) {
			return (
				<>
					<DynamicSourceTextField
						value={section.title}
						placeholder={localizer(RESOURCE_KEYS.sidebar.section.reference.referencedLabel)}
						onClick={event => event.stopPropagation()}
						errorMessage={referenceErrorMessage}
						hideLabel
						readonly
					/>
					<SideBarItemActionButtons
						entityId={reference.id}
						type="section"
						deleteItem={onClickRemoveReference}
						unlinkItem={onUnlinkReference}
						navigateToSource={onNavigateToSource}
					/>
				</>
			);
		}
		if (reference) {
			// The section is gone from its fragment model - keep the reference visible so it can be removed here
			// or restored in the fragment model.
			return (
				<>
					<DynamicSourceTextField
						value={reference.refId}
						onClick={event => event.stopPropagation()}
						errorMessage={referenceErrorMessage}
						hideLabel
						readonly
					/>
					<SideBarItemActionButtons
						entityId={reference.id}
						type="section"
						deleteItem={onClickRemoveReference}
						unlinkItem={onUnlinkReference}
						navigateToSource={onNavigateToSource}
					/>
				</>
			);
		}
		if (section) {
			return (
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
					<SideBarItemActionButtons
						entityId={section.id}
						type="section"
						deleteItem={onClickDeleteSection}
						errorMessage={sectionTitleError}
					/>
				</>
			);
		}

		if (!pageOrientation || !sectionUsage) {
			return null;
		}

		return <SectionAddOrReferenceSelect pageOrientation={pageOrientation} sectionUsage={sectionUsage} />;
	};

	return (
		<StyledSectionCard data-testid="section-card" onClick={handleOpenSectionEditor} isSelected={isSelectedSection}>
			<StyledSectionIcon>
				{orientation && <Icon title={localizer(orientation.title)}>{orientation.icon}</Icon>}
				{sectionUsage === SectionUsage.Remaining && (
					<Icon title={localizer(RESOURCE_KEYS.sidebar.section.type.remaining)}>repeat</Icon>
				)}
				{reference && (
					<Icon title={localizer(RESOURCE_KEYS.sidebar.section.reference.referencedLabel)}>link</Icon>
				)}
				<BadgeGroup validationCounter={sectionValidationCounter} standalone />
			</StyledSectionIcon>
			{renderCardContent()}
		</StyledSectionCard>
	);
};

/** Add button and fragment section select for an empty slot - only rendered when its slot is known. */
const SectionAddOrReferenceSelect = ({
	pageOrientation,
	sectionUsage,
}: {
	pageOrientation: PageOrientation;
	sectionUsage: SectionUsage;
}) => {
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();

	const selectAvailableFragmentSections = React.useMemo(
		() => RequestApiSelectors.makeAvailableFragmentSections(),
		[]
	);
	const availableFragmentSections = useSelector((state: PrintEngineState) =>
		selectAvailableFragmentSections(state, pageOrientation)
	);

	const fragmentSectionSelectItems: SelectItem[] = React.useMemo(
		() =>
			availableFragmentSections.map(({ section: fragmentSection }, index) => ({
				value: `${index}`,
				label: fragmentSection.title || fragmentSection.id,
			})),
		[availableFragmentSections]
	);

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

	const onSelectFragmentSection = React.useCallback(
		(selectedValue: string) => {
			const item = availableFragmentSections[Number.parseInt(selectedValue, 10)];
			if (!item) {
				return;
			}
			const reference = {
				id: nanoid(),
				refId: item.section.id,
				model: item.modelId,
				sectionUsage: sectionUsage,
			};
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.section.sectionCard.addSectionReference,
					region: GlobalRegion.SIDEBAR,
					transactionLogActions: [
						TransactionLogStateActions.addSectionReference({
							data: reference,
						}),
					],
				})
			);
		},
		[dispatch, availableFragmentSections, sectionUsage]
	);

	return (
		<>
			<Button onClick={onClickAddSection} title={localizer(RESOURCE_KEYS.button.add)}>
				{localizer(RESOURCE_KEYS.button.add)}
			</Button>
			{availableFragmentSections.length > 0 && (
				<Select
					placeholder={localizer(RESOURCE_KEYS.sidebar.section.reference.selectPlaceholder)}
					value=""
					onValueChanged={onSelectFragmentSection}
					items={fragmentSectionSelectItems}
					fitToParent={false}
				/>
			)}
		</>
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
