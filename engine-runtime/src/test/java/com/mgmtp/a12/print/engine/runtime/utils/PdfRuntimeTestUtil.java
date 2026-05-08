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
package com.mgmtp.a12.print.engine.runtime.utils;

import com.mgmtp.a12.kernel.md.model.api.IDocumentModel;
import com.mgmtp.a12.print.engine.api.PdfPrintResult;
import com.mgmtp.a12.print.engine.api.PrintJobConfig;
import com.mgmtp.a12.print.engine.api.PrintModelId;
import com.mgmtp.a12.print.engine.runtime.ExecutorServiceFactory;
import com.mgmtp.a12.print.engine.runtime.PrintJobManager;
import com.mgmtp.a12.print.engine.runtime.internal.manager.PrintModelCompilerRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.PrintModelCompilationContext;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.PrintModelCompiler;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.ReferenceSpreadExpression;
import com.mgmtp.a12.print.engine.runtime.pdf.PdfPrintEngine;
import com.mgmtp.a12.print.engine.runtime.test.internal.PrintTestUtil;
import com.mgmtp.a12.print.model.api.model.PrintModel;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.container.TopLevelReferenceContainer;
import com.mgmtp.a12.print.model.api.model.element.PrintModelElement;
import com.mgmtp.a12.print.model.api.model.element.base.Margins;
import com.mgmtp.a12.print.model.api.model.reference.PlaceableReference;
import com.mgmtp.a12.print.model.api.walker.model.PrintModelPath;
import org.apache.commons.io.FileUtils;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.junit.jupiter.params.provider.Arguments;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutorService;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;


public class PdfRuntimeTestUtil {

	public static String PDFBOX_SUFFIX = "-pdfBox";
	public static String PDF_PRINT_ENGINE_KEY = "PdfPrintEngine";
	public static String PDF_BOX_PRINT_ENGINE_KEY = "PdfBoxPrintEngine";
	public static Stream<Arguments> provideUsePdfBoxPrintProcess() {
		return Stream.of(Arguments.of(false, PDF_PRINT_ENGINE_KEY), Arguments.of(true, PDF_BOX_PRINT_ENGINE_KEY));
	}

	public static File writeResultFiles(final PdfPrintResult result, final String baseName) {
		try {
			var pdfResultName = baseName + PDFBOX_SUFFIX;
			if (result instanceof PdfPrintEngine.ResultWithMarkups resultWithMarkups) {
				for (int index = 0; index < resultWithMarkups.getSegmentHtmlMarkup().size(); index++) {
					final File htmlFile = PrintTestUtil.resolveFile(baseName + "-segment-" + index + ".html").toPath().toFile();
					final String html = resultWithMarkups.getSegmentHtmlMarkup().get(index).replace(
						"classpath:/ftl/main.css", "main.css"
					);
					FileUtils.write(htmlFile, html, StandardCharsets.UTF_8);
				}
				pdfResultName = baseName;
			}

			return PrintTestUtil.writeResultFiles(result, pdfResultName);
		} catch (IOException e) {
			throw new RuntimeException(e);
		}
	}

	public static File writePDDocumentToFile(PDDocument pdDocument, String name) {
		try {
			final File outFile = PrintTestUtil.resolveFile("PDDocument-"+ name + ".pdf").toPath().toFile();
			pdDocument.save(outFile);
			return outFile;
		} catch (IOException e) {
			throw new RuntimeException(e);
		}
	}

	public static File writeImageToFile(BufferedImage image, String name) {
		try {
			final File outFile = PrintTestUtil.resolveFile(name + ".png").toPath().toFile();
			ImageIO.write(image, "png", outFile);
			return outFile;
		} catch (IOException e) {
			throw new RuntimeException(e);
		}
	}

	public static Optional<Integer> getElementYPosition(String id, String markup) {
		Matcher matcher = Pattern.compile(String.format("id=\"%s\"[^>]*top: (\\d+)mm", id)).matcher(markup);
		if (matcher.find()) {
			return Optional.of(Integer.parseInt(matcher.group(1)));
		}
		return Optional.empty();
	}

	public static Optional<Integer> getElementHeight(String id, String markup) {
		Matcher matcher = Pattern.compile(String.format("id=\"%s\"[^>]*height: (\\d+)mm", id)).matcher(markup);
		if (matcher.find()) {
			return Optional.of(Integer.parseInt(matcher.group(1)));
		}
		return Optional.empty();
	}

	public static boolean containsNumberOfTimes(String text, String keyword, int count) {
		return Pattern.compile(keyword).matcher(text).results().count() == count;
	}

