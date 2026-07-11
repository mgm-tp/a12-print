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
package com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.factories.text;

import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.runtime.internal.PdfBoxDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.text.TextValueDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.inputSource.ReferenceInputSourceResolver;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.textStyleResolver.TextStyleDependency;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalPdfBoxPrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.Component;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.SizeResolverUtils;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing.HtmlStyle;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing.TextRenderStyle;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.element.base.inputSource.StringInputSource;
import lombok.AllArgsConstructor;

import java.util.Optional;

@AllArgsConstructor
public class TextElementComponentDependencyValueProducer implements PdfBoxDependencyValueProvider<Component, TextElementComponentDependency> {
	@Override
	public ValueFactory<Component> produce(TextElementComponentDependency dependency, PrintJob job, PrintEngine<?> engine, InternalPdfBoxPrintEngineRuntime runtime) {
		final var textElement = dependency.getPrintModelElementTrace().getTracedElement();
		final var textValueMarkups = dependency.getTextValueMarkups();
		final var textValueResult = runtime.provide(new TextValueDependency(
			textElement,
			textValueMarkups
		)).get();

		final var referenceInputSourceResolver = ReferenceInputSourceResolver.builder()
			.runtime(runtime)
			.printModelTreeTrace(new PrintModelTreeTrace<>(dependency.getPrintModelElementTrace().getPath(), dependency.getPrintModelElementTrace().getTracedElement()))
			.build();

		final Optional<StringInputSource> textStyleId = SizeResolverUtils.getOptTextStyleId(dependency.getTextProperties());
		final var textStyle = runtime.provide(TextStyleDependency.create(
			textStyleId, referenceInputSourceResolver
		)).get();

		HtmlStyle htmlStyle = HtmlStyle.ofTextProperties(dependency.getTextProperties(), referenceInputSourceResolver);
		TextRenderStyle textRenderStyle = TextRenderStyle.EMPTY_STYLE.withTextStyle(textStyle);

		return runtime.provide(new TextComponentDependency(
			dependency.getPrintModelElementTrace(),
			textValueResult.orElse(null),
			htmlStyle,
			textRenderStyle,
			dependency.getBorderProperties(),
			dependency.getWidth(),
			true,
			dependency.getPdDocument()
		));
	}
}
