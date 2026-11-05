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
package com.mgmtp.a12.print.integration.configuration;

import com.mgmtp.a12.dataservices.model.GenericModel;
import com.mgmtp.a12.dataservices.model.GenericModelContent;
import com.mgmtp.a12.dataservices.model.ModelService;
import com.mgmtp.a12.dataservices.model.persistence.IModelLoader;
import com.mgmtp.a12.kernel.md.model.api.IDocumentModel;
import com.mgmtp.a12.model.header.Header;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Only covers the {@code PrintJobManagerApi} bean, which is the sole piece of the configuration
 * carrying logic of its own - everything else is bean wiring owned by Spring.
 */
@ExtendWith(MockitoExtension.class)
class PrintEngineConfigurationTest {

	private static final String RAW_MODEL = "{\"header\":{\"id\":\"InvoicePM\"}}";

	@Mock
	private ModelService modelService;

	@Mock
	private IModelLoader<IDocumentModel> documentModelLoader;

	private final PrintEngineConfiguration underTest = new PrintEngineConfiguration();

	@Test
	void givenExistingPrintModel_whenLoadPrintModel_thenRawContentIsReturned() {
		when(modelService.load("InvoicePM")).thenReturn(genericModel());

		final var result = underTest.printJobManagerApi(modelService, documentModelLoader).loadPrintModel("InvoicePM");

		assertThat(result).isEqualTo(RAW_MODEL);
	}

	@Test
	void givenExistingPrintFragmentModel_whenLoadPrintFragmentModel_thenRawContentIsReturned() {
		when(modelService.load("HeaderPFM")).thenReturn(genericModel());

		final var result =
			underTest.printJobManagerApi(modelService, documentModelLoader).loadPrintFragmentModel("HeaderPFM");

		assertThat(result).isEqualTo(RAW_MODEL);
	}

	@Test
	void givenDocumentModelId_whenLoadDocumentModel_thenLoaderIsUsed() {
		final var documentModel = mock(IDocumentModel.class);
		when(documentModelLoader.loadModel("InvoiceDM")).thenReturn(documentModel);

		final var result =
			underTest.printJobManagerApi(modelService, documentModelLoader).loadDocumentModel("InvoiceDM");

		assertThat(result).isSameAs(documentModel);
	}

	private GenericModel genericModel() {
		return new GenericModel(mock(Header.class), new GenericModelContent(RAW_MODEL));
	}
}
