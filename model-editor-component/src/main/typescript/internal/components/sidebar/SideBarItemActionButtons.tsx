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
import React, { useMemo } from "react";
import { useDispatch } from "react-redux";

import { Badge, Button, Icon, PopUpMenu } from "@com.mgmtp.a12.widgets/widgets-core";
import { SidebarItem } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import { PrintLocalizer } from "../../localization/localizer.js";
import { RESOURCE_KEYS } from "../../localization/index.js";
import { EditorStateActions, type PrintModelRefs } from "../../redux/index.js";

import { StyledRightSidebarItemActionButtons } from "../segments/SegmentCard.styled.js";

export interface SideBarItemActionButtonsProps {
	entityId: string;
	openEditorEntityId?: string;
	type: "fragment" | "segment" | "section" | "watermark" | "element";
	setOpenSetting?: (entityId?: string) => void;
	errorMessage?: React.ReactNode;
	isOpenSetting?: boolean;
	duplicateItem?: () => void;
	unlinkItem?: () => void;
	deleteItem: () => void;
	deleteDisabled?: boolean;
	navigateToSource?: () => void;
	usageCount?: number;
	onShowUsages?: () => void;
	usagesLoading?: boolean;
}

export const SideBarItemActionButtons = (props: SideBarItemActionButtonsProps) => {
	const { entityId, type, setOpenSetting, isOpenSetting, duplicateItem, unlinkItem, deleteItem } = props;
	const localizer = PrintLocalizer.useLocalizer();
	const dispatch = useDispatch();

	const openEditorPayload = useMemo(() => {
		const payload = () => {
			switch (type) {
				case "fragment":
					return { currentRefType: SidebarItem.FRAGMENT, fragmentId: entityId };
				case "segment":
					return { currentRefType: SidebarItem.SEGMENT, segmentId: entityId };
				case "section":
					return { currentRefType: SidebarItem.SECTION, sectionId: entityId };
				case "watermark":
					return {
						currentRefType: SidebarItem.WATERMARK,
						watermarkId: props.openEditorEntityId ?? entityId,
					};
				default:
					return { currentRefType: SidebarItem.FRAGMENT, fragmentId: entityId };
			}
		};
		return payload() as PrintModelRefs;
	}, [entityId, props.openEditorEntityId, type]);

	const openEditor = React.useCallback(() => {
		dispatch(EditorStateActions.openEditorView(openEditorPayload));
	}, [dispatch, openEditorPayload]);

	const OpenSetting = React.useMemo(() => {
		const handleOpenSetting = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
			event.stopPropagation();
			setOpenSetting?.(isOpenSetting ? undefined : entityId);
		};
		return (
			<Button
				icon={<Icon>{isOpenSetting ? "close" : "settings"}</Icon>}
				onClick={handleOpenSetting}
				title={localizer(RESOURCE_KEYS.button[isOpenSetting ? "closeSetting" : "openSetting"])}
			/>
		);
	}, [isOpenSetting, localizer, setOpenSetting, entityId]);

	const duplicateButtonLabel = localizer(RESOURCE_KEYS.button.duplicate);
	const unlinkButtonLabel = localizer(RESOURCE_KEYS.button.unlink);
	const deleteButtonLabel = localizer(RESOURCE_KEYS.button.delete);
	const usagesButtonLabel = localizer(RESOURCE_KEYS.fragmentUsage.modalTitle);
	const navigateToSourceButtonLabel = localizer(RESOURCE_KEYS.button.navigateToSource);

	const renderMenu = () => {
		const showUsagesEntry = Boolean(props.onShowUsages);
		const usagesDisabled = props.usagesLoading || !props.usageCount;
		const hasPopUpMenu = type === "segment" || type === "fragment" || props.navigateToSource || showUsagesEntry;
		if (!hasPopUpMenu) {
			return deleteButton({ deleteItem, deleteButtonLabel, showLabel: false, disabled: props.deleteDisabled });
		}
		return (
			<PopUpMenu
				triggerButtonTitle={localizer(RESOURCE_KEYS.sidebar.segment.button.menuSetting)}
				onTriggerElementClick={(event: React.MouseEvent<HTMLElement, MouseEvent>) => event.stopPropagation()}
			>
				{props.navigateToSource && (
					<Button
						label={navigateToSourceButtonLabel}
						title={navigateToSourceButtonLabel}
						icon={<Icon>open_in_new</Icon>}
						onClick={props.navigateToSource}
					/>
				)}
				{showUsagesEntry && (
					<Button
						label={
							<>
								{usagesButtonLabel}{" "}
								{!props.usagesLoading && <Badge count={props.usageCount ?? 0} standalone light />}
							</>
						}
						title={usagesButtonLabel}
						icon={<Icon>open_in_new</Icon>}
						onClick={props.onShowUsages}
						disabled={usagesDisabled}
					/>
				)}
				{duplicateItem && (
					<Button
						label={duplicateButtonLabel}
						title={duplicateButtonLabel}
						icon={<Icon>content_copy</Icon>}
						onClick={duplicateItem}
					/>
				)}
				{unlinkItem && (
					<Button
						label={unlinkButtonLabel}
						title={unlinkButtonLabel}
						icon={<Icon>link_off</Icon>}
						onClick={unlinkItem}
					/>
				)}
				{deleteButton({ deleteItem, deleteButtonLabel, disabled: props.deleteDisabled })}
			</PopUpMenu>
		);
	};

	return (
		<StyledRightSidebarItemActionButtons>
			{setOpenSetting && OpenSetting}
			<Button
				icon={<Icon>square_foot</Icon>}
				onClick={openEditor}
				title={localizer(RESOURCE_KEYS.button.openEditor)}
				disabled={Boolean(props.errorMessage)}
			/>
			{renderMenu()}
		</StyledRightSidebarItemActionButtons>
	);
};

const deleteButton = ({
	deleteItem,
	showLabel = true,
	deleteButtonLabel,
	disabled,
}: {
	deleteItem: () => void;
	deleteButtonLabel: string;
	showLabel?: boolean;
	disabled?: boolean;
}) => {
	return (
		<Button
			label={showLabel ? deleteButtonLabel : undefined}
			title={deleteButtonLabel}
			onClick={deleteItem}
			icon={<Icon variant="error">delete</Icon>}
			destructive
			disabled={disabled}
		/>
	);
};
