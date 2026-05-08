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
package com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.factories;

import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.runtime.internal.PdfBoxDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.chart.ChartValueDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.inputSource.ReferenceInputSourceResolver;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalPdfBoxPrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.Component;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.ImageComponent;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.base.PrintRenderingException;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.Size;
import com.mgmtp.a12.print.model.api.inputSource.InputValueSourceResolver;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;

import static com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.ImageComponentUtils.decodeToBytes;

public class ChartComponentDependencyValueProducer implements PdfBoxDependencyValueProvider<Component, ChartComponentDependency> {

	@Override
	public ValueFactory<Component> produce(ChartComponentDependency dependency, PrintJob job, PrintEngine<?> engine, InternalPdfBoxPrintEngineRuntime runtime) {
		final var path = dependency.getPath();
		final var chart = dependency.getChart();
		final var printDocumentContext = dependency.getPrintDocumentContext();

		final var chartTreeTrace = new PrintModelTreeTrace<>(path, chart);
		final var dimensions = chart.getChartProperties().getDimensions();
		final var chartValue = runtime.provide(new ChartValueDependency(chartTreeTrace, printDocumentContext));
		final var chartSrc = chartValue.get();
		final var srcUri =  chartSrc.orElseThrow(() ->
			new PrintRenderingException("The provided image could not be resolved")
		);

		final var referenceInputSourceResolver =  ReferenceInputSourceResolver.builder()
			.runtime(runtime)
			.printModelTreeTrace(new PrintModelTreeTrace<>(path, chart))
			.build();

		final var altText = InputValueSourceResolver.getInputValue(chart.getChartProperties().getTitle(), referenceInputSourceResolver)
			.map(title -> String.format(
				"%s: %s",
				chart.getType().name(),
				chart.getType().name())
			)
			.orElse(chart.getType().name());

		return () -> new ImageComponent(
			chart.getId(),
			decodeToBytes(srcUri),
			altText,
			Size.ofMm(dimensions.getWidth().getValue(), dimensions.getHeight().getValue())
		);
	}
}
