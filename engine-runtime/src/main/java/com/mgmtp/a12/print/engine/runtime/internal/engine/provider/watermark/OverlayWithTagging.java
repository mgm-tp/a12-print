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
package com.mgmtp.a12.print.engine.runtime.internal.engine.provider.watermark;

import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.api.exception.impl.OverlayWithTaggingException;
import com.mgmtp.a12.print.model.api.model.element.properties.PageOrientation;
import lombok.NonNull;
import lombok.Value;
import org.apache.commons.lang3.math.NumberUtils;
import org.apache.pdfbox.cos.*;
import org.apache.pdfbox.io.IOUtils;
import org.apache.pdfbox.multipdf.PDFCloneUtility;
import org.apache.pdfbox.pdfparser.PDFStreamParser;
import org.apache.pdfbox.pdfwriter.ContentStreamWriter;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDDocumentCatalog;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDResources;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.common.PDStream;
import org.apache.pdfbox.pdmodel.documentinterchange.logicalstructure.PDParentTreeValue;
import org.apache.pdfbox.pdmodel.documentinterchange.logicalstructure.PDStructureTreeRoot;

import java.io.Closeable;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.*;
import java.util.stream.Collectors;

import static java.util.stream.Collectors.groupingBy;

/**
 * Adds an overlay to an existing PDF document with tagging.
 */
public class OverlayWithTagging implements Closeable {
	private Map<PageOrientation, Optional<OverlayDocument>> specificPageOverlayDocument = new EnumMap<>(PageOrientation.class);

	private PDDocument inputPDFDocument = null;

	public void overlayDocuments(
		@NonNull final Map<PageOrientation, Optional<PDDocument>> inputOverlayDocuments
	) {
		specificPageOverlayDocument = inputOverlayDocuments.entrySet().stream().collect(Collectors.toMap(
			Map.Entry::getKey,
			value -> value.getValue().flatMap(doc -> Optional.of(getOverlayDocument(doc)))
		));

		processPages(inputPDFDocument);
	}

	public void setInputPDF(PDDocument inputPDF) {
		inputPDFDocument = inputPDF;
	}

	@Override
	public void close() {
		specificPageOverlayDocument.clear();
	}

	private OverlayDocument getOverlayDocument(
		@NonNull final PDDocument overlayPdDocument
	) {
		final var overlayPage = overlayPdDocument.getPage(0);
		final var overlaySubResourcesPerKey = new EnumMap<ResourceKey, COSBase>(ResourceKey.class);
		final var maxIndexes = new EnumMap<ResourceKey, Integer>(ResourceKey.class);
		final var incrementTaggingIndex = getIncrementTaggingIndex(overlayPage, overlaySubResourcesPerKey, maxIndexes);

		final var contents = overlayPage.getCOSObject().getDictionaryObject(COSName.CONTENTS);

		try {
			return new OverlayDocument(
				createCombinedContentStream(contents),
				maxIndexes,
				incrementTaggingIndex,
				overlaySubResourcesPerKey,
				overlayPdDocument.getDocumentCatalog()
			);
		} catch (IOException e) {
			throw new OverlayWithTaggingException(e.getMessage());
		}
	}

	private int getIncrementTaggingIndex(
		PDPage overlayPage,
		EnumMap<ResourceKey, COSBase> overlaySubResourcesPerKey,
		EnumMap<ResourceKey, Integer> maxIndexes
	) {
		var incrementTaggingIndex = -1;
		for (final var resourceKey : ResourceKey.values()) {
			final var overlaySubResources = (COSDictionary) overlayPage.getResources().getCOSObject().getDictionaryObject(
				resourceKey.getCosName()
			);

			overlaySubResourcesPerKey.put(resourceKey, overlaySubResources);

			if (overlaySubResources != null) {
				final var overlayIncrementTaggingIndex = getOverlayIncrementTaggingIndex(
					overlayPage,
					maxIndexes,
					resourceKey,
					overlaySubResources,
					incrementTaggingIndex
				);
				incrementTaggingIndex = overlayIncrementTaggingIndex != null ? overlayIncrementTaggingIndex : incrementTaggingIndex;
			}
		}
		return incrementTaggingIndex;
	}

