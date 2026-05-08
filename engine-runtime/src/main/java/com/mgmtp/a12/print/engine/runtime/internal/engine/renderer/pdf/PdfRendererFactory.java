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

import com.mgmtp.a12.print.engine.api.PrintEngineConfig;
import com.mgmtp.a12.print.engine.api.constant.ConfigConstants;
import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.openhtmltopdf.extend.FSStream;
import com.openhtmltopdf.extend.FSStreamFactory;
import com.openhtmltopdf.outputdevice.helper.BaseRendererBuilder;
import com.openhtmltopdf.pdfboxout.PdfBoxRenderer;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.io.IOUtils;

import java.io.*;
import java.util.EnumSet;
import java.util.Map;
import java.util.Map.Entry;
import java.util.stream.Collectors;

@Slf4j
public class PdfRendererFactory {

	private final Map<String, byte[]> fonts;
	private final byte[] colorspace;

	public PdfRendererFactory(final Map<String, String> availableFonts) {
		final Map<String, byte[]> fileBinaryMap =
			availableFonts.values().stream().distinct().collect(Collectors.toMap(e -> e, FontUtils::getFontFile));
		fonts = availableFonts.entrySet().stream().collect(Collectors.toMap(Entry::getKey,
			e -> fileBinaryMap.get(e.getValue())));

		try (InputStream colorProfile = PdfRendererFactory.class.getResourceAsStream("/colorspaces/sRGB2014.icc")) {
			colorspace = colorProfile != null ? IOUtils.toByteArray(colorProfile) : null;
		} catch (IOException e) {
			throw new PrintException("There is a problem with the colorspace", e);
		}
	}

	public PdfBoxRenderer create(final String html) {
		return create(html, 0);
	}

	public PdfBoxRenderer create(final String html, final int initialPageNumber) {
		final PdfRendererBuilder builder = new PdfRendererBuilder();
		builder.useFastMode();
		builder.usePdfVersion(1.7f);

		builder.usePdfUaAccessbility(true); // required
		builder.usePdfAConformance(PdfRendererBuilder.PdfAConformance.PDFA_3_A); // required
		if (colorspace == null) {
			throw new PrintException("The colorspace is necessary for PDF/A-3 conformance");
		}
		builder.useColorProfile(colorspace);

		builder.useInitialPageNumber(initialPageNumber);

		builder.useProtocolsStreamImplementation(new ClasspathStreamFactory(), "classpath");
		builder.withHtmlContent(html, "");

		fonts.forEach((key, value) -> builder.useFont(() -> new ByteArrayInputStream(value), key));

		if (fonts.containsKey(PrintEngineConfig.DEFAULT_FONT_KEY)) {
			builder.useFont(
				() -> new ByteArrayInputStream(fonts.get(PrintEngineConfig.DEFAULT_FONT_KEY)),
				"default",
				400,
				BaseRendererBuilder.FontStyle.NORMAL,
				true,
				EnumSet.of(BaseRendererBuilder.FSFontUseCase.FALLBACK_PRE)
			);
		}

		return builder.buildPdfRenderer();
	}

	private static class ClasspathStreamFactory implements FSStreamFactory {

		@Override
		public FSStream getUrl(final String url) {
			return new ClasspathFSStream(url);
		}
	}

	private static class ClasspathFSStream implements FSStream {

		private final String url;

		private ClasspathFSStream(final String url) {
			this.url = url;
		}

		@Override
		public InputStream getStream() {
			return getClass().getResourceAsStream(url.substring(ConfigConstants.CLASSPATH_SUFFIX.length()));
		}

		@Override
		public Reader getReader() {
			return new InputStreamReader(getStream());
		}
	}
}
