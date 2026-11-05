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
import com.mgmtp.a12.print.engine.api.StaticImageProvider;
import com.mgmtp.a12.print.engine.api.exception.StaticImageNotFoundException;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class StaticImageResourceProvider implements StaticImageProvider {

	private final ResourceFileService resourceFileService;

	@Getter(value = AccessLevel.PRIVATE, lazy = true)
	private final Map<String, Path> staticImagePaths = indexByFileName();

	@Override
	public byte[] loadStaticImage(String internalFilename) throws StaticImageNotFoundException {
		Path currentFilePath = getStaticImagePaths().get(internalFilename);
		if (currentFilePath == null) {
			throw new StaticImageNotFoundException(internalFilename);
		}
		try (InputStream is = new FileInputStream(currentFilePath.toAbsolutePath().toString())) {
			return is.readAllBytes();
		} catch (IOException e) {
			throw new UnexpectedException(e);
		}
	}

	private Map<String, Path> indexByFileName() {
		assert resourceFileService != null;

		Map<String, Path> index = new LinkedHashMap<>();
		resourceFileService.loadAllStaticImages()
			.forEach(path -> index.putIfAbsent(path.getFileName().toString(), path));
		return index;
	}
}