	private Integer getOverlayIncrementTaggingIndex(
		PDPage overlayPage,
		EnumMap<ResourceKey, Integer> maxIndexes,
		ResourceKey resourceKey,
		COSDictionary overlaySubResources,
		int incrementTaggingIndex
	) {
		Integer overlayIncrementTaggingIndex = null;
		var incrementIndex = -1;

		for (final var overlaySubResource : overlaySubResources.entrySet()) {
			final var cosName = overlaySubResource.getKey();
			final var currentIndex = getCosNameIndex(cosName, resourceKey);

			if (currentIndex != -1 && currentIndex > incrementIndex) {
				incrementIndex = currentIndex;
			}

			if (resourceKey.equals(ResourceKey.PROPERTIES)) {
				final var propertyList = overlayPage.getResources().getProperties(cosName);

				final var taggingIndex = propertyList.getCOSObject().getInt(COSName.MCID);
				if (taggingIndex != -1 && taggingIndex > incrementTaggingIndex) {
					overlayIncrementTaggingIndex = taggingIndex;
				}
			}
		}

		maxIndexes.put(resourceKey, incrementIndex);
		return overlayIncrementTaggingIndex;
	}

	private COSStream createCombinedContentStream(
		@NonNull final COSBase contents
	) throws IOException {
		List<COSStream> contentStreams = createContentStreamList(contents);
		// concatenate streams
		COSStream concatStream = inputPDFDocument.getDocument().createCOSStream();
		try (final OutputStream out = concatStream.createOutputStream(COSName.FLATE_DECODE)) {
			for (COSStream contentStream : contentStreams) {
				InputStream in = contentStream.createInputStream();
				IOUtils.copy(in, out);
				out.flush();
				in.close();
			}
		}
		return concatStream;
	}

	// get the content streams as a list
	private List<COSStream> createContentStreamList(
		final COSBase contents
	) {
		List<COSStream> contentStreams = new ArrayList<>();
		if (contents == null) {
			return contentStreams;
		} else if (contents instanceof COSStream cosStream) {
			contentStreams.add(cosStream);
		} else if (contents instanceof COSArray cosArray) {
			for (COSBase item : cosArray) {
				contentStreams.addAll(createContentStreamList(item));
			}
		} else if (contents instanceof COSObject cosObject) {
			contentStreams.addAll(createContentStreamList(cosObject.getObject()));
		} else {
			throw new OverlayWithTaggingException("Unknown content type: " + contents.getClass().getName());
		}
		return contentStreams;
	}

