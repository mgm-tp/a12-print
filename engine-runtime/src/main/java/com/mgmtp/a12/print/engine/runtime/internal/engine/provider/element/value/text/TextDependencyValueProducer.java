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
package com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.text;

import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.runtime.internal.CoreDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.html.HtmlReplacementDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.html.SanitizeValueDependency;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalCorePrintEngineRuntime;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.element.PrintModelElement;
import com.mgmtp.a12.print.model.api.model.element.type.expression.Expression;
import com.mgmtp.a12.print.model.api.model.element.type.text.TextElement;
import com.mgmtp.a12.print.model.api.model.reference.ElementReference;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;


public class TextDependencyValueProducer implements CoreDependencyValueProvider<TextValueDependency.TextValueResult, TextValueDependency> {

	@Override
	public ValueFactory<TextValueDependency.TextValueResult> produce(TextValueDependency dependency, PrintJob job, PrintEngine<?> engine, InternalCorePrintEngineRuntime runtime) {

		final TextElement textElement = dependency.getText();
		final var textValueMarkups = dependency.getTextValueMarkups();
		final String html = textElement.getTextElementProperties().getText();
		final List<ElementReference> references = (List<ElementReference>) textElement.getReferences();

		Optional<String> resultHtml = Optional.empty();
		Map<String, String> pageNumberGlobalStyles = new HashMap<>();
		if (!references.isEmpty()) {
			boolean isVisible = true;
			if (textElement.getTextElementProperties().hideIfEmpty().orElse(false)) {
				isVisible = references.stream().anyMatch(ref ->
					textValueMarkups.stream().anyMatch(textValueMarkup ->
						textValueMarkup.getId().equals(ref.getRefId()) && !textValueMarkup.isEmpty()
					)
				);
			}

			if (isVisible) {
				final var replacementResult = runtime.provide(new HtmlReplacementDependency(textElement, html, textValueMarkups)).get();
				resultHtml = Optional.ofNullable(replacementResult.html());
				pageNumberGlobalStyles = replacementResult.pageNumberGlobalStyles();
			}
		} else {
			resultHtml = Optional.ofNullable(html);
		}
		resultHtml = resultHtml.map(s -> runtime.provide(new SanitizeValueDependency(s)).get());

		final var result = new TextValueDependency.TextValueResult(resultHtml, pageNumberGlobalStyles);
		return () -> result;
	}

	public static boolean isHidden(PrintModelTreeTrace<? extends PrintModelElement> elementTrace, boolean valueIsEmpty) {
		var element = elementTrace.getTracedElement();
		if (element instanceof TextElement textElement) {
			return textElement.getTextElementProperties().hideIfEmpty().orElse(false) && valueIsEmpty;
		} else if (element instanceof Expression expressionElement) {
			return expressionElement.getExpressionProperties().hideIfEmpty().orElse(false) && valueIsEmpty;
		}

		return false;
	}

}
