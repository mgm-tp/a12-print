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
import { css, styled } from "styled-components";

import {
	TAB_PANEL_CLASS_NAME,
	TabPanelProps,
	TabPanelTemplate,
	TabPanelTemplateProps,
} from "@com.mgmtp.a12.widgets/widgets-core";
import {
	A11yDefinition,
	A11YLanguageContext,
} from "@com.mgmtp.a12.widgets/widgets-core/lib/common/main/a11y-localization/index.js";
import { BaseTabPanelContent } from "@com.mgmtp.a12.widgets/widgets-core/lib/tab-panel/main/template/tab-panel.tpl.styled.js";
import { joinClassNames } from "@com.mgmtp.a12.widgets/widgets-core/lib/common/index.js";

export interface PrintTabPanelProps extends TabPanelProps {
	footer?: React.ReactNode;
}

const baseDataRole = "tab-panel";

const BaseTabPanelWrapper = styled.div`
	display: flex;
	height: 100%;
`;

const BaseTabPanelPanel = styled.div(({ theme }) => {
	return css`
		background: ${theme.components.tabPanel.background};
		display: flex;
		flex-flow: column;
		flex-grow: 1;
		min-width: 0;
	`;
});

const BaseTabPanelTabs = styled.ul(({ theme }) => {
	const { tabs } = theme.components.tabPanel;

	return css`
		display: flex;
		flex-direction: column;
		background-color: ${tabs.background};
		margin: 0;
		min-width: ${tabs.minWidth};
		padding: ${tabs.padding};
	`;
});

export const TabPanel: React.FC<PrintTabPanelProps> = (props: PrintTabPanelProps): React.ReactElement => {
	const { onSelect, value, className, children, header, footer, tabs, id, onClose, ...rest } = props;
	const { tabPanelTitles } = React.useContext<A11yDefinition>(A11YLanguageContext);

	const handleTabClick = React.useCallback(
		(event: React.SyntheticEvent<HTMLElement>, tab: TabPanelTemplateProps.TabProps) => {
			onSelect?.(tab);
			tab.onClick?.(event);
		},
		[onSelect]
	);

	const selectedTab = tabs.find(tab => (value ? tab.value === value : tab.selected));

	const handleWrapperKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
		if (event.key === "Escape") {
			onClose?.();
		}
	};

	return (
		<BaseTabPanelWrapper
			{...rest}
			className={joinClassNames(TAB_PANEL_CLASS_NAME, className)}
			id={id}
			data-role={baseDataRole}
			onKeyDown={handleWrapperKeyDown}
		>
			{tabs?.length > 0 && (
				<BaseTabPanelTabs
					className={`${TAB_PANEL_CLASS_NAME}__tabs`}
					role="tablist"
					data-role={`${baseDataRole}-tab-list`}
					aria-label={tabPanelTitles?.tabListAriaLabel}
					aria-orientation="vertical"
				>
					{tabs.map(tab => {
						return (
							<TabPanelTemplate.Tab
								{...tab}
								selected={tab.value === selectedTab?.value}
								onClick={
									tab.disabled
										? undefined
										: (event: React.SyntheticEvent<HTMLElement, Event>): void =>
												handleTabClick(event, tab)
								}
								key={tab.value}
							/>
						);
					})}
					{footer}
				</BaseTabPanelTabs>
			)}
			{children && (
				<BaseTabPanelPanel
					className={`${TAB_PANEL_CLASS_NAME}__panel`}
					role={"tabpanel"}
					aria-labelledby={selectedTab ? selectedTab.id : undefined}
					id={id ? `${id}-panel` : undefined}
					data-role="panel"
				>
					{header}
					<BaseTabPanelContent
						className={`${TAB_PANEL_CLASS_NAME}__content`}
						data-role={`${baseDataRole}-content`}
					>
						{children}
					</BaseTabPanelContent>
				</BaseTabPanelPanel>
			)}
		</BaseTabPanelWrapper>
	);
};
