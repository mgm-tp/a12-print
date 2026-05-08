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
package com.mgmtp.a12.print.engine.runtime.internal.engine.provider.renderer;

import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.api.exception.impl.HtmlPrintException;
import com.mgmtp.a12.print.engine.runtime.internal.CoreDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.renderer.pdf.TemplateUtils;
import com.mgmtp.a12.print.engine.runtime.internal.engine.rendering.CssUtil;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalCorePrintEngineRuntime;
import freemarker.template.Configuration;
import freemarker.template.Template;
import freemarker.template.TemplateException;
import freemarker.template.TemplateExceptionHandler;
import lombok.NonNull;

import java.io.IOException;
import java.io.StringWriter;
import java.io.Writer;
import java.util.Locale;
import java.util.Map;


public class HtmlDependencyValueProducer implements CoreDependencyValueProvider<String, HtmlDependency> {

	private final Configuration freemarker;
	@NonNull
	private final CssUtil cssUtil;

	public HtmlDependencyValueProducer(@NonNull final String templateDirectory, @NonNull CssUtil cssUtil) {
		this.cssUtil = cssUtil;
		final Configuration cfg = new Configuration(Configuration.VERSION_2_3_31);
		TemplateUtils.setTemplateLoading(templateDirectory, cfg);
		cfg.setDefaultEncoding("UTF-8");
		cfg.setRecognizeStandardFileExtensions(true);
		cfg.setLocale(Locale.GERMAN);
		cfg.setNumberFormat("computer");
		cfg.setTemplateExceptionHandler(TemplateExceptionHandler.RETHROW_HANDLER);

		this.freemarker = cfg;
	}

	@Override
	public ValueFactory<String> produce(HtmlDependency dependency, PrintJob job, PrintEngine<?> engine, InternalCorePrintEngineRuntime runtime) {
		final String templateName = dependency.getTemplateName();
		try (final Writer writer = new StringWriter()) {
			final Template template = freemarker.getTemplate(templateName);
			template.process(
				Map.of(
					"context",  dependency.getInput(),
					"cssUtil", cssUtil
				),
				writer
			);
			final var html = writer.toString();
			return () -> html;
		} catch (final TemplateException | IOException e) {
			throw new HtmlPrintException("Couldn't generate html for template {}.", templateName, e);
		}
	}
}
