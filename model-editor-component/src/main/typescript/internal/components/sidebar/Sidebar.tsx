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

import type { TabPanelTemplateProps } from "@com.mgmtp.a12.widgets/widgets-core";
import { Button, Icon } from "@com.mgmtp.a12.widgets/widgets-core";
import type { SidebarItem } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import { FULLSCREEN_TABS, NavigationActions, NavigationSelectors } from "../../redux/navigation/index.js";
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
	const { activeTab, isOpen, isFullscreen } = useSelector(NavigationSelectors.sidebarState);

	const sidebarTabs = useSidebarTabs(hiddenItems);

	const onClose = React.useCallback(() => {
		dispatch(NavigationActions.setExpandedState({ isOpen: false }));
	}, [dispatch]);

	const onToggleFullscreen = React.useCallback(() => {
		dispatch(NavigationActions.setExpandedState({ isFullscreen: !isFullscreen }));
	}, [dispatch, isFullscreen]);

	const onSelect = React.useCallback(
		(newTab: TabPanelTemplateProps.TabProps) => {
			if (newTab.value === activeTab) {
				if (FULLSCREEN_TABS.includes(activeTab)) {
					return;
				}
				dispatch(NavigationActions.setExpandedState({ isOpen: !isOpen }));
				return;
			}
			dispatch(NavigationActions.setActiveTab(newTab.value as SidebarItem));
			dispatch(NavigationActions.setExpandedState({ isOpen: true }));
		},
		[dispatch, isOpen, activeTab]
	);

	const fullScreenButton = React.useMemo(
		() =>
			isFullscreen
				? { icon: "fullscreen_exit", title: localizer(RESOURCE_KEYS.button.minimized) }
				: { icon: "fullscreen", title: localizer(RESOURCE_KEYS.button.maximized) },
		[localizer, isFullscreen]
	);

	const showPanelSuffixes = React.useMemo(() => !FULLSCREEN_TABS.includes(activeTab), [activeTab]);

	return (
		<TabPanel
			onSelect={onSelect}
			value={activeTab}
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
			{isOpen && activeTab && <SidebarContent />}
		</TabPanel>
	);
};
