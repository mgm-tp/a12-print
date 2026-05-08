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
package com.mgmtp.a12.print.engine.runtime.internal.engine.provider.html;

import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.internal.CoreDependencyFunction;
import org.jsoup.nodes.Element;

import java.util.stream.Collectors;


public class AddStylesToHtmlPdfDependencyValueProducer implements CoreDependencyFunction<Element, AddStylesToHtmlDependency> {
	@Override
	public Element apply(AddStylesToHtmlDependency dependency) {
		final Element htmlElement = dependency.getHtmlElement();
		final String initialStyles = htmlElement.attr("style");

		String newStyles = dependency.getNewStyle().entrySet()
			.stream()
			.map(entry -> {
				if (!dependency.isOverwrite() && initialStyles.contains(entry.getKey())) {
					throw new PrintException(String.format(
						"Attempting to overwrite existing style %s on %s. Is this intended?",
						entry.getKey(),
						initialStyles
					));
				}
				return String.format("%s: %s", entry.getKey(), entry.getValue());
			})
			.collect(Collectors.joining(";"));

		htmlElement.attr("style", String.format(
			"%s%s%s;",
			initialStyles,
			initialStyles.endsWith(";") || initialStyles.length() == 0 ? " " : "; ",
			newStyles
		));
		return htmlElement;
	}
}
