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
package com.mgmtp.a12.print.engine.runtime.internal.engine.rendering;

import org.owasp.html.AttributePolicy;
import org.owasp.html.CssSchema;
import org.owasp.html.HtmlPolicyBuilder;
import org.owasp.html.PolicyFactory;

import java.util.List;

public class HTMLCleanUpUtil {

	private final PolicyFactory policyFactory;

	public HTMLCleanUpUtil(final List<String> allowedHtmlTags, final List<String> allowedPropertyStyles) {
		final String[] allowedTags = allowedHtmlTags.toArray(String[]::new);
		final CssSchema allowedStyles = CssSchema.withProperties(allowedPropertyStyles);

		this.policyFactory = new HtmlPolicyBuilder()
			.allowElements(allowedTags)
			.allowAttributes("style", "class", "entity-id", "entity-type").onElements("span")
			.allowAttributes("style", "class").onElements("p")
			.allowAttributes("href", "target", "title", "name").onElements("a")
			.allowUrlProtocols("https", "http")
			.allowStyling(allowedStyles)
			.allowUrlsInStyles(AttributePolicy.REJECT_ALL_ATTRIBUTE_POLICY)
			.toFactory();
	}

	public String sanitize(final String html) {
		return policyFactory.sanitize(html);
	}
}
