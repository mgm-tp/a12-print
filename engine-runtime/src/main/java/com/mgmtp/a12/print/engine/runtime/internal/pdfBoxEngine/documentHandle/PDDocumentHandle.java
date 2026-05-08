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
package com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.documentHandle;

import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.PrintDocumentContext;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.AttachmentToAppend;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.ImageAttachmentToAppend;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.PdfAttachmentToAppend;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.restriction.PdfJobRestrictionContextDependency;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalPdfBoxPrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.ImageComponent;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.base.AccessibilityData;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.base.ContentStreamAdapter;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.Position;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.Size;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.watermark.WatermarkHandleDependency;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.element.properties.PageOrientation;
import com.mgmtp.a12.print.model.api.model.watermark.Watermark;
import lombok.NonNull;
import lombok.Value;
import org.apache.pdfbox.cos.COSArray;
import org.apache.pdfbox.cos.COSDictionary;
import org.apache.pdfbox.cos.COSInteger;
import org.apache.pdfbox.cos.COSName;
import org.apache.pdfbox.multipdf.PDFMergerUtility;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.common.PDNumberTreeNode;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.documentinterchange.logicalstructure.PDStructureElement;
import org.apache.pdfbox.pdmodel.interactive.action.PDActionGoTo;
import org.apache.pdfbox.pdmodel.interactive.action.PDActionURI;
import org.apache.pdfbox.pdmodel.interactive.annotation.PDAnnotationLink;
import org.apache.pdfbox.pdmodel.interactive.documentnavigation.destination.PDPageFitDestination;

import java.io.IOException;
import java.util.*;

import static com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.ImageComponentUtils.calcImageHeight;
import static com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.ImageComponentUtils.getImageAspectRatio;
import static com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.PDFUnitUtil.floatToLongPt;

@Value
public class PDDocumentHandle {
	@NonNull
	List<ContentStreamAdapter> contentStreamAdapters;
	@NonNull
	LinkedHashMap<String, AttachmentToAppend> attachmentsToAppend;
	@NonNull
	PDDocument document;
	@NonNull PDFMergerUtility pdfMergerUtility = new PDFMergerUtility();

	public void finalizePages(
		@NonNull List<PrintModelTreeTrace<Watermark>> watermarks,
		@NonNull InternalPdfBoxPrintEngineRuntime runtime,
		PrintDocumentContext printDocumentContext
	) {
		final var documentStructElement = (COSDictionary) document.getDocumentCatalog().getStructureTreeRoot().getK();
		final var rootStructElement = new PDStructureElement(documentStructElement);
		final var numTree = new COSArray();

		final var jobRestrictionContext = runtime.provide(new PdfJobRestrictionContextDependency()).get();
		final var inclusivePageRangeStart = Math.max(jobRestrictionContext.getInclusivePageRangeStart(), 0);
		final var exclusivePageRangeEnd = jobRestrictionContext.getExclusivePageRangeEnd();

		if (inclusivePageRangeStart >= contentStreamAdapters.size()) {
			throw new PrintException("The range start is higher than the page count");
		}

		final List<ContentStreamAdapter> restrictedAdapterList = contentStreamAdapters.subList(
			inclusivePageRangeStart,
			Math.min(exclusivePageRangeEnd.orElse(contentStreamAdapters.size()), contentStreamAdapters.size())
		);

		List<WatermarkDocumentHandle> watermarkDocumentHandles = null;
		if (!watermarks.isEmpty()) {
			final var portraitWatermark = watermarks.stream().filter(watermark ->
				watermark.getTracedElement().getPageOrientation().equals(PageOrientation.PORTRAIT)
			).findAny();
			final var landscapeWatermark = watermarks.stream().filter(watermark ->
				watermark.getTracedElement().getPageOrientation().equals(PageOrientation.LANDSCAPE)
			).findAny();

			final var dependencies = new ArrayList<WatermarkHandleDependency>();
			for (final var adapter: restrictedAdapterList) {
				final var pageOrientation = getPageOrientation(adapter);
				Optional<PrintModelTreeTrace<Watermark>> watermarkTrace;
				if (pageOrientation.equals(PageOrientation.LANDSCAPE)) {
					watermarkTrace = landscapeWatermark;
				} else {
					watermarkTrace = portraitWatermark;
				}

				watermarkTrace.ifPresentOrElse(watermarkPrintModelTreeTrace -> dependencies.add(new WatermarkHandleDependency(
					watermarkPrintModelTreeTrace,
					printDocumentContext,
					adapter
				)), () -> dependencies.add(null));
			}
			watermarkDocumentHandles = runtime.streamWatermarkHandleDependency(dependencies.stream()).toList();
		}

		final var annotations = new ArrayList<PDAnnotationLink>();
		final var structParent = closeAdapters(
			restrictedAdapterList,
			watermarkDocumentHandles,
			annotations,
			rootStructElement,
			numTree
		);

		final var dict = new COSDictionary();
		dict.setItem(COSName.NUMS, numTree);
		final var limits = new COSArray();
		limits.add(COSInteger.get(0));
		limits.add(COSInteger.get(structParent - (long) 1));
		dict.setItem(COSName.LIMITS, limits);
		final var numberTreeNode = new PDNumberTreeNode(dict, dict.getClass());
		document.getDocumentCatalog().getStructureTreeRoot().setParentTree(numberTreeNode);
		document.getDocumentCatalog().getStructureTreeRoot().setParentTreeNextKey(structParent);

		addAttachments(annotations);
	}

