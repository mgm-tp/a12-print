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
package com.mgmtp.a12.print.model.api.model.internal.dto.reference;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.mgmtp.a12.print.model.api.model.EnableGetterByFieldNameForInheritableSource;
import com.mgmtp.a12.print.model.api.model.RegisterGetterByFieldName;
import com.mgmtp.a12.print.model.api.model.element.base.Dimensions;
import com.mgmtp.a12.print.model.api.model.element.base.HideCondition;
import com.mgmtp.a12.print.model.api.model.element.base.Position;
import com.mgmtp.a12.print.model.api.model.element.base.ScreenReadingOrder;
import com.mgmtp.a12.print.model.api.model.element.base.Margins;
import com.mgmtp.a12.print.model.api.model.element.base.inputSource.InputSource;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.base.inputSource.PageBreakBehaviorInputSourceDto;
import com.mgmtp.a12.print.model.api.model.reference.PlaceableReference;
import com.mgmtp.a12.print.model.api.model.internal.dto.JsonModel;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.base.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Value
@SuperBuilder
@NoArgsConstructor(force = true, access = AccessLevel.PROTECTED)
@EqualsAndHashCode(callSuper = true)
@EnableGetterByFieldNameForInheritableSource
public class PlaceableReferenceDto extends ElementReferenceDto implements PlaceableReference, JsonModel {
	@JsonProperty(value = "position", required = true)
	@JsonDeserialize(as = PositionDto.class)
	Position position;

	@JsonProperty(value = "dimensions", required = true)
	@JsonDeserialize(as = MinimalDimensionsDto.class)
	Dimensions dimensions;

	@JsonProperty("hideConditions")
	@JsonDeserialize(contentAs = HideConditionDto.class)
	@Builder.Default
	List<HideCondition> hideConditions = new ArrayList<>();

	@JsonProperty(value = "screenReadingOrder", required = true)
	@JsonDeserialize(as = ScreenReadingOrderDto.class)
	ScreenReadingOrder screenReadingOrder;

	@JsonProperty(value = "margins")
	@JsonDeserialize(as = MarginsDto.class)
	Margins margins;

	public Optional<Margins> getMargins() {
		return Optional.ofNullable(margins);
	}

	@JsonProperty(value = "pageBreakBehavior", required = true)
	@JsonDeserialize(as = PageBreakBehaviorInputSourceDto.class)
	@RegisterGetterByFieldName
	InputSource<PageBreakBehavior> pageBreakBehavior;
}
