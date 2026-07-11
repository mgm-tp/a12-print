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

import { Button, Icon, SizeContext } from "@com.mgmtp.a12.widgets/widgets-core";
import { SidebarItem } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import { EditorComponentContext } from "../../../../api/context-api.js";
import { PrintEngineSelectors } from "../../../../store/selectors.js";
import { initialStateLogStore, CommitViewActions, NavigationSelectors } from "../../../../redux/index.js";
import { initialize } from "../../../../utils/commit-changes-utils.js";
import { StyledSlot, StyledSlotWrapper } from "../../../global-toolbar/GlobalToolbar.styled.js";
import { RESOURCE_KEYS } from "../../../../localization/keys.js";
import { UndoRedoGroup } from "../../../undo-redo-group/UndoRedoGroup.js";
import { ErrorCounter } from "../../../validation/ErrorCounter.js";
import { Sidebar } from "../../../sidebar/Sidebar.js";
import { CustomMasterDetailLayout } from "../../../custom-master-detail-layout/CustomMasterDetailLayout.js";

import { selectTransactionGroupsForCommit } from "../selectors.js";

import { StyledContent, StyledLayout, StyledSidebar, StyledToolbar } from "./PrintEditorView.styled.js";

const fullscreenItems = new Set<SidebarItem>([
	SidebarItem.GENERAL,
	SidebarItem.TEXT_STYLES,
	SidebarItem.COMMIT_CHANGES,
]);

export const PrintEditorView: React.ComponentType = function PrintEditorView() {
	const { localizer } = React.useContext(EditorComponentContext);
	const { currentSize } = React.useContext(SizeContext);

	const { isOpen, isFullscreen, activeTab } = useSelector(NavigationSelectors.sidebarState);
	const transactionLogState = useSelector(PrintEngineSelectors.transactionLogState);
	const transactionGroupsForCommit = useSelector(selectTransactionGroupsForCommit);

	const dispatch = useDispatch();

	function getLayoutClassName() {
		if (!isOpen || !activeTab) {
			return "minimized";
		}
		if (isFullscreen || currentSize !== "lg" || fullscreenItems.has(activeTab)) {
			return "maximized";
		}
		return "normal";
	}
	const className = getLayoutClassName();

	const onSaveClick = React.useCallback(
		() => dispatch(CommitViewActions.commitChanges(initialize(transactionGroupsForCommit))),
		[dispatch, transactionGroupsForCommit]
	);

	return transactionLogState !== initialStateLogStore ? (
		<StyledLayout className={className}>
			<StyledToolbar>
				<StyledSlotWrapper slotPosition="left">
					<StyledSlot>
						<Button
							title={localizer(RESOURCE_KEYS.button.save)}
							onClick={onSaveClick}
							disabled={transactionGroupsForCommit.length < 1}
							icon={<Icon>save</Icon>}
						/>
					</StyledSlot>
					<UndoRedoGroup />
				</StyledSlotWrapper>
				<StyledSlotWrapper slotPosition="right">
					<ErrorCounter />
				</StyledSlotWrapper>
			</StyledToolbar>
			<StyledSidebar>
				<Sidebar hiddenItems={[SidebarItem.SCHEMA, SidebarItem.COMMIT_CHANGES]} />
			</StyledSidebar>
			{className !== "maximized" && (
				<StyledContent>
					<CustomMasterDetailLayout />
				</StyledContent>
			)}
		</StyledLayout>
	) : null;
};
