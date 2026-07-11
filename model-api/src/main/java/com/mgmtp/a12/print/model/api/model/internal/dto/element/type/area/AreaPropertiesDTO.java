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
package com.mgmtp.a12.print.model.api.model.internal.dto.element.type.area;

import com.fasterxml.jackson.annotation.JsonProperty;
import tools.jackson.databind.annotation.JsonDeserialize;
import com.mgmtp.a12.print.model.api.model.element.base.DataContext;
import com.mgmtp.a12.print.model.api.model.element.type.area.AreaProperties;
import com.mgmtp.a12.print.model.api.model.element.type.area.OverflowDimensions;
import com.mgmtp.a12.print.model.api.model.reference.PlaceableReference;
import com.mgmtp.a12.print.model.api.model.internal.dto.PrintModelEntityDto;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.base.DataContextDto;
import com.mgmtp.a12.print.model.api.model.internal.dto.reference.PlaceableReferenceDto;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Value
@SuperBuilder
@NoArgsConstructor(force = true, access = AccessLevel.PROTECTED)
@EqualsAndHashCode(callSuper = true)
public class AreaPropertiesDTO extends PrintModelEntityDto implements AreaProperties {
	@JsonProperty(value = "dimensions", required = true)
	@JsonDeserialize(as = OverflowDimensionsDto.class)
	OverflowDimensions dimensions;

	@JsonProperty(value = "elementReferences")
	@JsonDeserialize(contentAs = PlaceableReferenceDto.class)
	@Builder.Default
	List<PlaceableReference> elementReferences = new ArrayList<>();

	@JsonProperty(value = "dataContexts")
	@JsonDeserialize(contentAs = DataContextDto.class)
	@Builder.Default
	List<DataContext> dataContexts = new ArrayList<>();

	@JsonProperty(value = "maxRepetitions")
	Integer maxRepetitions;

	@Override
	public Optional<Integer> getMaxRepetitions() {
		return Optional.ofNullable(maxRepetitions);
	}
}
