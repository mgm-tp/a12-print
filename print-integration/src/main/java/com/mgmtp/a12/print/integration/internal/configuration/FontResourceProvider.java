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
import lombok.Getter;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

import static com.mgmtp.a12.print.engine.api.PdfBoxPrintEngineConfig.DEFAULT_FONTS;

@Lazy
@Component
public class FontResourceProvider {
	private static final String FONT_EXTENSION = "ttf";
	private static final Map<String, String> TRIMMED_DEFAULT_FONTS = DEFAULT_FONTS.keySet().stream()
		.map(s -> Map.entry(StringUtils.deleteWhitespace(s), s))
		.collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

	@Getter
	private final Map<String, String> availableFonts;

	public FontResourceProvider(ResourceFileService resourceFileService) {
		Map<String, String> fontMap = new HashMap<>(DEFAULT_FONTS);
		resourceFileService.loadAllFonts().forEach(path -> {
			String absolutePath = path.toAbsolutePath().toString();
			String extension = FilenameUtils.getExtension(absolutePath);
			if (extension.equalsIgnoreCase(FONT_EXTENSION)) {
				String fontFileName = FilenameUtils.getBaseName(absolutePath);
				String fontPath = ConfigConstants.FILEPATH_SUFFIX + absolutePath;
				if (TRIMMED_DEFAULT_FONTS.containsKey(fontFileName)) {
					String defaultKey = TRIMMED_DEFAULT_FONTS.get(fontFileName);
					fontMap.put(defaultKey, fontPath);
				} else {
					fontMap.put(fontFileName, fontPath);
				}
			}
		});
		this.availableFonts = fontMap;
	}
}
