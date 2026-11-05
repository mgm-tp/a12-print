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
package com.mgmtp.a12.print.engine.runtime.pdfBox;

import com.mgmtp.a12.print.engine.api.PdfBoxPrintEngineConfig;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.api.PrintModelId;
import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.loader.PrintModelDependency;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalPdfBoxPrintEngineRuntime;
import com.mgmtp.a12.model.header.Annotation;
import com.mgmtp.a12.model.header.Header;
import com.mgmtp.a12.print.model.api.model.ModelSubTypeAccessor;
import com.mgmtp.a12.print.model.api.model.PrintModel;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.concurrent.Executors;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PdfBoxPrintEngineTest {

	@Test
	void givenFragmentModel_whenPrintInternal_thenThrowsPrintException() {
		var engine = new PdfBoxPrintEngine(Executors.newSingleThreadExecutor(), mock(PdfBoxPrintEngineConfig.class));
		var job = mock(PrintJob.class);
		var runtime = mock(InternalPdfBoxPrintEngineRuntime.class);
		var printModel = mock(PrintModel.class);
		var header = mock(Header.class);
		var modelSubTypeAnnotation = mock(Annotation.class);

		when(job.getPrintModelId()).thenReturn(mock(PrintModelId.class));
		when(modelSubTypeAnnotation.getName()).thenReturn(ModelSubTypeAccessor.MODEL_SUB_TYPE_ANNOTATION);
		when(modelSubTypeAnnotation.getValue()).thenReturn(ModelSubTypeAccessor.FRAGMENT_MODEL_SUB_TYPE);
		when(header.getAnnotations()).thenReturn(List.of(modelSubTypeAnnotation));
		when(printModel.getHeader()).thenReturn(header);
		ValueFactory<PrintModel> printModelFactory = () -> printModel;
		when(runtime.provide(any(PrintModelDependency.class))).thenReturn(printModelFactory);

		assertThrows(PrintException.class, () -> engine.printInternal(job, runtime));
	}
}
