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
package utils;

import com.mgmtp.a12.print.model.api.utils.serialization.DeserializationTest;
import com.mgmtp.a12.print.model.api.utils.serialization.SerializationTest;
import org.apache.commons.io.IOUtils;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.Objects;

public class FileUtils {
	public static void writeFileContent(final String path, final String content)  {
		try(OutputStream outputStream = org.apache.commons.io.FileUtils.openOutputStream(
			new File(Objects.requireNonNull(SerializationTest.class.getResource(path)).getPath())
		)) {
			IOUtils.write(content, outputStream, StandardCharsets.UTF_8);
		} catch (IOException exception) {
			throw new RuntimeException(exception);
		}
	}

	public static String getFileContent(final String path)  {
		final Class<DeserializationTest> type = DeserializationTest.class;
		try (final InputStream inputStream = Objects.requireNonNull(type.getResourceAsStream(path))) {
			return IOUtils.toString(inputStream, StandardCharsets.UTF_8);
		} catch (final IOException e) {
			throw new UncheckedIOException(e);
		}
	}
}