	public static String getTextOfPdf(final String baseName) throws IOException {
		final File pdfFile = PrintTestUtil.resolveFile(baseName + ".pdf").toPath().toFile();
		final var pdDoc = PDDocument.load(pdfFile);
		final var pdfStripper = new PDFTextStripper();
		return pdfStripper.getText(pdDoc);
	}

	public static String getFileContent(final File pdfFile) {
		String text = "";
		try (final PDDocument pdDocument = PDDocument.load(pdfFile)) {
			text = new PDFTextStripper().getText(pdDocument);
		} catch (IOException e) {
			e.printStackTrace();
		}

		return text;
	}

	public static List<String> getFileContentPerPage(final File pdfFile) {
		final List<String> pagesTexts = new ArrayList<>();
		try (final PDDocument pdDocument = PDDocument.load(pdfFile)) {
			final int totalPages = pdDocument.getNumberOfPages();
			final PDFTextStripper pdfStripper = new PDFTextStripper();

			for (int i = 1; i <= totalPages; i++) {
				pdfStripper.setStartPage(i);
				pdfStripper.setEndPage(i);
				pagesTexts.add(pdfStripper.getText(pdDocument));
			}
		} catch (IOException e) {
			e.printStackTrace();
		}

		return pagesTexts;
	}

	public static PlaceableReference getPlaceableReference(PrintModel printModel, String elementId) {
		return printModel
			.getContent()
			.getSegments()
			.getDefinitions()
			.stream()
			.flatMap(segment -> segment
				.getReferences()
				.stream())
			.filter(placeableReference -> placeableReference.getRefId().equals(elementId))
			.findFirst()
			.orElseThrow(() -> new IllegalArgumentException(String.format("Element id %s not found")));
	}

	public static ReferenceSpreadExpression getReferenceSpreadExpression(
		PrintModel printModel,
		TopLevelReferenceContainer parentTopLevelReferenceContainer,
		PlaceableReference placeableReference
	) {
		return new ReferenceSpreadExpression(
			placeableReference.getRefId(),
			placeableReference.getPosition(),
			placeableReference,
			new PrintModelTreeTrace<>(PrintModelPath.create(printModel), placeableReference).getPath(),
			PrintModelId.fromString(printModel.getHeader().getId()),
			parentTopLevelReferenceContainer,
			null,
			null,
			placeableReference.getMargins().flatMap(Margins::getBottom).map(bottomMargin -> bottomMargin.getMargin().getValue()).orElse(null),
			placeableReference.getMargins().flatMap(Margins::getTop).map(topMargin -> topMargin.getMargin().getValue()).orElse(null)
		);
	}

	public static ExecutorService getDefaultExecutorService() {
		return ExecutorServiceFactory.getInstance();
	}

	public static PrintJobManager.PrintJobManagerApi getPrintJobManagerApi(String printModelPath, String documentModel, String documentModelId) {
		return new PrintJobManager.PrintJobManagerApi() {
			@Override
			public String loadPrintModel(String id) {
				return PrintTestUtil.loadFromResources(printModelPath); // <1>
			}

			@Override
			public IDocumentModel loadDocumentModel(String id) {
				if (id.equals(documentModelId)) { // <2>
					return PrintTestUtil.loadDocumentModel(documentModel, documentModelId);
				}
				throw new RuntimeException(id);
			}
		};
	}

	public static PrintModelElement getPrintModelElement(PrintModel printModel, String elementId) {
		return printModel
			.getContent()
			.getElementDefinitions()
			.stream()
			.filter(printModelElement -> printModelElement.getId().equals(elementId))
			.findFirst()
			.orElseThrow(() -> new RuntimeException(String.format("Element for id %s not found", elementId)));
	}

	public static PrintModelCompilerRuntime getPrintModelCompilerRuntime(PrintJobManager.PrintJobManagerApi managerApi) {
		var executorService = getDefaultExecutorService();
		return new PrintModelCompilerRuntime(executorService, managerApi, PrintJobConfig.DEFAULT);
	}

	public static PrintModelCompilationContext getPrintModelCompilationContext(PrintModel printModel, PrintModelCompilerRuntime printModelCompilerRuntime) {
		return PrintModelCompilationContext
			.builder()
			.id(PrintModelId.fromString(printModel.getHeader().getId()))
			.model(printModel)
			.compiler(
				new PrintModelCompiler(printModelCompilerRuntime)
			)
			.build();
	}

	public static String getFirstLine(String text) {
		if (text == null) { return ""; }
		final int index = text.indexOf(System.lineSeparator());
		return (index == -1) ? text : text.substring(0, index);
	}

	public static String getOneLineTemplate(String template) {
		return template.replaceAll("\\r\\n|\\r|\\n", "");
	}
}
