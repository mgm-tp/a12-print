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
package com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing;

import lombok.NonNull;
import lombok.Value;

import java.util.ArrayList;
import java.util.List;

import static com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing.TokenLine.getString;

@Value
public class LineSubSequence implements CharSequence {
	int start;
	int end;
	List<InnerTextToken> tokens;

	@Override
	public int length() {
		return end - start;
	}

	@Override
	public char charAt(int index) {
		if (index < 0 || index >= length())
			throw new IndexOutOfBoundsException();

		return TokenLine.charAt(index, tokens);
	}

	@Override
	@NonNull
	public LineSubSequence subSequence(int subStart, int subEnd) {
		if (subStart < 0 || subEnd > length() || subStart >= subEnd)
			throw new IndexOutOfBoundsException();

		return TokenLine.getSubsequence(subStart, subEnd, tokens);
	}

	public int getLastTrailingSpaceIndex() {
		int index = this.length() - 1;
		while (index >= 0 && Character.isWhitespace(this.charAt(index))) {
			index--;
		}
		return (index == this.length() - 1)
			? -1
			: index + 1;
	}

	@Override
	@NonNull
	public String toString() {
		return getString(tokens);
	}

	public static LineSubSequence withHyphen(LineSubSequence first) {
		List<InnerTextToken> mergedTokens = new ArrayList<>(first.getTokens().size() + 1);
		mergedTokens.addAll(first.getTokens());
		mergedTokens.add(new InnerTextToken("-", 0,1, first.getTokens().getLast().getStyle()));

		return new LineSubSequence(first.getStart(), first.getEnd() + 1, mergedTokens);
	}
}
