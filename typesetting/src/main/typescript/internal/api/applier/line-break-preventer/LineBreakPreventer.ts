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
import type { PreventLineBreakRule, TypesettingModel } from "../../../../a12internal/api/model/index.js";

import type { LineBreakPreventIndex, LineBreakPreventPosition } from "./LineBreakIndex.js";

export interface LineBreakPreventer {
	findLineBreakPreventPositions(text: string): LineBreakPreventIndex;
}

export class PatternLineBreakPreventer implements LineBreakPreventer {
	private readonly preventLineBreakRules: PreventLineBreakRule[];

	constructor(typesetting: TypesettingModel) {
		this.preventLineBreakRules = typesetting.content.preventLineBreakRules;
	}

	findLineBreakPreventPositions(text: string): LineBreakPreventIndex {
		const index: LineBreakPreventIndex = {};
		for (const rule of this.preventLineBreakRules) {
			const regex = new RegExp(rule.pattern, "dg");
			let match;
			while ((match = regex.exec(text)) !== null) {
				const matchLength = match[0].length;
				const { index: matchIndex } = match;
				const end = matchIndex + matchLength;

				this.updateIndex(index, matchIndex, "start");
				this.updateIndex(index, end, "end");
			}
		}

		return index;
	}

	private updateIndex(index: LineBreakPreventIndex, searchIndex: number, position: LineBreakPreventPosition) {
		const currentEntry = index[searchIndex];
		const currentCount = currentEntry && currentEntry[position] !== undefined ? currentEntry[position]! : 0;
		index[searchIndex] = {
			...(currentEntry || {}),
			[position]: currentCount + 1,
		};
	}
}
