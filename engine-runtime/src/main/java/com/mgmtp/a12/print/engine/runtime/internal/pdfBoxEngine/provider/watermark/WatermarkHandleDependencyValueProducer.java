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
package com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.watermark;

import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.runtime.internal.PdfBoxDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalPdfBoxPrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.pdfBoxEngine.ComponentTreeManagerDependency;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.documentHandle.WatermarkDocumentHandle;

public class WatermarkHandleDependencyValueProducer implements PdfBoxDependencyValueProvider<WatermarkDocumentHandle, WatermarkHandleDependency> {

	@Override
	public ValueFactory<WatermarkDocumentHandle> produce(WatermarkHandleDependency dependency, PrintJob job, PrintEngine<?> engine, InternalPdfBoxPrintEngineRuntime runtime) {
		if (dependency == null) {
			return () -> null;
		}

		final var watermark = dependency.getWatermark();
		final var printDocumentContext = dependency.getDocumentContext();
		final var contentStreamAdapter = dependency.getContentStreamAdapter();

		final var documentHandle = new WatermarkDocumentHandle(
			contentStreamAdapter,
			watermark.getTracedElement().getOpacity().orElse(null)
		);

		runtime.provide(
			new ComponentTreeManagerDependency(
				watermark.getTracedElement().getId(),
				documentHandle,
				printDocumentContext,
				false
			)
		).get();

		return () -> documentHandle;
	}
}
