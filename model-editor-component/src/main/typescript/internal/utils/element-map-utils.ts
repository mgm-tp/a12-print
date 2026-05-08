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
import { ElementMapEntry } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/types/document-model-data.js";
import { DocumentModelUtils } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/utils/document-model-utils.js";

import { DataContextEntry } from "../types/data-context.js";

export namespace ElementMapUtils {
	export function createEntriesFromDataContext(
		elementMapEntries: ElementMapEntry[],
		dataContext: DataContextEntry[]
	): ElementMapEntry[] {
		const resElementMapEntries: ElementMapEntry[] = [];

		dataContext.forEach(({ group, isInstance }) => {
			const subPaths = group.split("/");
			const parentPaths: string[] = [];
			for (let i = 1; i < subPaths.length - 1; i++) {
				parentPaths.push(subPaths.slice(0, i + 1).join("/"));
			}
			if (!isInstance) {
				elementMapEntries.forEach(entry => {
					if (parentPaths.some(path => entry.elementPath === path)) {
						const resEntry = resElementMapEntries.find(
							resEntry => resEntry.elementPath === entry.elementPath
						);

						if (!resEntry) {
							resElementMapEntries.push({
								...entry,
								treeOptions: { ...entry.treeOptions, disabled: true },
							});
						}
						return;
					}
					if (!isSubPath(entry.elementPath, group)) {
						return;
					}
					const resEntry = resElementMapEntries.find(resEntry => resEntry.elementPath === entry.elementPath);
					if (resEntry) {
						if (resEntry.treeOptions?.isInstance) {
							resElementMapEntries.push(entry);
						}
						return;
					}
					resElementMapEntries.push(entry);
				});
				return;
			}
			elementMapEntries.forEach(entry => {
				if (!isSubPath(entry.elementPath, group)) {
					return;
				}

				if (entry.elementPath === group && entry.repeatability && entry.repeatability > 1) {
					const existedIndex = resElementMapEntries.findIndex(
						resEntry => resEntry.elementPath === entry.elementPath
					);

					const instanceEntry = {
						...entry,
						treeOptions: { isInstance: true },
						repeatability: 1,
						element: {
							...entry.element,
							...(DocumentModelUtils.isGroup(entry.element) ? { repeatability: 1 } : {}),
						},
					};

					if (existedIndex > -1) {
						resElementMapEntries[existedIndex] = instanceEntry;
						return;
					}

					resElementMapEntries.push(instanceEntry);
					return;
				}
				if (!resElementMapEntries.some(resEntry => resEntry.elementPath === entry.elementPath)) {
					resElementMapEntries.push(entry);
				}
			});
		});

		return resElementMapEntries;
	}

	export function getAvailableDataContexts(
		elementMapEntries: ElementMapEntry[],
		dataContext: DataContextEntry[]
	): ElementMapEntry[] {
		let resElementMapEntries = elementMapEntries;

		dataContext.forEach(context => {
			if (context.isInstance) {
				return;
			}
			const subPaths = context.group.split("/");
			const pathsToFilter: string[] = [];
			for (let i = 1; i < subPaths.length - 1; i++) {
				pathsToFilter.push(subPaths.slice(0, i + 1).join("/"));
			}
			resElementMapEntries = resElementMapEntries.reduce<ElementMapEntry[]>((res, entry) => {
				if (isSubPath(entry.elementPath, context.group)) {
					return res;
				}
				if (pathsToFilter.some(path => entry.elementPath === path)) {
					res.push({ ...entry, treeOptions: { ...entry.treeOptions, disabled: true } });
					return res;
				}
				res.push(entry);
				return res;
			}, []);
		});

		return resElementMapEntries;
	}

	export function setInstance(elementMapEntries: ElementMapEntry[], instance?: string): ElementMapEntry[] {
		if (!instance) {
			return elementMapEntries;
		}
		return elementMapEntries.reduce<ElementMapEntry[]>((res, entry) => {
			res.push(
				entry.elementPath === instance && entry.repeatability && entry.repeatability > 1
					? {
							...entry,
							treeOptions: { ...entry.treeOptions, isInstance: true },
							repeatability: 1,
							element: {
								...entry.element,
								...(DocumentModelUtils.isGroup(entry.element) ? { repeatability: 1 } : {}),
							},
						}
					: entry
			);
			return res;
		}, []);
	}

	export function createSubElementMapEntries(
		elementMapEntries: ElementMapEntry[],
		newRootPath: string,
		isNewRootInstance?: boolean
	): ElementMapEntry[] {
		const subPaths = newRootPath.split("/");
		const parentPaths: string[] = [];
		for (let i = 1; i < subPaths.length - 1; i++) {
			parentPaths.push(subPaths.slice(0, i + 1).join("/"));
		}
		return elementMapEntries.reduce<ElementMapEntry[]>((res, entry) => {
			if (parentPaths.some(path => path === entry.elementPath)) {
				res.push({ ...entry, treeOptions: { ...entry.treeOptions, disabled: true }, repeatability: 1 });
			} else if (isSubPath(entry.elementPath, newRootPath)) {
				res.push(
					isNewRootInstance && entry.elementPath === newRootPath
						? {
								...entry,
								treeOptions: { isInstance: true },
								repeatability: 1,
								element: {
									...entry.element,
									...(DocumentModelUtils.isGroup(entry.element) ? { repeatability: 1 } : {}),
								},
							}
						: entry
				);
			}
			return res;
		}, []);
	}
}

const isSubPath = (path: string, rootPath: string) => {
	return !rootPath || `${path}/`.startsWith(`${rootPath}/`);
};
