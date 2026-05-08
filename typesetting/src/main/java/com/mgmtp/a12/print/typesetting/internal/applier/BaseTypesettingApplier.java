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
package com.mgmtp.a12.print.typesetting.internal.applier;

import com.mgmtp.a12.print.model.api.model.textStyle.TextStyle;
import com.mgmtp.a12.print.typesetting.internal.applier.hyphenator.*;
import com.mgmtp.a12.print.typesetting.internal.applier.lineBreakPreventer.LineBreakPreventIndexEntry;
import com.mgmtp.a12.print.typesetting.internal.applier.lineBreakPreventer.LineBreakPreventer;
import com.mgmtp.a12.print.typesetting.internal.applier.lineBreakPreventer.PatternLineBreakPreventer;
import com.mgmtp.a12.print.typesetting.internal.constant.StaticHyphenatorMap;
import com.mgmtp.a12.print.typesetting.internal.model.TypesettingModel;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

public class BaseTypesettingApplier implements TypesettingApplier {
	private static final String DELIMITER = "\\b";

	private final Hyphenator staticHyphenator;
	private final TypesettingModel typesettingModel;
	private final LineBreakPreventer lineBreakPreventer;
	private final String hyphenSymbol;
	private final String preventLineBreakStartSymbol;
	private final String preventLineBreakEndSymbol;

	public BaseTypesettingApplier(TextStyle.StaticHyphenator staticHyphenatorKey) {
		this(staticHyphenatorKey, null, null, null, null);
	}
	public BaseTypesettingApplier(TypesettingModel typesettingModel) {
		this(null, typesettingModel, null, null, null);
	}

	public BaseTypesettingApplier(
		TextStyle.StaticHyphenator staticHyphenatorKey,
		TypesettingModel typesettingModel,
		String hyphenSymbol,
		String preventLineBreakStartSymbol,
		String preventLineBreakEndSymbol
	) {
		this.staticHyphenator = staticHyphenatorKey != null
			? StaticHyphenatorMap.getHyphenator(staticHyphenatorKey)
			: null;
		this.typesettingModel = typesettingModel;
		this.lineBreakPreventer = typesettingModel != null
			? new PatternLineBreakPreventer(typesettingModel)
			: null;

		this.hyphenSymbol = hyphenSymbol != null ? hyphenSymbol : "-";
		this.preventLineBreakStartSymbol = preventLineBreakStartSymbol != null ? preventLineBreakStartSymbol : "{start}";
		this.preventLineBreakEndSymbol = preventLineBreakEndSymbol != null ? preventLineBreakEndSymbol : "{end}";
	}

	@Override
	public String applyToWord(String word) {
		if (noRulesApplicable()) {
			return word;
		}

		final var hyphenationResult = applyHyphenationToWord(word);
		final var lineBreakPositions = this.lineBreakPreventer != null
			? this.lineBreakPreventer.findLineBreakPreventPositions(word)
			: new HashMap<Integer, LineBreakPreventIndexEntry>();

		return insertSymbols(hyphenationResult, lineBreakPositions);
	}

	@Override
	public String applyToText(String text) {
		if (noRulesApplicable()) {
			return text;
		}

		final var lineBreakPositions = this.lineBreakPreventer != null
			? this.lineBreakPreventer.findLineBreakPreventPositions(text)
			: new HashMap<Integer, LineBreakPreventIndexEntry>();

		final var hyphenationResult = Arrays.stream(text.split(DELIMITER))
			.map(this::applyHyphenationToWord)
			.flatMap(List::stream)
			.collect(Collectors.toList());

		return this.insertSymbols(hyphenationResult, lineBreakPositions);
	}

	@Override
	public String applyToHtml(String html) {
		if (noRulesApplicable()) {
			return html;
		}

		String regex = "<[^>]+>";
		Pattern pattern = Pattern.compile(regex);
		Matcher matcher = pattern.matcher(html);
		StringBuilder builder = new StringBuilder();
		int lastTagEnd = 0;
		while (matcher.find()) {
			int tagStart = matcher.start();
			int tagEnd = matcher.end();

			if (tagStart != lastTagEnd) {
				String content = html.substring(lastTagEnd, tagStart);
				String hyphenatedContent = applyToText(content);
				builder.append(hyphenatedContent);
			}

			String tag = html.substring(tagStart, tagEnd);
			builder.append(tag);

			lastTagEnd = tagEnd;
		}

		if (html.length() > lastTagEnd) {
			String content = html.substring(lastTagEnd);
			String hyphenatedContent = applyToText(content);
			builder.append(hyphenatedContent);
		}

		return builder.toString();
	}

	private boolean noRulesApplicable() {
		return this.staticHyphenator == null && this.lineBreakPreventer == null;
	}

	private List<HyphenationResultEntry> applyHyphenationToWord(String word) {
		if (word.isEmpty()) {
			return new ArrayList<>();
		}

		if (this.staticHyphenator != null) {
			return this.staticHyphenator.findHyphenPositions(
				word, this.typesettingModel != null ? this.typesettingModel.getContent().getCustomExclusions() : Collections.emptyList()
			);
		}

		final var hyphenations = new ArrayList<HyphenationResultEntry>();
		for (char c : word.toCharArray()) {
			hyphenations.add(new HyphenationResultCharEntry(c));
		}

		return hyphenations;
	}

	private String insertSymbols(
		List<HyphenationResultEntry> hyphenationResult,
		Map<Integer, LineBreakPreventIndexEntry> lineBreakPreventIndex
	) {
		final var stringBuilder = new StringBuilder();
		var originIndex = 0;

		for (var i = 0; i <= hyphenationResult.size(); i++) {
			final var hyphenationEntry = i == hyphenationResult.size() ? null : hyphenationResult.get(i);
			final var lineBreakEntry = getLineBreakEntry(hyphenationResult, lineBreakPreventIndex, i, originIndex);

			if (lineBreakEntry != null && lineBreakEntry.getEndCount().isPresent()) {
				stringBuilder.append(String.valueOf(preventLineBreakEndSymbol).repeat(Math.max(0, lineBreakEntry.getEndCount().get())));
			}
			if (hyphenationEntry instanceof HyphenationResultHyphenEntry) {
				stringBuilder.append(hyphenSymbol);
			}
			if (lineBreakEntry != null && lineBreakEntry.getStartCount().isPresent()) {
				stringBuilder.append(String.valueOf(preventLineBreakStartSymbol).repeat(Math.max(0, lineBreakEntry.getStartCount().get())));
			}
			if (hyphenationEntry instanceof HyphenationResultCharEntry charEntry) {
				stringBuilder.append(charEntry.getCharValue());
				originIndex++;
			}
		}

		return stringBuilder.toString();
	}

	private static LineBreakPreventIndexEntry getLineBreakEntry(
		List<HyphenationResultEntry> hyphenationResult,
		Map<Integer, LineBreakPreventIndexEntry> lineBreakPreventIndex,
		int hyphenationCharIndex,
		int originIndex
	) {
		return (hyphenationCharIndex == 0 || hyphenationResult.get(hyphenationCharIndex - 1) instanceof HyphenationResultCharEntry)
			? lineBreakPreventIndex.get(originIndex)
			: null;
	}
}
