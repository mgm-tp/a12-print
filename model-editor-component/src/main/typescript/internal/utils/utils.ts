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
import type { ElementMap, ElementMapEntry } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

export function getItemsFromElementMap(group: string | undefined, elementMap: ElementMap) {
	const resItems: { label: string; value: string }[] = [{ label: "", value: "" }];
	if (group) {
		Object.values(elementMap).forEach(elementMapEntry => {
			if (isAllowedElement(elementMapEntry, group, elementMap)) {
				const label = elementMapEntry.elementPath.replace(`/${group}/`, "");
				resItems.push({ label, value: label });
			}
		});
	}
	return resItems;
}

function isAllowedElement(elementMapEntry: ElementMapEntry, groupRef: string, elementMap: ElementMap) {
	const cleanElementPath = elementMapEntry.elementPath;
	if (!elementMapEntry.isGroup && cleanElementPath.startsWith(`${groupRef}/`)) {
		const relativePath = cleanElementPath.substring(groupRef.length + 1);
		if (relativePath && !relativePath.includes("/")) {
			return true;
		} else {
			const path = [groupRef, ...relativePath.split("/")];
			for (let i = 1; i < path.length; i++) {
				const subGroupPath = `${path.slice(0, i + 1).join("/")}`;
				const subGroup = Object.values(elementMap).find(f => f.elementPath === subGroupPath);
				if (subGroup && subGroup.element.type === "Group" && subGroup.element.repeatability > 1) {
					return false;
				}
			}
			return true;
		}
	}
	return false;
}

/**
 * Trigger downloading file from browser
 * @param source string
 * @param fileName expected file name
 */
export function downloadFile(source: string, fileName = "image") {
	const tempAnchor = document.createElement("a");
	tempAnchor.href = source;
	tempAnchor.download = fileName;
	tempAnchor.target = "_blank";
	tempAnchor.click();
}

export function getShortcutText(
	key: string,
	options: { withAlt?: boolean; withCtrl?: boolean; withShift?: boolean } = {}
) {
	const { withAlt, withCtrl, withShift } = options;

	const keyText = key.trim();

	if (!keyText) {
		return "";
	}

	const keys: string[] = [];

	if (withCtrl) {
		keys.push("Ctrl");
	}

	if (withAlt) {
		keys.push("Alt");
	}

	if (withShift) {
		keys.push("Shift");
	}

	keys.push(keyText);

	return keys.join(" + ");
}
