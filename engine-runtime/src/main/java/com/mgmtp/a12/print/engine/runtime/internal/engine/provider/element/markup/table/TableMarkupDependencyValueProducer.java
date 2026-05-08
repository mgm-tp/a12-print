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
package com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.markup.table;

import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.internal.PdfDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.inputSource.ReferenceInputSourceResolver;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.MarkupResult;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.renderer.HtmlDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.textStyleResolver.TextStyleDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.rendering.CssUtil;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalPdfPrintEngineRuntime;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.element.PrintModelElement;
import com.mgmtp.a12.print.model.api.model.element.properties.TextProperties;
import com.mgmtp.a12.print.model.api.model.reference.PlaceableReference;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class TableMarkupDependencyValueProducer implements PdfDependencyValueProvider<MarkupResult, TableMarkupDependency> {

	private static final String TEMPLATE = "element/table.ftlx";
	@NonNull
	private final CssUtil cssUtil;

	@Override
	public ValueFactory<MarkupResult> produce(TableMarkupDependency dependency, PrintJob job, PrintEngine<?> engine, InternalPdfPrintEngineRuntime runtime) {
		final var table = dependency.getTable();
		final var tableValueResult = dependency.getTableValues().get();
		final var rows = tableValueResult.getRows();
		final var headerCells = tableValueResult.getHeaderCells();
		final var colGroups = tableValueResult.getColGroups();

		final var referenceInputSourceResolver = ReferenceInputSourceResolver.builder()
			.runtime(runtime)
			.printModelTreeTrace(new PrintModelTreeTrace<>(table.getPath(), table.getTracedElement()))
			.build();

		final var html = runtime.provide(
			new HtmlDependency(
				TEMPLATE,
				TableHtmlTemplateParameters
					.builder()
					.table(table.getTracedElement())
					.rows(rows.stream().map(row -> row.stream().map(MarkupResult.class::cast).map(
						cellMarkup -> cellMarkup.hasEmptyContent() ? "" : cellMarkup.getMarkup()
					).toList()).toList())
					.headerCells(headerCells)
					.parent(table.findReferenceCallSite(PrintModelElement::getId).flatMap(
						e -> e.tryCastTracedElement(PlaceableReference.class)
							.map(PrintModelTreeTrace::getTracedElement)
					).orElseThrow(() -> new PrintException("table is missing a Placeable Reference Call Site")))
					.textStyle(runtime.provide(cssUtil.getTextStyleFromStyleable(table.getTracedElement(), referenceInputSourceResolver)).get())
					.headerTextStyle(runtime.provide(
						 TextStyleDependency.create(
							table.getTracedElement().getTableProperties().getHeaderTextProperties().flatMap(
								TextProperties::getTextStyleId
							),
							 referenceInputSourceResolver
						 )
					).get())
					.colGroups(colGroups)
					.referenceInputSourceResolver(referenceInputSourceResolver)
					.build()
			)
		);

		return () -> new MarkupResult(table.getTracedElement().getId(), html.get(), rows.isEmpty());
	}
}
