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
package com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing;

import com.mgmtp.a12.print.engine.api.PrintEngineConfig;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.PDFUnitUtil;
import com.mgmtp.a12.print.model.api.model.element.type.listing.RowPropertyComputation;
import com.mgmtp.a12.print.model.api.model.element.type.listing.column.ColumnPropertyComputation;
import com.mgmtp.a12.print.model.api.model.element.type.tableLayout.ColumnProperties;
import com.mgmtp.a12.print.model.api.model.textStyle.TextStyle;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.Value;
import org.apache.commons.lang3.EnumUtils;

import java.util.Map;
import java.util.function.ToLongFunction;

import static com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.PDFUnitUtil.floatToLongPt;
import static org.apache.pdfbox.pdmodel.documentinterchange.taggedpdf.StandardStructureTypes.DIV;

@Builder(toBuilder = true)
@Value
public class TextRenderStyle {
	public static final TextRenderStyle EMPTY_STYLE = TextRenderStyle.builder().build();

	TextStyle textStyle;
	@Getter(AccessLevel.NONE)
	String font;
	@Getter(AccessLevel.NONE)
	Long fontSize;
	@Getter(AccessLevel.NONE)
	Long lineHeight;
	@Builder.Default
	ColumnProperties.VerticalAlignment verticalAlignment = ColumnProperties.VerticalAlignment.MIDDLE;
	@Builder.Default
	long paddingLeft = 0L;
	@Builder.Default
	long paddingRight = 0L;
	@Builder.Default
	long paddingTop = 0L;
	@Builder.Default
	long paddingBottom = 0L;

	public long getVerticalPadding() {
		return paddingTop + paddingBottom;
	}
	public long getHorizontalPadding() {
		return paddingLeft + paddingRight;
	}
	public long getLineHeight() {
		if (lineHeight != null) return lineHeight;
		if (textStyle != null) return floatToLongPt(textStyle.getLineHeight());
		return 1800;
	}
	public long getFontSize() {
		if (fontSize != null) return fontSize;
		if (textStyle != null) return floatToLongPt(textStyle.getFontSize());
		return 1200;
	}
	public String getFont() {
		if (font != null) return font;
		if (textStyle != null) return textStyle.getFont();
		return PrintEngineConfig.DEFAULT_FONT_KEY;
	}
	public String getWrappingStructType() {
		if (textStyle == null) {
			return DIV;
		}
		final var semantic = textStyle.getSemantic();
		if (semantic.equals(TextStyle.Semantic.P)) {
			return DIV;
		} else {
			return semantic.name();
		}
	}

	public TextRenderStyle withTextStyle(TextStyle textStyle) {
		if (textStyle == null) {
			return this;
		}
		return this.toBuilder().textStyle(textStyle).build();
	}

	public TextRenderStyle withVerticalAlignment(ColumnProperties.VerticalAlignment alignment) {
		if (alignment == null) {
			return this;
		}
		return this.toBuilder().verticalAlignment(alignment).build();
	}

	public TextRenderStyle withComputedRowProperties(Map<RowPropertyComputation.PropertyType, Object> properties) {
		if (properties.isEmpty()) return this;
		TextRenderStyleBuilder styleBuilder = this.toBuilder();
		for(Map.Entry<RowPropertyComputation.PropertyType, Object> entry : properties.entrySet()) {
			applyComputedProperty(styleBuilder, entry.getKey(), entry.getValue());
		}
		return styleBuilder.build();
	}

	public TextRenderStyle withComputedColumnProperties(Map<ColumnPropertyComputation.PropertyType, Object> properties) {
		if (properties.isEmpty()) return this;
		TextRenderStyleBuilder styleBuilder = this.toBuilder();
		for (Map.Entry<ColumnPropertyComputation.PropertyType, Object> entry : properties.entrySet()){
			if (EnumUtils.isValidEnum(RowPropertyComputation.PropertyType.class, entry.getKey().name())) {
				applyComputedProperty(styleBuilder, RowPropertyComputation.PropertyType.valueOf(entry.getKey().name()), entry.getValue());
			}
		}
		return styleBuilder.build();
	}

	private static void applyComputedProperty(TextRenderStyleBuilder styleBuilder, RowPropertyComputation.PropertyType key, Object value) {
		switch (key) {
			case FONT ->
				styleBuilder.font(value.toString());
			case FONT_SIZE ->
				styleBuilder.fontSize(parseFloat(value, PDFUnitUtil::floatToLongPt));
			case LINE_HEIGHT ->
				styleBuilder.lineHeight(parseFloat(value, PDFUnitUtil::floatToLongPt));
			case VERTICAL_ALIGNMENT ->
				styleBuilder.verticalAlignment((ColumnProperties.VerticalAlignment.fromString(value.toString().toUpperCase())));
			case PADDING_LEFT ->
				styleBuilder.paddingLeft(parseFloat(value, PDFUnitUtil::mmToLongPt));
			case PADDING_RIGHT ->
				styleBuilder.paddingRight(parseFloat(value, PDFUnitUtil::mmToLongPt));
			case PADDING_TOP ->
				styleBuilder.paddingTop(parseFloat(value, PDFUnitUtil::mmToLongPt));
			case PADDING_BOTTOM ->
				styleBuilder.paddingBottom(parseFloat(value, PDFUnitUtil::mmToLongPt));
			default -> { }
		}
	}

	private static long parseFloat(Object value, ToLongFunction<Float> converter) {
		if (value instanceof Number n) return converter.applyAsLong(n.floatValue());
		if (value instanceof String s) return converter.applyAsLong(Float.parseFloat(s.trim()));
		throw new IllegalArgumentException("Unsupported float type: " + value.getClass());
	}
}
