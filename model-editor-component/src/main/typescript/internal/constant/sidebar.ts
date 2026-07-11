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
import { SidebarItem } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import { RESOURCE_KEYS } from "../localization/keys.js";

interface ElementProperties {
	name: string;
	iconName: string;
}

export const SidebarItemTypes: Record<SidebarItem, ElementProperties | undefined> = {
	[SidebarItem.GENERAL]: {
		iconName: "info",
		name: RESOURCE_KEYS.sidebar.general.name,
	},
	[SidebarItem.SCHEMA]: {
		iconName: "schema",
		name: RESOURCE_KEYS.sidebar.schema.name,
	},
	[SidebarItem.TEXT_STYLES]: {
		iconName: "text_format",
		name: RESOURCE_KEYS.sidebar.textStyles,
	},
	[SidebarItem.SEGMENT]: {
		iconName: "segment",
		name: RESOURCE_KEYS.sidebar.segment.name,
	},
	[SidebarItem.SECTION]: {
		iconName: "view_day",
		name: RESOURCE_KEYS.sidebar.section.name,
	},
	[SidebarItem.WATERMARK]: {
		iconName: "branding_watermark",
		name: RESOURCE_KEYS.sidebar.watermark.name,
	},
	[SidebarItem.COMMIT_CHANGES]: {
		name: RESOURCE_KEYS.sidebar.commitChanges.title,
		iconName: "commit",
	},
};
