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
package com.mgmtp.a12.print.engine.runtime.internal;

import com.openhtmltopdf.util.Diagnostic;
import com.openhtmltopdf.util.XRLogger;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.logging.Level;

import static java.util.logging.Level.ALL;
import static java.util.logging.Level.CONFIG;
import static java.util.logging.Level.FINE;
import static java.util.logging.Level.FINER;
import static java.util.logging.Level.FINEST;
import static java.util.logging.Level.INFO;
import static java.util.logging.Level.OFF;
import static java.util.logging.Level.SEVERE;
import static java.util.logging.Level.WARNING;

public class CustomXRLogger implements XRLogger {
	private static final Logger PRINT_LOGGER = LoggerFactory.getLogger("com.mgmtp.a12.print");
	private static final List<Level> DEBUG_LEVELS = List.of(OFF, SEVERE, WARNING, INFO, CONFIG);
	private static final List<Level> TRACE_LEVELS = List.of(FINE, FINER, FINEST, ALL);
	private static final String PREFIX = "[openHtmlToPdf] %s";

	@Override
	public void log(Diagnostic diagnostic) {
		String msg = diagnostic.getLogMessageId().getMessageFormat();
		String format = String.format(PREFIX, msg);
		Level level = diagnostic.getLevel();
		Object[] args = diagnostic.getArgs();
		if (DEBUG_LEVELS.contains(level)) {
			PRINT_LOGGER.debug(format, args);
		} else {
			PRINT_LOGGER.trace(format, args);
		}
	}

	@Override
	public void log(String where, Level level, String msg) {
		String message = String.format(PREFIX, msg);
		if (DEBUG_LEVELS.contains(level)) {
			PRINT_LOGGER.debug(message);
		} else {
			PRINT_LOGGER.trace(message);
		}
	}

	@Override
	public void log(String where, Level level, String msg, Throwable th) {
		String message = String.format(PREFIX, msg);
		if (DEBUG_LEVELS.contains(level)) {
			PRINT_LOGGER.debug(message, th);
		} else {
			PRINT_LOGGER.trace(message, th);
		}
	}

	@Override
	public void setLevel(String logger, Level level) {
		throw new UnsupportedOperationException("log4j should be not be configured here");
	}

	@Override
	public boolean isLogLevelEnabled(Diagnostic diagnostic) {
		Level level = diagnostic.getLevel();
		if (DEBUG_LEVELS.contains(level)) {
			return PRINT_LOGGER.isDebugEnabled();
		} else if (TRACE_LEVELS.contains(level)) {
			return PRINT_LOGGER.isTraceEnabled();
		}
		return true;
	}
}
