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
package com.mgmtp.a12.print.engine.runtime.internal.manager;

import com.mgmtp.a12.print.engine.api.*;
import com.mgmtp.a12.print.engine.api.exception.PrintJobConfigurationException;
import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.PrintModelCompilationContext;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NonNull;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Data
@Builder(toBuilder = true)
@AllArgsConstructor
public class ManagedPrintJob implements PrintJob {

	@NonNull
	private final PrintModelCompilationContext printModelCompilationContext;

	private Locale locale;

	private TimeZone timeZone;

	private JobRestriction restriction;

	@NonNull
	private final ConcurrentHashMap<JobDependencyProvider, JobDependencyProvider> dataProviderList = new ConcurrentHashMap<>();

	@Override
	public PrintModelId getPrintModelId() {
		return printModelCompilationContext.getId();
	}

	@Override
	public ManagedPrintJob withProvider(@NonNull JobDependencyProvider provider) throws PrintException {
		dataProviderList.computeIfAbsent(provider, k -> k);
		return this;
	}

	@Override
	public ManagedPrintJob withLocale(@NonNull Locale locale) {
		this.locale = locale;
		return this;
	}

	@Override
	public PrintJob withTimeZone(@NonNull TimeZone timeZone) {
		this.timeZone = timeZone;
		return this;
	}

	@Override
	public PrintJob withRestriction(@NonNull JobRestriction restriction) {
		if(this.restriction == null) {
			this.restriction = restriction;
		} else {
			final var currentRestriction = this.restriction;
			final var newRestriction = restriction;
			this.restriction = context -> {
				currentRestriction.restrict(context);
				newRestriction.restrict(context);
			};
		}
		return this;
	}

	@Override
	public @NonNull Locale getLocale() throws PrintJobConfigurationException {
		return Optional.ofNullable(locale).orElseThrow(() -> new PrintJobConfigurationException("Locale"));
	}
	@Override
	public @NonNull TimeZone getTimeZone() throws PrintJobConfigurationException {
		return Optional.ofNullable(timeZone).orElseThrow(() -> new PrintJobConfigurationException("TimeZone"));
	}
}
