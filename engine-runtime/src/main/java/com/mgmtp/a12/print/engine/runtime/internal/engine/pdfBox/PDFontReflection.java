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
package com.mgmtp.a12.print.engine.runtime.internal.engine.pdfBox;

import com.mgmtp.a12.print.engine.api.exception.PrintException;
import org.apache.pdfbox.pdmodel.font.PDType0Font;

import java.lang.reflect.Field;
import java.util.Set;

public class PDFontReflection {
	private static final Field embedderField;
	private static final Field subsetCodePointsField;

	static {
		try {
			embedderField = PDType0Font.class.getDeclaredField("embedder");
			embedderField.setAccessible(true);

			final var classLoader = PDFontReflection.class.getClassLoader();
			final var embedderClass = classLoader.loadClass("org.apache.pdfbox.pdmodel.font.TrueTypeEmbedder");

			subsetCodePointsField = embedderClass.getDeclaredField("subsetCodePoints");
			subsetCodePointsField.setAccessible(true);
		} catch (NoSuchFieldException | ClassNotFoundException e) {
			throw new PrintException("The element cannot be found", e);
		}
	}

	private static Object getEmbedder(PDType0Font font) throws IllegalAccessException {
		return embedderField.get(font);
	}

	public static Set<Integer> getSubsetCodePoints(PDType0Font font) {
		try {
			final var embedder = getEmbedder(font);
			final var subsetCodePoints = subsetCodePointsField.get(embedder);

			if (subsetCodePoints instanceof Set) {
				return (Set<Integer>) subsetCodePoints;
			} else {
				throw new PrintException("The 'subsetCodePoints' field is not a Set");
			}
		} catch (IllegalAccessException e) {
			throw new PrintException("The field cannot be accessed", e);
		}
	}
}
