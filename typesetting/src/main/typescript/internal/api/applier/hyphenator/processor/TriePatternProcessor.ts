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
import type { HyphenationPattern } from "../../../../../a12internal/api/model/index.js";

import { CharTrieMapNode } from "../trie/CharTrieMapNode.js";
import type { CharTrieNode } from "../trie/CharTrieNode.js";
import { FixedSizeIntArrayList } from "../collection/FixedSizeIntArrayList.js";
import type { FixedSizeIntList } from "../collection/FixedSizeIntList.js";
import type { CharTrie } from "../trie/CharTrie.js";

import type { PatternProcessor } from "./PatternProcessor.js";

export class TriePatternProcessor implements PatternProcessor<CharTrieNode> {
	private digitRegex = /\d/;

	processPatterns(patterns: HyphenationPattern[]): CharTrieNode {
		let node: CharTrieNode | undefined;
		const root: CharTrieNode = new CharTrieMapNode();
		let trie: CharTrie | undefined;

		for (const pattern of patterns.map(pattern => pattern.v)) {
			node = root;
			for (const ch of pattern) {
				if (this.digitRegex.test(ch) || !node?.trie) {
					continue;
				}
				trie = node.trie;
				if (trie.get(ch) === undefined) {
					trie.put(ch, new CharTrieMapNode());
				}
				node = trie.get(ch);
			}

			if (!node) {
				throw new Error("t undefined");
			}
			node.points = this.computePointsForPattern(pattern);
		}
		return root;
	}

	private computePointsForPattern(pattern: string): FixedSizeIntList {
		const list: FixedSizeIntList = new FixedSizeIntArrayList(this.countNonDigits(pattern) + 1);

		let digitStart = -1;
		for (let i = 0; i < pattern.length; i++) {
			const ch = pattern.charAt(i);
			if (/\d/.test(ch)) {
				if (digitStart < 0) {
					digitStart = i;
				}
				if (i === pattern.length - 1) {
					const number = pattern.substring(digitStart);
					list.add(Number.parseInt(number, 10));
				}
			} else if (digitStart >= 0) {
				const number = pattern.substring(digitStart, i);
				list.add(Number.parseInt(number, 10));
				digitStart = -1;
			} else {
				list.add(0);
			}
		}
		return list;
	}

	private countNonDigits(s: string): number {
		let count = 0;
		for (const ch of s) {
			if (!this.digitRegex.test(ch)) {
				count++;
			}
		}
		return count;
	}
}
