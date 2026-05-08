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
package com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components;

import com.mgmtp.a12.print.engine.api.exception.PrintException;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Base64;

public class ImageComponentUtils {
	public static double getImageAspectRatio(final byte[] imageBytes) {
		try (final var inputStream = ImageIO.createImageInputStream(new ByteArrayInputStream(imageBytes))) {
			final var readers = ImageIO.getImageReaders(inputStream);
			if (!readers.hasNext()) {
				throw new IllegalArgumentException("Image format not supported");
			}
			final var reader = readers.next();
			reader.setInput(inputStream);
			return getImageAspectRatio(reader);
		} catch (IOException e) {
			throw new PrintException(e);
		}
	}

	private static double getImageAspectRatio(ImageReader imageReader) {
		try {

			int width = imageReader.getWidth(0);
			int height = imageReader.getHeight(0);
			return (float) height / (float) width;
		} catch (IOException e) {
			throw new PrintException(e);
		} finally {
			imageReader.dispose();
		}
	}

	public static byte[] decodeToBytes(String base64String) {
		if (base64String.contains(",")) {
			base64String = base64String.substring(base64String.indexOf(",") + 1);
		}
		return Base64.getDecoder().decode(base64String);
	}

	public static long calcImageHeight(final long width, final double aspectRatio) {
		return (long) (width * aspectRatio);
	}
}
