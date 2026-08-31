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

import com.mgmtp.a12.print.engine.api.PdfBoxPrintEngineConfig;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.api.exception.impl.PrintDomainException;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.Entity;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.PrintDocumentContext;
import com.mgmtp.a12.print.engine.runtime.internal.engine.renderer.pdf.FontUtils;
import com.mgmtp.a12.print.model.api.inputSource.InputValueSourceResolver;
import com.mgmtp.a12.print.model.api.inputSource.InputValueSourceResolver.ReferenceResolver;
import com.mgmtp.a12.print.model.api.model.element.type.chart.ChartData;
import com.mgmtp.a12.print.model.api.model.element.type.chart.ChartOrientation;
import com.mgmtp.a12.print.model.api.model.element.type.chart.KeyFieldChartData;
import com.mgmtp.a12.print.model.api.model.element.type.chart.MultipleSeriesProperties;
import com.mgmtp.a12.print.model.api.model.element.type.chart.barChart.BarChartProperties;
import com.mgmtp.a12.print.model.api.model.element.type.chart.lineChart.LineChartProperties;
import com.mgmtp.a12.print.model.api.model.element.type.chart.pieChart.PieChartProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NonNull;
import org.knowm.xchart.*;
import org.knowm.xchart.internal.chartpart.AxesChart;
import org.knowm.xchart.internal.chartpart.Chart;
import org.knowm.xchart.internal.chartpart.PlotContent_Pie;
import org.knowm.xchart.internal.chartpart.Plot_;
import org.knowm.xchart.style.PieStyler.LabelType;
import org.knowm.xchart.style.Styler.LegendLayout;
import org.knowm.xchart.style.Styler.LegendPosition;
import org.knowm.xchart.style.colors.ChartColor;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.text.NumberFormat;
import java.util.*;
import java.util.List;
import java.util.stream.IntStream;

import static com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.PDFUnitUtil.MM_PER_INCH;

public class ChartGeneratorUtils {

	private static final String SINGLE_BLANK_STRING = " ";

	public static String generatePieChart(
		PieChartProperties properties,
		PrintDocumentContext printDocumentContext,
		PrintJob job,
		PdfBoxPrintEngineConfig printEngineConfig,
		InputValueSourceResolver.ReferenceResolver referenceInputSourceResolver
	) {
		final ChartDocumentData data = getValues(properties.getBasePath(), properties.getData(), printDocumentContext);
		final PieChart chart = buildPieChart(properties, data, printEngineConfig, referenceInputSourceResolver, job);
		return convertChartToBase64String(chart);
	}

	public static String generateMultipleSeriesChart(
		MultipleSeriesProperties properties,
		PrintDocumentContext printDocumentContext,
		PrintJob job,
		PdfBoxPrintEngineConfig printEngineConfig,
		InputValueSourceResolver.ReferenceResolver referenceInputSourceResolver
	) {
		final List<ChartDocumentData> dataList = properties.getData()
			.stream()
			.map(data -> getValues(properties.getBasePath(), data, printDocumentContext))
			.toList();

		Chart<?,?> chart = null;
		if (properties instanceof LineChartProperties lineChartProperties) {
			chart = buildLineChart(lineChartProperties, dataList, job, printEngineConfig, referenceInputSourceResolver);
		} else if (properties instanceof BarChartProperties barChartProperties) {
			chart = buildBarChart(barChartProperties, dataList, job, printEngineConfig, referenceInputSourceResolver);
		}
		return convertChartToBase64String(chart);
	}