	private int closeAdapters(
		List<ContentStreamAdapter> contentStreamAdapters,
		List<WatermarkDocumentHandle> watermarkDocumentHandles,
		List<PDAnnotationLink> annotations,
		PDStructureElement rootStructureElement,
		COSArray numTree
	) {
		var structParent = 0;
		for (var i = 0; i < contentStreamAdapters.size(); i++) {
			final var adapter = contentStreamAdapters.get(i);
			final var watermarkAdapter = watermarkDocumentHandles != null && watermarkDocumentHandles.get(i) != null
				? watermarkDocumentHandles.get(i).getWatermarkContentStreamAdapter()
				: null;
			setAccessibilityData(adapter, watermarkAdapter, rootStructureElement, numTree, structParent);
			final var page = adapter.getPage();
			structParent = handleLinkAccessibility(page, adapter, annotations, numTree, structParent);
			page.getCOSObject().setItem(COSName.getPDFName("Tabs"), COSName.S);
			document.addPage(page);
			adapter.close();

			if (watermarkAdapter != null) {
				watermarkAdapter.close();
			}
			structParent++;
		}
		return structParent;
	}

	private int handleLinkAccessibility(
		PDPage page,
		ContentStreamAdapter adapter,
		List<PDAnnotationLink> annotations,
		COSArray numTree,
		int initialStructParent
	) {
		var structParent = initialStructParent;
		try {
			final var pageAnnotations = page.getAnnotations();
			if (pageAnnotations != null && !pageAnnotations.isEmpty()) {
				final var linkStructElements = adapter.getLinkStructElements();
				var index = 0;
				for (final var annotation : pageAnnotations) {
					if (annotation instanceof PDAnnotationLink annotationLink) {
						// These two list should be in line because the content stream of a segment is changed serial
						final var linkStructElement = index > linkStructElements.size() - 1
							? null
							: linkStructElements.get(index);
						if (linkStructElement == null) {
							throw new PrintException("There is no struct element for the selected Annotation");
						}
						index++;
						structParent++;

						annotationLink.setStructParent(structParent);
						annotations.add(annotationLink);
						numTree.add(COSInteger.get(structParent));
						numTree.add(linkStructElement);
					}
				}
			}
		} catch (IOException e) {
			throw new PrintException(e);
		}
		return structParent;
	}

	private void setAccessibilityData(
		ContentStreamAdapter contentStreamAdapter,
		ContentStreamAdapter watermarkAdapter,
		PDStructureElement rootStructElement,
		COSArray numTree,
		int structParent
	) {
		final var numTreeValues = new COSArray();
		final var page = contentStreamAdapter.getPage();

		page.setStructParents(structParent);
		numTree.add(COSInteger.get(structParent));

		AccessibilityData watermarkAccessData = null;
		if (watermarkAdapter != null) {
			watermarkAccessData = AccessibilityData.ofList(watermarkAdapter.getAccessibilityDataList());
		}

		final var headerAccessData = AccessibilityData.ofList(contentStreamAdapter.getHeaderAccessibilityDataList());
		final var contentAccessData = AccessibilityData.ofList(contentStreamAdapter.getAccessibilityDataList());
		final var footerAccessData = AccessibilityData.ofList(contentStreamAdapter.getFooterAccessibilityDataList());

		final var allPDStructureElements = new ArrayList<PDStructureElement>();
		final var allParentTreeElements = new ArrayList<PDStructureElement>();

		// order is important
		if (watermarkAccessData != null) {
			allPDStructureElements.addAll(watermarkAccessData.getStructureElements());
		}
		allPDStructureElements.addAll(headerAccessData.getStructureElements());
		allPDStructureElements.addAll(contentAccessData.getStructureElements());
		allPDStructureElements.addAll(footerAccessData.getStructureElements());

		allParentTreeElements.addAll(contentAccessData.getParentTreeElements());
		allParentTreeElements.addAll(headerAccessData.getParentTreeElements());
		allParentTreeElements.addAll(footerAccessData.getParentTreeElements());
		if (watermarkAccessData != null) {
			allParentTreeElements.addAll(watermarkAccessData.getParentTreeElements());
		}

		setAccessibilityData(
			new AccessibilityData(allPDStructureElements, allParentTreeElements),
			rootStructElement,
			numTreeValues
		);
		numTree.add(numTreeValues);
	}

