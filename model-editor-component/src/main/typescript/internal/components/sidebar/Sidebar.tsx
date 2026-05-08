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
import { Icon } from "@com.mgmtp.a12.widgets/widgets-core/lib/icon/main/icon.view.js";
import { TabPanelTemplateProps } from "@com.mgmtp.a12.widgets/widgets-core/lib/tab-panel/index.js";
import { SidebarItem } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/index.js";

import { FULLSCREEN_TABS, SidebarActions } from "../../redux/sidebar/index.js";
import { PrintEngineSelectors } from "../../store/selectors.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";

import { SidebarContent } from "./SidebarContent.js";
import { StyledPanelHeader } from "./Sidebar.styled.js";
import { TabPanel } from "./TabPanel.js";
import { useSidebarTabs } from "./hooks/use-sidebar-tabs.js";

interface SidebarProps {
	footer?: React.ReactNode;
	hiddenItems?: readonly SidebarItem[];
}

export const Sidebar = ({ footer, hiddenItems }: SidebarProps) => {
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();
	const { selectedItem, isOpen, isFullscreen } = useSelector(PrintEngineSelectors.sidebar);

	const sidebarTabs = useSidebarTabs(hiddenItems);

	const onClose = React.useCallback(() => {
		dispatch(SidebarActions.setExpandedState({ isOpen: false }));
	}, [dispatch]);

	const onToggleFullscreen = React.useCallback(() => {
		dispatch(SidebarActions.setExpandedState({ isFullscreen: !isFullscreen }));
	}, [dispatch, isFullscreen]);

	const onSelect = React.useCallback(
		(newTab: TabPanelTemplateProps.TabProps) => {
			if (newTab.value === selectedItem) {
				if (FULLSCREEN_TABS.includes(selectedItem)) {
					return;
				}
				dispatch(SidebarActions.setExpandedState({ isOpen: !isOpen }));
				return;
			}
			dispatch(SidebarActions.setCurrentView({ selectedItem: newTab.value as SidebarItem, isOpen: true }));
		},
		[dispatch, isOpen, selectedItem]
	);

	const fullScreenButton = React.useMemo(
		() =>
			isFullscreen
				? { icon: "fullscreen_exit", title: localizer(RESOURCE_KEYS.button.minimized) }
				: { icon: "fullscreen", title: localizer(RESOURCE_KEYS.button.maximized) },
		[localizer, isFullscreen]
	);

	const showPanelSuffixes = React.useMemo(() => !FULLSCREEN_TABS.includes(selectedItem), [selectedItem]);

	return (
		<TabPanel
			onSelect={onSelect}
			value={selectedItem}
			tabs={sidebarTabs}
			footer={footer}
			header={
				<StyledPanelHeader
					suffixes={
						showPanelSuffixes
							? [
									<Button
										key="search-button"
										icon={<Icon>{fullScreenButton.icon}</Icon>}
										invert
										destructive
										onClick={onToggleFullscreen}
										title={fullScreenButton.title}
									/>,
									<Button
										key="close-button"
										icon={<Icon>close</Icon>}
										invert
										destructive
										onClick={onClose}
										title={localizer(RESOURCE_KEYS.button.close)}
									/>,
								]
							: undefined
					}
				/>
			}
			id="sidebar"
		>
			{isOpen && selectedItem && <SidebarContent />}
		</TabPanel>
	);
};
