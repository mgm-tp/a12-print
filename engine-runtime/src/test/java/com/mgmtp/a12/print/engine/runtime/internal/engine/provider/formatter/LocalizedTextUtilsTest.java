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
package com.mgmtp.a12.print.engine.runtime.internal.engine.provider.formatter;

import com.mgmtp.a12.kernel.md.model.a12internal.LocalizedTextMapBuilder;
import com.mgmtp.a12.kernel.md.model.api.ILocalizedTextMap;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Locale;

import static org.assertj.core.api.Assertions.assertThat;

class LocalizedTextUtilsTest {

	private static final Locale DE = Locale.of("de");
	private static final Locale EN = Locale.of("en");
	private static final Locale DE_DE = Locale.of("de", "DE");
	private static final Locale DE_AT = Locale.of("de", "AT");
	private static final Locale EN_US = Locale.of("en", "US");
	private static final Locale FR_FR = Locale.of("fr", "FR");

	private static ILocalizedTextMap textMap(Object... localeTextPairs) {
		final var builder = new LocalizedTextMapBuilder();
		for (int i = 0; i < localeTextPairs.length; i += 2) {
			builder.add((Locale) localeTextPairs[i], (String) localeTextPairs[i + 1]);
		}
		return builder.build();
	}

	@Test
	void getLocalizedTextPrefersExactLocaleOverLanguage() {
		final var texts = textMap(DE, "Deutsch", DE_AT, "Österreichisch");

		assertThat(LocalizedTextUtils.getLocalizedText(texts, DE_AT)).isEqualTo("Österreichisch");
	}

	@Test
	void getLocalizedTextFallsBackToLanguageWhenRegionIsMissing() {
		final var texts = textMap(DE, "Ja", EN, "Yes");

		assertThat(LocalizedTextUtils.getLocalizedText(texts, DE_DE)).isEqualTo("Ja");
		assertThat(LocalizedTextUtils.getLocalizedText(texts, EN_US)).isEqualTo("Yes");
	}

	@Test
	void getLocalizedTextReturnsNullWhenLanguageIsMissing() {
		final var texts = textMap(DE, "Ja", EN, "Yes");

		assertThat(LocalizedTextUtils.getLocalizedText(texts, FR_FR)).isNull();
	}

	@Test
	void resolveLocalePrefersExactLocaleOverLanguage() {
		assertThat(LocalizedTextUtils.resolveLocale(List.of(DE, DE_DE), DE_DE)).isEqualTo(DE_DE);
	}

	@Test
	void resolveLocaleFallsBackToLanguageWhenRegionIsMissing() {
		assertThat(LocalizedTextUtils.resolveLocale(List.of(EN, DE), DE_DE)).isEqualTo(DE);
	}

	@Test
	void resolveLocaleFallsBackToAvailableLocaleWhenLanguageIsMissing() {
		assertThat(LocalizedTextUtils.resolveLocale(List.of(DE), FR_FR)).isEqualTo(DE);
	}

	@Test
	void resolveLocaleReturnsRequestedLocaleWhenNoneAreAvailable() {
		assertThat(LocalizedTextUtils.resolveLocale(List.of(), DE_DE)).isEqualTo(DE_DE);
		assertThat(LocalizedTextUtils.resolveLocale(null, DE_DE)).isEqualTo(DE_DE);
	}
}
