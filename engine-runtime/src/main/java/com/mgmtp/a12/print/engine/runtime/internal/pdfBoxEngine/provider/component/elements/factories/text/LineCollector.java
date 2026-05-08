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
import lombok.NonNull;
import org.apache.pdfbox.pdmodel.font.PDFont;

import java.util.ArrayList;
import java.util.List;

public class LineCollector {
	private final long maxWidth;
	private final List<LineWrapperLine> lines;
	protected LineWrapperLine currentLine;
	private final TextWidthResolver resolver;
	private final PDFont font;
	private final PDFont fallbackFont;
	private final long fontSize;

	public LineCollector(
		final long maxWidth,
		@NonNull final TextWidthResolver resolver,
		@NonNull final PDFont font,
		@NonNull final PDFont fallbackFont,
		final long fontSize
	) {
		this.maxWidth = maxWidth;
		this.lines = new ArrayList<>();
		this.currentLine = new LineWrapperLine(maxWidth);
		this.resolver = resolver;
		this.font = font;
		this.fallbackFont = fallbackFont;
		this.fontSize = fontSize;
	}

	public List<List<InnerTextToken>>getLines() {
		return lines.stream().map(LineWrapperLine::getLine).toList();
	}

	public void addToCurrentLine(@NonNull final LineWrapperSubSequence subSequence) {
		currentLine.addSubsequence(subSequence);
	}

	public void addToCurrentLine(@NonNull final List<LineWrapperSubSequence> subSequences) {
		for (final var subSequence : subSequences) {
			currentLine.addSubsequence(subSequence);
		}
	}

	public void startNextLine() {
		currentLine.trimLastToken(resolver, font, fallbackFont, fontSize);
		lines.add(currentLine);
		currentLine = LineWrapperLine.emptyLine(maxWidth);
	}

	public void finish() {
		if (!currentLine.getLine().isEmpty()) {
			currentLine.trimLastToken(resolver, font, fallbackFont, fontSize);
			lines.add(currentLine);
		}
		currentLine = LineWrapperLine.emptyLine(maxWidth);
	}
}