	private void processPages(
		@NonNull final PDDocument document
	) {
		final var sourceStruct = document.getDocumentCatalog().getStructureTreeRoot();

		if (!(sourceStruct.getK() instanceof final COSDictionary sourceStructDictionary)) {
			throw new OverlayWithTaggingException("This type of 'K' structure is not covered");
		}

		final var sourceStructItems = getStructItems(sourceStructDictionary);
		final Map<Integer, List<COSBase>> sourceItemsPerStructPageIndex = sourceStructItems.toList().stream().collect(groupingBy(
			structElement -> {
				if (structElement instanceof COSDictionary structDictionary) {
					return extractPageIndexFromStruct(structDictionary);
				} else {
					throw new OverlayWithTaggingException("This type of nested 'K' item in source document is not covered");
				}
			}
		));

		final var updatedTaggingIndexesPerStructPage = new HashMap<Integer, Map<Integer, Integer>>();
		final var structIndexToPageIndexMapping = new HashMap<Integer, Integer>();
		final var overlayItemsPerPage = new HashMap<Integer, COSArray>();

		for (var pageIndex = 0; pageIndex < document.getNumberOfPages(); pageIndex++) {
			final var page = document.getPage(pageIndex);
			final var pageOrientation = getPageOrientation(page);

			final var structPageIndex = getPageStructIndexFromPageObject(page.getCOSObject());

			if (structPageIndex == null) {
				throw new OverlayWithTaggingException("For the current page has now struct page index assigned");
			}
			structIndexToPageIndexMapping.put(pageIndex, structPageIndex);

			if (!specificPageOverlayDocument.containsKey(pageOrientation)) {
				continue;
			}

			int finalPageIndex = pageIndex;
			specificPageOverlayDocument.get(pageOrientation).ifPresent(
				overlayDocument -> {
					try {
						final Map<ResourceKey, Map<Integer, COSName>> updatedIndexMap = Arrays.stream(ResourceKey.values()).collect(Collectors.toMap(
							key -> key,
							key -> new HashMap<>()
						));

						// increase the token indexes in the page content stream
						final var updatedTokens = updateTokensWithNewIndexes(
							page, overlayDocument, updatedIndexMap
						);

						// set the new tokens and add the overlay content stream
						updateContentStream(
							document, page, updatedTokens, new PDStream(overlayDocument.getContentStream())
						);

						// set the new indexes in the resources and add the overlay resources
						final var updatedTaggingIndexes = updateIndexesInResources(
							page, overlayDocument, updatedIndexMap
						);
						updatedTaggingIndexesPerStructPage.put(structPageIndex, updatedTaggingIndexes);

						// collect the struct items from the overlay page
						final var overlayStructItems = collectOverlayStructItems(
							document,
							overlayDocument.getDocumentCatalog(),
							page.getCOSObject(),
							sourceStructDictionary
						);
						overlayItemsPerPage.put(finalPageIndex, overlayStructItems.getGeneralStructItems());

						// add the parent tree items from overlay to source document
						addItemsToParentTree(sourceStruct, overlayStructItems.getParentTreeStructItems(), structPageIndex);
					} catch (IOException e) {
						throw new OverlayWithTaggingException(e.getMessage());
					}
				}
			);
		}

		final var finalStructItems = collectStructItems(
			document,
			sourceStructDictionary,
			overlayItemsPerPage,
			structIndexToPageIndexMapping,
			sourceItemsPerStructPageIndex,
			updatedTaggingIndexesPerStructPage
		);

		sourceStructDictionary.setItem(COSName.K, finalStructItems);
	}

	private COSArray collectStructItems(
		PDDocument document,
		COSDictionary sourceStructDictionary,
		HashMap<Integer, COSArray> overlayItemsPerPage,
		HashMap<Integer, Integer> structIndexToPageIndexMapping,
		Map<Integer, List<COSBase>> sourceItemsPerStructPageIndex,
		HashMap<Integer, Map<Integer, Integer>> updatedTaggingIndexesPerStructPage
	) {
		final var finalStructItems = new COSArray();
		for (var pageIndex = 0; pageIndex < document.getNumberOfPages(); pageIndex++) {
			final var overlayItems = overlayItemsPerPage.get(pageIndex);

			// add the overlay items before the source items to the final structure
			if (overlayItems != null) {
				finalStructItems.addAll(overlayItems);
			}

			final var structPageIndex = structIndexToPageIndexMapping.get(pageIndex);
			if (structPageIndex == null) {
				throw new OverlayWithTaggingException(String.format(
					"For the current page index %d is no struct page index mapped", pageIndex
				));
			}

			// set the new tagging indexes and add the origin struct items
			final var sourceStructItemsForCurrentPage = sourceItemsPerStructPageIndex.get(structPageIndex);
			if (sourceStructItemsForCurrentPage != null) {
				for (final var sourceStructItem : sourceStructItemsForCurrentPage) {
					if (overlayItems != null) {
						setUpdatedTaggingIndexes(sourceStructItem, sourceStructDictionary, updatedTaggingIndexesPerStructPage);
					}
					finalStructItems.add(sourceStructItem);
				}
			}
		}
		return finalStructItems;
	}

	private PageOrientation getPageOrientation(
		@NonNull final PDPage page
	) {
		final PDRectangle mediaBox = page.getMediaBox();

		boolean isLandscape = switch (page.getRotation()) {
			case 0, 180 -> mediaBox.getWidth() > mediaBox.getHeight();
			case 90, 270 -> mediaBox.getWidth() < mediaBox.getHeight();
			default -> throw new IllegalStateException("Illegale PDF Rotation");
		};
		return isLandscape ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT;
	}

