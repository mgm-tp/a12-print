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

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mgmtp.a12.print.engine.api.PrintEngineConfig;
import com.mgmtp.a12.print.setting.internal.model.Font;
import com.mgmtp.a12.print.setting.internal.model.FontSettingType;
import com.mgmtp.a12.print.setting.internal.model.impl.SettingModelDto;
import com.mgmtp.a12.print.engine.api.constant.ConfigConstants;

import lombok.extern.slf4j.Slf4j;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
public class ConfigUtils {

	public static Optional<PrintEngineConfig> parseConfigContent(String content) {
		ObjectMapper mapper = new ObjectMapper();
		try {
			SettingModelDto settingModel = mapper.readValue(content, SettingModelDto.class);
			List<Font> fonts = settingModel.getContent().getSettings().getFonts();
			Map<String, String> availableFonts = new HashMap<>();
			fonts.forEach(font -> {
				String fontKey = font.isFallback() ? PrintEngineConfig.DEFAULT_FONT_KEY : font.getName();
				if (font.getType().equals(FontSettingType.ATTACHMENT)) {
					font.getFontAttachment().ifPresent(e -> {
						availableFonts.put(fontKey, ConfigConstants.ATTACHMENT_SUFFIX + e.getContent());
					});
				}

				if (font.getType().equals(FontSettingType.PATH)) {
					font.getPath().ifPresent(e -> {
						availableFonts.put(fontKey, ConfigConstants.FILEPATH_SUFFIX + e);
					});
				}
			});

			return Optional.ofNullable(PrintEngineConfig.builder().availableFonts(availableFonts).build());
		} catch (JsonProcessingException e) {
			log.warn("Error on setting parsing", e);
			return Optional.empty();
		}
	}
}
