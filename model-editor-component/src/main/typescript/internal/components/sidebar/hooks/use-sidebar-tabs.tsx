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
import React from "react";

import { SidebarItem } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import type { TabPanelTemplateProps } from "@com.mgmtp.a12.widgets/widgets-core";
import { Icon } from "@com.mgmtp.a12.widgets/widgets-core";

import { PrintLocalizer, RESOURCE_KEYS } from "../../../localization/index.js";

import { useErrorBadgeCounterGetter } from "./use-error-badge-counter-getter.js";

export const useSidebarTabs = (hiddenItems: readonly SidebarItem[] = []): TabPanelTemplateProps.TabProps[] => {
	const localizer = PrintLocalizer.useLocalizer();
	const getErrorBadgeCounter = useErrorBadgeCounterGetter();

	return React.useMemo(() => {
		const allTabs: TabPanelTemplateProps.TabProps[] = [
			{
				icon: <Icon>info</Icon>,
				value: SidebarItem.GENERAL,
				title: localizer(RESOURCE_KEYS.sidebar.general.name),
				children: getErrorBadgeCounter(SidebarItem.GENERAL),
			},
			{
				icon: <Icon>schema</Icon>,
				value: SidebarItem.SCHEMA,
				title: localizer(RESOURCE_KEYS.sidebar.schema.name),
			},
			{
				icon: <Icon>text_format</Icon>,
				value: SidebarItem.TEXT_STYLES,
				title: localizer(RESOURCE_KEYS.sidebar.textStyles),
				children: getErrorBadgeCounter(SidebarItem.TEXT_STYLES),
			},
			{
				icon: <Icon>segment</Icon>,
				value: SidebarItem.SEGMENT,
				title: localizer(RESOURCE_KEYS.sidebar.segment.name),
				children: getErrorBadgeCounter(SidebarItem.SEGMENT),
			},
			{
				icon: <Icon>view_day</Icon>,
				value: SidebarItem.SECTION,
				title: localizer(RESOURCE_KEYS.sidebar.section.name),
				children: getErrorBadgeCounter(SidebarItem.SECTION),
			},
			{
				icon: <Icon>branding_watermark</Icon>,
				value: SidebarItem.WATERMARK,
				title: localizer(RESOURCE_KEYS.sidebar.watermark.name),
				children: getErrorBadgeCounter(SidebarItem.WATERMARK),
			},
			{
				icon: <Icon>commit</Icon>,
				value: SidebarItem.COMMIT_CHANGES,
				title: localizer(RESOURCE_KEYS.sidebar.commitChanges.title),
			},
		];

		if (!hiddenItems.length) {
			return allTabs;
		}

		const hiddenSet = new Set(hiddenItems);
		return allTabs.filter(tab => !hiddenSet.has(tab.value as SidebarItem));
	}, [getErrorBadgeCounter, localizer, hiddenItems]);
};
