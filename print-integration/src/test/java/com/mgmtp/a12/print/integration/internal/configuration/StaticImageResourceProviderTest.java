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

import com.mgmtp.a12.dataservices.common.exception.UnexpectedException;
import com.mgmtp.a12.dataservices.utils.ResourceFileService;
import com.mgmtp.a12.print.engine.api.exception.StaticImageNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StaticImageResourceProviderTest {

	private static final byte[] LOGO_CONTENT = {(byte) 0x89, 'P', 'N', 'G', 1, 2, 3};

	@TempDir
	private Path staticImagesRoot;

	@Mock
	private ResourceFileService resourceFileService;

	@Test
	void givenKnownFilename_whenLoadStaticImage_thenFileContentIsReturned() throws Exception {
		final var logo = writeImage("logo.png", LOGO_CONTENT);
		when(resourceFileService.loadAllStaticImages()).thenReturn(List.of(logo));

		assertThat(new StaticImageResourceProvider(resourceFileService).loadStaticImage("logo.png"))
			.isEqualTo(LOGO_CONTENT);
	}

	@Test
	void givenEmptyFile_whenLoadStaticImage_thenEmptyArrayIsReturned() throws Exception {
		final var empty = writeImage("empty.png", new byte[0]);
		when(resourceFileService.loadAllStaticImages()).thenReturn(List.of(empty));

		assertThat(new StaticImageResourceProvider(resourceFileService).loadStaticImage("empty.png")).isEmpty();
	}

	@Test
	void givenUnknownFilename_whenLoadStaticImage_thenStaticImageNotFoundExceptionIsThrown() throws Exception {
		when(resourceFileService.loadAllStaticImages()).thenReturn(List.of(writeImage("logo.png", LOGO_CONTENT)));
		final var underTest = new StaticImageResourceProvider(resourceFileService);

		assertThatThrownBy(() -> underTest.loadStaticImage("missing.png"))
			.isInstanceOf(StaticImageNotFoundException.class)
			.hasMessageContaining("missing.png")
			.extracting(e -> ((StaticImageNotFoundException) e).getInternalFilename())
			.isEqualTo("missing.png");
	}

	/**
	 * Only the plain file name is matched, so a model referencing a nested image by its relative
	 * path must not resolve.
	 */
	@Test
	void givenFilenameWithPathSegments_whenLoadStaticImage_thenStaticImageNotFoundExceptionIsThrown() throws Exception {
		final var nested = Files.createDirectory(staticImagesRoot.resolve("brand")).resolve("logo.png");
		Files.write(nested, LOGO_CONTENT);
		when(resourceFileService.loadAllStaticImages()).thenReturn(List.of(nested));
		final var underTest = new StaticImageResourceProvider(resourceFileService);

		assertThatThrownBy(() -> underTest.loadStaticImage("brand/logo.png"))
			.isInstanceOf(StaticImageNotFoundException.class);
	}

	/**
	 * The file list is captured once on the first lookup, so an image deleted afterwards is still
	 * reported as known but can no longer be read.
	 */
	@Test
	void givenKnownFileDeletedAfterConstruction_whenLoadStaticImage_thenUnexpectedExceptionIsThrown() throws Exception {
		final var logo = writeImage("logo.png", LOGO_CONTENT);
		when(resourceFileService.loadAllStaticImages()).thenReturn(List.of(logo));
		final var underTest = new StaticImageResourceProvider(resourceFileService);
		Files.delete(logo);

		assertThatThrownBy(() -> underTest.loadStaticImage("logo.png"))
			.isInstanceOf(UnexpectedException.class)
			.hasRootCauseInstanceOf(IOException.class);
	}

	@Test
	void givenSameFilenameInSeveralDirectories_whenLoadStaticImage_thenFirstMatchIsReturned() throws Exception {
		final var first = writeImage("logo.png", LOGO_CONTENT);
		final var second = Files.createDirectory(staticImagesRoot.resolve("other")).resolve("logo.png");
		Files.write(second, new byte[] {9, 9, 9});
		when(resourceFileService.loadAllStaticImages()).thenReturn(List.of(first, second));

		assertThat(new StaticImageResourceProvider(resourceFileService).loadStaticImage("logo.png"))
			.isEqualTo(LOGO_CONTENT);
	}

	@Test
	void givenProviderIsCreated_whenNoImageIsRequested_thenNoResourcesAreRead() {
		new StaticImageResourceProvider(resourceFileService);

		verifyNoInteractions(resourceFileService);
	}

	@Test
	void givenSeveralLookups_whenLoadStaticImage_thenResourcesAreReadOnlyOnce() throws Exception {
		final var logo = writeImage("logo.png", LOGO_CONTENT);
		when(resourceFileService.loadAllStaticImages()).thenReturn(List.of(logo));
		final var underTest = new StaticImageResourceProvider(resourceFileService);

		underTest.loadStaticImage("logo.png");
		underTest.loadStaticImage("logo.png");

		verify(resourceFileService, times(1)).loadAllStaticImages();
	}

	private Path writeImage(String fileName, byte[] content) throws IOException {
		return Files.write(staticImagesRoot.resolve(fileName), content);
	}
}
