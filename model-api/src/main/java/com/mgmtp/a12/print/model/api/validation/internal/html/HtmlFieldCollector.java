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
package com.mgmtp.a12.print.model.api.validation.internal.html;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.mgmtp.a12.print.model.api.validation.IPrintModelIntegrityMessage;

import java.util.ArrayList;
import java.util.List;

/**
 * Walks the {@code content.elementDefinitions} of a raw print model JSON, runs HTML validation
 * on every {@code Text} element's {@code text.text} field, and returns the collected messages.
 */
public class HtmlFieldCollector {

	private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
	private static final HtmlValidator HTML_VALIDATOR = new HtmlValidator();

	public static List<IPrintModelIntegrityMessage> collect(String rawPrintModel) {
		List<IPrintModelIntegrityMessage> messages = new ArrayList<>();
		try {
			JsonNode root = OBJECT_MAPPER.readTree(rawPrintModel);
			JsonNode elementDefinitions = root.path("content").path("elementDefinitions");
			if (!elementDefinitions.isArray()) {
				return messages;
			}
			for (int i = 0; i < elementDefinitions.size(); i++) {
				JsonNode element = elementDefinitions.get(i);
				if (!"Text".equals(element.path("type").textValue())) {
					continue;
				}
				String html = element.path("text").path("text").textValue();
				if (html == null || html.isBlank()) {
					continue;
				}
				HtmlValidationResult result = HTML_VALIDATOR.validate(html);
				for (HtmlValidationIssue issue : result.getIssues()) {
					String text = "content.elementDefinitions[" + i + "]: " + issue.message();
					messages.add(new HtmlIntegrityMessage(text, issue.severity()));
				}
			}
		} catch (Exception e) {
			// Malformed JSON is already reported by the kernel validation
		}
		return messages;
	}
}
