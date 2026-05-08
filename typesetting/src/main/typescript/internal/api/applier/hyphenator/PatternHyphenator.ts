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
import { Hyphenation, HyphenationExclusion, TypesettingModel } from "../../model/index.js";

import Hyphenator, {
	HyphenationResultCharEntry,
	HyphenationResultEntry,
	HyphenationResultHyphenEntry,
} from "./Hyphenator.js";
import CharTrieNode from "./trie/CharTrieNode.js";
import TriePatternProcessor from "./processor/TriePatternProcessor.js";
import HyphenIndex from "./HyphenIndex.js";
import FixedSizeIntList from "./collection/FixedSizeIntList.js";
import ZeroInitializedFixedSizeIntArrayList from "./collection/ZeroInitializedFixedSizeIntArrayList.js";
import ImmutableCharArrayList from "./collection/ImmutableCharArrayList.js";
import ImmutableCharList from "./collection/ImmutableCharList.js";
import CharTrie from "./trie/CharTrie.js";

export default class PatternHyphenator implements Hyphenator {
	private readonly root: CharTrieNode;
	private readonly hyphenation: Hyphenation;

	constructor(typesetting: TypesettingModel) {
		if (!typesetting.content.internal.hyphenation) {
			throw new Error("Hyphenation is not set in the model");
		}
		this.hyphenation = typesetting.content.internal.hyphenation;

		this.root = new TriePatternProcessor().processPatterns(this.hyphenation.patterns);
	}

	findHyphenPositions(word: string, customHyphenationExclusions?: HyphenationExclusion[]): HyphenationResultEntry[] {
		const result: HyphenIndex = new HyphenIndex(word.length);
		const exclusions = customHyphenationExclusions
			? [...customHyphenationExclusions, ...this.hyphenation.exclusions]
			: this.hyphenation.exclusions;

		for (const exclusion of exclusions) {
			if (exclusion.word.toLowerCase() === word.toLowerCase()) {
				return this.insertHyphens(new HyphenIndex(undefined, exclusion.index), word);
			}
		}

		const wordWithDots = "." + word + ".";
		const lowercase: string = wordWithDots.toLowerCase();
		const wordLength: number = lowercase.length;
		const points: FixedSizeIntList = new ZeroInitializedFixedSizeIntArrayList(wordLength);
		const characters: ImmutableCharList = new ImmutableCharArrayList(lowercase);

		this.traverseTrieToExtractPoints(characters, wordLength, points);

		const leftMin: number = this.hyphenation.general.hyphenmins.typesetting.left;
		const rightMin: number = this.hyphenation.general.hyphenmins.typesetting.right;

		for (let i = 1; i < wordLength - 1; i++) {
			if (i > leftMin && i < wordLength - rightMin && points.get(i) % 2 > 0) {
				result.add(i - 1);
			}
		}

		return this.insertHyphens(result, word);
	}

	private traverseTrieToExtractPoints(
		characters: ImmutableCharList,
		wordLength: number,
		points: FixedSizeIntList
	): void {
		let node: CharTrieNode | undefined;
		let trie: CharTrie | undefined;

		for (let i = 0; i < wordLength; i++) {
			node = this.root;
			for (let j = i; j < wordLength; j++) {
				trie = node.trie;
				if (!trie) {
					continue;
				}
				node = trie.get(characters.get(j));
				if (!node) {
					break;
				}
				this.extractNodePoints(node, points, i);
			}
		}
	}

	private extractNodePoints(node: CharTrieNode, points: FixedSizeIntList, index: number) {
		const nodePoints = node.points;
		if (nodePoints) {
			for (let k = 0, nodePointsLength = nodePoints.length; k < nodePointsLength; k++) {
				points.set(index + k, Math.max(points.get(index + k), nodePoints.get(k)));
			}
		}
	}

	private insertHyphens(hyphenIndex: HyphenIndex, word: string): HyphenationResultEntry[] {
		const result: HyphenationResultEntry[] = [];
		const indices: number[] = hyphenIndex.indices;
		let hyphenIndexPosition = 0;

		for (let i = 0; i < word.length; i++) {
			if (i !== 0 && hyphenIndexPosition < indices.length && indices[hyphenIndexPosition] === i) {
				result.push(new HyphenationResultHyphenEntry());
				hyphenIndexPosition++;
			}
			result.push(new HyphenationResultCharEntry(word.charAt(i)));
		}

		return result;
	}
}
