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
package com.mgmtp.a12.print.engine.runtime.xml;

import com.mgmtp.a12.print.engine.api.PdfPrintResult;
import com.mgmtp.a12.print.engine.api.PrintEngineConfig;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.api.XmlPrintResult;
import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.PrintEngine;
import com.mgmtp.a12.print.engine.runtime.modelDocument.ModelDocumentPrintEngine;
import com.mgmtp.a12.print.engine.runtime.xml.internal.mapping.ModelDocumentToXmlMapper;
import com.mgmtp.a12.print.engine.runtime.xml.internal.serialization.XmlSerialization;
import lombok.NonNull;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDDocumentNameDictionary;
import org.apache.pdfbox.pdmodel.PDEmbeddedFilesNameTreeNode;
import org.apache.pdfbox.pdmodel.common.filespecification.PDComplexFileSpecification;
import org.apache.pdfbox.pdmodel.common.filespecification.PDEmbeddedFile;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Calendar;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ExecutorService;

// tag::header[]
/**
 * Provides the ability to execute {@link PrintJob}s.
 */
public class XmlPrintEngine extends PrintEngine<XmlPrintResult> implements com.mgmtp.a12.print.engine.api.XmlPrintEngine {
// end::header[]

	private final ExecutorService service;

	private static final ModelDocumentToXmlMapper modelDocumentToXmlMapper = new ModelDocumentToXmlMapper();

	// tag::ctr[]
	/**
	 * @param service the ExecutorService that is used for the execution of concurrent processes.
	 * @param config the relevant {@link PrintEngineConfig}
	 */
	public XmlPrintEngine(
		@NonNull ExecutorService service,
		@NonNull PrintEngineConfig config
	) {
		super(config);
		this.service = service;
	}
	// end::ctr[]

	/**
	 * @param printJob
	 * @return
	 * @throws PrintException if the print operation was interrupted by any exception.
	 */
	@Override
	public XmlPrintResult execute(PrintJob printJob) throws PrintException {
		return wrapResultWithXml(printJob);
	}

	protected XmlPrintResult wrapResultWithXml(
		PrintJob printJob
	) {
		final var modelDocumentEngine = new ModelDocumentPrintEngine(service, super.getConfig());
		final var result = modelDocumentEngine.execute(printJob);

		final var printDocumentXml = modelDocumentToXmlMapper.map(result.getPrintModelDocument());

		final var serializedXml = XmlSerialization.serializeXML(printDocumentXml);
		final var xmlContent = new String(serializedXml, StandardCharsets.UTF_8);

		return new XmlPrintResult() {
			@Override
			public String getXmlMarkup() {
				return xmlContent;
			}

			@Override
			public void copyTo(OutputStream outputStream) throws IOException, PrintException {
				outputStream.write(serializedXml);
			}
		};
	}
}
