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

import com.mgmtp.a12.print.engine.api.PdfBoxPrintEngineConfig;
import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.runtime.internal.PdfBoxDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.loader.TypesettingModelDependency;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalPdfBoxPrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.Component;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.TextComponent;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.base.LineCountSettings;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.FontLoadException;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.FontLoaderDependency;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.Size;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.SizeResolverUtils;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing.TextRenderStyle;
import com.mgmtp.a12.print.model.api.model.textStyle.TextStyle;
import com.mgmtp.a12.print.typesetting.internal.model.TypesettingModel;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.font.PDFont;

import java.util.Optional;

@Slf4j
@AllArgsConstructor
public class TextComponentDependencyValueProducer implements PdfBoxDependencyValueProvider<Component, TextComponentDependency> {
	private final LineWrapper lineWrapper;

	@Override
	public ValueFactory<Component> produce(TextComponentDependency dependency, PrintJob job, PrintEngine<?> engine, InternalPdfBoxPrintEngineRuntime runtime) {
		final var isHtml = dependency.isHtml();
		final var document = dependency.getPdDocument();
		final var elementTrace = dependency.getPrintModelElementTrace();
		final var element = elementTrace.getTracedElement();
		final var borderProperties = dependency.getBorderProperties();
		final var optValue = Optional.ofNullable(dependency.getEvaluatedValue());

		if (optValue.isEmpty()) {
			return () -> null;
		}
		final TextStyle textStyle = dependency.getTextRenderStyle().getTextStyle();
		final var typesettingModelName = textStyle.getTypesettingModelName();
		final TypesettingModel typesettingModel = typesettingModelName.map(s -> runtime.provide(
			new TypesettingModelDependency(s)
		).get()).orElse(null);
		final TextStyle.StaticHyphenator staticHyphenator = textStyle.getStaticHyphenator().orElse(null);
		final LineWrapperTypeSetting lineWrapperTypeSetting = new LineWrapperTypeSetting(staticHyphenator, typesettingModel);
		final var lineCountSettings = LineCountSettings.ofTypesettingModel(typesettingModel);

		TextRenderStyle textRenderStyle = dependency.getTextRenderStyle().toBuilder().textStyle(textStyle).build();
		String fontKey = textRenderStyle.getFont();
		final var loadedFont = runtime.provide(new FontLoaderDependency(fontKey, document)).get();
		final var fallbackFont = runtime.provide(new FontLoaderDependency(PdfBoxPrintEngineConfig.DEFAULT_FONT_KEY, document)).get();

		if (fallbackFont == null) {
			throw new FontLoadException("The requested fallback font could not be loaded");
		}
		final PDFont font;
		if (loadedFont == null) {
			log.warn("The specified font '{}' could not be loaded. For this reason, the fallback font is being used.", fontKey);
			font = fallbackFont;
		} else {
			font = loadedFont;
		}

		final var initialWidth = dependency.getWidth();
		final var border = SizeResolverUtils.getBorderWidth(borderProperties);
		final long horizontalPadding = dependency.getTextRenderStyle().getHorizontalPadding();
		final var maxWidth = initialWidth - (border * 2) - horizontalPadding;

		final var paragraphList = lineWrapper.getLines(
			optValue.get(),
			maxWidth,
			font,
			fallbackFont,
			textRenderStyle.getFontSize(),
			dependency.getHtmlStyle(),
			lineWrapperTypeSetting,
			isHtml
		);
		final var lineHeights = paragraphList.totalLinesCount() * textRenderStyle.getLineHeight();
		final long verticalPadding = dependency.getTextRenderStyle().getVerticalPadding();
		final var height = lineHeights + border * 2 + verticalPadding;

		return () -> new TextComponent(
			element.getId(),
			dependency.getHtmlStyle(),
			textRenderStyle,
			lineCountSettings,
			new Size(initialWidth, height),
			paragraphList,
			font,
			fallbackFont,
			borderProperties
		);
	}
}
