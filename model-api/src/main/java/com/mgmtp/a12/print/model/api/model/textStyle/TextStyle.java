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
package com.mgmtp.a12.print.model.api.model.textStyle;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.mgmtp.a12.print.model.api.model.PrintModelEntity;

import java.util.Optional;

public interface TextStyle extends PrintModelEntity {
	String getName();

	String getFont();

	Optional<String> getTypesettingModelName();

	float getFontSize();

	float getLineHeight();

	Semantic getSemantic();

	enum Semantic {
		@JsonProperty("P") P,
		@JsonProperty("H1") H1,
		@JsonProperty("H2") H2,
		@JsonProperty("H3") H3,
		@JsonProperty("H4") H4,
		@JsonProperty("H5") H5,
		@JsonProperty("H6") H6
	}

	Optional<StaticHyphenator> getStaticHyphenator();

	enum StaticHyphenator {
		@JsonProperty("en_US") EN_US,
		@JsonProperty("de_1996") DE_1996,
		@JsonProperty("fr") FR,
		@JsonProperty("cs") CS,
		@JsonProperty("pt") PT,
		@JsonProperty("vi") VI
	}
}
