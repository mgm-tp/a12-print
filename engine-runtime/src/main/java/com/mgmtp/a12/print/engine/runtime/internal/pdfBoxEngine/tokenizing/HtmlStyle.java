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

import com.mgmtp.a12.print.model.api.inputSource.InputValueSourceResolver;
import com.mgmtp.a12.print.model.api.model.element.base.inputSource.PossibleInputSource;
import com.mgmtp.a12.print.model.api.model.element.properties.TextProperties;
import com.mgmtp.a12.print.model.api.model.element.type.listing.RowPropertyComputation;
import com.mgmtp.a12.print.model.api.model.element.type.listing.column.ColumnPropertyComputation;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Value;
import org.apache.commons.lang3.EnumUtils;

import java.util.Map;

@EqualsAndHashCode
@Builder(toBuilder = true)
@Value
public class HtmlStyle {
	public static final HtmlStyle EMPTY_STYLE = HtmlStyle.builder().build();

	@Builder.Default
	Integer color = null;
	@Builder.Default
	Integer backgroundColor = null;
	@Builder.Default
	TextProperties.Alignment alignment = null;
	@Builder.Default
	String attachmentId = null;
	@Builder.Default
	boolean bold = false;
	@Builder.Default
	boolean italic = false;
	@Builder.Default
	boolean underline = false;

	@Builder.Default
	boolean isDefaultColor = true;
	@Builder.Default
	boolean isDefaultUnderline = true;

	public static HtmlStyle ofTextProperties(final TextProperties properties, InputValueSourceResolver.ReferenceResolver referenceInputSourceResolver) {
		return  HtmlStyle.ofTextProperties(properties, referenceInputSourceResolver, false);
	}

	public static HtmlStyle ofTextProperties(final TextProperties properties, InputValueSourceResolver.ReferenceResolver referenceInputSourceResolver, boolean ignoreBackgroundColor) {
		if (properties == null) {
			return EMPTY_STYLE;
		}

		final var styleBuilder = HtmlStyle.builder();

		properties.getBold()
			.flatMap(bold -> com.mgmtp.a12.print.model.api.inputSource.InputValueSourceResolver.getInputValue(bold, referenceInputSourceResolver))
			.ifPresent(styleBuilder::bold);

		properties.getItalic()
			.flatMap(italic -> com.mgmtp.a12.print.model.api.inputSource.InputValueSourceResolver.getInputValue(italic, referenceInputSourceResolver))
			.ifPresent(styleBuilder::italic);

		properties.getUnderlined()
			.ifPresent(underlined -> {
			styleBuilder.isDefaultUnderline(PossibleInputSource.DEFAULT.equals(underlined.getSource()));
			InputValueSourceResolver.getInputValue(underlined, referenceInputSourceResolver)
				.ifPresent(styleBuilder::underline);
		});

		properties.getAlignment()
			.flatMap(alignment -> com.mgmtp.a12.print.model.api.inputSource.InputValueSourceResolver.getInputValue(alignment, TextProperties.Alignment::fromString, referenceInputSourceResolver))
			.ifPresent(styleBuilder::alignment);

		properties.getColor()
			.ifPresent(color -> {
				styleBuilder.isDefaultColor(PossibleInputSource.DEFAULT.equals(color.getSource()));
				InputValueSourceResolver.getInputValue(color, referenceInputSourceResolver)
					.ifPresent(c -> styleBuilder.color(HtmlAttributesUtils.parseColor(c)));
			});

		if (!ignoreBackgroundColor) {
			properties.getBackgroundColor()
				.flatMap(backgroundColor -> com.mgmtp.a12.print.model.api.inputSource.InputValueSourceResolver.getInputValue(backgroundColor, referenceInputSourceResolver))
				.ifPresent(backgroundColor -> styleBuilder.backgroundColor(HtmlAttributesUtils.parseColor(backgroundColor)));
		}

		return styleBuilder.build();
	}

	public HtmlStyle withComputedRowProperties(Map<RowPropertyComputation.PropertyType, Object> properties) {
		HtmlStyleBuilder styleBuilder = this.toBuilder();
		for(Map.Entry<RowPropertyComputation.PropertyType, Object> entry : properties.entrySet()) {
			applyComputedProperty(styleBuilder, entry.getKey(), entry.getValue());
		}
		return styleBuilder.build();
	}

	public HtmlStyle withComputedColumnProperties(Map<ColumnPropertyComputation.PropertyType, Object> properties) {
		HtmlStyleBuilder styleBuilder = this.toBuilder();
		for (Map.Entry<ColumnPropertyComputation.PropertyType, Object> entry : properties.entrySet()){
			if (EnumUtils.isValidEnum(RowPropertyComputation.PropertyType.class, entry.getKey().name())) {
				applyComputedProperty(styleBuilder, RowPropertyComputation.PropertyType.valueOf(entry.getKey().name()), entry.getValue());
			}
		}
		return styleBuilder.build();
	}

	private static void applyComputedProperty(HtmlStyleBuilder styleBuilder, RowPropertyComputation.PropertyType key, Object value) {
		switch (key) {
            case COLOR -> {
                styleBuilder.isDefaultColor(false);
                styleBuilder.color(HtmlAttributesUtils.parseColor(value.toString()));
            }
            case BACKGROUND_COLOR ->
				styleBuilder.backgroundColor(HtmlAttributesUtils.parseColor(value.toString()));
			case HORIZONTAL_ALIGNMENT ->
				styleBuilder.alignment((TextProperties.Alignment.fromString(value.toString().toUpperCase())));
			case BOLD ->
				styleBuilder.bold(checkObjectIsBooleanAndTrue(value));
			case ITALIC ->
				styleBuilder.italic(checkObjectIsBooleanAndTrue(value));
            case UNDERLINE -> {
                styleBuilder.isDefaultUnderline(false);
                styleBuilder.underline(checkObjectIsBooleanAndTrue(value));
            }
            default -> { }
		}
	}

	public HtmlStyle overrideWith(HtmlStyle other) {
		if (other == null) return this;
		var b = this.toBuilder();

		if (other.getColor() != null)
			b.color(other.getColor());
		if (other.getBackgroundColor() != null)
			b.backgroundColor(other.getBackgroundColor());
		if (other.getAlignment() != null)
			b.alignment(other.getAlignment());
		if (other.getAttachmentId() != null)
			b.attachmentId(other.getAttachmentId());
		if (other.isBold())
			b.bold(true);
		if (other.isItalic())
			b.italic(true);
		if (other.isUnderline())
			b.underline(true);

		return b.build();
	}

	public static boolean checkObjectIsBooleanAndTrue(Object object) {
		return object instanceof Boolean && (Boolean) object;
	}
}
