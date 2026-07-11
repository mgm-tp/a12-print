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
package com.mgmtp.a12.print.engine.runtime.internal.engine.provider.formatter;

import com.mgmtp.a12.print.engine.api.exception.impl.PrintCompilerException;

import java.io.IOException;
import java.io.StringWriter;
import java.io.Writer;

public class StringEscapeUtils {
	private StringEscapeUtils() {}

	public static String escapeXHTML(String input) {
		try {
			final var outputWriter = new StringWriter();
			escapeXHTML(input, outputWriter);
			return outputWriter.toString();
		} catch (IOException e) {
			throw new PrintCompilerException("The HTML could not be escaped", e);
		}
	}

	private static void escapeXHTML(String input, Writer out) throws IOException {
		int writtenEnd = 0;
		final int length = input.length();
		for (int i = 0; i < length; i++) {
			char character = input.charAt(i);
			if (character == '<' || character == '>' || character == '&' || character == '"' || character == '\'') {
				int flushLength = i - writtenEnd;
				if (flushLength != 0) {
					out.write(input, writtenEnd, flushLength);
				}
				writtenEnd = i + 1;

				switch (character) {
					case '<': out.write("&lt;"); break;
					case '>': out.write("&gt;"); break;
					case '&': out.write("&amp;"); break;
					case '"': out.write("&quot;"); break;
					default: out.write("&#39;"); break;
				}
			}
		}
		if (writtenEnd < length) {
			out.write(input, writtenEnd, length - writtenEnd);
		}
	}
}
