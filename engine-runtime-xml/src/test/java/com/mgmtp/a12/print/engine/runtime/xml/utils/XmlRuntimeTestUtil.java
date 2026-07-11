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
package com.mgmtp.a12.print.engine.runtime.xml.utils;

import com.mgmtp.a12.kernel.md.document.apiV2.immutable.DocumentV2;
import com.mgmtp.a12.kernel.md.model.api.IDocumentModel;
import com.mgmtp.a12.print.engine.api.PdfBoxPrintEngineConfig;
import com.mgmtp.a12.print.engine.api.PrintJobConfig;
import com.mgmtp.a12.print.engine.api.StaticImageProvider;
import com.mgmtp.a12.print.engine.api.XmlPrintResult;
import com.mgmtp.a12.print.engine.api.a12.DocumentDependencyDescriptor;
import com.mgmtp.a12.print.engine.api.exception.StaticImageNotFoundException;
import com.mgmtp.a12.print.engine.runtime.AttachmentProvider;
import com.mgmtp.a12.print.engine.runtime.KernelDocumentV2Provider;
import com.mgmtp.a12.print.engine.runtime.PrintJobManager;
import com.mgmtp.a12.print.engine.runtime.internal.engine.constant.Constants;
import com.mgmtp.a12.print.engine.runtime.test.internal.PrintTestUtil;
import com.mgmtp.a12.print.engine.runtime.xml.XmlPrintEngine;
import com.mgmtp.a12.print.engine.runtime.xml.internal.serialization.XmlSerialization;
import lombok.NonNull;
import org.apache.commons.io.FileUtils;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.TimeZone;

import static org.junit.jupiter.api.Assertions.assertTrue;


public class XmlRuntimeTestUtil {

	private XmlRuntimeTestUtil() {
	}

	private static final StaticImageProvider STATIC_IMAGE_PROVIDER = internalFilename -> {
		try (InputStream stream = XmlRuntimeTestUtil.class.getResourceAsStream("/static-images/" + internalFilename)) {
			if (stream == null) {
				throw new StaticImageNotFoundException(internalFilename);
			}
			return stream.readAllBytes();
		} catch (IOException e) {
			throw new UncheckedIOException(e);
		}
	};

	public static XmlPrintResult print(
		@NonNull String printModel,
		@NonNull String documentModelId,
		String documentModel,
		String document
	) {
		return print(printModel, documentModelId, TimeZone.getTimeZone("UTC"), documentModel, document, null);
	}

	public static XmlPrintResult print(
		@NonNull String printModel,
		@NonNull String documentModelId,
		String documentModel,
		String document,
		AttachmentProvider attachmentProvider
	) {
		return print(printModel, documentModelId, TimeZone.getTimeZone("UTC"), documentModel, document, attachmentProvider);
	}

	public static XmlPrintResult print(
		@NonNull String printModel,
		@NonNull String documentModelId,
		@NonNull TimeZone timeZone,
		String documentModel,
		String document
	) {
		return print(printModel, documentModelId, timeZone, documentModel, document, null);
	}

	public static XmlPrintResult print(
		@NonNull String printModel,
		@NonNull String documentModelId,
		@NonNull TimeZone timeZone,
		String documentModel,
		String document,
		AttachmentProvider attachmentProvider
	) {
		final var pool = PrintTestUtil.getPrintPool();
		try {
			// tag::PrintJobManagerApi[]
			var printJobManagerApi = new PrintJobManager.PrintJobManagerApi() {
				@Override
				public String loadPrintModel(String id) {
					if (id.equals("DINTemplatePM")) { // <1>
						return PrintTestUtil.loadFromResources(
							"/data/dinTemplates/DINTemplatePM.json"
						);
					}
					throw new RuntimeException();
				}

				@Override
				public IDocumentModel loadDocumentModel(String id) {
					if (id.equals(documentModelId)) { // <2>
						return PrintTestUtil.loadDocumentModel(documentModel, documentModelId);
					}
					throw new RuntimeException(id);
				}
			};
			// end::PrintJobManagerApi[]
			// tag::PrintJobManager[]
			var printJobManager = new PrintJobManager(
				pool, printJobManagerApi, PrintJobConfig.DEFAULT, STATIC_IMAGE_PROVIDER
			);
			// end::PrintJobManager[]
			var printModelId = printJobManager.prepare(printModel);
			// tag::PdfPrintEngine[]
			var xmlPrintEngine = new XmlPrintEngine(
				pool,
				PdfBoxPrintEngineConfig.DEFAULT.toBuilder()
					.availableFonts(PdfBoxPrintEngineConfig.DEFAULT_FONTS)
					.build()
			);
			// end::PdfPrintEngine[]

			// tag::PrintJob[]
			var printJob = printJobManager.createNewJob(printModelId);
			printJob.withLocale(Locale.GERMAN);
			printJob.withTimeZone(timeZone);
			// end::PrintJob[]


			if (Constants.NO_SELECTED_DOCUMENT_ID.equals(documentModelId)) {
				return xmlPrintEngine.execute(printJob);
			}

			var documentToPrint = PrintTestUtil.getDocumentV2ToPrint(
				documentModelId,
				document,
				documentModel
			);
			// tag::PrintJobProviderV2[]
			printJob.withProvider(new KernelDocumentV2Provider() { // <1>
				@Override
				public boolean supports(DocumentDependencyDescriptor documentDependencyDescriptor) {
					return documentDependencyDescriptor.getModelReference().getReference().equals(documentModelId);
				}

				@Override
				public DocumentV2 loadDocument(DocumentDependencyDescriptor descriptor) {
					return documentToPrint; // <2>
				}
			});
			// end::PrintJobProviderV2[]

			if (attachmentProvider != null) {
				printJob.withProvider(attachmentProvider);
			}
			return xmlPrintEngine.execute(printJob);
		} finally {
			pool.shutdown();
		}
	}

	public static void writeResultFiles(final XmlPrintResult result, final String baseName) {
		try {
			final File xmlFile = PrintTestUtil.resolveFile(baseName + ".xml").toPath().toFile();
			FileUtils.write(xmlFile, result.getXmlMarkup(), StandardCharsets.UTF_8);

			assertTrue(XmlSerialization.validate(result.getXmlMarkup()).isEmpty());
		} catch (IOException e) {
			throw new RuntimeException(e);
		}
	}
}
