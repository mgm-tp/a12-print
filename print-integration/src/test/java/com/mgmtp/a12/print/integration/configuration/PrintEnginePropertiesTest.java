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
package com.mgmtp.a12.print.integration.configuration;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.util.List;
import java.util.TimeZone;

import static org.assertj.core.api.Assertions.assertThat;

class PrintEnginePropertiesTest {

	private final PrintEngineProperties underTest = new PrintEngineProperties();

	@Test
	void givenDefaults_whenIsPreCompilationEnabledForModel_thenEveryModelIsEnabled() {
		assertThat(underTest.isPreCompilationEnabledForModel("AnyPrintModelPM")).isTrue();
	}

	@Test
	void givenDefaults_whenGetTimezone_thenSystemDefaultIsUsed() {
		assertThat(underTest.getTimeZone()).isEqualTo(TimeZone.getTimeZone("UTC"));
	}

	@ParameterizedTest(name = "[{index}] {0} for allowlist [{1}] should be {2}")
	@CsvSource({
		"InvoicePM, InvoicePM, true",
		"InvoicePM, OrderPM, false",
		"InvoicePM, '*', true",
		"InvoicePM, OrderPM;InvoicePM, true",
	})
	void givenAllowlist_whenIsPreCompilationEnabledForModel_thenOnlyAllowlistedModelsAreEnabled(
		final String headerId,
		final String allowlist,
		final boolean expected
	) {
		underTest.setPreCompilingEnabledForModels(List.of(allowlist.split(";")));

		assertThat(underTest.isPreCompilationEnabledForModel(headerId)).isEqualTo(expected);
	}

	@Test
	void givenEmptyAllowlist_whenIsPreCompilationEnabledForModel_thenNoModelIsEnabled() {
		underTest.setPreCompilingEnabledForModels(List.of());

		assertThat(underTest.isPreCompilationEnabledForModel("InvoicePM")).isFalse();
	}
}