	private List<Object> updateTokensWithNewIndexes(
		@NonNull final PDPage page,
		@NonNull final OverlayDocument overlayDocument,
		@NonNull final Map<ResourceKey, Map<Integer, COSName>> updatedIndexMap
	) throws IOException {
		final var parser = new PDFStreamParser(page);
		parser.parse();
		final var originTokens = parser.getTokens();

		final var incrementerMap = Arrays.stream(ResourceKey.values()).collect(Collectors.toMap(
			key -> key,
			key -> {
				final var maxIndex = overlayDocument.maxIndexes.get(key);
				return new Incrementer(maxIndex == null ? -1 : maxIndex);
			}
		));

		final var updatedTokens = new ArrayList<>();

		for (final var token : originTokens) {
			if (token instanceof COSName cosName) {
				final var currentResourceKey = getCurrentResourceKey(cosName);

				if (currentResourceKey.isPresent()) {
					final var incrementer = incrementerMap.get(currentResourceKey.get());
					final var updatedIndexes = updatedIndexMap.get(currentResourceKey.get());
					final var oldIndex = getCosNameIndex(cosName, currentResourceKey.get());

					final COSName newName;
					if (updatedIndexes.containsKey(oldIndex)) {
						newName = updatedIndexes.get(oldIndex);
					} else {
						final var newIndex = incrementer.increase();
						newName = COSName.getPDFName(currentResourceKey.get().getIdentifier() + newIndex);
						updatedIndexes.put(oldIndex, newName);
					}

					updatedTokens.add(newName);
					continue;
				}
			}
			updatedTokens.add(token);
		}

		return updatedTokens;
	}

	private void updateContentStream(
		@NonNull final PDDocument document,
		@NonNull final PDPage page,
		@NonNull final List<Object> updatedTokens,
		@NonNull final PDStream overlayContentStream
	) throws IOException {
		PDStream newContents = new PDStream(document);
		OutputStream out = newContents.createOutputStream(COSName.FLATE_DECODE);
		ContentStreamWriter writer = new ContentStreamWriter(out);
		writer.writeTokens(updatedTokens);
		out.close();

		page.setContents(List.of(
			newContents,
			overlayContentStream
		));
	}

	private Map<Integer, Integer> updateIndexesInResources(
		@NonNull final PDPage page,
		@NonNull final OverlayDocument overlayDocument,
		@NonNull final Map<ResourceKey, Map<Integer, COSName>> updatedIndexMap
	) {
		final Map<Integer, Integer> updatedTaggingIndexes = new HashMap<>();
		Arrays.stream(ResourceKey.values()).forEach(resourceKey -> {
			final var newSubResources = new COSDictionary();
			final var overlaySubResources = (COSDictionary) overlayDocument.getOverlaySubResources().get(resourceKey);

			if (overlaySubResources != null) {
				newSubResources.addAll(overlaySubResources);
			}

			if (page.getResources() == null) {
				page.setResources(new PDResources());
			}

			final var pageSubResources = (COSDictionary) page.getResources().getCOSObject().getDictionaryObject(resourceKey.getCosName());

			if (pageSubResources != null) {
				updateIndexesInPageResources(page, overlayDocument, updatedIndexMap, resourceKey, pageSubResources, newSubResources, updatedTaggingIndexes);
			}

			page.getResources().getCOSObject().setItem(resourceKey.getCosName(), newSubResources);
		});

		return updatedTaggingIndexes;
	}

	private void updateIndexesInPageResources(
		PDPage page,
		OverlayDocument overlayDocument,
		Map<ResourceKey, Map<Integer, COSName>> updatedIndexMap,
		ResourceKey resourceKey,
		COSDictionary pageSubResources,
		COSDictionary newSubResources,
		Map<Integer, Integer> updatedTaggingIndexes
	) {
		var incrementTaggingIndex = overlayDocument.getMaxTaggingIndex();

		for (final var pageSubResource : pageSubResources.entrySet()) {
			final var cosName = pageSubResource.getKey();
			final var oldIndex = getCosNameIndex(cosName, resourceKey);

			var newPropName = cosName;
			if (oldIndex != -1) {
				newPropName = updatedIndexMap.get(resourceKey).get(oldIndex);

				if (newPropName == null) {
					throw new OverlayWithTaggingException(String.format("There is not updated index for the origin index %d", oldIndex));
				}
			}

			newSubResources.setItem(
				newPropName,
				pageSubResource.getValue()
			);

			if (resourceKey.equals(ResourceKey.PROPERTIES)) {
				final var propertyList = page.getResources().getProperties(cosName);
				final var taggingIndex = propertyList.getCOSObject().getInt(COSName.MCID);
				if (taggingIndex != -1) {
					incrementTaggingIndex = incrementTaggingIndex + 1;

					if (updatedTaggingIndexes.containsKey(taggingIndex)) {
						throw new OverlayWithTaggingException(String.format("There is already a new tagging index for the origin index %d", taggingIndex));
					}
					updatedTaggingIndexes.put(taggingIndex, incrementTaggingIndex);
					propertyList.getCOSObject().setInt(COSName.MCID, incrementTaggingIndex);
				}
			}
		}
	}

