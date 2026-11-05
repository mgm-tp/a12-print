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
package com.mgmtp.a12.print.integration.internal.service;

import com.mgmtp.a12.dataservices.attachment.AttachmentAnnotation;
import com.mgmtp.a12.dataservices.attachment.AttachmentHeader;
import com.mgmtp.a12.dataservices.attachment.AttachmentService;
import com.mgmtp.a12.dataservices.attachment.AttachmentUrl;
import com.mgmtp.a12.dataservices.attachment.events.AttachmentBeforeCreateEvent;
import com.mgmtp.a12.dataservices.attachment.persitence.IAttachmentRepository;
import com.mgmtp.a12.dataservices.document.DataServicesDocument;
import com.mgmtp.a12.dataservices.document.DocumentReference;
import com.mgmtp.a12.dataservices.document.DocumentService;
import com.mgmtp.a12.dataservices.document.exception.InvalidDocumentReferenceException;
import com.mgmtp.a12.dataservices.model.GenericModel;
import com.mgmtp.a12.dataservices.model.ModelService;
import com.mgmtp.a12.print.engine.api.PdfPrintResult;
import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.api.PrintModelId;
import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.KernelDocumentV2Provider;
import com.mgmtp.a12.print.engine.runtime.PrintJobManager;
import com.mgmtp.a12.print.engine.runtime.TypesettingModelProvider;
import com.mgmtp.a12.print.integration.configuration.PrintEngineProperties;
import com.mgmtp.a12.print.integration.exception.PrintServiceException;
import com.mgmtp.a12.print.integration.exception.PrintUnexpectedException;
import lombok.NonNull;
import org.apache.commons.lang3.StringUtils;
import org.springframework.context.annotation.Lazy;
import org.springframework.context.event.EventListener;
import org.springframework.core.NestedExceptionUtils;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Locale;

import static com.mgmtp.a12.dataservices.attachment.TypeOfTheContent.ATTACHMENT_SECURED;

@Service
public class PrintService {

	private final static String PDF_ATTACHMENT_ANNOTATION = "PRINT_ENGINE_RESULT";

	private final DocumentService documentService;
	private final ModelService modelService;
	private final AttachmentService attachmentService;
	private final IAttachmentRepository attachmentRepository;
	private final AttachmentProviderFactory attachmentProviderFactory;
	private final PrintJobManager printJobManager;
	private final PrintEngine<PdfPrintResult> pdfBoxPrintEngine;
	private final PrintEngineProperties printEngineProperties;
	private final TypesettingModelLoader typesettingModelLoader;

	public PrintService(
		DocumentService documentService,
		ModelService modelService,
		AttachmentService attachmentService,
		IAttachmentRepository attachmentRepository,
		AttachmentProviderFactory attachmentProviderFactory,
		PrintJobManager printJobManager,
		@Lazy PrintEngine<PdfPrintResult> pdfBoxPrintEngine,
		PrintEngineProperties printEngineProperties,
		TypesettingModelLoader typesettingModelLoader
	) {
		this.documentService = documentService;
		this.modelService = modelService;
		this.attachmentService = attachmentService;
		this.attachmentRepository = attachmentRepository;
		this.attachmentProviderFactory = attachmentProviderFactory;
		this.printJobManager = printJobManager;
		this.pdfBoxPrintEngine = pdfBoxPrintEngine;
		this.printEngineProperties = printEngineProperties;
		this.typesettingModelLoader = typesettingModelLoader;
	}

	public String print(
		@NonNull final String docRef,
		@NonNull final String printModelId,
		@NonNull final Locale locale
	) {
		DocumentReference documentReference = parseDocRef(docRef);

		try {
			PrintModelId preparedPrintModel = isPreparedForPreCompilation(printModelId)
				? PrintModelId.fromString(printModelId)
				: printJobManager.prepare(readRawPrintModel(printModelId));

			PrintJob printJob = printJobManager.createNewJob(preparedPrintModel)
				.withLocale(locale)
				.withTimeZone(printEngineProperties.getTimeZone())
				.withProvider(getDocumentProvider(documentReference))
				.withProvider(TypesettingModelProvider.fromLoader(
					SecurityContextPropagation.withCurrentSecurityContext(typesettingModelLoader::loadModel)
				))
				.withProvider(attachmentProviderFactory.getAttachmentProvider(documentReference));

			PdfPrintResult printResult = pdfBoxPrintEngine.execute(printJob);
			return transformPrintResult(printResult, documentReference);
		} catch (PrintException printException) {
			Throwable root = NestedExceptionUtils.getMostSpecificCause(printException);
			throw new PrintServiceException(root.getMessage(), printException);
		}
	}

	private boolean isPreparedForPreCompilation(final String printModelId) {
		return printJobManager.isPrepared(PrintModelId.fromString(printModelId));
	}

	private String transformPrintResult(PdfPrintResult printResult, DocumentReference documentReference) {
		try (ByteArrayOutputStream pdfBytes = new ByteArrayOutputStream()) {
			printResult.copyTo(pdfBytes);

			String filename = documentReference.getDocumentId() + ".pdf";

			AttachmentHeader attachmentHeader = attachmentService.createAttachment(
				new ByteArrayInputStream(pdfBytes.toByteArray()),
				filename,
				documentReference.getDocumentModelName(),
				"",
				List.of(
					AttachmentAnnotation.builder()
						.name(PDF_ATTACHMENT_ANNOTATION)
						.value(filename)
						.build()
				)
			);

			return attachmentRepository.findUrl(attachmentHeader.getAttachmentId(), filename, ATTACHMENT_SECURED)
				.map(AttachmentUrl::getLocation)
				.orElseThrow(() ->
					new PrintUnexpectedException("Content store did not return a download URL for content " + attachmentHeader.getAttachmentId())
				);
		} catch (IOException e) {
			throw new PrintUnexpectedException("The PDF could not be generated", e);
		}
	}

	@EventListener(AttachmentBeforeCreateEvent.class)
	void onAttachmentCreate(AttachmentBeforeCreateEvent event) {
		event.getAttachment().getHeader().getAnnotations().stream().filter(
			anno -> anno.getName().equals(PDF_ATTACHMENT_ANNOTATION)
		).findFirst().ifPresent(anno -> {
			event.getCustomHeaders()
				.header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PDF_VALUE)
				.header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline()
					.filename(anno.getValue(), StandardCharsets.UTF_8)
					.build().toString());
		});
	}

	private String readRawPrintModel(String printModelId) {
		GenericModel printModel = modelService.load(printModelId);
		return printModel.getContent().getRawContent();
	}

	private KernelDocumentV2Provider getDocumentProvider(DocumentReference documentReference) {
		DataServicesDocument document = documentService
				.load(documentReference)
				.orElseThrow(() -> new PrintServiceException(
						"Document not found for reference " + documentReference.getDocumentId()
				));
		return KernelDocumentV2Provider.fromDocument(document.getKernelDocument());
	}

	private static DocumentReference parseDocRef(String docRef) {
		try {
			return new DocumentReference(docRef);
		} catch (InvalidDocumentReferenceException e) {
			if (StringUtils.isBlank(docRef)) {
				throw new PrintServiceException("docRef is marked non-null but is null");
			}
			throw e;
		}
	}
}
