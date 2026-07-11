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

import com.drew.imaging.ImageMetadataReader;
import com.drew.metadata.exif.ExifIFD0Directory;
import com.mgmtp.a12.print.engine.api.exception.impl.PrintDomainException;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Base64;

import static com.drew.metadata.exif.ExifDirectoryBase.TAG_ORIENTATION;

public class ImageComponentUtils {
	public static double getImageAspectRatio(final byte[] imageBytes) {
		try (final var inputStream = ImageIO.createImageInputStream(new ByteArrayInputStream(imageBytes))) {
			final var readers = ImageIO.getImageReaders(inputStream);
			if (!readers.hasNext()) {
				throw new PrintDomainException("Image format not supported");
			}
			final var reader = readers.next();
			reader.setInput(inputStream);
			return getImageAspectRatio(reader, imageBytes);
		} catch (IOException e) {
			throw new PrintDomainException("The image could not be loaded", e);
		}
	}

	private static double getImageAspectRatio(ImageReader imageReader, final byte[] imageBytes) {
		try {
			int width = imageReader.getWidth(0);
			int height = imageReader.getHeight(0);
			final int orientation = readExifOrientation(imageBytes);

			if (orientation >= 5 && orientation <= 8) {
				return (float) width / (float) height;
			}
			return (float) height / (float) width;
		} catch (IOException e) {
			throw new PrintDomainException("The width or height could not be read", e);
		} finally {
			imageReader.dispose();
		}
	}

	public static int readExifOrientation(final byte[] imageBytes) {
		try {
			final var metadata = ImageMetadataReader.readMetadata(new ByteArrayInputStream(imageBytes));
			final var exif = metadata.getFirstDirectoryOfType(ExifIFD0Directory.class);
			if (exif != null && exif.containsTag(TAG_ORIENTATION)) {
				return exif.getInt(TAG_ORIENTATION);
			}
		} catch (Exception ignored) {
			// The default rotation is used in this case
		}
		return 1;
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
