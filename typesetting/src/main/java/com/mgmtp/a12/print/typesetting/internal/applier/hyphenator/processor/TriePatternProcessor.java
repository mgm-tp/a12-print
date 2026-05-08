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
package com.mgmtp.a12.print.typesetting.internal.applier.hyphenator.processor;

import com.mgmtp.a12.print.typesetting.internal.applier.hyphenator.collection.FixedSizeIntArrayList;
import com.mgmtp.a12.print.typesetting.internal.applier.hyphenator.collection.FixedSizeIntList;
import com.mgmtp.a12.print.typesetting.internal.applier.hyphenator.trie.CharTrieMapNode;
import com.mgmtp.a12.print.typesetting.internal.applier.hyphenator.trie.CharTrieNode;
import com.mgmtp.a12.print.typesetting.internal.model.HyphenationPattern;

import java.util.List;

public class TriePatternProcessor implements PatternProcessor<CharTrieNode> {

	public CharTrieNode processPatterns(List<HyphenationPattern> patterns) {
		CharTrieNode t, root = new CharTrieMapNode();

		for (String pattern : patterns.stream().map(HyphenationPattern::getValue).toList()) {
			t = root;

			for (char ch : pattern.toCharArray()) {
				if (Character.isDigit(ch)) {
					continue;
				}
				if (t.getTrie().get(ch) == null) {
					t.getTrie().put(ch, new CharTrieMapNode());
				}
				t = t.getTrie().get(ch);
			}

			t.setPoints(computePointsForPattern(pattern));
		}
		return root;
	}

	private FixedSizeIntList computePointsForPattern(String pattern) {
		FixedSizeIntList list = new FixedSizeIntArrayList(countNonDigits(pattern) + 1);
		int digitStart = -1;
		for (int i = 0; i < pattern.length(); i++) {
			if (Character.isDigit(pattern.charAt(i))) {
				if (digitStart < 0) {
					digitStart = i;
				}
				if (i == pattern.length() - 1) {
					String number = pattern.substring(digitStart);
					list.add(Integer.parseInt(number));
				}
			} else if (digitStart >= 0) {
				String number = pattern.substring(digitStart, i);
				list.add(Integer.parseInt(number));
				digitStart = -1;
			} else {
				list.add(0);
			}
		}
		return list;
	}

	private int countNonDigits(String s) {
		int count = 0;
		for (char ch : s.toCharArray()) {
			if (!Character.isDigit(ch)) {
				count++;
			}
		}
		return count;
	}
}
