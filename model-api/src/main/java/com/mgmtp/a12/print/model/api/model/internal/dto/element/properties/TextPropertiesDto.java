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
package com.mgmtp.a12.print.model.api.model.internal.dto.element.properties;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.mgmtp.a12.print.model.api.model.RegisterGetterByFieldName;
import com.mgmtp.a12.print.model.api.model.EnableGetterByFieldNameForInheritableSource;
import com.mgmtp.a12.print.model.api.model.element.base.inputSource.BooleanInputSource;
import com.mgmtp.a12.print.model.api.model.element.base.inputSource.InputSource;
import com.mgmtp.a12.print.model.api.model.element.base.inputSource.StringInputSource;
import com.mgmtp.a12.print.model.api.model.element.properties.TextProperties;
import com.mgmtp.a12.print.model.api.model.internal.dto.JsonModel;
import com.mgmtp.a12.print.model.api.model.internal.dto.PrintModelEntityDto;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.base.inputSource.AlignmentInputSourceDto;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.base.inputSource.BooleanInputSourceDto;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.base.inputSource.StringInputSourceDto;
import lombok.AccessLevel;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.Value;
import lombok.experimental.SuperBuilder;

import java.util.Optional;

@Value
@SuperBuilder
@NoArgsConstructor(force = true, access = AccessLevel.PROTECTED)
@EqualsAndHashCode(callSuper = true)
@EnableGetterByFieldNameForInheritableSource
public class TextPropertiesDto extends PrintModelEntityDto implements TextProperties, JsonModel {
	@JsonProperty("textStyleId")
	@JsonDeserialize(as = StringInputSourceDto.class)
	@RegisterGetterByFieldName
	StringInputSource textStyleId;

	@JsonProperty(value = "color")
	@JsonDeserialize(as = StringInputSourceDto.class)
	@RegisterGetterByFieldName
	StringInputSource color;

	@JsonProperty(value = "backgroundColor")
	@JsonDeserialize(as = StringInputSourceDto.class)
	@RegisterGetterByFieldName
	StringInputSource backgroundColor;

	@JsonProperty(value = "alignment")
	@JsonDeserialize(as = AlignmentInputSourceDto.class)
	@RegisterGetterByFieldName
	InputSource<Alignment> alignment;

	@JsonProperty(value = "bold")
	@JsonDeserialize(as = BooleanInputSourceDto.class)
	@RegisterGetterByFieldName
	BooleanInputSource bold;

	@JsonProperty(value = "italic")
	@JsonDeserialize(as = BooleanInputSourceDto.class)
	@RegisterGetterByFieldName
	BooleanInputSource italic;

	@JsonProperty(value = "underlined")
	@JsonDeserialize(as = BooleanInputSourceDto.class)
	@RegisterGetterByFieldName
	BooleanInputSource underlined;

	@Override
	public Optional<StringInputSource> getTextStyleId() {
		return Optional.ofNullable(textStyleId);
	}

	@Override
	public Optional<StringInputSource> getColor() {
		return Optional.ofNullable(color);
	}

	@Override
	public Optional<StringInputSource> getBackgroundColor() {
		return Optional.ofNullable(backgroundColor);
	}

	@Override
	public Optional<InputSource<Alignment>> getAlignment() {
		return Optional.ofNullable(alignment);
	}

	@Override
	public Optional<BooleanInputSource> getBold() {
		return Optional.ofNullable(bold);
	}

	@Override
	public Optional<BooleanInputSource> getItalic() {
		return Optional.ofNullable(italic);
	}

	@Override
	public Optional<BooleanInputSource> getUnderlined() {
		return Optional.ofNullable(underlined);
	}
}
