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
package com.mgmtp.a12.print.model.api.model.internal.dto.element.base;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.mgmtp.a12.print.model.api.model.element.base.DisplayOptions;
import com.mgmtp.a12.print.model.api.model.internal.dto.JsonModel;
import com.mgmtp.a12.print.model.api.model.internal.dto.PrintModelEntityDto;
import lombok.AccessLevel;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.Value;
import lombok.experimental.SuperBuilder;

import java.util.Optional;

@Value
@NoArgsConstructor(force = true, access = AccessLevel.PROTECTED)
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class DisplayOptionsDto extends PrintModelEntityDto implements DisplayOptions, JsonModel {
	@JsonProperty(value = "displayType", required = true)
	DisplayType displayType;
	@JsonProperty("dateFormat")
	String dateFormat;
	@JsonProperty("dateRangeFormatStart")
	String dateRangeFormatStart;
	@JsonProperty("dateRangeFormatEnd")
	String dateRangeFormatEnd;
	@JsonProperty("dateRangeDelimiter")
	String dateRangeDelimiter;
	@JsonProperty("checkboxChecked")
	String checkboxChecked;
	@JsonProperty("checkboxUnchecked")
	String checkboxUnchecked;
	@JsonProperty("suffix")
	String suffix;

	@Override
	public Optional<DisplayType> getDisplayType() {
		return Optional.ofNullable(displayType);
	}
	@Override
	public Optional<String> getDateFormat() {
		return Optional.ofNullable(dateFormat);
	}
	@Override
	public Optional<String> getDateRangeFormatStart() {
		return Optional.ofNullable(dateRangeFormatStart);
	}
	@Override
	public Optional<String> getDateRangeFormatEnd() {
		return Optional.ofNullable(dateRangeFormatEnd);
	}
	@Override
	public Optional<String> getDateRangeDelimiter() {
		return Optional.ofNullable(dateRangeDelimiter);
	}
	@Override
	public Optional<String> getCheckboxChecked() {
		return Optional.ofNullable(checkboxChecked);
	}
	@Override
	public Optional<String> getCheckboxUnchecked() {
		return Optional.ofNullable(checkboxUnchecked);
	}
	@Override
	@JsonIgnore
	public Optional<String> getSuffix() {
		if(suffix != null && suffix.startsWith("#") && suffix.endsWith("#")) {
			return Optional.of(suffix.substring(1, suffix.length() -1));
		}
		return Optional.ofNullable(suffix);
	}

	@Override
	@JsonIgnore
	public boolean isHtml() {
		return DisplayOptions.super.isHtml();
	}
}
