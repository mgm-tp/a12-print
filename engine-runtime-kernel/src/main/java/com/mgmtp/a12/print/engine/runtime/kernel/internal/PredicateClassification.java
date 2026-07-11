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
package com.mgmtp.a12.print.engine.runtime.kernel.internal;


import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.mgmtp.a12.print.engine.api.exception.impl.PrintCompilerException;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.SyntaxTreeElementType;
import lombok.AccessLevel;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Value;
import lombok.experimental.SuperBuilder;

import java.util.List;
import java.util.Map;

@Value
@NoArgsConstructor(force = true, access = AccessLevel.PROTECTED)
@SuperBuilder(toBuilder = true)
public class PredicateClassification {

	@JsonProperty(value = "predicates", required = true)
	Map<String, PredicateSignature> predicates;

	public enum PredicateType {
		NUMBER,
		DATE,
		DATE_TIME,
		BOOLEAN,
		STRING,
		TIME,
		UNKNOWN
	}

	public enum ParameterType {
		NUMBER,
		DATE,
		STRING,
		DATE_FRAGMENT,
		CUSTOM,
		TIME,
		DATE_TIME,
		BOOLEAN,
		DATE_RANGE,
		ENUMERATION,
		UNKNOWN
	}

	@Value
	@NoArgsConstructor(force = true, access = AccessLevel.PROTECTED)
	@SuperBuilder(toBuilder = true)
	public static class PredicateSignature {
		@JsonProperty(value = "type", required = true)
		List<PredicateType> type;
		@JsonProperty(value = "parameters")
		List<NamedParameter> parameters;
		@JsonProperty(value = "parameters$either")
		Map<String, ParameterEither> parametersEither;
		@JsonProperty(value = "inclusion")
		Inclusion inclusion;
		@JsonProperty(value = "consistence")
		Consistence consistence;
	}

	@Value
	@NoArgsConstructor(force = true, access = AccessLevel.PROTECTED)
	@SuperBuilder(toBuilder = true)
	public static class ParameterEither {
		@JsonProperty(value = "parameters")
		List<NamedParameter> parameters;
	}

	@Value
	@NoArgsConstructor(force = true, access = AccessLevel.PROTECTED)
	@SuperBuilder(toBuilder = true)
	public static class Parameter {
		@JsonProperty(value = "type")
		List<ParameterType> type;
		@JsonProperty(value = "accepts")
		List<SyntaxTreeElementType> accepts;
	}

	@Data
	@NoArgsConstructor(force = true, access = AccessLevel.PROTECTED)
	public static class NamedParameter {
		private String name;
		private Parameter parameter;

		@JsonAnySetter
		public void add(String key, Parameter parameter) {
			if (name != null || this.parameter != null) {
				throw new PrintCompilerException("The name or parameter is already set");
			}
			name = key;
			this.parameter = parameter;
		}

	}

	@Value
	@NoArgsConstructor(force = true, access = AccessLevel.PROTECTED)
	@SuperBuilder(toBuilder = true)
	public static class Inclusion {
		@JsonProperty(value = "left")
		List<NamedParameter> left;
		@JsonProperty(value = "right")
		List<NamedParameter> right;
	}

	@Value
	@NoArgsConstructor(force = true, access = AccessLevel.PROTECTED)
	@SuperBuilder(toBuilder = true)
	public static class Consistence {
		@JsonProperty(value = "left")
		List<NamedParameter> left;
		@JsonProperty(value = "right")
		List<NamedParameter> right;
	}
}
