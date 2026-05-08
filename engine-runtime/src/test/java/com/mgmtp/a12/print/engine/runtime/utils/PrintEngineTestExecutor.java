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

import com.fasterxml.jackson.core.JsonProcessingException;
import com.mgmtp.a12.kernel.md.document.api.IDocument;
import com.mgmtp.a12.kernel.md.document.apiV2.immutable.DocumentV2;
import com.mgmtp.a12.kernel.md.model.api.IDocumentModel;
import com.mgmtp.a12.print.engine.api.PdfBoxPrintEngineConfig;
import com.mgmtp.a12.print.engine.api.PdfPrintResult;
import com.mgmtp.a12.print.engine.api.PrintEngineConfig;
import com.mgmtp.a12.print.engine.api.PrintJobConfig;
import com.mgmtp.a12.print.engine.api.a12.AttachmentDependencyDescriptor;
import com.mgmtp.a12.print.engine.api.a12.DocumentDependencyDescriptor;
import com.mgmtp.a12.print.engine.api.a12.TypesettingModelDependencyDescriptor;
import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.api.restriction.PageRangeRestriction;
import com.mgmtp.a12.print.engine.runtime.*;
import com.mgmtp.a12.print.engine.runtime.internal.engine.constant.Constants;
import com.mgmtp.a12.print.engine.runtime.pdf.PdfPrintEngine;
import com.mgmtp.a12.print.engine.runtime.pdfBox.PdfBoxPrintEngine;
import com.mgmtp.a12.print.engine.runtime.test.internal.PrintTestUtil;
import com.mgmtp.a12.print.typesetting.internal.model.TypesettingModel;
import com.mgmtp.a12.print.typesetting.internal.model.impl.TypesettingModelDto;
import com.mgmtp.a12.print.typesetting.internal.serialization.ObjectMapperFactory;
import lombok.Builder;
import lombok.NonNull;
import lombok.Value;

import java.io.ByteArrayInputStream;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.TimeZone;

@Value
@Builder(toBuilder = true)
public class PrintEngineTestExecutor {
	public static PrintEngineTestExecutor DEFAULT_EXECUTOR = PrintEngineTestExecutor.builder().build();

	@Builder.Default
	boolean usePdfBoxPrintProcess = false;
	@NonNull
	@Builder.Default
	TimeZone timeZone = TimeZone.getTimeZone("UTC");
	@NonNull
	@Builder.Default
	Map<String, ByteArrayInputStream> attachments = new HashMap<>();
	@Builder.Default
	Integer startIndex = null;
	@Builder.Default
	Integer endIndex = null;
	@Builder.Default
	boolean useDocumentV2 = false;
	@Builder.Default
	String typesettingModel = null;

	public PdfPrintResult execute(
		@NonNull String printModel,
		@NonNull String documentModelId,
		String documentModel,
		String document
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
			var printJobManager = new PrintJobManager(pool, printJobManagerApi, PrintJobConfig.DEFAULT, usePdfBoxPrintProcess);
			// end::PrintJobManager[]
			var printModelId = printJobManager.prepare(printModel);
			// tag::PdfPrintEngine[]
			var pdfPrintEngine = usePdfBoxPrintProcess
				? new PdfBoxPrintEngine(pool, PdfBoxPrintEngineConfig.DEFAULT)
				: new PdfPrintEngine(pool, PrintEngineConfig.DEFAULT, true);
			// end::PdfPrintEngine[]

			// tag::PrintJob[]
			var printJob = printJobManager.createNewJob(printModelId);
			printJob.withLocale(Locale.GERMAN);
			printJob.withTimeZone(timeZone);
			// end::PrintJob[]

			if (typesettingModel != null) {
				// tag::TypesettingModelProvider[]
				final var objectMapper = ObjectMapperFactory.createTypesettingModelMapper();
				final var typesettingModelObject = objectMapper.readValue(typesettingModel, TypesettingModelDto.class);
				printJob.withProvider(new TypesettingModelProvider() {
					@Override
					public boolean supports(TypesettingModelDependencyDescriptor typesettingModelDependencyDescriptor) {
						return typesettingModelDependencyDescriptor.getTypesettingModelId().equals(typesettingModelObject.getHeader().getId());
					}

					@Override
					public TypesettingModel loadTypesettingModel(TypesettingModelDependencyDescriptor descriptor) {
						return typesettingModelObject;
					}
				});
				// end::TypesettingModelProvider[]
			}


			if (Constants.NO_SELECTED_DOCUMENT_ID.equals(documentModelId)) {
				return pdfPrintEngine.execute(printJob);
			}

			if (useDocumentV2) {
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
			} else {
				var documentToPrint = PrintTestUtil.getDocumentToPrint(
					documentModelId,
					document,
					documentModel
				);
				// tag::PrintJobProvider[]
				printJob.withProvider(new KernelDocumentProvider() { // <1>
					@Override
					public boolean supports(DocumentDependencyDescriptor documentDependencyDescriptor) {
						return documentDependencyDescriptor.getModelReference().getReference().equals(documentModelId);
					}

					@Override
					public IDocument loadDocument(DocumentDependencyDescriptor descriptor) {
						return documentToPrint; // <2>
					}
				});
				// end::PrintJobProvider[]
			}
			if (!attachments.isEmpty()) {
				// tag::AttachmentPrintJobProvider[]
				printJob.withProvider(new AttachmentProvider() {
					@Override
					public boolean supports(AttachmentDependencyDescriptor attachmentDependencyDescriptor) {
						return attachments.containsKey(attachmentDependencyDescriptor.getAttachmentId());
					}

					@Override
					public ByteArrayInputStream loadAttachment(AttachmentDependencyDescriptor descriptor) {
						return attachments.get(descriptor.getAttachmentId());
					}
				});
				// end::AttachmentPrintJobProvider[]
			}
			if (startIndex != null) {
				// tag::PageRangeRestriction[]
				printJob.withRestriction(
					PageRangeRestriction.builder()
						.inclusiveStart(startIndex)
						.exclusiveEnd(endIndex)
						.build()
				);
				// end::PageRangeRestriction[]
			}
			return pdfPrintEngine.execute(printJob);
		} catch (JsonProcessingException e) {
			throw new PrintException(e);
		} finally {
			pool.shutdown();
		}
	}
}
