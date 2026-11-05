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
import { Icon, type CollapsibleTreeNodeModel, type TreeNodeModel } from "@com.mgmtp.a12.widgets/widgets-core";

import type { FragmentTypeNode } from "./FragmentTypeNode.js";

export interface FragmentRootNode extends TreeNodeModel, CollapsibleTreeNodeModel {
	label: "Fragments";
	selected?: boolean;
	children: FragmentTypeNode[];
}

export const BaseFragmentTree: FragmentRootNode = {
	id: "fragment-root",
	label: "Fragments",
	initiallyExpanded: true,
	children: [
		{
			id: "sections",
			label: "Sections",
			icon: <Icon>view_day</Icon>,
			type: "section",
			initiallyExpanded: true,
		},
		{
			id: "watermarks",
			label: "Watermarks",
			icon: <Icon>branding_watermark</Icon>,
			type: "watermark",
			initiallyExpanded: true,
		},
		{
			id: "segments",
			label: "Segments",
			icon: <Icon>segment</Icon>,
			type: "segment",
			initiallyExpanded: true,
		},
		{
			id: "elements",
			label: "Elements",
			icon: <Icon>category</Icon>,
			type: "element",
			initiallyExpanded: true,
		},
	],
};
