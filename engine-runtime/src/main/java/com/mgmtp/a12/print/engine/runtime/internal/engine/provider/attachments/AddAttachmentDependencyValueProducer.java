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
package com.mgmtp.a12.print.engine.runtime.internal.engine.provider.attachments;

import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.internal.PdfDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.ImageAttachmentHtmlTemplateParameters;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.AttachmentToAppend;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.ImageAttachmentToAppend;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.PdfAttachmentToAppend;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.renderer.HtmlDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.renderer.PDDocumentDependency;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalPdfPrintEngineRuntime;
import lombok.NonNull;
import lombok.Value;
import org.apache.commons.lang3.tuple.Pair;
import org.apache.pdfbox.multipdf.PDFMergerUtility;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageTree;
import org.apache.pdfbox.pdmodel.interactive.action.PDActionGoTo;
import org.apache.pdfbox.pdmodel.interactive.action.PDActionURI;
import org.apache.pdfbox.pdmodel.interactive.annotation.PDAnnotation;
import org.apache.pdfbox.pdmodel.interactive.annotation.PDAnnotationLink;
import org.apache.pdfbox.pdmodel.interactive.documentnavigation.destination.PDPageDestination;
import org.apache.pdfbox.pdmodel.interactive.documentnavigation.destination.PDPageFitWidthDestination;

import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map.Entry;


public class AddAttachmentDependencyValueProducer implements PdfDependencyValueProvider<AddAttachmentResult, AddAttachmentDependency> {

	private final PDFMergerUtility pdfMergerUtility;

	public AddAttachmentDependencyValueProducer() {
		this.pdfMergerUtility = new PDFMergerUtility();
	}

	@Override
	public ValueFactory<AddAttachmentResult> produce(AddAttachmentDependency dependency, PrintJob job, PrintEngine<?> engine, InternalPdfPrintEngineRuntime runtime) {
		final LinkedHashMap<String, AttachmentToAppend> attachments = dependency.getAttachmentsToAppend();
		final PDDocument document = dependency.getDocument();
		if (attachments.isEmpty()) {
			return () -> new AddAttachmentResult(document, new ArrayList<>());
		}

		final var documentsToClose = new ArrayList<PDDocument>();

		final var resultDoc = attachments.entrySet()
			.stream()
			.map(entry -> {
				if (entry.getValue() instanceof PdfAttachmentToAppend) {
					return loadPDDocument(entry);
				}

				if (entry.getValue() instanceof ImageAttachmentToAppend) {
					return generateImagePDDocument(entry, dependency.getLanguage(), runtime);
				}

				throw new PrintException("The current attachment type is not supported");
			})
			.reduce(
				document,
				(doc, pair) -> merge(doc, pair, documentsToClose),
				(a, b) -> a
			);

		return () -> new AddAttachmentResult(resultDoc, documentsToClose);
	}

	private PDDocument merge(
		final PDDocument originDocument,
		final Pair<String, AttachmentPdDocumentWrapper> pair,
		List<PDDocument> documentsToClose
	) {
		try {
			final PDDocument attachment = pair.getValue().getPdDocument();
			final String attachmentId = pair.getKey();
			final int originPageSize = originDocument.getPages().getCount();

			documentsToClose.add(attachment);
			pdfMergerUtility.appendDocument(originDocument, attachment);
			replacePageLinks(
				originDocument,
				attachmentId,
				originPageSize,
				pair.getValue().getAttachment().getAltText()
			);
			return originDocument;
		} catch (final IOException e) {
			throw new RuntimeException(e);
		}
	}

	private Pair<String, AttachmentPdDocumentWrapper> loadPDDocument(
		final Entry<String, AttachmentToAppend> e
	) {
		final PDDocument pdDocument;
		try {
			pdDocument = PDDocument.load(e.getValue().getAttachmentContent());
		} catch (final IOException ex) {
			throw new RuntimeException(ex);
		}
		return Pair.of(e.getKey(), new AttachmentPdDocumentWrapper(pdDocument, e.getValue()));
	}

	private Pair<String, AttachmentPdDocumentWrapper> generateImagePDDocument(
		final Entry<String, AttachmentToAppend> e,
		final String language,
		final InternalPdfPrintEngineRuntime runtime
	) {
		ImageAttachmentToAppend imageAttachmentToAppend = (ImageAttachmentToAppend) e.getValue();

		final HtmlDependency htmlDependency = new HtmlDependency(
			"attachment/imageAttachment.ftlx",
			ImageAttachmentHtmlTemplateParameters
				.builder()
				.language(language)
				.imageBase64(AttachmentUtils.attachmentToBase64(imageAttachmentToAppend))
				.altText(imageAttachmentToAppend.getAltText())
				.attachmentId(e.getKey())
				.build()
		);
		final var html = runtime.provide(htmlDependency).get();
		final PDDocumentDependency pdDocumentDependency = new PDDocumentDependency(html);
		final var pdDocument = runtime.provide(pdDocumentDependency).get();

		return Pair.of(e.getKey(), new AttachmentPdDocumentWrapper(pdDocument, e.getValue()));
	}

	public static void replacePageLinks(
		final PDDocument document,
		final String attachmentId,
		final int pageIndex,
		final String altText
	) throws IOException {
		final PDPageTree pages = document.getDocumentCatalog().getPages();
		for (final PDPage page : pages) {
			for (final PDAnnotation annotation : page.getAnnotations()) {
				if (isActionURIAnnotation(annotation)) {
					annotation.setContents(altText);
					final String uri = ((PDActionURI) ((PDAnnotationLink) annotation).getAction()).getURI();
					if (isAttachmentUrl(attachmentId, uri)) {
						replacePageLink(document, pageIndex, (PDAnnotationLink) annotation);
					}
				}
			}
		}
	}

	private static boolean isAttachmentUrl(final String attachmentId, final String uri) {
		return uri.equals(AttachmentToAppend.getAttachmentLinkHrefById(attachmentId));
	}

	private static boolean isActionURIAnnotation(final PDAnnotation annotation) {
		return annotation instanceof PDAnnotationLink && ((PDAnnotationLink) annotation).getAction() instanceof PDActionURI;
	}

	private static void replacePageLink(final PDDocument document, final int pageIndex,
										final PDAnnotationLink annotation) {
		final PDPageDestination destination = new PDPageFitWidthDestination();
		final PDActionGoTo action = new PDActionGoTo();
		destination.setPage(document.getPage(pageIndex));
		action.setDestination(destination);
		annotation.setAction(action);
	}

	@Value
	private static class AttachmentPdDocumentWrapper {
		@NonNull PDDocument pdDocument;
		@NonNull AttachmentToAppend attachment;
	}
}
