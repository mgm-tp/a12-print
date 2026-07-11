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
package com.mgmtp.a12.print.engine.runtime.internal.message;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.api.exception.impl.PrintDomainException;
import com.mgmtp.a12.print.engine.api.message.PrintMessage;
import com.mgmtp.a12.print.engine.api.message.PrintMessageReport;
import lombok.Value;
import org.jspecify.annotations.Nullable;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;
import java.util.function.Supplier;

@Value
public class PrintMessageReportImpl<T> implements PrintMessageReport<T> {
	@Nullable
	@JsonProperty
	T result;
	List<PrintMessage> messages;

	@Override
	@JsonIgnore
	public T getResult() {
		if (!noErrorOccurred()) {
			throw new PrintException("The report contains error message. Therefore no result is available.");
		}
		assert result != null;
		return result;
	}

	public static <T, E extends Exception> PrintMessageReport<T> wrapException(
		Supplier<PrintMessageReport<T>> supplier,
		Class<E> passthroughExceptionClass,
		Function<Exception, E> exceptionFactory
	) throws E {
		PrintMessageCollector.begin();
		try {
			return supplier.get();
		} catch (Exception e) {
			if (isCausedBy(e, PrintDomainException.class)) {
				final var finalMessages = new ArrayList<PrintMessage>(PrintMessageCollector.getMessages());
				finalMessages.add(PrintMessageCollector.getErrorMessage(e));
				return new PrintMessageReportImpl<>(null, finalMessages);
			}

			if (isCausedBy(e, passthroughExceptionClass)) {
				throw passthroughExceptionClass.cast(e);
			}
			throw exceptionFactory.apply(e);
		} finally {
			PrintMessageCollector.end();
		}
	}

	private static boolean isCausedBy(Throwable throwable, Class<? extends Throwable> type) {
		Throwable current = throwable;
		while (current != null) {
			if (type.isInstance(current)) {
				return true;
			}
			current = current.getCause();
		}
		return false;
	}
}