	private void setAccessibilityData(
		AccessibilityData accessibilityData,
		PDStructureElement rootStructElement,
		COSArray numTreeValues
	) {
		for (var kidElement: accessibilityData.getParentTreeElements()) {
			final var kids = kidElement.getKids();
			if (kids.size() == 1) {
				// Special handling for link elements
				if (kids.getFirst() instanceof PDStructureElement structureElement) {
					numTreeValues.add(structureElement);
				} else {
					numTreeValues.add(kidElement);
				}
			} else {
				for (Object kid : kids) {
					if (kid instanceof Integer) {
						numTreeValues.add(kidElement);
					}
				}
			}
		}
		addStructElements(accessibilityData, rootStructElement);
	}

	private static void addStructElements(AccessibilityData accessibilityData, PDStructureElement rootStructElement) {
		for (var structElement: accessibilityData.getStructureElements()) {
			rootStructElement.appendKid(structElement);
		}
	}

	private static PageOrientation getPageOrientation(final ContentStreamAdapter contentStreamAdapter) {
		final var mediaBox = contentStreamAdapter.getPage().getMediaBox();
		if (PDRectangle.A4.getHeight() == mediaBox.getHeight()) {
			return PageOrientation.PORTRAIT;
		} else {
			return PageOrientation.LANDSCAPE;
		}
	}

	private void addAttachments(List<PDAnnotationLink> annotations) {
		for (final var entry: attachmentsToAppend.entrySet()) {
			final var currentAnnotations = annotations.stream().filter(anno ->
				anno.getAction() instanceof PDActionURI actionURI && actionURI.getURI().equals(entry.getKey())
			).toList();

			if (!currentAnnotations.isEmpty()) {
				final var attachmentToAppend = entry.getValue();

				final var targetPage = document.getNumberOfPages();
				renderAttachment(entry);

				for (final var currentAnnotation : currentAnnotations) {
					currentAnnotation.setContents(attachmentToAppend.getAltText());
					final var destination = new PDPageFitDestination();
					destination.setPage(document.getPage(targetPage));
					final var action = new PDActionGoTo();
					action.setDestination(destination);
					currentAnnotation.setAction(action);
				}
			}
		}
	}

	private void renderAttachment(@NonNull final Map.Entry<String, AttachmentToAppend> attachmentToAppend) {
		final var value = attachmentToAppend.getValue();
		if (value instanceof PdfAttachmentToAppend) {
			try {
				final var doc = loadPDDocument(attachmentToAppend);
				pdfMergerUtility.appendDocument(document, doc);
				doc.close();
			} catch (IOException e) {
				throw new PrintException(e);
			}
		} else if (value instanceof ImageAttachmentToAppend imageAttachmentToAppend) {
			renderImageAttachment(attachmentToAppend.getKey(), imageAttachmentToAppend);
		} else {
			throw new PrintException("The current attachment type is not supported");
		}
	}

	private void renderImageAttachment(
		String id,
		ImageAttachmentToAppend imageAttachmentToAppend
	) {
		final var imageBytes = imageAttachmentToAppend.getAttachmentContent().readAllBytes();
		final var width = floatToLongPt(PDRectangle.A4.getWidth());
		final var resolvedHeight = calcImageHeight(width, getImageAspectRatio(imageBytes));
		final var imageComponent = new ImageComponent(
			id,
			imageBytes,
			imageAttachmentToAppend.getAltText(),
			new Size(width, resolvedHeight)
		);
		final var imageHandle = new ImageAttachmentDocumentHandle(document);
		final var regionCursor = imageHandle.getInitialRegionCursor(new Position(0, 0));
		final var renderResult = imageComponent.render(regionCursor, true);
		final var contentStream = regionCursor.getContentStream();
		contentStream.addAccessibilityData(imageHandle, renderResult.getAccessibilityData());

		final var documentStructElement = (COSDictionary) document.getDocumentCatalog().getStructureTreeRoot().getK();
		final var rootStructElement = new PDStructureElement(documentStructElement);
		final var parent = document.getDocumentCatalog().getStructureTreeRoot().getParentTree();
		final var nextKey = document.getDocumentCatalog().getStructureTreeRoot().getParentTreeNextKey();

		setAccessibilityData(
			contentStream,
			null,
			rootStructElement,
			(COSArray) parent.getCOSObject().getItem(COSName.NUMS),
			nextKey
		);

		final var limits = new COSArray();
		limits.add(COSInteger.get(0));
		limits.add(COSInteger.get(nextKey));
		parent.getCOSObject().setItem(COSName.LIMITS, limits);

		document.getDocumentCatalog().getStructureTreeRoot().setParentTreeNextKey(nextKey + 1);

		document.addPage(contentStream.getPage());
		contentStream.close();
	}

	private static PDDocument loadPDDocument(
		final Map.Entry<String, AttachmentToAppend> e
	) {
		final PDDocument pdDocument;
		try {
			pdDocument = PDDocument.load(e.getValue().getAttachmentContent());
		} catch (final IOException ex) {
			throw new PrintException(ex);
		}
		return pdDocument;
	}
}
