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
package com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.chart;

import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.runtime.internal.CoreDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.PrintDocumentContext;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.inputSource.ReferenceInputSourceResolver;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalCorePrintEngineRuntime;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.element.type.chart.Chart;
import com.mgmtp.a12.print.model.api.model.element.type.chart.MultipleSeriesProperties;
import com.mgmtp.a12.print.model.api.model.element.type.chart.barChart.BarChart;
import com.mgmtp.a12.print.model.api.model.element.type.chart.lineChart.LineChart;
import com.mgmtp.a12.print.model.api.model.element.type.chart.pieChart.PieChart;
import com.mgmtp.a12.print.model.api.model.element.type.chart.pieChart.PieChartProperties;

import java.util.Optional;


public class ChartDependencyValueProducer implements CoreDependencyValueProvider<Optional<String>, ChartValueDependency> {

	@Override
	public ValueFactory<Optional<String>> produce(ChartValueDependency dependency, PrintJob job, PrintEngine<?> engine, InternalCorePrintEngineRuntime runtime) {
		final Chart chartElement = dependency.getChartElement().getTracedElement();

		final PrintDocumentContext printDocumentContext = dependency.getPrintDocumentContext();

		final var referenceInputSourceResolver =  ReferenceInputSourceResolver.builder()
			.runtime(runtime)
			.printModelTreeTrace(new PrintModelTreeTrace<>(dependency.getChartElement().getPath(), chartElement))
			.build();

		String svg = null;
		if (chartElement instanceof PieChart) {
			final PieChartProperties pieChartProperties = (PieChartProperties) chartElement.getChartProperties();
			svg = ChartGeneratorUtils.generatePieChart(pieChartProperties, printDocumentContext, job, engine.getConfig(), referenceInputSourceResolver);
		} else if (
			chartElement instanceof BarChart ||
				chartElement instanceof LineChart
		) {
			MultipleSeriesProperties chartProperties = (MultipleSeriesProperties) chartElement.getChartProperties();
			svg = ChartGeneratorUtils.generateMultipleSeriesChart(chartProperties, printDocumentContext, job, engine.getConfig(), referenceInputSourceResolver);
		}
		final var result = Optional.ofNullable(
			svg != null ? String.format("data:image/png;base64,%s", svg) : null
		);
		return () -> result;
	}

}
