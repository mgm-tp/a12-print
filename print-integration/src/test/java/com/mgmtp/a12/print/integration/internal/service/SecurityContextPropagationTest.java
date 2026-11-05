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
package com.mgmtp.a12.print.integration.internal.service;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.function.Function;

import static org.assertj.core.api.Assertions.assertThat;

class SecurityContextPropagationTest {

	private static final Authentication REQUEST_USER = new TestingAuthenticationToken("request-user", null);
	private static final Authentication WORKER_USER = new TestingAuthenticationToken("worker-user", null);

	private final ExecutorService worker = Executors.newSingleThreadExecutor();

	@AfterEach
	void tearDown() {
		SecurityContextHolder.clearContext();
		worker.shutdownNow();
	}

	@Test
	void givenLoaderBoundOnRequestThread_whenAppliedOnThreadWithoutContext_thenRequestAuthenticationIsUsed() throws Exception {
		Function<String, Authentication> loader = boundLoaderOfRequestUser();

		assertThat(worker.submit(() -> loader.apply("id")).get()).isSameAs(REQUEST_USER);
	}

	@Test
	void givenThreadWithoutContext_whenLoaderIsDone_thenThreadHasNoAuthentication() throws Exception {
		Function<String, Authentication> loader = boundLoaderOfRequestUser();

		worker.submit(() -> loader.apply("id")).get();

		assertThat(worker.submit(() -> SecurityContextHolder.getContext().getAuthentication()).get()).isNull();
	}

	@Test
	void givenThreadWithOwnContext_whenLoaderIsDone_thenOwnAuthenticationIsRestored() throws Exception {
		Function<String, Authentication> loader = boundLoaderOfRequestUser();

		Authentication afterLoad = worker.submit(() -> {
			SecurityContextHolder.getContext().setAuthentication(WORKER_USER);
			loader.apply("id");
			return SecurityContextHolder.getContext().getAuthentication();
		}).get();

		assertThat(afterLoad).isSameAs(WORKER_USER);
	}

	private static Function<String, Authentication> boundLoaderOfRequestUser() {
		SecurityContextHolder.getContext().setAuthentication(REQUEST_USER);
		return SecurityContextPropagation.withCurrentSecurityContext(
			id -> SecurityContextHolder.getContext().getAuthentication()
		);
	}
}