	private Optional<ResourceKey> getCurrentResourceKey(
		@NonNull final COSName name
	) {
		for (final var key : ResourceKey.values()) {
			if (name.getName().startsWith(key.getIdentifier())) {
				return Optional.of(key);
			}
		}

		return Optional.empty();
	}

	private int getCosNameIndex(
		@NonNull final COSName name,
		@NonNull final ResourceKey key
	) {
		final var identifier = name.getName();
		if (identifier.startsWith(key.getIdentifier())) {
			final var indexString = identifier.replaceAll(key.getIdentifier(), "");

			if (NumberUtils.isCreatable(indexString)) {
				return Integer.parseInt(indexString);
			}
		}

		return -1;
	}

	private OverlayStructItems collectOverlayStructItems(
		@NonNull final PDDocument document,
		@NonNull final PDDocumentCatalog overlayCatalog,
		@NonNull final COSBase pageObject,
		@NonNull final COSDictionary sourceStructDictionary
	) throws IOException {
		final var parentTreeStructItems = new ArrayList<COSBase>();
		COSArray generalStructItems;

		final var overlayStruct = overlayCatalog.getStructureTreeRoot();

		if (overlayStruct.getK() instanceof COSDictionary overlayStructDictionary) {
			final var cloner = new PDFCloneUtility(document);
			final var clonedStructDictionary = new COSDictionary();
			cloner.cloneMerge(overlayStructDictionary, clonedStructDictionary);
			generalStructItems = getStructItems(clonedStructDictionary);

			for (final var structElement : generalStructItems) {
				if (structElement instanceof COSDictionary structObject) {
					collectStructElements(structObject, sourceStructDictionary, parentTreeStructItems, pageObject);
				} else {
					throw new OverlayWithTaggingException("This type of nested 'K' item is not covered");
				}
			}
		} else {
			throw new OverlayWithTaggingException("This type of 'K' structure is not covered");
		}

		return new OverlayStructItems(
			parentTreeStructItems,
			generalStructItems
		);
	}

	private void addItemsToParentTree(
		@NonNull final PDStructureTreeRoot sourceStruct,
		@NonNull final List<COSBase> structItemsForParentTree,
		int pageIndex
	) throws IOException {
		if (sourceStruct.getParentTree().getNumbers().containsKey(pageIndex)) {
			final var currentNumbers = sourceStruct.getParentTree().getNumbers().get(pageIndex);
			if (
				currentNumbers instanceof PDParentTreeValue parentTreeValue &&
					parentTreeValue.getCOSObject() instanceof COSArray numArray
			) {
				numArray.addAll(0, structItemsForParentTree);
			} else {
				throw new OverlayWithTaggingException("This type of the struct number tree is not covered");
			}
		} else {
			throw new OverlayWithTaggingException(String.format("There is no struct number tree for the page with index: %d", pageIndex));
		}
	}

	private COSArray getStructItems(
		@NonNull final COSDictionary dictionary
	) {
		final var structArray = new COSArray();
		final var items = dictionary.getItem(COSName.K);
		if (items instanceof COSObject || items instanceof COSDictionary) {
			structArray.add(items);
		} else if (items instanceof COSArray kArray) {
			structArray.addAll(kArray);
		} else if (items != null) {
			throw new OverlayWithTaggingException("This type of 'K' items is not covered");
		}

		return structArray;
	}

