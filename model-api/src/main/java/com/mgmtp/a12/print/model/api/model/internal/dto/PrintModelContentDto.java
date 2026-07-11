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
package com.mgmtp.a12.print.model.api.model.internal.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import tools.jackson.databind.annotation.JsonDeserialize;
import com.mgmtp.a12.print.model.api.model.PrintModelContent;
import com.mgmtp.a12.print.model.api.model.element.PrintModelElement;
import com.mgmtp.a12.print.model.api.model.general.General;
import com.mgmtp.a12.print.model.api.model.section.ModelSectionContainer;
import com.mgmtp.a12.print.model.api.model.segment.ModelSegmentContainer;
import com.mgmtp.a12.print.model.api.model.textStyle.TextStylesContainer;
import com.mgmtp.a12.print.model.api.model.watermark.WatermarkContainer;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.PrintModelElementDto;
import com.mgmtp.a12.print.model.api.model.internal.dto.general.GeneralDto;
import com.mgmtp.a12.print.model.api.model.internal.dto.section.ModelSectionContainerDTO;
import com.mgmtp.a12.print.model.api.model.internal.dto.segment.ModelSegmentContainerDTO;
import com.mgmtp.a12.print.model.api.model.internal.dto.textStyle.TextStylesContainerDto;
import com.mgmtp.a12.print.model.api.model.internal.dto.watermark.WatermarkContainerDto;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Value
@SuperBuilder
@NoArgsConstructor(force = true, access = AccessLevel.PROTECTED)
@EqualsAndHashCode(callSuper = true)
public class PrintModelContentDto extends PrintModelEntityDto implements PrintModelContent, JsonModel {
	@JsonProperty(value = "general", required = true)
	@JsonDeserialize(as = GeneralDto.class)
	General general;

	@JsonProperty(value = "segments")
	@JsonDeserialize(as = ModelSegmentContainerDTO.class)
	ModelSegmentContainer segments;

	@JsonProperty(value = "sections")
	@JsonDeserialize(as = ModelSectionContainerDTO.class)
	ModelSectionContainer sections;

	@JsonProperty(value = "watermarks")
	@JsonDeserialize(as = WatermarkContainerDto.class)
	WatermarkContainer watermarks;

	@JsonProperty("elementDefinitions")
	@JsonDeserialize(contentAs = PrintModelElementDto.class)
	@Builder.Default
	List<PrintModelElement> elementDefinitions = new ArrayList<>();

	@JsonProperty(value = "textStyles")
	@JsonDeserialize(as = TextStylesContainerDto.class)
	TextStylesContainer textStyles;

	@Override
	public Optional<TextStylesContainer> getTextStyles() {
		return Optional.ofNullable(textStyles);
	}

	@Override
	public Optional<ModelSectionContainer> getSections() {
		return Optional.ofNullable(sections);
	}

	@Override
	public Optional<WatermarkContainer> getWatermarks() {
		return Optional.ofNullable(watermarks);
	}
}

