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
package com.mgmtp.a12.print.model.api.model.element.type.listing;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.mgmtp.a12.model.utils.OnlyForUsage;
import com.mgmtp.a12.print.model.api.model.PrintModelEntity;
import com.mgmtp.a12.print.model.api.model.element.base.ComputationAlternative;
import com.mgmtp.a12.print.model.api.model.element.base.internal.LogicComponent;
import com.mgmtp.a12.print.model.api.model.element.base.internal.LogicContainer;

import java.util.List;
import java.util.stream.Stream;

@OnlyForUsage
public interface RowPropertyComputation extends PrintModelEntity, LogicContainer {
	PropertyType getProperty();

	List<ComputationAlternative> getComputationAlternatives();

	@Override
	default Stream<LogicComponent> logicComponents() {
		return getComputationAlternatives().stream().map(e -> e);
	}

	@OnlyForUsage
	enum PropertyType {
		@JsonProperty("Bold") BOLD,
		@JsonProperty("Italic") ITALIC,
		@JsonProperty("Underline") UNDERLINE,
		@JsonProperty("Font") FONT,
		@JsonProperty("FontSize") FONT_SIZE,
		@JsonProperty("PaddingTop") PADDING_TOP,
		@JsonProperty("PaddingBottom") PADDING_BOTTOM,
		@JsonProperty("PaddingLeft") PADDING_LEFT,
		@JsonProperty("PaddingRight") PADDING_RIGHT,
		@JsonProperty("LineHeight") LINE_HEIGHT,
		@JsonProperty("HorizontalAlignment") HORIZONTAL_ALIGNMENT,
		@JsonProperty("VerticalAlignment") VERTICAL_ALIGNMENT,
		@JsonProperty("Color") COLOR,
		@JsonProperty("BackgroundColor") BACKGROUND_COLOR,
		@JsonProperty("BorderStyle") BORDER_STYLE,
		@JsonProperty("BorderWidth") BORDER_WIDTH,
		@JsonProperty("BorderColor") BORDER_COLOR,
		@JsonProperty("IsHidden") IS_HIDDEN,
	}

}
