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
package com.mgmtp.a12.print.engine.runtime.internal.engine.renderer.pdf;

import com.mgmtp.a12.print.engine.api.constant.ConfigConstants;
import com.mgmtp.a12.print.engine.api.exception.impl.FontLoadingException;
import com.mgmtp.a12.print.engine.api.exception.impl.FontNotFoundException;
import org.apache.commons.io.IOUtils;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.net.URI;
import java.util.Base64;

public class FontUtils extends ResourceUtils {

	public static byte[] getFontFile(final String path) {
		try {
			if (path.startsWith(ConfigConstants.CLASSPATH_SUFFIX)) {
				final String replacedPath = getClassPathPath(path);
				try (final InputStream inputStream = FontUtils.class.getResourceAsStream(replacedPath)) {
					if (inputStream == null) {
						throw new FontNotFoundException("The Font {} was not found.", path);
					}
					return IOUtils.toByteArray(inputStream);
				}
			}

			if (path.startsWith(ConfigConstants.FILEPATH_SUFFIX)) {
				final File file = new File(path.replace(ConfigConstants.FILEPATH_SUFFIX, ""));
				final URI uri = file.toURI();
				return IOUtils.toByteArray(uri);
			}

			if (path.startsWith(ConfigConstants.ATTACHMENT_SUFFIX)) {
				final String attachment = path.replace(ConfigConstants.ATTACHMENT_SUFFIX, "");
				return Base64.getDecoder().decode(attachment.substring(attachment.indexOf(',') + 1));
			}
		} catch (final MalformedURLException e) {
			/* silently catch malformed url exception since it will be covered by
			 * the FontLoadingException which is thrown next
			 */
		} catch (final IOException e) {
			throw new FontLoadingException("Error loading font {}.", path, e);
		}
		throw new FontLoadingException("{} is no valid filepath qualifier", path);
	}
}