	private void collectStructElements(
		@NonNull final COSBase structObject,
		@NonNull final COSDictionary parentDictionary,
		@NonNull final List<COSBase> overlayStructObjects,
		final COSBase refPage
	) {
		switch (structObject) {
			case COSDictionary dictionary ->
				collectStructElementsOutOfDictionary(parentDictionary, overlayStructObjects, refPage, dictionary);
			case COSArray cosArray ->
				collectStructElementOutOfArray(parentDictionary, overlayStructObjects, refPage, cosArray);
			case COSInteger ignored -> overlayStructObjects.add(parentDictionary);
			default -> throw new OverlayWithTaggingException("This type of recursive 'K' item is not covered");
		}
	}

	private void collectStructElementOutOfArray(
		COSDictionary parentDictionary,
		List<COSBase> overlayStructObjects,
		COSBase refPage,
		COSArray cosArray
	) {
		// recollect array items, because items from second page should not be added
		final var resultArray = new COSArray();
		for (final var cosObject : cosArray) {
			var objectNeedsToBeAdded = true;
			if (cosObject instanceof COSDictionary dictionary) {
				final var page = dictionary.getItem(COSName.PG);

				if (page instanceof COSDictionary pageDictionary) {
					int pageIndex = pageDictionary.getInt(COSName.STRUCT_PARENTS);

					if (pageIndex != 0) {
						objectNeedsToBeAdded = false;
					}
				}
			}

			if (objectNeedsToBeAdded) {
				resultArray.add(cosObject);
				collectStructElements(cosObject, parentDictionary, overlayStructObjects, refPage);
			}
		}
		parentDictionary.setItem(COSName.K, resultArray);
	}

	private void collectStructElementsOutOfDictionary(
		COSDictionary parentDictionary,
		List<COSBase> overlayStructObjects,
		COSBase refPage,
		COSDictionary dictionary
	) {
		dictionary.setItem(COSName.P, parentDictionary);

		final var page = dictionary.getItem(COSName.PG);

		// set source page as ref
		if (page != null) {
			dictionary.setItem(COSName.PG, refPage);
		}

		if (dictionary.getItem(COSName.K) != null) {
			collectStructElements(dictionary.getItem(COSName.K), dictionary, overlayStructObjects, refPage);
		}
	}

	private int extractPageIndexFromStruct(
		@NonNull final COSDictionary structDictionary
	) {
		final var pageIndex = getPageStructIndex(structDictionary);

		if (pageIndex != -1) {
			return pageIndex;
		}

		throw new OverlayWithTaggingException("The corresponding page object has no page index assigned");
	}

	private int getPageStructIndex(
		@NonNull final COSBase structObject
	) {
		if (structObject instanceof COSDictionary dictionary) {
			return getPageStructIndexOutOfDictionary(dictionary);
		} else if (structObject instanceof COSArray cosArray) {
			final var results = new ArrayList<Integer>();
			for (final var cosObject : cosArray) {
				results.add(getPageStructIndex(cosObject));
			}
			final var minValue = results.stream()
				.mapToInt(v -> v)
				.filter(v -> v != -1)
				.min();
			if (minValue.isPresent()) {
				return minValue.getAsInt();
			}
		}

		return -1;
	}

	private int getPageStructIndexOutOfDictionary(COSDictionary dictionary) {
		final var pageItem = dictionary.getItem(COSName.PG);
		final var parentItem = dictionary.getItem(COSName.P);
		final var kItem = dictionary.getItem(COSName.K);
		final var mcidItem = dictionary.getItem(COSName.MCID);

		final var pageStructParent = getPageStructIndexFromPageObject(pageItem);

		if (kItem != null || mcidItem != null) {
			final var item = kItem != null ? kItem : mcidItem;

			return Objects.requireNonNullElseGet(pageStructParent, () -> getPageStructIndex(item));
		// fix page number extraction for empty "div" elements only if they are on root level
		} else if (parentItem instanceof COSDictionary parentItemDictionary) {
			final var type = parentItemDictionary.getCOSName(COSName.S);

			if (
				type != null &&
					(type.equals(COSName.DOCUMENT) || type.equals(COSName.PART)) &&
					pageStructParent != null
			) {
				return pageStructParent;
			}
		}
		return -1;
	}

	private Integer getPageStructIndexFromPageObject(
		final COSBase pageItem
	) {
		if (pageItem instanceof COSDictionary pageItemDictionary) {
			return pageItemDictionary.getInt(COSName.STRUCT_PARENTS);
		}

		return null;
	}

