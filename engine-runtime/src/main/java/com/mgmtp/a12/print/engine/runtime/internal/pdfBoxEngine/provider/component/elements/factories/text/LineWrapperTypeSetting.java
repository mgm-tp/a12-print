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
package com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.factories.text;

import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing.InnerTextToken;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing.LineWrapperSubSequence;
import com.mgmtp.a12.print.model.api.model.textStyle.TextStyle;
import com.mgmtp.a12.print.typesetting.internal.applier.hyphenator.HyphenIndex;
import com.mgmtp.a12.print.typesetting.internal.applier.hyphenator.Hyphenator;
import com.mgmtp.a12.print.typesetting.internal.applier.hyphenator.PatternHyphenator;
import com.mgmtp.a12.print.typesetting.internal.constant.StaticHyphenatorMap;
import com.mgmtp.a12.print.typesetting.internal.model.HyphenationExclusion;
import com.mgmtp.a12.print.typesetting.internal.model.TypesettingModel;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Deque;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@AllArgsConstructor
public class LineWrapperTypeSetting {
	private List<Pattern> patternList;
	private final Hyphenator staticHyphenator;
	private final Hyphenator customHyphenator;
	private final TypesettingModel typesettingModel;

	public LineWrapperTypeSetting(
		TextStyle.StaticHyphenator staticHyphenatorKey,
		TypesettingModel typesettingModel
	) {
		this.staticHyphenator = staticHyphenatorKey != null
			? StaticHyphenatorMap.getHyphenator(staticHyphenatorKey)
			: null;
		this.typesettingModel = typesettingModel;
		this.customHyphenator = initalizeCustomHyphenator();
		this.patternList = initializeLineBreakPreventPatterns();
	}

	private Hyphenator initalizeCustomHyphenator() {
		if (typesettingModel != null && typesettingModel.getContent().getInternal().getHyphenation().isPresent()) {
			return new PatternHyphenator(typesettingModel);
		}
		return null;
	}


	private List<Pattern> initializeLineBreakPreventPatterns() {
		if (typesettingModel == null) {
			return List.of();
		}
		final var list = typesettingModel.getContent().getPreventLineBreakRules();
		return list.stream().map(s -> Pattern.compile(s.getPattern())).toList();
	}

	public HyphenIndex getHyphenationPositions(String word) {
		if (word.isEmpty()) {
			return new HyphenIndex();
		}

		final List<HyphenationExclusion> customExclusions = this.customHyphenator != null
			? this.typesettingModel.getContent().getCustomExclusions()
			: Collections.emptyList();

		if (this.customHyphenator != null) {
			return this.customHyphenator.findHyphenIndexes(word, customExclusions);
		} else if (this.staticHyphenator != null) {
			return this.staticHyphenator.findHyphenIndexes(word, customExclusions);
		}

		return new HyphenIndex();
	}

	public boolean hasLineBreakPreventRules() {
		return !patternList.isEmpty();
	}

	public MatchResult getBreakPositions(Deque<LineWrapperSubSequence> window) {
		MatchResult matches = new MatchResult();
		if (!hasLineBreakPreventRules()) {
			return matches;
		}

		StringBuilder sb = new StringBuilder();
		for (LineWrapperSubSequence s : window) {
			for (InnerTextToken t : s.getLineSubSequence().getTokens()) {
				sb.append(t.toString());
			}
		}
		String joined = sb.toString();
		for (Pattern p : patternList) {
			Matcher m = p.matcher(joined);
			while (m.find()) {
				matches.addMatch(new MatchPosition(m.start(), m.end()));
			}
		}
		return matches;
	}

	@NoArgsConstructor
	public class MatchResult {
		private List<MatchPosition> matches = new ArrayList();

		public void addMatch(MatchPosition match) {
			matches.add(match);
		}

		public boolean intersects(int index) {
			for (MatchPosition pos : matches) {
				if (pos.intersects(index)) {
					return true;
				}
			}
			return false;
		}
	}
	@AllArgsConstructor
	public class MatchPosition {
		private int start;
		private int end;

		public boolean intersects(int index) {
			return index > start && index < end;
		}
	}
}
