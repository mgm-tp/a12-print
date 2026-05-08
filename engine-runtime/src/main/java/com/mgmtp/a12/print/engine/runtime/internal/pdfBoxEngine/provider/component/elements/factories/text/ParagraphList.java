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
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@NoArgsConstructor
@Getter
public class ParagraphList {
	private final List<Paragraph> paragraphs = new ArrayList<>();

	public int totalLinesCount() {
		return paragraphs.stream()
			.mapToInt(Paragraph::getLinesCount)
			.sum();
	}

	public List<List<InnerTextToken>> getAllLines() {
		return paragraphs.stream()
			.flatMap(p -> p.getLines().stream())
			.toList();
	}

	public void add(List<List<InnerTextToken>> lines, boolean isSplitInsideParagraph) {
		this.paragraphs.add(new Paragraph(lines, isSplitInsideParagraph));
	}

	public void add(Paragraph paragraph) {
		this.paragraphs.add(paragraph);
	}

	@AllArgsConstructor
	@Getter
	public static class Paragraph {
		List<List<InnerTextToken>> lines;
		boolean isSplitInsideParagraph;

		public int getLinesCount() {
			// handle empty paragraph as one empty line
			return lines.isEmpty() ? 1 : lines.size();
		}

		public List<InnerTextToken> getLineAt(int index) {
			if (lines.isEmpty() && index == 0) {
				return List.of(); // handle empty paragraph as one empty line
			}
			return lines.get(index);
		}

		public boolean isLastLine(int lineIndex) {
			if (lines.isEmpty()) {
				return false;
			}
			return !this.isSplitInsideParagraph() && lineIndex == lines.size() - 1;
		}
	}

	public record ParagraphSlice(ParagraphList visible, ParagraphList remaining) {}

	public static ParagraphSlice slice(ParagraphList src, int visibleLines) {
		ParagraphList visible = new ParagraphList();
		ParagraphList remaining = new ParagraphList();

		int left = visibleLines;

		for (ParagraphList.Paragraph p : src.getParagraphs()) {
			int linesCount = p.getLinesCount();

			if (left <= 0) {
				remaining.add(p);
				continue;
			}

			if (linesCount <= left) {
				visible.add(p);
				left -= linesCount;
				continue;
			}

			// split case
			if (!p.getLines().isEmpty()) {
				List<List<InnerTextToken>> visLines = p.getLines().subList(0, left);
				visible.add(visLines, true);
				List<List<InnerTextToken>> remLines = p.getLines().subList(left, p.getLines().size());
				remaining.add(remLines, false);
			}
			left = 0;
		}

		return new ParagraphSlice(visible, remaining);
	}

}
