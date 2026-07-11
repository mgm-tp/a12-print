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
package com.mgmtp.a12.print.workspace.internal.fonts;

import com.mgmtp.a12.print.engine.api.PdfBoxPrintEngineConfig;
import com.mgmtp.a12.print.engine.api.constant.ConfigConstants;
import com.mgmtp.a12.print.workspace.internal.Workspace;
import com.mgmtp.a12.print.workspace.internal.elements.FileElementType;
import com.mgmtp.a12.print.workspace.internal.utils.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.StringUtils;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

import static com.mgmtp.a12.print.engine.api.PdfBoxPrintEngineConfig.DEFAULT_FONTS;

public class FontLoader {
	 private FontLoader() {}

	private static final String FONT_EXTENSION = "ttf";
	private static final Map<String, String> TRIMMED_DEFAULT_FONTS = DEFAULT_FONTS.keySet().stream()
		.map(s -> Map.entry(StringUtils.deleteWhitespace(s), s))
		.collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

	public static PdfBoxPrintEngineConfig loadFontConfig() {
		Map<String, String> availableFonts = new HashMap<>(DEFAULT_FONTS);

		Workspace.getInstance().getFileMap().get(FileElementType.UNKNOWN)
			.forEach(property -> {
				final var extension = FileUtils.getFileExtension(property.getPath());
				if (extension.equals(FONT_EXTENSION)) {
					final var fontFileName = FilenameUtils.getBaseName(property.getPath().toString());
					final var fontPath = ConfigConstants.FILEPATH_SUFFIX + property.getPath().toString();
					if (TRIMMED_DEFAULT_FONTS.containsKey(fontFileName)) {
						final var defaultKey = TRIMMED_DEFAULT_FONTS.get(fontFileName);
						availableFonts.put(defaultKey, fontPath);
					} else {
						availableFonts.put(fontFileName, fontPath);
					}
				}
			});

		return new PdfBoxPrintEngineConfig(availableFonts);
	}
}
