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
package com.mgmtp.a12.print.workspace.internal.printConfig;

import com.mgmtp.a12.print.engine.api.PrintEngineConfig;
import org.apache.commons.lang3.StringUtils;

import java.util.*;
import java.util.stream.Stream;

import static java.util.function.Predicate.not;

public class CustomPrintEngineConfigWrapper extends PrintEngineConfig {
	private final PrintEngineConfig fileConfig;


	public CustomPrintEngineConfigWrapper(
		final PrintEngineConfig fileConfig
	) {
		this.fileConfig = fileConfig;
	}

	private Optional<PrintEngineConfig> getFileConfig() {
		return Optional.ofNullable(fileConfig);
	}

	@Override
	public String getSegmentEntryTemplateName() {
		return getFileConfig()
			.map(PrintEngineConfig::getSegmentEntryTemplateName)
			.filter(not(StringUtils::isEmpty))
			.orElse(PrintEngineConfig.HTML_TEMPLATE_FILE);
	}

	@Override
	public String getTemplateDirectory() {
		return getFileConfig()
			.map(PrintEngineConfig::getTemplateDirectory)
			.filter(not(StringUtils::isEmpty))
			.orElse(PrintEngineConfig.TEMPLATE_DIR);
	}

	@Override
	public Map<String, String> getAvailableFonts() {
		final var resultFonts = new LinkedHashMap<String, String>();
		getFileConfig().map(PrintEngineConfig::getAvailableFonts).ifPresent(resultFonts::putAll);
		PrintEngineConfig.DEFAULT_FONTS.forEach(resultFonts::putIfAbsent);
		return resultFonts;
	}

	@Override
	public List<String> getAllowedHtmlTags() {
		return Stream
			.concat(
				getFileConfig()
					.map(PrintEngineConfig::getAllowedHtmlTags)
					.orElse(new ArrayList<>())
					.stream(),
				PrintEngineConfig.DEFAULT_ALLOWED_HTML_TAGS.stream()
			).distinct().toList();
	}

	@Override
	public List<String> getAllowedStyles() {
		return Stream
			.concat(
				getFileConfig()
					.map(PrintEngineConfig::getAllowedStyles)
					.orElse(new ArrayList<>())
					.stream(),
				PrintEngineConfig.DEFAULT_ALLOWED_STYLES.stream()
			).distinct().toList();
	}
}
