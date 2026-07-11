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
import type { DeepPartialErrorMap } from "@com.mgmtp.a12.print/print-model-api/errors";

import type { ErrorTreeNode } from "../../types/index.js";

import { countErrorDataNodes, createErrorNodes, pushErrorTreeNode } from "../error-tree-utils.js";

import { errorMap, largeErrorMap } from "./__testdata__/errorMap.js";

describe("error tree utils", () => {
	describe("countErrorDataNodes", () => {
		it("should count errorTreeNodes", () => {
			const tree = createErrorNodes(largeErrorMap as DeepPartialErrorMap<unknown>, "root", undefined, false);
			const count = countErrorDataNodes(tree);
			expect(count).toBe(largeErrorMap["@error"].length + largeErrorMap["@warning"].length);
		});
	});

	describe("pushErrorTreeNode", () => {
		it("should add treeNode to tree when treeNode has children", () => {
			const root: ErrorTreeNode = {
				id: "root",
				label: "root",
				children: createErrorNodes(largeErrorMap as DeepPartialErrorMap<unknown>, "root", undefined),
			};
			const elementsNode: ErrorTreeNode = {
				id: "elementsNode",
				label: "elementsNode",
				children: createErrorNodes(errorMap as DeepPartialErrorMap<unknown>, "elementsNode", undefined),
			};
			const emptyNode: ErrorTreeNode = {
				id: "emptyNode",
				label: "emptyNode",
				children: [],
			};

			pushErrorTreeNode(root.children, elementsNode);
			expect(JSON.stringify(root)).toMatchSnapshot();

			const rootCopy = JSON.parse(JSON.stringify(root));
			pushErrorTreeNode(root.children, emptyNode);
			expect(rootCopy).toEqual(root);
		});
	});

	describe("createErrorNodes", () => {
		it("should create errorTreeNodes", () => {
			const tree = createErrorNodes(largeErrorMap as DeepPartialErrorMap<unknown>, "root", undefined, false);
			expect(JSON.stringify(tree)).toMatchSnapshot();
		});

		it("should create errorTreeNodes with Flatened Nodes", () => {
			const tree = createErrorNodes(largeErrorMap as DeepPartialErrorMap<unknown>, "root", undefined);
			expect(JSON.stringify(tree)).toMatchSnapshot();
		});

		it("should not create errorTreeNodes", () => {
			const tree = createErrorNodes(undefined, "root", undefined, false);
			expect(tree).toEqual([]);
		});

		it("should not create errorTreeNodes", () => {
			const tree = createErrorNodes(
				{ "@error": [], "@warning": [] } as unknown as DeepPartialErrorMap<unknown>,
				"root",
				undefined,
				false
			);
			expect(tree).toEqual([]);
		});
	});
});