	public static String convertChartToBase64String(Chart<?,?> chart) {
		if (chart == null) {
			return null;
		}
		BufferedImage bufferedImage = BitmapEncoder.getBufferedImage(chart);
		try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
			ImageIO.write(bufferedImage, "png", outputStream);
			byte[] image = outputStream.toByteArray();
			return Base64.getEncoder().encodeToString(image);
		} catch (IOException e) {
			e.printStackTrace();
		}
		return null;
	}

	private static Chart<?, ?> buildLineChart(
		LineChartProperties properties,
		List<ChartDocumentData> dataList,
		PrintJob job,
		PdfBoxPrintEngineConfig printEngineConfig,
		ReferenceResolver referenceInputSourceResolver) {

		XYChart chart = new XYChartBuilder()
			.title(InputValueSourceResolver.getInputValue(properties.getTitle(), referenceInputSourceResolver).orElse(""))
			.width(convertToPixel(properties.getDimensions().getWidth().getValue()))
			.height(convertToPixel(properties.getDimensions().getHeight().getValue()))
			.build();

		// Customize Chart
		chart.getStyler()
			.setPlotGridLinesColor(ChartColor.WHITE.getColor());

		chart.getStyler()
			.setLocale(job.getLocale())
			.setChartTitleVisible(true)
			.setPlotBorderVisible(false)
			.setLegendBorderColor(null)
			.setPlotBackgroundColor(ChartColor.LIGHT_GREY.getColor())
			.setChartBackgroundColor(ChartColor.WHITE.getColor())
			.setLegendPadding(5)
			.setLegendPosition(LegendPosition.OutsideS)
			.setLegendLayout(LegendLayout.Horizontal);

		ChartOrientation orientation = properties.getOrientation();
		if (orientation == ChartOrientation.VERTICAL) {
			chart.setXAxisTitle(InputValueSourceResolver.getInputValue(properties.getLabelX(), referenceInputSourceResolver).orElse(""));
			chart.setYAxisTitle(InputValueSourceResolver.getInputValue(properties.getLabelY(), referenceInputSourceResolver).orElse(""));

			for (int i = 0; i < dataList.size(); i++) {
				String seriesName = properties.getData().get(i).getSeriesName().orElse(String.valueOf(i));
				List<Number> yData = convertToNonEmptyNumberList(dataList.get(i).getData());
				chart.addSeries(seriesName, null, yData);
			}
		} else {
			chart.setXAxisTitle(InputValueSourceResolver.getInputValue(properties.getLabelY(), referenceInputSourceResolver).orElse(""));
			chart.setYAxisTitle(InputValueSourceResolver.getInputValue(properties.getLabelX(), referenceInputSourceResolver).orElse(""));

			for (int i = 0; i < dataList.size(); i++) {
				String seriesName = properties.getData().get(i).getSeriesName().orElse(String.valueOf(i));
				List<Number> xData = convertToNonEmptyNumberList(dataList.get(i).getData());
				List<Number> yData = convertToNonEmptyNumberList(IntStream.rangeClosed(1, dataList.get(i).getData().length).boxed().map(Integer::floatValue).toArray(Float[]::new));
				chart.addSeries(seriesName, xData, yData);
			}
		}

		if (NumberFormat.getNumberInstance(job.getLocale()) instanceof DecimalFormat numberFormat) {
			chart.getStyler().setYAxisDecimalPattern((numberFormat).toPattern());
			chart.getStyler().setXAxisDecimalPattern((numberFormat).toPattern());
		}
		applyChartFont(chart, printEngineConfig);

		return chart;
	}

	private static AxesChart<?, ?> buildBarChart(
		BarChartProperties properties,
		List<ChartDocumentData> dataList,
		PrintJob job,
		PdfBoxPrintEngineConfig printEngineConfig,
		ReferenceResolver referenceInputSourceResolver) {

		final AxesChart<?, ?> chart;
		if (properties.getOrientation().equals(ChartOrientation.HORIZONTAL)) {
			// Create Chart
			chart =
				new HorizontalBarChartBuilder()
					.title(InputValueSourceResolver.getInputValue(properties.getTitle(), referenceInputSourceResolver).orElse(""))
					.xAxisTitle(InputValueSourceResolver.getInputValue(properties.getLabelY(), referenceInputSourceResolver).orElse(""))
					.yAxisTitle(InputValueSourceResolver.getInputValue(properties.getLabelX(), referenceInputSourceResolver).orElse(""))
					.width(convertToPixel(properties.getDimensions().getWidth().getValue()))
					.height(convertToPixel(properties.getDimensions().getHeight().getValue()))
					.build();
		} else {
			// Create Chart
			chart =
				new CategoryChartBuilder()
					.title(InputValueSourceResolver.getInputValue(properties.getTitle(), referenceInputSourceResolver).orElse(""))
					.xAxisTitle(InputValueSourceResolver.getInputValue(properties.getLabelX(), referenceInputSourceResolver).orElse(""))
					.yAxisTitle(InputValueSourceResolver.getInputValue(properties.getLabelY(), referenceInputSourceResolver).orElse(""))
					.width(convertToPixel(properties.getDimensions().getWidth().getValue()))
					.height(convertToPixel(properties.getDimensions().getHeight().getValue()))
					.build();

			((CategoryChart) chart).getStyler()
				.setLabelsVisible(true);
		}

		// Customize Chart
		chart.getStyler()
			.setPlotGridLinesColor(ChartColor.WHITE.getColor());

		chart.getStyler()
			.setLocale(job.getLocale())
			.setPlotBorderVisible(false)
			.setLegendBorderColor(null)
			.setPlotBackgroundColor(ChartColor.LIGHT_GREY.getColor())
			.setChartBackgroundColor(ChartColor.WHITE.getColor())
			.setLegendPadding(5)
			.setLegendPosition(LegendPosition.OutsideS)
			.setLegendLayout(LegendLayout.Horizontal);
		applyChartFont(chart, printEngineConfig);

		if (NumberFormat.getNumberInstance(job.getLocale()) instanceof DecimalFormat numberFormat) {
			chart.getStyler().setYAxisDecimalPattern((numberFormat).toPattern());
		}

		// Series
		Set<String> orderedXDataSet = new LinkedHashSet<>();
        for (ChartDocumentData chartDocumentData : dataList) {
            orderedXDataSet.addAll(Arrays.asList(chartDocumentData.getLabels()));
        }
		List<String> orderedXData = new ArrayList<>(orderedXDataSet);

		if (dataList.isEmpty() || orderedXData.isEmpty()) {
			if (chart instanceof HorizontalBarChart barChart) {
				barChart.addSeries(SINGLE_BLANK_STRING, List.of(0), List.of(SINGLE_BLANK_STRING));
			} else {
				((CategoryChart) chart).addSeries(SINGLE_BLANK_STRING, List.of(SINGLE_BLANK_STRING), List.of(0));
			}
			return chart;
		}

		for (int i = 0; i < dataList.size(); i++) {
			String seriesName = properties.getData().get(i).getSeriesName().orElse(String.valueOf(i));
			String[] xData = dataList.get(i).getLabels();
			Float[] yData = dataList.get(i).getData();

			Map<String, Number> labelValueMap = new HashMap<>();
			for (int j = 0; j < xData.length; j++) {
				labelValueMap.put(xData[j], yData[j]);
			}

			List<Number> orderedYData = new ArrayList<>();
			for (String x : orderedXData) {
				orderedYData.add(labelValueMap.getOrDefault(
					x, chart instanceof HorizontalBarChart ? 0 : null
				));
			}

			if (chart instanceof HorizontalBarChart barChart) {
				barChart.addSeries(seriesName, orderedYData, orderedXData);
			} else {
				((CategoryChart) chart).addSeries(seriesName, orderedXData, orderedYData);
			}
		}

		if (orderedXData.size() >= 2) {
			chart.getStyler().setXAxisMaxLabelCount(orderedXData.size());
		}

		return chart;
	}

	private static PieChart buildPieChart(
		PieChartProperties properties,
		ChartDocumentData chartData,
		PdfBoxPrintEngineConfig printEngineConfig,
		ReferenceResolver referenceInputSourceResolver,
		PrintJob job
	) {
		// Create Chart
		PieChart chart = new PieChartBuilder()
			.title(InputValueSourceResolver.getInputValue(properties.getTitle(), referenceInputSourceResolver).orElse(""))
			.width(convertToPixel(properties.getDimensions().getWidth().getValue()))
			.height(convertToPixel(properties.getDimensions().getHeight().getValue()))
			.build();

		final Float[] data = chartData.getData();
		for (int i = 0; i < data.length; i++) {
			final var key = chartData.getLabels()[i];
			final var value = data[i];
			if (chart.getSeries(key) != null) {
				final var existingValue = chart.getSeries(key).getValue().floatValue();
				final var newValue = existingValue + value;
				chart.updatePieSeries(key, newValue);
			} else {
				chart.addSeries(key, value);
			}
		}
		if (chart.getSeriesCollection().isEmpty()) {
			chart.addSeries(SINGLE_BLANK_STRING, 0);
		}

		chart.getStyler()
			.setLabelType(LabelType.Percentage)
			.setPlotBorderVisible(false)
			.setLocale(job.getLocale())
			.setLegendBorderColor(null)
			.setChartPadding(5)
			.setLegendPadding(5)
			.setPlotBackgroundColor(null)
			.setChartBackgroundColor(null)
			.setLegendLayout(LegendLayout.Vertical)
			.setLegendPosition(LegendPosition.OutsideS);

		if (NumberFormat.getNumberInstance(job.getLocale()) instanceof DecimalFormat numberFormat) {
			setDecimalPatternOnPieChartWithReflection(chart, numberFormat);
		}
		applyChartFont(chart, printEngineConfig);
		return chart;
	}

	private static void setDecimalPatternOnPieChartWithReflection(@NonNull PieChart chart, @NonNull DecimalFormat decimalFormat) {
		try {
			final var plotfield = Chart.class.getDeclaredField("plot");
			plotfield.setAccessible(true);
			final var plot = plotfield.get(chart);

			final var plotContent = Plot_.class.getDeclaredField("plotContent");
			plotContent.setAccessible(true);
			final var content = plotContent.get(plot);

			final var dfField = PlotContent_Pie.class.getDeclaredField("df");
			dfField.setAccessible(true);
			dfField.set(content, decimalFormat);
		} catch (IllegalAccessException | NoSuchFieldException e) {
			throw new PrintException("Could not set number format for pie chart", e);
		}
	}

	private static void applyChartFont(Chart<?,?> chart, PdfBoxPrintEngineConfig printEngineConfig) {
		byte[] fontFile = FontUtils.getFontFile(printEngineConfig.getAvailableFonts().get(PdfBoxPrintEngineConfig.DEFAULT_FONT_KEY));
		InputStream inputStream = new ByteArrayInputStream(fontFile);
		Font defaultFont;
		try {
			defaultFont = Font.createFont(Font.TRUETYPE_FONT, inputStream);
		} catch (FontFormatException | IOException e) {
			throw new PrintDomainException("The default font cannot be used for the chart generation", e);
		}
		if (chart instanceof PieChart pieChart) {
			pieChart.getStyler()
				.setSumFont(defaultFont.deriveFont(pieChart.getStyler().getSumFont().getStyle(), pieChart.getStyler().getSumFont().getSize()))
				.setLabelsFont(defaultFont.deriveFont(pieChart.getStyler().getLabelsFont().getStyle(), pieChart.getStyler().getLabelsFont().getSize()));
		} else if (chart instanceof XYChart xyChart) {
			xyChart.getStyler()
				.setCursorFont(defaultFont.deriveFont(xyChart.getStyler().getCursorFont().getStyle(), xyChart.getStyler().getCursorFont().getSize()))
				.setAxisTitleFont(defaultFont.deriveFont(xyChart.getStyler().getAxisTitleFont().getStyle(), xyChart.getStyler().getAxisTitleFont().getSize()))
				.setAxisTickLabelsFont(defaultFont.deriveFont(xyChart.getStyler().getAxisTickLabelsFont().getStyle(), xyChart.getStyler().getAxisTickLabelsFont().getSize()));
		} else if (chart instanceof CategoryChart categoryChart) {
			categoryChart.getStyler()
				.setLabelsFont(defaultFont.deriveFont(categoryChart.getStyler().getLabelsFont().getStyle(), categoryChart.getStyler().getLabelsFont().getSize()))
				.setAxisTitleFont(defaultFont.deriveFont(categoryChart.getStyler().getAxisTitleFont().getStyle(), categoryChart.getStyler().getAxisTitleFont().getSize()))
				.setAxisTickLabelsFont(defaultFont.deriveFont(categoryChart.getStyler().getAxisTickLabelsFont().getStyle(), categoryChart.getStyler().getAxisTickLabelsFont().getSize()));
		} else if (chart instanceof HorizontalBarChart horizontalBarChart) {
			horizontalBarChart.getStyler()
				.setLabelsFont(defaultFont.deriveFont(horizontalBarChart.getStyler().getLabelsFont().getStyle(), horizontalBarChart.getStyler().getLabelsFont().getSize()))
				.setAxisTitleFont(defaultFont.deriveFont(horizontalBarChart.getStyler().getAxisTitleFont().getStyle(), horizontalBarChart.getStyler().getAxisTitleFont().getSize()))
				.setAxisTickLabelsFont(defaultFont.deriveFont(horizontalBarChart.getStyler().getAxisTickLabelsFont().getStyle(), horizontalBarChart.getStyler().getAxisTickLabelsFont().getSize()));
		}

		chart.getStyler()
			.setBaseFont(defaultFont.deriveFont(chart.getStyler().getBaseFont().getStyle(), chart.getStyler().getBaseFont().getSize()))
			.setChartTitleFont(defaultFont.deriveFont(chart.getStyler().getChartTitleFont().getStyle(), chart.getStyler().getChartTitleFont().getSize()))
			.setAnnotationTextFont(defaultFont.deriveFont(chart.getStyler().getAnnotationTextFont().getStyle(), chart.getStyler().getAnnotationTextFont().getSize()))
			.setLegendFont(defaultFont.deriveFont(chart.getStyler().getLegendFont().getStyle(), chart.getStyler().getLegendFont().getSize()))
			.setChartTitleFont(defaultFont.deriveFont(chart.getStyler().getChartTitleFont().getStyle(), chart.getStyler().getChartTitleFont().getSize()))
			.setToolTipFont(defaultFont.deriveFont(chart.getStyler().getToolTipFont().getStyle(), chart.getStyler().getToolTipFont().getSize()));
	}

	private static ChartDocumentData getValues(
		String basePath,
		ChartData chartData,
		PrintDocumentContext printDocumentContext
	) {

		final List<Float> values = new ArrayList<>();
		final List<String> labels = new ArrayList<>();

		int x = 0;
		final var repetitions = printDocumentContext.findRepetitions(basePath);

		for(final var repetition: repetitions.toList()) {
			final var evaluatedValue = repetition
				.findSingleFieldInstance(chartData.getValueField())
				.flatMap(Entity::getValue);

			if (evaluatedValue.isPresent() && evaluatedValue.get() instanceof final BigDecimal valueString) {
				values.add(valueString.floatValue());

				if (chartData.labelIsNumeration().orElse(false)) {
					labels.add(String.valueOf(x));
					x = x + 1;
				} else if (
					chartData instanceof KeyFieldChartData keyFieldChartData &&
						keyFieldChartData.getKeyField().isPresent()
				) {
					final var labelValue = repetition
						.findSingleFieldInstance(keyFieldChartData.getKeyField().get())
						.flatMap(Entity::getValue);
					labels.add(String.valueOf(labelValue.orElse("")));
				}
			}
		}
		return new ChartDocumentData(
			values.toArray(new Float[0]),
			labels.toArray(new String[0])
		);

	}

	private static List<Number> convertToNonEmptyNumberList(Float[] data) {
		if (data == null || data.length == 0) {
			return List.of(0);
		} else {
			return Arrays.asList(data);
		}
	}

	private static int convertToPixel(int millimeters) {
		return (int) Math.floor((millimeters / MM_PER_INCH) * 96);
	}

	@Data
	@AllArgsConstructor
	public static class ChartDocumentData {
		Float[] data;
		String[] labels;
	}
}
