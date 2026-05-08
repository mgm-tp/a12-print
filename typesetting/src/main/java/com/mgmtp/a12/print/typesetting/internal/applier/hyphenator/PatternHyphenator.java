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
package com.mgmtp.a12.print.typesetting.internal.applier.hyphenator;

import com.mgmtp.a12.print.typesetting.internal.applier.hyphenator.collection.FixedSizeIntList;
import com.mgmtp.a12.print.typesetting.internal.applier.hyphenator.collection.ImmutableCharArrayList;
import com.mgmtp.a12.print.typesetting.internal.applier.hyphenator.collection.ImmutableCharList;
import com.mgmtp.a12.print.typesetting.internal.applier.hyphenator.collection.ZeroInitializedFixedSizeIntArrayList;
import com.mgmtp.a12.print.typesetting.internal.applier.hyphenator.processor.TriePatternProcessor;
import com.mgmtp.a12.print.typesetting.internal.applier.hyphenator.trie.CharTrieNode;
import com.mgmtp.a12.print.typesetting.internal.model.Hyphenation;
import com.mgmtp.a12.print.typesetting.internal.model.HyphenationExclusion;
import com.mgmtp.a12.print.typesetting.internal.model.TypesettingModel;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

public class PatternHyphenator implements Hyphenator {

	private final CharTrieNode root;
	private final Hyphenation hyphenation;

	public PatternHyphenator(TypesettingModel typesettingModel) {
		this.hyphenation = typesettingModel.getContent().getInternal().getHyphenation().orElseThrow(() ->
			new RuntimeException("Hyphenation only possible with a Typesetting model with hyphenation rules")
		);
		this.root = new TriePatternProcessor().processPatterns(hyphenation.getPatterns());
	}

	public List<HyphenationResultEntry> findHyphenPositions(String word, List<HyphenationExclusion> hyphenationExclusions) {
		HyphenIndex hyphenationResult = findHyphenIndexes(word, hyphenationExclusions);
		return insertHyphens(hyphenationResult, word);
	}

	public HyphenIndex findHyphenIndexes(String word, List<HyphenationExclusion> hyphenationExclusions) {
		HyphenIndex result = new HyphenIndex(word.length());

		for (HyphenationExclusion exclusion : Stream.concat(hyphenationExclusions.stream(), hyphenation.getExclusions().stream()).toList()) {
			if (exclusion.getWord().equals(word.toLowerCase())) {
				return new HyphenIndex(exclusion.getIndices());
			}
		}

		final var wordWithDots = "." + word + ".";

		String lowercase = wordWithDots.toLowerCase();
		int wordLength = lowercase.length();

		FixedSizeIntList points = new ZeroInitializedFixedSizeIntArrayList(wordLength);
		ImmutableCharList characters = new ImmutableCharArrayList(lowercase);

		CharTrieNode node;
		for (int i = 0; i < wordLength; i++) {
			node = root;
			for (int j = i; j < wordLength; j++) {
				node = node.getTrie().get(characters.get(j));
				if (node == null) {
					break;
				}
				extractNodePoints(node, points, i);
			}
		}

		int leftMin = hyphenation.getGeneral().getHyphenMins().getTypeSetting().getLeft();
		int rightMin = hyphenation.getGeneral().getHyphenMins().getTypeSetting().getRight();
		for (int i = 1; i < wordLength - 1; i++) {
			if (i > leftMin && i < (wordLength - rightMin) && points.get(i) % 2 > 0) {
				result.add(i - 1);
			}
		}
		return result;
	}

	private static void extractNodePoints(CharTrieNode node, FixedSizeIntList points, int i) {
		FixedSizeIntList nodePoints  = node.getPoints();
		if (nodePoints != null) {
			for (int k = 0, nodePointsLength = nodePoints.size(); k < nodePointsLength; k++) {
				points.set(i + k, Math.max(points.get(i + k), nodePoints.get(k)));
			}
		}
	}

	public List<HyphenationResultEntry> insertHyphens(HyphenIndex hyphenIndex, String word) {
		final var result = new ArrayList<HyphenationResultEntry>();
		int[] indices = hyphenIndex.getIndices();
		int hyphenIndexPosition = 0;
		for (int i = 0; i < word.length(); i++) {
			if (i != 0 && hyphenIndexPosition < indices.length && indices[hyphenIndexPosition] == i) {
				result.add(new HyphenationResultHyphenEntry());
				hyphenIndexPosition++;
			}
			result.add(new HyphenationResultCharEntry(word.charAt(i)));
		}
		return result;
	}
}
