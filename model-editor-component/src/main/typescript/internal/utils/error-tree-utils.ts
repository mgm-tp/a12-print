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
import { DeepPartialErrorMap, PrintError } from "@com.mgmtp.a12.print/print-model-api/lib/errors/index.js";
import { EntityInstancePath } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import { NavigationTarget, ErrorTreeNode } from "../types/index.js";

export function pushErrorTreeNode(rootNodes: ErrorTreeNode[] | undefined, newNode: ErrorTreeNode | undefined) {
	if (newNode?.children?.length) {
		rootNodes?.push(newNode);
	}
}

export function countErrorDataNodes(rootNodes: ErrorTreeNode[]): number {
	let count = 0;

	function traverse(node: ErrorTreeNode) {
		if (node.errorData) {
			count++;
		}

		if (node.children && node.children.length > 0) {
			node.children.forEach(child => traverse(child));
		}
	}

	rootNodes.forEach(rootNode => traverse(rootNode));
	return count;
}

export function createErrorNodes<T>(
	errorMap: DeepPartialErrorMap<T> | undefined,
	parentId: string,
	navigation: NavigationTarget | undefined,
	flat: boolean = true
) {
	const treeNodes: ErrorTreeNode[] = [];

	if (!errorMap) {
		return treeNodes;
	}

	if (flat) {
		treeNodes.push(...createFlatErrorNodes(errorMap["@error"], parentId, navigation));
		treeNodes.push(...createFlatErrorNodes(errorMap["@warning"], parentId, navigation));
	} else {
		treeNodes.push(...createNestedErrorNodes(errorMap, parentId, navigation));
	}
	return treeNodes;
}

function createFlatErrorNodes(
	err: PrintError[] | undefined,
	parentId: string,
	navigation: NavigationTarget | undefined
) {
	const treeNodes: ErrorTreeNode[] = [];
	if (!err?.length) {
		return treeNodes;
	}

	err.forEach((e, index) => {
		const jsonPath = convertPathToString(e.jsonPath);
		const newNode: ErrorTreeNode = {
			label: e.jsonPath[e.jsonPath.length - 1].elementName,
			id: `${parentId}.${e.errorCode}[${index}]`,
			path: jsonPath,
			errorData: { ...e, navigation },
			initiallyExpanded: true,
		};
		treeNodes.push(newNode);
	});
	return treeNodes;
}

function createNestedErrorNodes<T>(
	errorMap: DeepPartialErrorMap<T> | undefined,
	parentId: string,
	navigation?: NavigationTarget,
	pathElements: string[] = [],
	initiallyExpanded: boolean = true
) {
	const treeNodes: ErrorTreeNode[] = [];

	if (!errorMap?.["@error"]?.length && !errorMap?.["@warning"]?.length) {
		return treeNodes;
	}

	(Object.keys(errorMap) as Array<keyof DeepPartialErrorMap<T> & string>).forEach(errorMapKey => {
		if (errorMapKey.startsWith("@error") || errorMapKey.startsWith("@warning")) {
			// errorMap entry is error or warning
			const errorList = errorMap[errorMapKey] as PrintError[];
			errorList.forEach((error, index) => {
				const jsonPathString = convertPathToString(error.jsonPath);
				const pathElementsString = pathElements.join(".");
				if (!!pathElementsString && jsonPathString.endsWith(pathElementsString)) {
					const nodeData = createNodeData(errorMapKey, parentId, pathElements, index);
					const { id, label, path } = nodeData;
					const errorData = { ...error, navigation };
					const newNode: ErrorTreeNode = { label, id, errorData, path, initiallyExpanded };
					treeNodes.push(newNode);
				}
			});
		} else if (Array.isArray(errorMap[errorMapKey])) {
			// errorMap entry is array
			const elements = errorMap[errorMapKey] as DeepPartialErrorMap<T>[];
			elements.forEach((element, index) => {
				// skip if element has no errors
				if (!element["@error"]?.length && !element["@warning"]?.length) {
					return;
				}

				const nodeData = createNodeData(errorMapKey, parentId, pathElements, index);
				const { id, label, path, currentPath } = nodeData;
				const children = createNestedErrorNodes(element, id, navigation, currentPath, initiallyExpanded);
				const newNode: ErrorTreeNode = { id, initiallyExpanded, label, path, children };
				treeNodes.push(newNode);
			});
		} else if (typeof errorMap[errorMapKey] === "object" && errorMap[errorMapKey] !== null) {
			// errorMap entry is object
			const element = errorMap[errorMapKey] as unknown as DeepPartialErrorMap<T>;
			const nodeData = createNodeData(errorMapKey, parentId, pathElements);
			const { id, label, path, currentPath } = nodeData;
			const children = createNestedErrorNodes(element, id, navigation, currentPath, initiallyExpanded);
			const newNode: ErrorTreeNode = { id, initiallyExpanded, label, path, children };
			treeNodes.push(newNode);
		}
	});

	return treeNodes;
}

function createNodeData(errorMapKey: string, parentId: string, path: string[], index?: number) {
	const currentPath = [...path, errorMapKey];
	const position = index ? `[${index}]` : "";
	const label = `${errorMapKey}${position}`;
	const id = `${parentId}.${label}`;
	return {
		id,
		label,
		path: currentPath.join("."),
		currentPath,
	};
}

function convertPathToString(path: EntityInstancePath): string {
	return path.map(({ elementName }) => elementName).join(".");
}
