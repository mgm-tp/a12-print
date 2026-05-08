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
import { Locator } from "@playwright/test";

/**
 *	Navigates through a tree component until it reaches the end of the path, where it clicks the
 *	last element.
 *
 *	@param fieldPath should be the path within the tree - this function will not search the tree for field name
 * 	e.g. example/stringfield
 * 	@param tree should be the top level of the Tree component
 */
export const selectFieldFromTree = async ({ tree, fieldPath }: { tree: Locator; fieldPath: string }) => {
	const nodes = fieldPath.split("/");
	nodes.shift();

	let currNode = tree;
	for (let i = 0; i < nodes.length - 1; i++) {
		currNode = currNode.locator(`_react=TreeNode[label = '${nodes[i]}']`);
		const btn = currNode.locator("_react=ArrowButton").first();
		// expand_more does mean the Subtree is already expanded
		if (!(await currNode.locator("_react=NodeContent").allInnerTexts()).toString().includes("expand_more")) {
			await btn.locator("_react=Button").click();
		}
	}

	await currNode.locator(`_react=TreeNode[label = '${fieldPath.split("/").at(-1)}']`).click();
};
