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
package com.mgmtp.a12.print.integration.internal.configuration;

import com.mgmtp.a12.dataservices.utils.ResourceFileService;
import com.mgmtp.a12.print.engine.api.constant.ConfigConstants;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.nio.file.Path;
import java.util.List;

import static com.mgmtp.a12.print.engine.api.PdfBoxPrintEngineConfig.DEFAULT_FONTS;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FontResourceProviderTest {

	@Mock
	private ResourceFileService resourceFileService;

	@Test
	void givenNoExternalFonts_whenCreated_thenOnlyDefaultFontsAreAvailable() {
		when(resourceFileService.loadAllFonts()).thenReturn(List.of());

		assertThat(new FontResourceProvider(resourceFileService).getAvailableFonts())
			.containsExactlyInAnyOrderEntriesOf(DEFAULT_FONTS);
	}

	@Test
	void givenExternalFont_whenCreated_thenFontIsRegisteredUnderItsBaseNameWithFileUrl() {
		final var fontFile = Path.of("workspace", "fonts", "Roboto-Bold.ttf").toAbsolutePath();
		when(resourceFileService.loadAllFonts()).thenReturn(List.of(fontFile));

		final var availableFonts = new FontResourceProvider(resourceFileService).getAvailableFonts();

		assertThat(availableFonts)
			.containsAllEntriesOf(DEFAULT_FONTS)
			.containsEntry("Roboto-Bold", ConfigConstants.FILEPATH_SUFFIX + fontFile);
	}

	@ParameterizedTest
	@ValueSource(strings = {"Roboto-Bold.otf", "Roboto-Bold.woff2", "README.md", "Roboto-Bold"})
	void givenNonTtfResource_whenCreated_thenResourceIsIgnored(String fileName) {
		when(resourceFileService.loadAllFonts())
			.thenReturn(List.of(Path.of("workspace", "fonts", fileName).toAbsolutePath()));

		assertThat(new FontResourceProvider(resourceFileService).getAvailableFonts())
			.containsExactlyInAnyOrderEntriesOf(DEFAULT_FONTS);
	}

	/**
	 * A default font key such as {@code Noto Sans Mono} is matched against the whitespace-free file
	 * name {@code NotoSansMono.ttf}, so the classpath default is replaced instead of a second,
	 * near-duplicate entry being added.
	 */
	@Test
	void givenFontFileNamedLikeADefaultFont_whenCreated_thenDefaultFontIsOverridden() {
		final var fontFile = Path.of("workspace", "fonts", "NotoSansMono.ttf").toAbsolutePath();
		when(resourceFileService.loadAllFonts()).thenReturn(List.of(fontFile));

		final var availableFonts = new FontResourceProvider(resourceFileService).getAvailableFonts();

		assertThat(availableFonts)
			.hasSameSizeAs(DEFAULT_FONTS)
			.containsEntry("Noto Sans Mono", ConfigConstants.FILEPATH_SUFFIX + fontFile)
			.doesNotContainKey("NotoSansMono");
	}

	@Test
	void givenMultipleExternalFonts_whenCreated_thenAllOfThemAreAvailable() {
		final var roboto = Path.of("workspace", "fonts", "Roboto-Bold.ttf").toAbsolutePath();
		final var lato = Path.of("workspace", "fonts", "nested", "Lato-Regular.ttf").toAbsolutePath();
		when(resourceFileService.loadAllFonts()).thenReturn(List.of(roboto, lato));

		final var availableFonts = new FontResourceProvider(resourceFileService).getAvailableFonts();

		assertThat(availableFonts)
			.containsAllEntriesOf(DEFAULT_FONTS)
			.containsEntry("Roboto-Bold", ConfigConstants.FILEPATH_SUFFIX + roboto)
			.containsEntry("Lato-Regular", ConfigConstants.FILEPATH_SUFFIX + lato);
	}
}
