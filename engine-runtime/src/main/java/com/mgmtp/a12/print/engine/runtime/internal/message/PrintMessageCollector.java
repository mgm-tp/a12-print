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

import com.mgmtp.a12.print.engine.api.message.PrintMessage;
import lombok.NonNull;
import lombok.experimental.UtilityClass;
import org.jspecify.annotations.Nullable;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.List;

/**
 * Thread-local collector for print messages. Must be scoped via {@link #begin()} and {@link #end()}
 * on the thread that performs the print operation.
 */
@UtilityClass
public class PrintMessageCollector {

	private static final ThreadLocal<List<PrintMessage>> HOLDER = new ThreadLocal<>();

	public static void begin() {
		HOLDER.set(new ArrayList<>());
	}

	public static void addWarning(String description) {
		List<PrintMessage> messages = HOLDER.get();
		if (messages != null) {
			messages.add(new PrintWarningMessageImpl(description));
		}
	}

	public static void addError(@NonNull Throwable cause) {
		addError(cause.getMessage(), cause);
	}

	public static void addError(@NonNull String description, @Nullable Throwable cause) {
		List<PrintMessage> messages = HOLDER.get();
		if (messages != null) {
			messages.add(new PrintErrorMessageImpl(description, stackTraceOf(cause)));
		}
	}

	public static List<PrintMessage> getMessages() {
		List<PrintMessage> messages = HOLDER.get();
		return messages != null ? List.copyOf(messages) : List.of();
	}

	public static boolean hasNoErrors() {
		List<PrintMessage> messages = HOLDER.get();
		return messages == null || messages.stream().noneMatch(m -> m.getSeverity() == PrintMessage.Severity.ERROR);
	}

	public static void end() {
		HOLDER.remove();
	}

	public static PrintMessage getErrorMessage(Exception cause) {
		Throwable root = cause;
		while (root.getCause() != null) {
			root = root.getCause();
		}
		return new PrintErrorMessageImpl(root.getMessage(), stackTraceOf(cause));
	}

	@Nullable
	private static String stackTraceOf(@Nullable Throwable cause) {
		if (cause == null) {
			return null;
		}
		StringWriter sw = new StringWriter();
		cause.printStackTrace(new PrintWriter(sw));
		return sw.toString();
	}
}
