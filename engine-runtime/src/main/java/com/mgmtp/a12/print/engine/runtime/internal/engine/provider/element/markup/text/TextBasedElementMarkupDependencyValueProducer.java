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
package com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.markup.text;

import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.internal.PdfDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.constant.Constants;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.text.TextDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.inputSource.ReferenceInputSourceResolver;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.MarkupResult;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.renderer.HtmlDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.rendering.CssUtil;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalPdfPrintEngineRuntime;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.element.PrintModelElement;
import com.mgmtp.a12.print.model.api.model.element.base.Styleable;

import lombok.NonNull;
import lombok.RequiredArgsConstructor;

import java.util.Optional;

@RequiredArgsConstructor
public class TextBasedElementMarkupDependencyValueProducer implements PdfDependencyValueProvider<MarkupResult, TextBasedElementMarkupDependency> {

	private static final String TEMPLATE = "element/text.ftlx";


	@NonNull
	private final CssUtil cssUtil;

	@Override
	public ValueFactory<MarkupResult> produce(TextBasedElementMarkupDependency dependency, PrintJob job, PrintEngine<?> engine, InternalPdfPrintEngineRuntime runtime) {

		final var printModelElementTrace = dependency.getPrintModelElementTrace();
		final var evaluatedValueOptional = dependency.getEvaluatedValue().get();
		final var evaluatedValue = evaluatedValueOptional.orElse("");

		final var isHtml = dependency.isHtml();
		final var printModelElement = printModelElementTrace.getTracedElement();
		final var elementReference
			= printModelElementTrace.findReferenceCallSite(PrintModelElement::getId);
		final var nestingType = elementReference.map(NestingType::fromReference).orElse(NestingType.NONE);
		final var isHidden = TextDependencyValueProducer.isHidden(printModelElementTrace, evaluatedValueOptional.isEmpty());
		final var isHiddenOption = Optional.of(isHidden).filter(e -> e);


		final var referenceValueSourceResolver = ReferenceInputSourceResolver.builder()
			.runtime(runtime)
			.printModelTreeTrace(new PrintModelTreeTrace<>(printModelElementTrace.getPath(), printModelElement))
			.build();

		final var html = isHiddenOption
			.map(f -> (ValueFactory<String>) () -> "")
			.orElseGet(() -> {
				final var textStyle = Optional.of(printModelElement)
											  .filter(e -> e instanceof Styleable)
											  .map(e -> runtime.provide(cssUtil.getTextStyleFromStyleable((Styleable) e, referenceValueSourceResolver)).get());

				return runtime.provide(new HtmlDependency(
					TEMPLATE,
					TextBasedElementHtmlTemplateParameters
						.builder()
						.element(printModelElement)
						.evaluatedValue(evaluatedValue)
						.isHtml(isHtml)
						.nestingType(nestingType)
						.elementReference(
							elementReference.map(PrintModelTreeTrace::getTracedElement)
								.orElseThrow(() -> new PrintException("Element is missing a Reference CallSite", dependency))
						)
						.textStyle(textStyle.orElse(Constants.DEFAULT_TEXT_STYLE))
						.referenceInputSourceResolver(referenceValueSourceResolver)
						.build()
				));
			});

		return () -> new MarkupResult(
			printModelElement.getId(),
			html.get(),
			evaluatedValueOptional.isEmpty(),
			isHidden,
			dependency.getPageNumberGlobalStyles()
		);
	}
}
