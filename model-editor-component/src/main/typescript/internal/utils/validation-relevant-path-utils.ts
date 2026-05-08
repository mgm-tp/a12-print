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
import { Meta } from "typescript-fsa";
import uniqWith from "lodash/uniqWith.js";

import { AffectedItem } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/interaction-log.js";
import { PrintModel } from "@com.mgmtp.a12.print/print-model-api/lib/model/print-model.js";
import { EntityInstancePath } from "@com.mgmtp.a12.kernel/kernel-md-facade";

export function isAffectedItemMeta(object: object): object is { affectedItems: AffectedItem[] } {
	return "affectedItems" in object;
}
export function createAffectedItemMeta(affectedItems: AffectedItem[]): { affectedItems: AffectedItem[] } {
	return { affectedItems };
}
export function getAffectedItemMeta(meta?: Meta): AffectedItem[] {
	if (meta && isAffectedItemMeta(meta)) {
		return meta.affectedItems;
	}
	return [];
}

export function createRelevantPathsFromAffectedItems(
	affectedItems: AffectedItem[],
	printModel: PrintModel
): EntityInstancePath[] {
	const relevantEntities: EntityInstancePath[] = [];
	affectedItems.forEach(item => {
		if (item.type === "printModelElement") {
			printModel.content.elementDefinitions.forEach((element, index) => {
				if (element.id === item.id) {
					relevantEntities.push(createElementDefinitionPath(index));
				}
			});
		} else if (item.type === "segment") {
			printModel.content.segments.definitions.forEach((element, index) => {
				if (element.id === item.id) {
					relevantEntities.push(createSegmentDefinitionPath(index));
				}
			});
		} else if (item.type === "section") {
			printModel.content.sections?.definitions.forEach((element, index) => {
				if (element.id === item.id) {
					relevantEntities.push(createSectionDefinitionPath(index));
				}
			});
		} else if (item.type === "watermark") {
			printModel.content.watermarks?.definitions.forEach((element, index) => {
				if (element.id === item.id) {
					relevantEntities.push(createWatermarkDefinitionPath(index));
				}
			});
		}
	});
	return uniqWith(relevantEntities, EntityInstancePath.equals);
}

const contentPath = [{ elementName: "content", index: 1 }];

function createElementDefinitionPath(index: number) {
	return [...contentPath, { elementName: "elementDefinitions", index: index + 1 }];
}
function createSegmentDefinitionPath(index: number) {
	return [...contentPath, { elementName: "segments", index: 1 }, { elementName: "definitions", index: index + 1 }];
}
function createSectionDefinitionPath(index: number) {
	return [...contentPath, { elementName: "sections", index: 1 }, { elementName: "definitions", index: index + 1 }];
}
function createWatermarkDefinitionPath(index: number) {
	return [...contentPath, { elementName: "watermarks", index: 1 }, { elementName: "definitions", index: index + 1 }];
}
