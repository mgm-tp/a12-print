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
package com.mgmtp.a12.print.model.api.model.internal.dto.element.type.table;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.mgmtp.a12.print.model.api.inputSource.InputValueSourceResolver;
import com.mgmtp.a12.print.model.api.model.element.base.inputSource.IntegerInputSource;
import com.mgmtp.a12.print.model.api.model.element.base.inputSource.StringInputSource;
import com.mgmtp.a12.print.model.api.model.element.properties.TextProperties;
import com.mgmtp.a12.print.model.api.model.element.type.table.TableProperties;
import com.mgmtp.a12.print.model.api.model.reference.TableColumnReference;
import com.mgmtp.a12.print.model.api.model.internal.dto.JsonModel;
import com.mgmtp.a12.print.model.api.model.internal.dto.PrintModelEntityDto;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.base.inputSource.IntegerInputSourceDto;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.base.inputSource.StringInputSourceDto;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.properties.TextPropertiesDto;
import com.mgmtp.a12.print.model.api.model.internal.dto.reference.TableColumnReferenceDto;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Value
@SuperBuilder
@NoArgsConstructor(force = true, access = AccessLevel.PROTECTED)
@EqualsAndHashCode(callSuper = true)
public class TablePropertiesDto extends PrintModelEntityDto implements TableProperties, JsonModel {
	@JsonProperty(value = "model", required = true)
	String model;

	@JsonProperty(value = "basePath", required = true)
	String basePath;

	@JsonProperty("maxRowCount")
	@JsonDeserialize(as = IntegerInputSourceDto.class)
	IntegerInputSource maxRowCount;

	@JsonProperty("filterExpression")
	String filterExpression;

	@JsonProperty("hideHeader")
	Boolean hideHeader;

	@JsonProperty(value = "sumLabel", required = true)
	@JsonDeserialize(as = StringInputSourceDto.class)
	StringInputSource sumLabel;

	@JsonProperty("columns")
	@JsonDeserialize(contentAs = TableColumnReferenceDto.class)
	@Builder.Default
	List<TableColumnReference> columns = new ArrayList<>();

	@JsonProperty("headerTextProperties")
	@JsonDeserialize(as = TextPropertiesDto.class)
	TextProperties headerTextProperties;

	@Override
	public Optional<Boolean> hideHeader() {
		return Optional.ofNullable(hideHeader);
	}
	@Override
	public Optional<String> getFilterExpression() {
		return Optional.ofNullable(filterExpression);
	}
	@Override
	public Optional<TextProperties> getHeaderTextProperties() {
		return Optional.ofNullable(headerTextProperties);
	}
}
