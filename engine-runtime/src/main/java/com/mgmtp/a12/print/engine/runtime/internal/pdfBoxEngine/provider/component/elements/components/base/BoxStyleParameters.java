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
package com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.base;

import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing.HtmlAttributesUtils;
import com.mgmtp.a12.print.model.api.inputSource.InputValueSourceResolver;
import com.mgmtp.a12.print.model.api.model.element.properties.BorderProperties;
import com.mgmtp.a12.print.model.api.model.element.properties.TextProperties;
import com.mgmtp.a12.print.model.api.model.element.type.listing.RowPropertyComputation;
import com.mgmtp.a12.print.model.api.model.element.type.listing.column.ColumnPropertyComputation;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import org.apache.commons.lang3.EnumUtils;

import java.util.Map;
import java.util.Optional;

import static com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.PDFUnitUtil.floatToLongPt;

@Builder
@Getter
@Setter
public class BoxStyleParameters {
	public static final BoxStyleParameters EMPTY_STYLE = BoxStyleParameters.builder().build();

	protected Integer backgroundColor;
	@Builder.Default
	protected Integer borderColor = HtmlAttributesUtils.parseColor("#000");
	@Builder.Default
	protected Long borderWidth = 100L;
	protected BorderProperties.BorderStyle borderStyle;
	@Builder.Default
	protected BorderPlacement borderPlacement = BorderPlacement.CENTERED;
	@Builder.Default
	protected BorderRenderMode borderRenderMode = BorderRenderMode.FULL;

	public enum BorderRenderMode { START, END, BETWEEN, FULL}

	public enum BorderPlacement {INSET, CENTERED}

	public boolean hasBackground() {
		return backgroundColor != null;
	}

	public boolean hasBorder() {
		return borderStyle != null;
	}

	public long getBorderWidth() {
		if (!hasBorder()) { return 0; }
		return borderWidth;
	}
	public long getBorderDrawOffset() {
		if (!hasBorder()) { return 0; }
		return borderPlacement == BorderPlacement.INSET ? borderWidth / 2 : 0;
	}
	public long getContentDrawOffset() {
		if (!hasBorder()) { return 0; }
		return borderPlacement == BorderPlacement.CENTERED ? borderWidth / 2 : borderWidth;
	}
	public long getContentSizeDifference() {
		if (!hasBorder()) { return 0; }
		return borderPlacement == BorderPlacement.CENTERED ? borderWidth : 2 * borderWidth;
	}

	public BoxStyleParameters setInset(boolean inset) {
		this.setBorderPlacement(inset ? BorderPlacement.INSET : BorderPlacement.CENTERED);
		return this;
	}

	public BoxStyleParameters copy() {
		return BoxStyleParameters.builder()
			.backgroundColor(this.backgroundColor)
			.borderColor(this.borderColor)
			.borderWidth(this.borderWidth)
			.borderStyle(this.borderStyle)
			.borderPlacement(this.borderPlacement)
			.build();
	}

	public void setComputedProperty(RowPropertyComputation.PropertyType key, Object value) {
		switch (key) {
			case BACKGROUND_COLOR:
				this.setBackgroundColor(HtmlAttributesUtils.parseColor(value.toString()));
				break;
			case BORDER_STYLE:
				this.setBorderStyle(BorderProperties.BorderStyle.fromString(value.toString().toUpperCase()));
				break;
			case BORDER_WIDTH:
				if (value instanceof Number) {
					this.setBorderWidth(floatToLongPt(((Number) value).floatValue()));
				}
				break;
			case BORDER_COLOR:
				this.setBorderColor(HtmlAttributesUtils.parseColor((value.toString())));
				break;
			default:
				break;
		}
	}

	public BoxStyleParameters setComputedRowProperties(Map<RowPropertyComputation.PropertyType, Object> properties) {
		for(Map.Entry<RowPropertyComputation.PropertyType, Object> entry : properties.entrySet()){
			this.setComputedProperty(entry.getKey(), entry.getValue());
		}
		return this;
	}

	public BoxStyleParameters setComputedColumnProperties(Map<ColumnPropertyComputation.PropertyType, Object> properties) {
		for (Map.Entry<ColumnPropertyComputation.PropertyType, Object> entry : properties.entrySet()) {
			if (EnumUtils.isValidEnum(RowPropertyComputation.PropertyType.class, entry.getKey().name())) {
				this.setComputedProperty(RowPropertyComputation.PropertyType.valueOf(entry.getKey().name()), entry.getValue());
			}
		}
		return this;
	}

	public static BoxStyleParametersBuilder fromBorderPropertiesBuilder(BorderProperties bp) {
		return fromPropertiesBuilder(bp, null);
	}

	public static BoxStyleParameters fromBorderProperties(BorderProperties bp) {
		return fromProperties(bp, null);
	}

	public static BoxStyleParameters fromTextProperties(TextProperties tp) {
		return fromProperties(null, tp);
	}

	public static BoxStyleParameters fromProperties(BorderProperties bp, TextProperties tp) {
		return fromPropertiesBuilder(bp, tp).build();
	}

	public static BoxStyleParametersBuilder fromPropertiesBuilder(BorderProperties bp, TextProperties tp) {
		BoxStyleParameters.BoxStyleParametersBuilder builder = BoxStyleParameters.builder();
		if (bp != null) {
			bp.getBorderWidth().ifPresent(borderWidth -> builder.borderWidth(floatToLongPt(borderWidth)));
			bp.getBorderColor().ifPresent(colorStr -> builder.borderColor(HtmlAttributesUtils.parseColor(colorStr)));
			bp.getBorderStyle().ifPresent(builder::borderStyle);
		}
		if (tp != null) {
			tp.getBackgroundColor()
				.flatMap(bg -> InputValueSourceResolver.getInputValue(bg, ref -> Optional.empty()))
				.ifPresent(colorStr -> builder.backgroundColor(HtmlAttributesUtils.parseColor(colorStr)));
		}
		return builder;
	}

	public BoxStyleParameters overrideFromProperties(BorderProperties bp, TextProperties tp) {
		if (bp != null) {
			bp.getBorderWidth().ifPresent(borderWidth -> this.setBorderWidth(floatToLongPt(borderWidth)));
			bp.getBorderColor().ifPresent(colorStr -> this.setBorderColor(HtmlAttributesUtils.parseColor(colorStr)));
			bp.getBorderStyle().ifPresent(this::setBorderStyle);
		}
		if (tp != null) {
			tp.getBackgroundColor()
				.flatMap(bg -> InputValueSourceResolver.getInputValue(bg, ref -> Optional.empty()))
				.ifPresent(colorStr -> this.setBackgroundColor(HtmlAttributesUtils.parseColor(colorStr)));
		}
		return this;
	}
}