	private void setUpdatedTaggingIndexes(
		@NonNull final COSBase structObject,
		@NonNull final COSDictionary parentDictionary,
		@NonNull final Map<Integer, Map<Integer, Integer>> updatedTaggingIndexesPerPage
	) {
		setUpdatedTaggingIndexes(structObject, parentDictionary, updatedTaggingIndexesPerPage, COSName.K);
	}

	private void setUpdatedTaggingIndexes(
		@NonNull final COSBase structObject,
		@NonNull final COSDictionary parentDictionary,
		@NonNull final Map<Integer, Map<Integer, Integer>> updatedTaggingIndexesPerPage,
		@NonNull final COSName cosName
	) {
		switch (structObject) {
			case COSDictionary dictionary -> setUpdatedTaggingIndexesInDictionary(updatedTaggingIndexesPerPage, dictionary);
			case COSArray cosArray -> {
				final var resultArray = new COSArray();
				for (final var cosObject : cosArray) {
					if (cosObject instanceof COSInteger intValue) {
						resultArray.add(COSInteger.get(
							getUpdatedTaggingIndex(updatedTaggingIndexesPerPage, parentDictionary, intValue)
						));
					} else {
						setUpdatedTaggingIndexes(cosObject, parentDictionary, updatedTaggingIndexesPerPage);
						resultArray.add(cosObject);
					}
				}
				parentDictionary.setItem(COSName.K, resultArray);
			}
			case COSInteger intValue -> parentDictionary.setInt(cosName, getUpdatedTaggingIndex(updatedTaggingIndexesPerPage, parentDictionary, intValue));
			default -> throw new PrintException("This type of recursive 'K' item is not covered");
		}
	}

	private void setUpdatedTaggingIndexesInDictionary(Map<Integer, Map<Integer, Integer>> updatedTaggingIndexesPerPage, COSDictionary dictionary) {
		final var kItem = dictionary.getItem(COSName.K);
		final var mcidItem = dictionary.getItem(COSName.MCID);

		if (kItem != null || mcidItem != null) {
			final var item = kItem != null ? kItem : mcidItem;
			setUpdatedTaggingIndexes(
				item,
				dictionary,
				updatedTaggingIndexesPerPage,
				kItem != null ? COSName.K : COSName.MCID
			);
		}
	}

	private Integer getUpdatedTaggingIndex(
		@NonNull final Map<Integer, Map<Integer, Integer>> updatedTaggingIndexesPerPage,
		@NonNull final COSDictionary parentDictionary,
		@NonNull final COSInteger intValue
	) {
		final var pageNumber = extractPageIndexFromStruct(parentDictionary);
		final var updatedTaggingIndexes = updatedTaggingIndexesPerPage.get(pageNumber);
		final var updatedTaggingId = updatedTaggingIndexes.get(intValue.intValue());

		if (updatedTaggingId == null) {
			throw new OverlayWithTaggingException(String.format("There is no updated tagging index for the origin index %d", intValue.intValue()));
		}

		return updatedTaggingId;
	}

	@Value
	private static class OverlayDocument {
		COSStream contentStream;
		Map<ResourceKey, Integer> maxIndexes;

		int maxTaggingIndex;
		Map<ResourceKey, COSBase> overlaySubResources;

		PDDocumentCatalog documentCatalog;
	}

	private enum ResourceKey {
		IMAGES("Im", COSName.XOBJECT),
		PROPERTIES("Prop", COSName.PROPERTIES),
		G_STATE("gs", COSName.EXT_G_STATE),
		FONTS("F", COSName.FONT);

		private final String identifier;
		private final COSName cosName;

		ResourceKey(
			final String identifier,
			final COSName cosName
		) {
			this.identifier = identifier;
			this.cosName = cosName;
		}

		public String getIdentifier() {
			return identifier;
		}

		public COSName getCosName() {
			return cosName;
		}
	}

	private static class Incrementer {
		private int index;

		public Incrementer(int initialValue) {
			this.index = initialValue;
		}

		public int increase() {
			index = index + 1;
			return index;
		}
	}

	@Value
	private static class OverlayStructItems {
		List<COSBase> parentTreeStructItems;
		COSArray generalStructItems;
	}
}
