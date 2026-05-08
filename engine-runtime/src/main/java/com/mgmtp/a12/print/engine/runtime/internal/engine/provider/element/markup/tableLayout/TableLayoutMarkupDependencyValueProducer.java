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
package com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.markup.tableLayout;

import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.internal.PdfDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.inputSource.ReferenceInputSourceResolver;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.MarkupResult;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.renderer.HtmlDependency;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalPdfPrintEngineRuntime;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.element.PrintModelElement;
import com.mgmtp.a12.print.model.api.model.reference.PlaceableReference;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class TableLayoutMarkupDependencyValueProducer implements PdfDependencyValueProvider<MarkupResult, TableLayoutMarkupDependency> {

	private static final String TEMPLATE = "element/tableLayout.ftlx";

	@Override
	public ValueFactory<MarkupResult> produce(TableLayoutMarkupDependency dependency, PrintJob job, PrintEngine<?> engine, InternalPdfPrintEngineRuntime runtime) {
		final var tableLayoutTrace = dependency.getTableLayoutTrace();
		final var tableLayout = tableLayoutTrace.getTracedElement();
		final var rows = dependency.getRows().get();

		var reference
			= tableLayoutTrace.findReferenceCallSite(PrintModelElement::getId)
							  .flatMap(e -> e.tryCastTracedElement(PlaceableReference.class))
							  .orElseThrow(() -> new PrintException("tableLayout requires a Placeable Reference"));

		final var referenceInputSourceResolver = ReferenceInputSourceResolver.builder()
			.runtime(runtime)
			.printModelTreeTrace(new PrintModelTreeTrace<>(tableLayoutTrace.getPath(), tableLayout))
			.build();


		final HtmlDependency htmlDependency = new HtmlDependency(
			TEMPLATE,
			TableLayoutHtmlTemplateParameters
				.builder()
				.tableLayout(tableLayout)
				.placeableReference(reference.getTracedElement())
				.rows(rows)
				.referenceInputSourceResolver(referenceInputSourceResolver)
				.build()
		);
		final var html = runtime.provide(htmlDependency);
		final var id = tableLayout.getId();
		return () -> new MarkupResult(
			id,
			html.get(),
			rows.isEmpty()
		);
	}

}
