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
import com.mgmtp.a12.print.typesetting.internal.model.TypesettingModel;
import com.mgmtp.a12.print.typesetting.internal.utils.TypesettingModelUtils;
import com.mgmtp.a12.print.typesetting.internal.validation.internal.utils.ResourceFile;
import org.junit.jupiter.api.Test;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.LongSummaryStatistics;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.fail;

class TypesettingApplierTest {

	public static final TypesettingModel customModel;
	static {
		final var content= ResourceFile.loadFileFromResources("/models/custom-typesetting-model.json");
		customModel = TypesettingModelUtils.deserializeModel(content);
	}

	private static final TypesettingApplier APPLIER_DE = new BaseTypesettingApplier(TextStyle.StaticHyphenator.DE_1996, customModel, null, null, null);
	private static final TypesettingApplier APPLIER_EN = new BaseTypesettingApplier(TextStyle.StaticHyphenator.EN_US, customModel, null, null, null);

	@Test
	void applyToWord() {
		assertEquals("Sa-che", APPLIER_DE.applyToWord("Sache"));
		assertEquals("Sil-ben-tren-nung", APPLIER_DE.applyToWord("Silbentrennung"));
		assertEquals("Um-welt", APPLIER_DE.applyToWord("Umwelt"));
		assertEquals("Recht-schrei-bungs-re-gel", APPLIER_DE.applyToWord("Rechtschreibungsregel"));
	}

	@Test
	void applyToText() {
		assertEquals("Sen-tences, with sym-bols: don't. Two classes'. Sec-ond sen-tence.", APPLIER_EN.applyToText("Sentences, with symbols: don't. Two classes'. Second sentence."));
		assertEquals("{start}l'i{end}n-ter-view", APPLIER_EN.applyToText("l'interview"));
	}

	@Test
	void applyToHtml() {
		assertEquals("Sen-tence. <body><p>Sen-tences, with <b>sym-bols</b>: don't.</p><p>Two classes'. Sec-ond sen-tence.</p></body> Sen-tence.", APPLIER_EN.applyToHtml("Sentence. <body><p>Sentences, with <b>symbols</b>: don't.</p><p>Two classes'. Second sentence.</p></body> Sentence."));

		// Line Break Prevent not working
		assertEquals("<span>s<em>y</em>mbols</span>", APPLIER_EN.applyToHtml("<span>s<em>y</em>mbols</span>"));
	}

	@Test
	void applyToExclusionWord() {
		assertEquals("as-so-ci-ate", APPLIER_EN.applyToWord("associate"));
		assertEquals("ob-lig-a-to-ry", APPLIER_EN.applyToWord("obligatory"));
		assertEquals("present", APPLIER_EN.applyToWord("present"));
		assertEquals("phil-an-throp-ic", APPLIER_EN.applyToWord("philanthropic"));

		assertEquals("e{start}m-pha-s{end}ized", APPLIER_EN.applyToWord("emphasized"));
		assertEquals("fol-l{start}{start}ow-ing{end}{end}", APPLIER_EN.applyToWord("following"));
	}

	@Test
	void applyToCustomExclusionWord() {
		assertEquals("tet-tttet", APPLIER_EN.applyToWord("tettttet"));
	}

	@Test
	void applyToWordList() {
		final var tsApplier = new BaseTypesettingApplier(TextStyle.StaticHyphenator.EN_US);

		try (BufferedReader br = new BufferedReader(
			new InputStreamReader(
				this.getClass().getResourceAsStream("/patterns/all-words-sorted-by-frequency.txt")))) {
			int correctHyphenationCount = 0;
			int lineCount = 0;

			LongSummaryStatistics statistics = new LongSummaryStatistics();

			String line;
			while ((line = br.readLine()) != null && !line.isEmpty()) {
				lineCount++;

				String inputWord = line.replace(";", "");
				String correctHyphenation = line.replace(";", "-");

				long start = System.nanoTime();
				String actualHyphenation = tsApplier.applyToWord(inputWord);
				long finish = System.nanoTime();
				long timeElapsed = finish - start;
				statistics.accept(timeElapsed);

				if (correctHyphenation.equals(actualHyphenation)) {
					correctHyphenationCount++;
				}
			}
			System.out.printf("Average: %s\nMin: %s\nMax: %s\nTotal for %s: %s\n", statistics.getAverage(), statistics.getMin(), statistics.getMax(), statistics.getCount(), statistics.getSum());
			System.out.printf("Correct: %s\n", correctHyphenationCount);

			double hyphenationSuccessPercentage = (correctHyphenationCount / (double) lineCount) * 100;
			if (hyphenationSuccessPercentage < 55) {
				fail("Hyphenation fail threshold is violated");
			}
		} catch (IOException e) {
			throw new RuntimeException(e);
		}
	}
}
