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
// tag::package[]
package com.mgmtp.a12.print.engine.runtime.xml;
// end::package[]

import com.mgmtp.a12.model.utils.OnlyForUsage;
import com.mgmtp.a12.print.engine.api.PdfBoxPrintEngineConfig;
import com.mgmtp.a12.print.engine.api.PdfPrintResult;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.api.message.PrintMessageReport;
import com.mgmtp.a12.print.engine.runtime.PrintEngine;
import com.mgmtp.a12.print.engine.runtime.internal.message.PrintMessageReportImpl;
import com.mgmtp.a12.print.engine.runtime.pdfBox.PdfBoxPrintEngine;
import lombok.NonNull;
import lombok.Value;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDDocumentNameDictionary;
import org.apache.pdfbox.pdmodel.PDEmbeddedFilesNameTreeNode;
import org.apache.pdfbox.pdmodel.common.filespecification.PDComplexFileSpecification;
import org.apache.pdfbox.pdmodel.common.filespecification.PDEmbeddedFile;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.Calendar;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.stream.Stream;

// tag::header[]
/**
 * Provides the ability to execute {@link PrintJob}s.
 */
@OnlyForUsage
public class PdfWithXmlPrintEngine extends PrintEngine<PdfPrintResult> implements com.mgmtp.a12.print.engine.api.PdfBoxPrintEngine {
// end::header[]

	private final ResultType resultType;

	private final ExecutorService service;

	private static final String XML_EXTENSION = ".xml";
	private static final String XML_TYPE = "text/xml";
	private static final String XML_FILE_NAME = "xml_content";

	// tag::ctr[]
	/**
	 * @param service the ExecutorService that is used for the execution of concurrent processes.
	 * @param config the relevant {@link PdfBoxPrintEngineConfig}
	 * @param resultType the relevant {@link ResultType}
	 */
	public PdfWithXmlPrintEngine(
		@NonNull ExecutorService service,
		@NonNull PdfBoxPrintEngineConfig config,
		@NonNull ResultType resultType
	) {
		super(config);
		this.service = service;
		this.resultType = resultType;
	}
	// end::ctr[]

	@Override
	public PrintMessageReport<PdfPrintResult> executeWithReport(PrintJob printJob) throws PrintException {
		try {
			return wrapResultWithXml(printJob);
		} catch (IOException e) {
			throw new PrintException("The XML could not be read", e);
		}
	}

	protected PrintMessageReport<PdfPrintResult> wrapResultWithXml(
		PrintJob printJob
	) throws IOException {
		final var modelDocumentEngine = new XmlPrintEngine(service, super.getConfig());
		final var modelDocumentResultReport = modelDocumentEngine.executeWithReport(printJob);

		if (!modelDocumentResultReport.noErrorOccurred()) {
			return new PrintMessageReportImpl<>(null, modelDocumentResultReport.getMessages());
		}

		final var result = modelDocumentResultReport.getResult();
		final var serializedXml = new ByteArrayOutputStream();
		result.copyTo(serializedXml);
		final var xmlContent = result.getXmlMarkup();

		final var pdfPrintEngine = new PdfBoxPrintEngine(service, super.getConfig());
		final var pdfPrintResultReport = pdfPrintEngine.executeWithReport(printJob);

		if (!pdfPrintResultReport.noErrorOccurred()) {
			return new PrintMessageReportImpl<>(null, pdfPrintResultReport.getMessages());
		}

		final var combinedMessages = Stream.concat(
			pdfPrintResultReport.getMessages().stream(),
			modelDocumentResultReport.getMessages().stream()
		).toList();
		final var pdfPrintResult = pdfPrintResultReport.getResult();
		if (resultType.equals(ResultType.XML_FILE) || resultType.equals(ResultType.XML_STRING_AND_FILE)) {
			final var updatedResult = getResultWithUpdatedPdDocument(pdfPrintResult, serializedXml.toByteArray());

			if (resultType.equals(ResultType.XML_FILE)) {
				return new PrintMessageReportImpl<>(updatedResult, combinedMessages);
			} else {
				return new PrintMessageReportImpl<>(new ResultWithXmlString(xmlContent, updatedResult), combinedMessages);
			}
		} else {
			return new PrintMessageReportImpl<>(new ResultWithXmlString(xmlContent, pdfPrintResult), combinedMessages);
		}
	}

	private PdfPrintResult getResultWithUpdatedPdDocument(
		PdfPrintResult pdfPrintResult,
		byte[] serializedXml
	) {
		final var finalPdDocument = getDocumentWithXmlFile(pdfPrintResult, serializedXml);
		return outputStream -> {
			try (finalPdDocument; finalPdDocument) {
				finalPdDocument.save(new OutputStream() {
					@Override
					public void write(int b) throws IOException {
						outputStream.write(b);
					}

					@Override
					public void flush() throws IOException {
						outputStream.flush();
					}
				});
			}
		};
	}

	private PDDocument getDocumentWithXmlFile(
		PdfPrintResult pdfPrintResult,
		byte[] serializedXml
	) {
		try (final var outputStream = new ByteArrayOutputStream()) {
			pdfPrintResult.copyTo(outputStream);

			PDDocument sourceDocument = Loader.loadPDF(new RandomAccessReadBuffer(outputStream.toByteArray()));

			final var fileSpecification = new PDComplexFileSpecification();
			fileSpecification.setFile(String.format("%s%s", XML_FILE_NAME, XML_EXTENSION));

			final var inputStream = new ByteArrayInputStream(serializedXml);
			final var embeddedFile = new PDEmbeddedFile(sourceDocument, inputStream);
			embeddedFile.setSubtype(XML_TYPE);
			embeddedFile.setSize(serializedXml.length);
			embeddedFile.setCreationDate(Calendar.getInstance());
			fileSpecification.setEmbeddedFile(embeddedFile);

			final var treeNode = new PDEmbeddedFilesNameTreeNode();
			treeNode.setNames(Collections.singletonMap(XML_FILE_NAME,  fileSpecification));

			final var names = new PDDocumentNameDictionary(sourceDocument.getDocumentCatalog());

			if (names.getEmbeddedFiles() != null) {
				if (names.getEmbeddedFiles().getKids() != null) {
					names.getEmbeddedFiles().getKids().add(treeNode);
				} else {
					names.getEmbeddedFiles().setKids(List.of(treeNode));
				}
			} else {
				final var embeddedFilesNameTreeNode = new PDEmbeddedFilesNameTreeNode();
				embeddedFilesNameTreeNode.setKids(List.of(treeNode));
				names.setEmbeddedFiles(embeddedFilesNameTreeNode);
			}

			sourceDocument.getDocumentCatalog().setNames(names);

			return sourceDocument;
		} catch (IOException e) {
			throw new PrintException(e.getMessage());
		}
	}

	@OnlyForUsage
	public enum ResultType {
		XML_STRING,
		XML_FILE,
		XML_STRING_AND_FILE
	}

	@Value
	@OnlyForUsage
	public static class ResultWithXmlString implements PdfPrintResult {
		@NonNull String xmlMarkup;
		@NonNull PdfPrintResult result;

		@Override
		public void copyTo(OutputStream outputStream) throws IOException, PrintException {
			result.copyTo(outputStream);
		}
	}
}

