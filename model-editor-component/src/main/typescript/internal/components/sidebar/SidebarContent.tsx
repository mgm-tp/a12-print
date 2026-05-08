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
import { useSelector } from "react-redux";

import { SidebarItem } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/index.js";

import { PrintEngineSelectors } from "../../store/selectors.js";

import { Segments } from "../segments/index.js";
import { General } from "../general/General.js";
import { TextStyles } from "../text-styles/TextStyles.js";
import { SectionContent } from "../sections/index.js";
import { SchemaContent } from "../schema/SchemaContent.js";
import { CommitChanges } from "../commit-changes/index.js";
import { WatermarkContent } from "../watermarks/index.js";

export const SidebarContent = () => {
	const { selectedItem } = useSelector(PrintEngineSelectors.sidebar);

	switch (selectedItem) {
		case SidebarItem.SEGMENT:
			return <Segments />;
		case SidebarItem.GENERAL:
			return <General />;
		case SidebarItem.SECTION:
			return <SectionContent />;
		case SidebarItem.WATERMARK:
			return <WatermarkContent />;
		case SidebarItem.TEXT_STYLES:
			return <TextStyles />;
		case SidebarItem.SCHEMA:
			return <SchemaContent />;
		case SidebarItem.COMMIT_CHANGES:
			return <CommitChanges />;
		default:
			return <div>{selectedItem || ""}</div>;
	}
};
