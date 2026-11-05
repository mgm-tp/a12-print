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

import com.mgmtp.a12.dataservices.attachment.*;
import com.mgmtp.a12.dataservices.attachment.events.AttachmentBeforeCreateEvent;
import com.mgmtp.a12.dataservices.attachment.persitence.IAttachmentRepository;
import com.mgmtp.a12.dataservices.common.content.CustomHeaders;
import com.mgmtp.a12.dataservices.common.exception.InvalidInputException;
import com.mgmtp.a12.dataservices.document.DataServicesDocument;
import com.mgmtp.a12.dataservices.document.DocumentService;
import com.mgmtp.a12.dataservices.model.GenericModel;
import com.mgmtp.a12.dataservices.model.GenericModelContent;
import com.mgmtp.a12.dataservices.model.ModelService;
import com.mgmtp.a12.model.header.Header;
import com.mgmtp.a12.print.engine.api.PdfPrintResult;
import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.runtime.AttachmentProvider;
import com.mgmtp.a12.print.engine.runtime.PrintJobManager;
import com.mgmtp.a12.print.integration.configuration.PrintEngineProperties;
import com.mgmtp.a12.print.integration.exception.PrintUnexpectedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Answers;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.io.InputStream;
import java.util.*;

import static com.mgmtp.a12.dataservices.attachment.TypeOfTheContent.ATTACHMENT_SECURED;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PrintServiceTest {

	private static final String DOC_REF = "InvoiceDM/doc-4711";
	private static final String PRINT_MODEL_ID = "InvoicePM";
	private static final String RAW_PRINT_MODEL = "{\"header\":{\"id\":\"InvoicePM\"}}";
	private static final String DOWNLOAD_URL = "http://host/content/4711";
	private static final String RESULT_ATTACHMENT_ID = "attachment-result";
	private static final String RESULT_FILENAME = "doc-4711.pdf";
	private static final String DOCUMENT_MODEL_NAME = "InvoiceDM";
	private static final String PDF_ATTACHMENT_ANNOTATION = "PRINT_ENGINE_RESULT";

	@Mock
	private DocumentService documentService;

	@Mock
	private ModelService modelService;

	@Mock
	private AttachmentService attachmentService;

	@Mock
	private PrintJobManager printJobManager;

	@Mock
	private PrintEngine<PdfPrintResult> pdfBoxPrintEngine;

	@Mock
	private IAttachmentRepository attachmentRepository;

	@Mock
	private PrintEngineProperties printEngineProperties;

	@Mock
	private TypesettingModelLoader typesettingModelLoader;

	@Mock
	private AttachmentProviderFactory attachmentProviderFactory;

	@InjectMocks
	private PrintService underTest;

	@Mock(answer = Answers.RETURNS_DEEP_STUBS)
	private DataServicesDocument document;

	@Mock
	private PdfPrintResult printResult;

	@Mock
	private AttachmentHeader attachmentHeader;

	@Mock
	private AttachmentUrl downloadUrl;

	private PrintJob printJob;

	@BeforeEach
	void setUp() {
		when(documentService.load(any())).thenReturn(Optional.of(document));
		printJob = mock(PrintJob.class, RETURNS_SELF);
		when(printJobManager.createNewJob(any())).thenReturn(printJob);
		when(printJobManager.isPrepared(any())).thenReturn(true);
		when(pdfBoxPrintEngine.execute(any())).thenReturn(printResult);
		when(printResult.getContentType()).thenReturn("application/pdf");
		when(printEngineProperties.getTimeZone()).thenReturn(TimeZone.getTimeZone("UTC"));
		when(attachmentService.createAttachment(any(InputStream.class), anyString(), anyString(), anyString(), any()))
			.thenReturn(attachmentHeader);
		when(attachmentHeader.getAttachmentId()).thenReturn(RESULT_ATTACHMENT_ID);
		when(downloadUrl.getLocation()).thenReturn(DOWNLOAD_URL);
		when(attachmentRepository.findUrl(anyString(), anyString(), any())).thenReturn(Optional.of(downloadUrl));
		when(attachmentProviderFactory.getAttachmentProvider(any())).thenReturn(mock(AttachmentProvider.class));
	}

	@Test
	void givenPreparedModel_whenPrint_thenModelIsNotPreparedAgain() {
		underTest.print(DOC_REF, PRINT_MODEL_ID, Locale.GERMAN);

		verify(printJobManager, never()).prepare(anyString());
		verify(modelService, never()).load(anyString());
	}

	@Test
	void givenPreparedButInvalidatedModel_whenPrint_thenModelIsPreparedAgain() {
		when(printJobManager.isPrepared(any())).thenReturn(false);
		when(modelService.load(PRINT_MODEL_ID)).thenReturn(genericModel());

		underTest.print(DOC_REF, PRINT_MODEL_ID, Locale.GERMAN);

		verify(printJobManager).prepare(RAW_PRINT_MODEL);
	}

	@Test
	void givenNeverPreparedModel_whenPrint_thenModelIsPreparedOnTheFly() {
		when(printJobManager.isPrepared(any())).thenReturn(false);
		when(modelService.load(PRINT_MODEL_ID)).thenReturn(genericModel());

		underTest.print(DOC_REF, PRINT_MODEL_ID, Locale.GERMAN);

		verify(printJobManager).prepare(RAW_PRINT_MODEL);
	}

	@Test
	void givenAnyModel_whenPrint_thenPreCompilationPropertyIsNotConsulted() {
		underTest.print(DOC_REF, PRINT_MODEL_ID, Locale.GERMAN);

		verify(printEngineProperties, never()).isPreCompilationEnabledForModel(anyString());
	}

	@Test
	void givenPrintableDocument_whenPrint_thenAttachmentDownloadUrlIsReturned() {
		final var result = underTest.print(DOC_REF, PRINT_MODEL_ID, Locale.GERMAN);

		assertThat(result).isEqualTo(DOWNLOAD_URL);
		verify(attachmentRepository).findUrl(RESULT_ATTACHMENT_ID, RESULT_FILENAME, ATTACHMENT_SECURED);
	}

	@Test
	@SuppressWarnings("unchecked")
	void givenPrintableDocument_whenPrint_thenResultIsStoredAsAnnotatedAttachment() {
		underTest.print(DOC_REF, PRINT_MODEL_ID, Locale.GERMAN);

		final ArgumentCaptor<List<AttachmentAnnotation>> captor = ArgumentCaptor.forClass(List.class);
		verify(attachmentService).createAttachment(
			any(InputStream.class),
			eq(RESULT_FILENAME),
			eq(DOCUMENT_MODEL_NAME),
			eq(""),
			captor.capture()
		);

		assertThat(captor.getValue())
			.extracting(AttachmentAnnotation::getName, AttachmentAnnotation::getValue)
			.containsExactly(tuple(PDF_ATTACHMENT_ANNOTATION, RESULT_FILENAME));
	}

	@Test
	void givenMissingDocument_whenPrint_thenInvalidInputExceptionIsThrown() {
		when(documentService.load(any())).thenReturn(Optional.empty());

		assertThatThrownBy(() -> underTest.print(DOC_REF, PRINT_MODEL_ID, Locale.GERMAN))
			.isInstanceOf(InvalidInputException.class)
			.hasMessageContaining("doc-4711");
	}

	@Test
	void givenAttachmentWithoutUrl_whenPrint_thenPrintUnexpectedExceptionIsThrown() {
		when(attachmentRepository.findUrl(anyString(), anyString(), any())).thenReturn(Optional.empty());

		assertThatThrownBy(() -> underTest.print(DOC_REF, PRINT_MODEL_ID, Locale.GERMAN))
			.isInstanceOf(PrintUnexpectedException.class)
			.hasMessageContaining("did not return a download URL");
	}

	@Test
	void givenPrintableDocument_whenPrint_thenAttachmentProviderIsRegistered() {
		final var attachmentProvider = mock(AttachmentProvider.class);
		when(attachmentProviderFactory.getAttachmentProvider(any())).thenReturn(attachmentProvider);

		underTest.print(DOC_REF, PRINT_MODEL_ID, Locale.GERMAN);

		verify(printJob).withProvider(attachmentProvider);
	}

	@Test
	void onAttachmentCreate_setsPdfHeaders_whenPrintResultAnnotationIsPresent() {
		final var event = attachmentCreateEvent(PDF_ATTACHMENT_ANNOTATION, RESULT_FILENAME);

		underTest.onAttachmentCreate(event);

		assertThat(customHeadersOf(event))
			.containsEntry("Content-Type", "application/pdf")
			.hasEntrySatisfying("Content-Disposition", value ->
				assertThat(value).startsWith("inline").contains(RESULT_FILENAME)
			);
	}

	@Test
	void onAttachmentCreate_leavesHeadersUntouched_forForeignAttachments() {
		final var event = attachmentCreateEvent("SOME_OTHER_ANNOTATION", "contract.docx");

		underTest.onAttachmentCreate(event);

		assertThat(event.getCustomHeaders().isEmpty()).isTrue();
	}

	private static AttachmentBeforeCreateEvent attachmentCreateEvent(String annotationName, String annotationValue) {
		final var header = AttachmentHeader.builder()
			.annotations(List.of(
				AttachmentAnnotation.builder()
					.name(annotationName)
					.value(annotationValue)
					.build()
			))
			.build();

		return new AttachmentBeforeCreateEvent(new DataServicesAttachment(header, InputStream::nullInputStream));
	}

	private static Map<String, String> customHeadersOf(AttachmentBeforeCreateEvent event) {
		final Map<String, String> headers = new HashMap<>();
		CustomHeaders.forEach(event.getCustomHeaders().build(), headers::put);
		return headers;
	}

	private GenericModel genericModel() {
		return new GenericModel(mock(Header.class), new GenericModelContent(RAW_PRINT_MODEL));
	}
}
