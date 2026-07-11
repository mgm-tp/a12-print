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

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import tools.jackson.databind.annotation.JsonDeserialize;
import com.mgmtp.a12.print.model.api.model.element.properties.BorderProperties;
import com.mgmtp.a12.print.model.api.model.element.type.area.Area;
import com.mgmtp.a12.print.model.api.model.element.type.area.AreaProperties;
import com.mgmtp.a12.print.model.api.model.reference.PlaceableReference;
import com.mgmtp.a12.print.model.api.model.internal.dto.JsonModel;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.PrintModelElementDto;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.properties.BorderPropertiesDto;
import lombok.AccessLevel;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.Value;
import lombok.experimental.SuperBuilder;

import java.util.List;
import java.util.Optional;

@Value
@SuperBuilder
@NoArgsConstructor(force = true, access = AccessLevel.PROTECTED)
@EqualsAndHashCode(callSuper = true)
public class AreaDTO extends PrintModelElementDto implements Area, JsonModel {
	@JsonProperty(value = "area", required = true)
	@JsonDeserialize(as = AreaPropertiesDTO.class)
	AreaProperties areaProperties;

	@JsonProperty(value = "borderProperties")
	@JsonDeserialize(as = BorderPropertiesDto.class)
	BorderProperties borderProperties;

	@Override
	public Optional<BorderProperties> getBorderProperties() {
		return Optional.ofNullable(borderProperties);
	}

	@Override
	@JsonIgnore
	public List<PlaceableReference> getReferences() {
		return Area.super.getReferences();
	}
}
