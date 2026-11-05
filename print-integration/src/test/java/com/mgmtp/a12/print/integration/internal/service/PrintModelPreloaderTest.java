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

import com.mgmtp.a12.dataservices.configuration.DataServicesCoreProperties;
import com.mgmtp.a12.dataservices.model.GenericModel;
import com.mgmtp.a12.dataservices.model.GenericModelContent;
import com.mgmtp.a12.dataservices.model.ModelService;
import com.mgmtp.a12.dataservices.model.events.AbstractModelEvent;
import com.mgmtp.a12.dataservices.model.events.ModelAfterDeleteEvent;
import com.mgmtp.a12.dataservices.model.events.ModelAfterUpdateEvent;
import com.mgmtp.a12.dataservices.model.events.ModelsAfterImportEvent;
import com.mgmtp.a12.model.header.Header;
import com.mgmtp.a12.print.engine.api.PrintModelId;
import com.mgmtp.a12.print.engine.runtime.PrintJobManager;
import com.mgmtp.a12.print.integration.configuration.PrintEngineProperties;
import com.mgmtp.a12.print.integration.events.PrintModelDeleteEvent;
import com.mgmtp.a12.print.integration.events.PrintModelUpdateEvent;
import com.mgmtp.a12.print.integration.events.PrintModelsImportEvent;
import com.mgmtp.a12.print.integration.events.PrintModelsPreloadedEvent;
import com.mgmtp.a12.uaa.authentication.backend.BackendAuthenticationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.context.ApplicationEventPublisher;

import java.util.List;
import java.util.Set;
import java.util.function.Supplier;

