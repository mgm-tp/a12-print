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
package com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.factories.text;

import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing.InnerTextToken;
import lombok.NonNull;
import org.apache.pdfbox.pdmodel.font.PDFont;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

public class CachedTextWidthResolver extends BasicTextWidthResolver {

	public static final int CACHE_TEXT_LIMIT = 5;
	public final ConcurrentMap<TextWidthCacheKey, TextWidthResolverResult> cache = new ConcurrentHashMap<>();

	@Override
	public TextWidthResolverResult resolve(@NonNull final InnerTextToken innerTextToken, @NonNull final PDFont font, @NonNull final PDFont fallbackFont, final long fontSize) {
		if (innerTextToken.length() > CACHE_TEXT_LIMIT) {
			return super.resolve(innerTextToken, font, fallbackFont, fontSize);
		}

		final var cacheKey = new TextWidthCacheKey(innerTextToken.toString(), font, fontSize);
		if (cache.containsKey(cacheKey)) {
			return cache.get(cacheKey);
		}

		final var result = super.resolve(innerTextToken, font, fallbackFont, fontSize);
		cache.put(cacheKey, result);

		return result;
	}

	public record TextWidthCacheKey(String text, PDFont font, long fontSize) {}
}
