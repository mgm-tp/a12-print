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
package com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.element.listing;

import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.api.exception.impl.PrintDomainException;
import com.mgmtp.a12.print.engine.runtime.internal.ModelDocumentDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.attachments.AttachmentUtils;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.listing.ListingValues;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.AttachmentToAppend;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.ImageAttachmentToAppend;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.PdfAttachmentToAppend;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.element.AttachmentWrapper;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalModelDocumentPrintEngineRuntime;
import com.mgmtp.a12.print.model.document.internal.attachments.AttachmentType;
import com.mgmtp.a12.print.model.document.internal.attachments.PrintAttachment;
import com.mgmtp.a12.print.model.document.internal.base.IPrintElement;
import com.mgmtp.a12.print.model.document.internal.element.listing.ListingCell;
import com.mgmtp.a12.print.model.document.internal.element.listing.ListingElement;
import com.mgmtp.a12.print.model.document.internal.element.listing.ListingRow;
import lombok.RequiredArgsConstructor;
import org.jsoup.Jsoup;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;

import static com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.factories.ListingComponentDependencyValueProducer.getListingCellHidden;
import static com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.factories.ListingComponentDependencyValueProducer.getListingRowHidden;

@RequiredArgsConstructor
public class ListingElementDependencyValueProducer implements ModelDocumentDependencyValueProvider<AttachmentWrapper<IPrintElement>, ListingElementDependency> {

	@Override
	public ValueFactory<AttachmentWrapper<IPrintElement>> produce(ListingElementDependency dependency, PrintJob job, PrintEngine<?> engine, InternalModelDocumentPrintEngineRuntime runtime) {
		final var listing = dependency.getListingLayoutTrace().getTracedElement();
		final var listingValueResult = dependency.getValueResult();
		final var attachments = getAttachments(listingValueResult.getAttachmentsToAppend());

		return () -> new AttachmentWrapper<>(
			new ListingElement(
				listing.getId(),
				listingValueResult.getHeaderCells(),
				getRows(listingValueResult.getRows())
			),
			attachments
		);
	}

	private List<PrintAttachment> getAttachments(
		final LinkedHashMap<String, AttachmentToAppend> attachmentsToAppend
	) {
		return attachmentsToAppend.entrySet().stream().map(
			entrySet -> {
				final var attachment = entrySet.getValue();
				final var attachmentId = entrySet.getKey();
				if (attachment instanceof PdfAttachmentToAppend) {
					return new PrintAttachment(attachmentId, AttachmentType.PDF, AttachmentUtils.attachmentToBase64(attachment), attachment.getAltText());
				} else if (attachment instanceof ImageAttachmentToAppend) {
					return new PrintAttachment(attachmentId,  AttachmentType.IMAGE, AttachmentUtils.attachmentToBase64(attachment), attachment.getAltText());
				} else {
					throw new PrintDomainException("The attachment type {} is not supported", attachment.getClass().getName());
				}
			}
		).toList();
	}

	private List<ListingRow> getRows(
		List<ListingValues.MarkupListingRowValue> rowValues
	) {
		final List<ListingRow> listingValues = new ArrayList<>();
		rowValues.forEach(row -> {
			if(!getListingRowHidden(row)) {
				listingValues.add(
					new ListingRow(
						row.getColumnValues().stream().map(cell -> {
							if (getListingCellHidden(cell)) {
								return new ListingCell(null, null, false);
							} else {
								final var innerHtml = cell.isHTML()
									? Jsoup.parseBodyFragment(cell.getValue()).body().text()
									: null;
								return new ListingCell(
									cell.getValue(),
									innerHtml,
									cell.isHTML()
								);
							}
						}).toList()
					)
				);
			}
		});

		return listingValues;
	}
}