import static com.mgmtp.a12.print.engine.runtime.internal.engine.constant.Constants.PRINT_MODEL_TYPE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PrintModelPreloaderTest {

	private static final String PRINT_MODEL_ID = "InvoicePM";
	private static final String RAW_PRINT_MODEL = "{\"header\":{\"id\":\"InvoicePM\"}}";

	@Mock
	private ApplicationEventPublisher eventPublisher;

	@Mock
	private ModelService modelService;

	@Mock
	private BackendAuthenticationService backendAuthenticationService;

	@Mock(answer = org.mockito.Answers.RETURNS_DEEP_STUBS)
	private DataServicesCoreProperties dataServicesCoreProperties;

	@Mock
	private PrintJobManager printJobManager;

	@Mock
	private PrintEngineProperties printEngineProperties;

	@InjectMocks
	private PrintModelPreloader underTest;

	@BeforeEach
	void setUp() {
		// The production code does its work inside a backend authentication callback,
		// so without this every test would silently exercise nothing.
		when(backendAuthenticationService.executeWithBackendAuthentication(any(), any()))
			.thenAnswer(invocation -> invocation.getArgument(1, Supplier.class).get());
	}

	@Test
	void givenEnabledAndUnpreparedModel_whenPreloadPrintModels_thenModelIsPrepared() {
		final var printModelHeader = header(PRINT_MODEL_ID);
		final var printModel = printModel(PRINT_MODEL_ID, PRINT_MODEL_TYPE);
		when(modelService.findAllHeadersByType(PRINT_MODEL_TYPE)).thenReturn(List.of(printModelHeader));
		when(printEngineProperties.isPreCompilationEnabledForModel(PRINT_MODEL_ID)).thenReturn(true);
		when(printJobManager.isPrepared(any())).thenReturn(false);
		when(modelService.load(PRINT_MODEL_ID)).thenReturn(printModel);

		underTest.preloadPrintModels();

		verify(printJobManager).prepare(RAW_PRINT_MODEL);
		verify(eventPublisher).publishEvent(any(PrintModelsPreloadedEvent.class));
	}

	@Test
	void givenDisabledModel_whenPreloadPrintModels_thenModelIsNotPrepared() {
		final var printModelHeader = header(PRINT_MODEL_ID);
		when(modelService.findAllHeadersByType(PRINT_MODEL_TYPE)).thenReturn(List.of(printModelHeader));
		when(printEngineProperties.isPreCompilationEnabledForModel(PRINT_MODEL_ID)).thenReturn(false);

		underTest.preloadPrintModels();

		verify(printJobManager, never()).prepare(anyString());
	}

	@Test
	void givenAlreadyPreparedModel_whenPreloadPrintModels_thenModelIsNotPreparedAgain() {
		final var printModelHeader = header(PRINT_MODEL_ID);
		when(modelService.findAllHeadersByType(PRINT_MODEL_TYPE)).thenReturn(List.of(printModelHeader));
		when(printEngineProperties.isPreCompilationEnabledForModel(PRINT_MODEL_ID)).thenReturn(true);
		when(printJobManager.isPrepared(any())).thenReturn(true);

		underTest.preloadPrintModels();

		verify(printJobManager, never()).prepare(anyString());
	}

	@Test
	void givenNoPrintModels_whenPreloadPrintModels_thenPreloadedEventIsStillPublished() {
		when(modelService.findAllHeadersByType(PRINT_MODEL_TYPE)).thenReturn(List.of());

		underTest.preloadPrintModels();

		verify(eventPublisher).publishEvent(any(PrintModelsPreloadedEvent.class));
	}

	@Test
	void givenFailingPreparation_whenPreloadPrintModels_thenExceptionIsPropagated() {
		final var printModelHeader = header(PRINT_MODEL_ID);
		final var printModel = printModel(PRINT_MODEL_ID, PRINT_MODEL_TYPE);
		when(modelService.findAllHeadersByType(PRINT_MODEL_TYPE)).thenReturn(List.of(printModelHeader));
		when(printEngineProperties.isPreCompilationEnabledForModel(PRINT_MODEL_ID)).thenReturn(true);
		when(printJobManager.isPrepared(any())).thenReturn(false);
		when(modelService.load(PRINT_MODEL_ID)).thenReturn(printModel);
		when(printJobManager.prepare(RAW_PRINT_MODEL)).thenThrow(new IllegalStateException("broken model"));

		assertThatThrownBy(() -> underTest.preloadPrintModels())
			.isInstanceOf(IllegalStateException.class)
			.hasMessage("broken model");
	}

	@Test
	void givenNonPrintModel_whenInvalidatePrintModel_thenNothingHappens() {
		final var model = printModel("InvoiceDM", "document");
		final AbstractModelEvent<GenericModel> event = new ModelAfterUpdateEvent(model, model);

		underTest.invalidatePrintModel(event);

		verifyNoInteractions(printJobManager);
		verifyNoInteractions(eventPublisher);
	}

	@Test
	void givenUpdatedPrintModel_whenInvalidatePrintModel_thenModelIsInvalidatedAndUpdateEventIsPublished() {
		final var model = printModel(PRINT_MODEL_ID, PRINT_MODEL_TYPE);
		final AbstractModelEvent<GenericModel> event = new ModelAfterUpdateEvent(model, model);

		underTest.invalidatePrintModel(event);

		verify(printJobManager).invalidatePreparedPrintModel(PrintModelId.fromString(PRINT_MODEL_ID));
		verify(printJobManager, never()).prepare(anyString());
		assertThat(publishedEvent()).isEqualTo(new PrintModelUpdateEvent(model.getHeader()));
	}

	@Test
	void givenDisabledPrintModel_whenInvalidatePrintModel_thenModelIsStillInvalidated() {
		// Invalidation is independent of the pre-compilation setting: it only drops a possibly stale
		// compilation, and PrintService prepares the model again on the next print either way.
		when(printEngineProperties.isPreCompilationEnabledForModel(PRINT_MODEL_ID)).thenReturn(false);
		final var model = printModel(PRINT_MODEL_ID, PRINT_MODEL_TYPE);
		final AbstractModelEvent<GenericModel> event = new ModelAfterUpdateEvent(model, model);

		underTest.invalidatePrintModel(event);

		verify(printJobManager).invalidatePreparedPrintModel(PrintModelId.fromString(PRINT_MODEL_ID));
	}

	@Test
	void givenDeletedPrintModel_whenInvalidatePrintModel_thenModelIsInvalidatedAndDeleteEventIsPublished() {
		final var model = printModel(PRINT_MODEL_ID, PRINT_MODEL_TYPE);
		final AbstractModelEvent<GenericModel> event = new ModelAfterDeleteEvent(model);

		underTest.invalidatePrintModel(event);

		verify(printJobManager).invalidatePreparedPrintModel(PrintModelId.fromString(PRINT_MODEL_ID));
		assertThat(publishedEvent()).isEqualTo(new PrintModelDeleteEvent(model.getHeader()));
	}

	@Test
	void givenDeletedNonPrintModel_whenInvalidatePrintModel_thenNothingHappens() {
		final var model = printModel("InvoiceDM", "document");
		final AbstractModelEvent<GenericModel> event = new ModelAfterDeleteEvent(model);

		underTest.invalidatePrintModel(event);

		verifyNoInteractions(printJobManager);
		verifyNoInteractions(eventPublisher);
	}

	@Test
	void givenImportedPrintModels_whenInvalidatePrintModels_thenAllPrintModelsAreInvalidatedAndImportEventIsPublished() {
		final var invoiceHeader = header(PRINT_MODEL_ID, PRINT_MODEL_TYPE);
		final var orderHeader = header("OrderPM", PRINT_MODEL_TYPE);
		final var event = new ModelsAfterImportEvent(Set.of(invoiceHeader, orderHeader));

		underTest.invalidatePrintModels(event);

		verify(printJobManager).invalidatePreparedPrintModel(PrintModelId.fromString(PRINT_MODEL_ID));
		verify(printJobManager).invalidatePreparedPrintModel(PrintModelId.fromString("OrderPM"));
		verify(printJobManager, never()).prepare(anyString());
		assertThat(publishedEvent()).isEqualTo(new PrintModelsImportEvent(Set.of(invoiceHeader, orderHeader)));
	}

	@Test
	void givenImportedMixedModels_whenInvalidatePrintModels_thenOnlyPrintModelsAreInvalidatedAndPublished() {
		final var printModelHeader = header(PRINT_MODEL_ID, PRINT_MODEL_TYPE);
		final var event = new ModelsAfterImportEvent(Set.of(printModelHeader, header("InvoiceDM", "document")));

		underTest.invalidatePrintModels(event);

		verify(printJobManager).invalidatePreparedPrintModel(PrintModelId.fromString(PRINT_MODEL_ID));
		verify(printJobManager, times(1)).invalidatePreparedPrintModel(any());
		assertThat(publishedEvent()).isEqualTo(new PrintModelsImportEvent(Set.of(printModelHeader)));
	}

	@Test
	void givenImportedNonPrintModelsOnly_whenInvalidatePrintModels_thenNothingIsInvalidatedButEmptyImportEventIsPublished() {
		final var event = new ModelsAfterImportEvent(Set.of(header("InvoiceDM", "document")));

		underTest.invalidatePrintModels(event);

		verifyNoInteractions(printJobManager);
		assertThat(publishedEvent()).isEqualTo(new PrintModelsImportEvent(Set.of()));
	}

	@Test
	void givenEmptyImport_whenInvalidatePrintModels_thenNothingIsInvalidatedButEmptyImportEventIsPublished() {
		final var event = new ModelsAfterImportEvent(Set.of());

		underTest.invalidatePrintModels(event);

		verifyNoInteractions(printJobManager);
		assertThat(publishedEvent()).isEqualTo(new PrintModelsImportEvent(Set.of()));
	}

	@Test
	void givenImportedDisabledPrintModel_whenInvalidatePrintModels_thenModelIsStillInvalidated() {
		when(printEngineProperties.isPreCompilationEnabledForModel(PRINT_MODEL_ID)).thenReturn(false);
		final var event = new ModelsAfterImportEvent(Set.of(header(PRINT_MODEL_ID, PRINT_MODEL_TYPE)));

		underTest.invalidatePrintModels(event);

		verify(printJobManager).invalidatePreparedPrintModel(PrintModelId.fromString(PRINT_MODEL_ID));
	}

	private Header header(final String id) {
		final var header = mock(Header.class);
		when(header.getId()).thenReturn(id);
		return header;
	}

	private Header header(final String id, final String modelType) {
		final var header = header(id);
		when(header.getModelType()).thenReturn(modelType);
		return header;
	}

	private GenericModel printModel(final String id, final String modelType) {
		return new GenericModel(header(id, modelType), new GenericModelContent(RAW_PRINT_MODEL));
	}

	private Object publishedEvent() {
		final var captor = ArgumentCaptor.forClass(Object.class);
		verify(eventPublisher).publishEvent(captor.capture());
		return captor.getValue();
	}
}
