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
package com.mgmtp.a12.print.typesetting.internal.applier.lineBreakPreventer;

import com.mgmtp.a12.print.typesetting.internal.model.PreventLineBreakRule;
import com.mgmtp.a12.print.typesetting.internal.model.TypesettingModel;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class PatternLineBreakPreventer implements LineBreakPreventer {
	private final List<PreventLineBreakRule> preventLineBreakRules;

	public PatternLineBreakPreventer(TypesettingModel typesettingModel) {
		this.preventLineBreakRules = typesettingModel.getContent().getPreventLineBreakRules();
	}

	@Override
	public Map<Integer, LineBreakPreventIndexEntry> findLineBreakPreventPositions(String text) {
		final var index = new HashMap<Integer, LineBreakPreventIndexEntry>();

		for (PreventLineBreakRule preventLineBreakRule : preventLineBreakRules) {
			final var regex = Pattern.compile(preventLineBreakRule.getPattern());
			Matcher matcher = regex.matcher(text);
			while (matcher.find()) {
				final var matchIndex = matcher.start();
				final var end = matcher.end();

				updateIndex(index, matchIndex, true);
				updateIndex(index, end, false);
			}
		}

		return index;
	}

	private void updateIndex(Map<Integer, LineBreakPreventIndexEntry> index, int searchIndex, boolean isStart) {
		if (index.containsKey(searchIndex)) {
			if (isStart) {
				index.get(searchIndex).incrementStartCount();
			} else {
				index.get(searchIndex).incrementEndCount();
			}
		} else {
			index.put(searchIndex, new LineBreakPreventIndexEntry(isStart ? 1 : null, isStart ? null : 1));
		}
	}
}
