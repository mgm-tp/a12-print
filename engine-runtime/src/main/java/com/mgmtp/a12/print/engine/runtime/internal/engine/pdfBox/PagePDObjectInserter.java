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
package com.mgmtp.a12.print.engine.runtime.internal.engine.pdfBox;

import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.internal.engine.constant.Constants;
import lombok.NonNull;
import org.apache.commons.lang3.math.NumberUtils;
import org.apache.pdfbox.contentstream.operator.Operator;
import org.apache.pdfbox.cos.*;
import org.apache.pdfbox.pdfparser.PDFStreamParser;
import org.apache.pdfbox.pdfwriter.ContentStreamWriter;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.common.PDStream;
import org.apache.pdfbox.pdmodel.documentinterchange.logicalstructure.PDParentTreeValue;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.apache.pdfbox.pdmodel.interactive.annotation.PDAnnotation;

import java.io.IOException;
import java.io.OutputStream;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.apache.pdfbox.contentstream.operator.OperatorName.*;

public class PagePDObjectInserter implements PDObjectInserter<PageInsertionResult> {
	@NonNull
	private final PDDocument segmentDocument;
	private final int pageIndex;
	private final List<ContainerElementPDObject> headerElementsToAdd;
	private final List<ContainerElementPDObject> footerElementsToAdd;
	@NonNull
	private final List<ContainerElementPDObject> containerElementPDObjects;
	private final COSDictionary structDictionary;
	@NonNull
	private final Incrementer structParentsIncrementer;

	private final PDPage page;
	private final Map<ResourceKey, Incrementer> incrementerMap;
	private final Incrementer taggingIncrementer = new Incrementer(-1);
	private final Map<ResourceKey, COSDictionary> resourcesToAdd  = Arrays.stream(ResourceKey.values()).collect(Collectors.toMap(
		key -> key,
		key -> new COSDictionary()
	));
	private final COSArray parentTreeKElements = new COSArray();
	private final Map<Integer, COSDictionary> annotationParentTreeKElements = new HashMap<>();
	private final Map<String, DeduplicatedType0Font> deduplicatedType0Fonts;
	private final Map<String, COSName> fontResourceNameToAdd = new HashMap<>();
	private final Set<PDFont> simpleFontsToSubset = new HashSet<>();
	private final List<PDAnnotation> annotations = new ArrayList<>();
	private final COSArray kElements = new COSArray();
	private final Set<PDDocument> elementPDDocumentsToClose = new HashSet<>();

	public PagePDObjectInserter(
		@NonNull final PDDocument segmentDocument,
		@NonNull final List<ContainerElementPDObject> containerElementPDObjects,
		final COSDictionary structDictionary,
		@NonNull final Incrementer structParentsIncrementer,
		@NonNull final Map<String, DeduplicatedType0Font> deduplicatedType0Fonts,
		final int pageIndex,
		final List<ContainerElementPDObject> headerElementsToAdd,
		final List<ContainerElementPDObject> footerElementsToAdd
	) {
		this.segmentDocument = segmentDocument;
		this.page = segmentDocument.getPage(pageIndex);
		this.pageIndex = pageIndex;
		this.headerElementsToAdd = headerElementsToAdd;
		this.footerElementsToAdd = footerElementsToAdd;
		this.containerElementPDObjects = containerElementPDObjects;
		this.structDictionary = structDictionary;
		this.structParentsIncrementer = structParentsIncrementer;
		this.deduplicatedType0Fonts = deduplicatedType0Fonts;

		final var properties = ((COSDictionary) page.getResources().getCOSObject().getDictionaryObject(
			COSName.PROPERTIES
		));
		final var maxProp = properties != null ? properties.entrySet().stream().map(entry -> getPropIndex(entry.getKey()))
				.max(Integer::compareTo)
				.orElse(-1)
			: -1;

		this.incrementerMap = Arrays.stream(ResourceKey.values()).collect(Collectors.toMap(
			key -> key,
			key -> new Incrementer(key.equals(ResourceKey.PROPERTIES) ? maxProp : -1)
		));
	}

	public PageInsertionResult getInsertionResult() {
		return new PageInsertionResult(simpleFontsToSubset, kElements, parentTreeKElements, annotationParentTreeKElements, elementPDDocumentsToClose);
	}

	public void process() throws IOException {
		final var pageResources = page.getResources();

		final var parser = new PDFStreamParser(page);
		parser.parse();
		final var tokens = parser.getTokens();
		final var insertIndices = getTokenInsertIndices(tokens);

		var insertIndexOffset = 0;

		if (headerElementsToAdd != null) {
			final var tokensToAdd = new ArrayList<>();
			addPDDocumentHolders(headerElementsToAdd, 0, tokensToAdd, true);
			assert insertIndices.length >= 3;
			tokens.addAll(insertIndices[1], tokensToAdd);
			insertIndexOffset = tokensToAdd.size();
		}

		if (footerElementsToAdd != null) {
			final var tokensToAdd = new ArrayList<>();
			addPDDocumentHolders(footerElementsToAdd, 0, tokensToAdd, true);
			assert insertIndices.length >= 4;
			tokens.addAll(insertIndices[3] + insertIndexOffset, tokensToAdd);
			insertIndexOffset = insertIndexOffset + tokensToAdd.size();
		}

		final var tokensToAdd = new ArrayList<>();
		// add new tokens for the elements
		addPDDocumentHolders(containerElementPDObjects, pageIndex, tokensToAdd, false);

		final var insertIndex = headerElementsToAdd != null || footerElementsToAdd != null ? 4 : 0;
		tokens.addAll(insertIndices[insertIndex] + insertIndexOffset, tokensToAdd);

		assert areTokensValid(tokens);

		// update content with new tokens
		PDStream updatedStream = new PDStream(segmentDocument);
		OutputStream out = updatedStream.createOutputStream();
		ContentStreamWriter tokenWriter = new ContentStreamWriter(out);
		tokenWriter.writeTokens(tokens);
		page.setContents(updatedStream);
		out.close();

		page.setAnnotations(annotations);

		// add all resources from the elements to the page resources
		for (final var resourceKey : resourcesToAdd.keySet()) {
			final var subResources = (COSDictionary) pageResources.getCOSObject().getDictionaryObject(
				resourceKey.getCosName()
			);
			final var resourceToAdd = resourcesToAdd.get(resourceKey);

			if (!resourceToAdd.entrySet().isEmpty()) {
				if (subResources != null) {
					subResources.addAll(resourceToAdd);
				} else {
					pageResources.getCOSObject().setItem(resourceKey.getCosName(), resourceToAdd);
				}
			}
		}
	}

	private void addPDDocumentHolders(
		List<ContainerElementPDObject> containerElementPDObjects,
		int pageIndex,
		List<Object> tokensToAdd,
		boolean isSection
	) throws IOException {
		for (var elementPDObject : containerElementPDObjects) {
			addPDDocumentHolder(elementPDObject, pageIndex, tokensToAdd, isSection);
		}
	}

	private void addPDDocumentHolder(
		ContainerElementPDObject containerElementPDObject,
		int pageIndex,
		List<Object> tokensToAdd,
		boolean isSection
	) throws IOException {
		final var singleElementPDObject = containerElementPDObject.getElementPDObject();
		final var childElements = containerElementPDObject.getChildElements();

		// select fonts, which are not handled already
		final var pdType0Fonts = getPDType0Fonts(singleElementPDObject.getFontsToSubset());

		// add documents/kElements only once
		addKElementsInitially(singleElementPDObject, isSection);

		if (singleElementPDObject.getPageObjects().get(pageIndex) == null) {
			return;
		}

		final var updateResourceMap = new HashMap<COSName, COSName>();

		final var pagePDObject = singleElementPDObject.getPageObjects().get(pageIndex);
		final var fontResources = (COSDictionary) pagePDObject.getResources().get(ResourceKey.FONTS);

		final var tokens = pagePDObject.getContentObjects();
		final var insertTokenIndex = !childElements.isEmpty() ? getTokenInsertIndex(tokens) : -1;

		collectTokensAndResources(tokens, fontResources, childElements, insertTokenIndex, isSection, updateResourceMap, tokensToAdd);

		if (!childElements.isEmpty() && (tokens.isEmpty() || insertTokenIndex == tokens.size())) {
			addPDDocumentHolders(childElements, pageIndex, tokensToAdd, isSection);
		}

		final var updatedMCIDs = updateMCIDsAndCollectFonts(pagePDObject, updateResourceMap, pdType0Fonts);

		final var parentTreeNumbers = pagePDObject.getParentTreeNumbers();
		if (parentTreeNumbers.isPresent()) {
			final var alreadyUpdatedArrayElements = new HashMap<COSBase, Set<Integer>>();
			final var currentParentTreeKElements = setUpdatedTaggingIndexes(parentTreeNumbers.get(), updatedMCIDs, alreadyUpdatedArrayElements);
			parentTreeKElements.addAll(currentParentTreeKElements);

			for (final var annotationWrapper: pagePDObject.getAnnotations()) {
				final var newStructParent = structParentsIncrementer.increase();
				final var annotation = annotationWrapper.getAnnotation();
				annotation.setStructParent(newStructParent);
				annotations.add(annotation);
				annotationParentTreeKElements.put(
					newStructParent,
					updateAnnotationIndexes(annotationWrapper.getParentTree(), annotation.getCOSObject(), updatedMCIDs, alreadyUpdatedArrayElements)
				);
			}
		}
	}

	private void addKElementsInitially(
		@NonNull final ElementPDObject singleElementPDObject,
		boolean isSection
	) {
		if (!singleElementPDObject.isGlobalElementsAreAdded()) {
			elementPDDocumentsToClose.add(singleElementPDObject.getDocumentToClose());
			final var kElementsOptional = singleElementPDObject.getKElements();
			if (getStructDictionary().isPresent() && kElementsOptional.isPresent()) {
				// remove kElements without tagging information & update parent and page information in kElements
				final var cleanedUpAndUpdatedKElements = cleanUpAndUpdateKElements(kElementsOptional.get(), isSection);
				this.kElements.addAll(cleanedUpAndUpdatedKElements);
			}
			singleElementPDObject.setGlobalElementsAreAdded(true);
		}
	}

	private void collectTokensAndResources(
		@NonNull final List<Object> tokens,
		final COSDictionary fontResources,
		@NonNull final List<ContainerElementPDObject> childElements,
		final int insertTokenIndex,
		final boolean isSection,
		@NonNull final Map<COSName, COSName> updateResourceMap,
		@NonNull final List<Object> tokensToAdd
	) throws IOException {
		for (var tokenIndex = 0; tokenIndex < tokens.size(); tokenIndex++) {
			final var tokenToAdd = tokens.get(tokenIndex);

			if (!childElements.isEmpty() && tokenIndex == insertTokenIndex) {
				addPDDocumentHolders(childElements, pageIndex, tokensToAdd, isSection);
			}

			final var usedResourceKey = getUsedResourceKey(tokenToAdd);
			usedResourceKey.ifPresentOrElse(
				resourceKey -> {
					final var alreadyUpdatedRes = updateResourceMap.get((COSName) tokenToAdd);
					if (alreadyUpdatedRes != null) {
						tokensToAdd.add(alreadyUpdatedRes);
					} else {
						updateAndCollectResource(tokenToAdd, resourceKey, fontResources, updateResourceMap, tokensToAdd);
					}
				},
				() -> tokensToAdd.add(tokenToAdd)
			);
		}
	}

	private void updateAndCollectResource(
		@NonNull final Object tokenToAdd,
		@NonNull final ResourceKey resourceKey,
		final COSDictionary fontResources,
		@NonNull final Map<COSName, COSName> updateResourceMap,
		@NonNull final List<Object> tokensToAdd
	) {
		COSName newResource;
		final var fontBaseName = resourceKey.equals(ResourceKey.FONTS)
			? getFontBaseName(fontResources.getDictionaryObject((COSName) tokenToAdd))
			: null;
		if (fontBaseName != null && fontResourceNameToAdd.containsKey(fontBaseName)) {
			newResource = fontResourceNameToAdd.get(fontBaseName);
		} else {
			final var newIndex = incrementerMap.get(resourceKey).increase();
			newResource = resourceKey.getCosName(newIndex);

			if (fontBaseName != null) {
				fontResourceNameToAdd.put(fontBaseName, newResource);
			}
		}
		tokensToAdd.add(newResource);
		updateResourceMap.put((COSName) tokenToAdd, newResource);
	}

	private Map<Integer, Integer> updateMCIDsAndCollectFonts(
		@NonNull final ElementPagePDObject pagePDObject,
		@NonNull final Map<COSName, COSName> updateResourceMap,
		@NonNull final Map<String, List<PDType0Font>> pdType0Fonts
	) {
		final var updatedMCIDs = new HashMap<Integer, Integer>();
		for(final var resourceKey : ResourceKey.values()) {
			final var newResources = pagePDObject.getResources().get(resourceKey);
			final var updatedResources = resourcesToAdd.get(resourceKey);
			if (newResources instanceof COSDictionary newResourcesDict) {
				handleUpdatedResourcesForKey(
					newResourcesDict,
					resourceKey,
					pdType0Fonts,
					updatedResources,
					updateResourceMap,
					updatedMCIDs
				);
			}
		}
		return updatedMCIDs;
	}

	private void handleUpdatedResourcesForKey(
		@NonNull final COSDictionary newResourcesDict,
		@NonNull final ResourceKey resourceKey,
		@NonNull final Map<String, List<PDType0Font>> pdType0Fonts,
		@NonNull final COSDictionary updatedResources,
		@NonNull final Map<COSName, COSName> updateResourceMap,
		@NonNull final Map<Integer, Integer> updatedMCIDs
	) {
		for(var newEntry : newResourcesDict.entrySet()) {
			var value = newEntry.getValue();
			COSName finalKey;

			final var fontBaseName = resourceKey.equals(ResourceKey.FONTS) ? getFontBaseName(value) : null;
			if (fontBaseName != null) {
				finalKey = Optional.ofNullable(fontResourceNameToAdd.get(fontBaseName)).orElseThrow(() ->
					new PrintException("There needs to be a new resource key"));

				final var currentFontsToSubset = pdType0Fonts.get(fontBaseName);

				if (currentFontsToSubset != null) {
					final var currentFontToSubset = currentFontsToSubset.stream().filter(font ->
						font.getCOSObject() == newEntry.getValue()).findFirst().orElse(null);

					if (currentFontToSubset == null) {
						throw new PrintException("There needs to be a font to subset");
					}

					if (deduplicatedType0Fonts.containsKey(fontBaseName)) {
						final var fontToAdd = deduplicatedType0Fonts.get(fontBaseName);
						if (fontToAdd.getFontToSubset() != currentFontToSubset) {
							fontToAdd.getFontsToMerge().add(currentFontToSubset);
						}

						if (updatedResources.containsKey(finalKey)) {
							continue;
						}
						value = fontToAdd.getFontToSubset().getCOSObject();
					} else {
						final var currentCodePoints = PDFontReflection.getSubsetCodePoints(currentFontToSubset);
						deduplicatedType0Fonts.put(fontBaseName, new DeduplicatedType0Font(currentFontToSubset, currentCodePoints));
					}
				}
			} else {
				final var newKey = updateResourceMap.get(newEntry.getKey());
				finalKey = newKey != null ? newKey : newEntry.getKey();
			}

			handleMCIDChange(value, finalKey, updatedResources, updatedMCIDs);
		}
	}

	private void handleMCIDChange(
		@NonNull final COSBase value,
		@NonNull final COSName finalKey,
		@NonNull final COSDictionary updatedResources,
		@NonNull final Map<Integer, Integer> updatedMCIDs
	) {
		if (
			value instanceof COSDictionary updatedDict &&
				updatedDict.containsKey(COSName.MCID)
		) {
			final var newDict = new COSDictionary();
			final var newTaggingId = taggingIncrementer.increase();
			if (updatedDict.getInt(COSName.MCID) != newTaggingId) {
				updatedMCIDs.put(updatedDict.getInt(COSName.MCID), newTaggingId);
			}
			newDict.setInt(COSName.MCID, newTaggingId);
			updatedResources.setItem(finalKey, newDict);
		} else {
			updatedResources.setItem(finalKey, value);
		}
	}

	private Optional<COSDictionary> getStructDictionary() {
		return Optional.ofNullable(structDictionary);
	}

	private String getFontBaseName(final COSBase base) {
		return base instanceof COSDictionary dict && dict.getItem(COSName.BASE_FONT) instanceof COSName baseFont
			? baseFont.getName()
			: null;
	}

	private Map<String, List<PDType0Font>> getPDType0Fonts(
		@NonNull final Set<PDFont> fontsToSubset
	) {
		final var notAddedFonts = new HashMap<String, List<PDType0Font>>();
		for (final var fontToSubset : fontsToSubset) {
			if (fontToSubset instanceof PDType0Font pdType0Font && pdType0Font.willBeSubset()) {
				if (notAddedFonts.containsKey(pdType0Font.getName())) {
					notAddedFonts.get(pdType0Font.getName()).add(pdType0Font);
				} else {
					final var newFonts = new ArrayList<PDType0Font>();
					newFonts.add(pdType0Font);
					notAddedFonts.put(pdType0Font.getName(), newFonts);
				}
			} else {
				simpleFontsToSubset.add(fontToSubset);
			}
		}
		return notAddedFonts;
	}

	private COSDictionary updateAnnotationIndexes(
		@NonNull PDParentTreeValue parentTreeNumbers,
		@NonNull COSDictionary annotation,
		@NonNull Map<Integer, Integer> updatedMCIDs,
		@NonNull Map<COSBase, Set<Integer>> alreadyUpdatedArrayElements
	) {
		if (
			parentTreeNumbers.getCOSObject() instanceof COSDictionary annoDictionary &&
				annoDictionary.getItem(COSName.K) instanceof COSArray annoArray
		) {
			final var updatedAnnoArray = new COSArray();
			final var updatedIndexes = alreadyUpdatedArrayElements.containsKey(annoDictionary)
				? alreadyUpdatedArrayElements.get(annoDictionary)
				: new HashSet<Integer>();

			var hasAnnotationObject = hasAnnotationObject(
				annotation,
				updatedMCIDs,
				annoArray,
				updatedIndexes,
				updatedAnnoArray
			);

			if (!hasAnnotationObject) {
				final var newAnnotationObject = new COSDictionary();
				newAnnotationObject.setItem(COSName.OBJ, annotation);
				newAnnotationObject.setItem(COSName.TYPE, COSName.getPDFName("OBJR"));
				updatedAnnoArray.add(newAnnotationObject);
			}

			annoDictionary.setItem(COSName.K, updatedAnnoArray);

			return annoDictionary;
		} else {
			throw new PrintException("Annotation Parent tree element not Valid");
		}
	}

	private static boolean hasAnnotationObject(
		COSDictionary annotation,
		Map<Integer, Integer> updatedMCIDs,
		COSArray annoArray,
		Set<Integer> updatedIndexes,
		COSArray updatedAnnoArray
	) {
		var hasAnnotationObject = false;
		for (var i = 0; i < annoArray.size(); i++) {
			final var item = annoArray.get(i);

			if (updatedIndexes.contains(i)) {
				updatedAnnoArray.add(item);
				continue;
			}

			if (item instanceof COSInteger taggingIndex) {
				if (!updatedMCIDs.isEmpty()) {
					final var updatedTaggingId = updatedMCIDs.get(taggingIndex.intValue());
					if (updatedTaggingId == null) {
						throw new PrintException(String.format("There is no updated tagging index for the origin index %d", taggingIndex.intValue()));
					}
					updatedAnnoArray.add(COSInteger.get(updatedTaggingId));
				} else {
					updatedAnnoArray.add(item);
				}
			} else if (
				item instanceof COSDictionary annoItemDict &&
					annoItemDict.containsKey(COSName.OBJ)
			) {
				annoItemDict.setItem(COSName.OBJ, annotation);
				updatedAnnoArray.add(annoItemDict);
				hasAnnotationObject = true;
			} else {
				throw new PrintException("The type of COSObject is not supported");
			}
		}
		return hasAnnotationObject;
	}

	private COSArray setUpdatedTaggingIndexes(
		@NonNull PDParentTreeValue parentTreeNumbers,
		@NonNull Map<Integer, Integer> updatedMCIDs,
		@NonNull Map<COSBase, Set<Integer>> alreadyUpdatedArrayElements
	) {
		if (!(parentTreeNumbers.getCOSObject() instanceof COSArray currentParentTreeKElements)) {
			throw new PrintException("Parent tree number is not a COSArray");
		}
		if (!updatedMCIDs.isEmpty()) {
			for (var i = 0; i < currentParentTreeKElements.size(); i++) {
				setUpdatedTaggingIndexes(currentParentTreeKElements.get(i), updatedMCIDs, alreadyUpdatedArrayElements, i);
			}
		}
		return currentParentTreeKElements;
	}

	private void setUpdatedTaggingIndexes(
		@NonNull final COSBase structObject,
		@NonNull final Map<Integer, Integer> updatedTaggingIndexes,
		@NonNull final Map<COSBase, Set<Integer>> alreadyUpdatedArrayElements,
		int currentIndex
	) {
		if (structObject instanceof COSDictionary dictionary) {
			final var kItem = dictionary.getItem(COSName.K);
			final var mcidItem = dictionary.getItem(COSName.MCID);

			if (kItem != null || mcidItem != null) {
				final var item = kItem != null ? kItem : mcidItem;
				setUpdatedTaggingIndexes(
					item,
					dictionary,
					updatedTaggingIndexes,
					kItem != null ? COSName.K : COSName.MCID,
					alreadyUpdatedArrayElements,
					currentIndex
				);
			}
		} else {
			throw new PrintException("This type of recursive 'K' item is not covered");
		}
	}

	private void setUpdatedTaggingIndexes(
		@NonNull final COSBase structObject,
		@NonNull final COSDictionary parentDictionary,
		@NonNull final Map<Integer, Integer> updatedTaggingIndexes,
		@NonNull final COSName cosName,
		@NonNull final Map<COSBase, Set<Integer>> alreadyUpdatedArrayElements,
		int currentIndex
	) {
		switch (structObject) {
			case COSArray cosArray -> {
				final var resultArray = new COSArray();
				final var updatedIndexes = alreadyUpdatedArrayElements.containsKey(parentDictionary)
					? alreadyUpdatedArrayElements.get(parentDictionary)
					: new HashSet<Integer>();

				setTaggingIndexesInItems(
					parentDictionary,
					updatedTaggingIndexes,
					currentIndex,
					cosArray,
					updatedIndexes,
					resultArray
				);
				parentDictionary.setItem(COSName.K, resultArray);
				alreadyUpdatedArrayElements.put(parentDictionary, updatedIndexes);
			}
			case COSInteger intValue -> parentDictionary.setInt(cosName, getUpdatedTaggingIndex(updatedTaggingIndexes, intValue, parentDictionary, currentIndex));
			case COSDictionary dictionary when dictionary.containsKey(COSName.MCID) -> dictionary.setInt(
				COSName.MCID,
				getUpdatedTaggingIndex(updatedTaggingIndexes, (COSInteger) dictionary.getItem(COSName.MCID), dictionary, currentIndex)
			);
			default -> throw new PrintException("This type of recursive 'K' item is not covered");
		}
	}

	private void setTaggingIndexesInItems(
		COSDictionary parentDictionary,
		Map<Integer, Integer> updatedTaggingIndexes,
		int currentIndex,
		COSArray cosArray,
		Set<Integer> updatedIndexes,
		COSArray resultArray
	) {
		for (var i = 0; i < cosArray.size(); i++) {
			final var cosObject = cosArray.get(i);
			if (updatedIndexes.contains(i)) {
				resultArray.add(cosObject);
				continue;
			}

			if (cosObject instanceof COSInteger intValue) {
				final int newValue = getUpdatedTaggingIndex(updatedTaggingIndexes, intValue, parentDictionary, currentIndex);
				if (newValue != intValue.intValue()) {
					updatedIndexes.add(i);
				}
				resultArray.add(COSInteger.get(newValue));
			} else {
				if (cosObject instanceof COSDictionary dictionary && dictionary.containsKey(COSName.MCID)) {
					final var originValue = (COSInteger) dictionary.getItem(COSName.MCID);
					final int newValue = getUpdatedTaggingIndex(updatedTaggingIndexes, (COSInteger) dictionary.getItem(COSName.MCID), dictionary, currentIndex);
					if (newValue != originValue.intValue()) {
						updatedIndexes.add(i);
					}
					dictionary.setInt(COSName.MCID, newValue);
				}
				resultArray.add(cosObject);
			}
		}
	}

	private Integer getUpdatedTaggingIndex(
		@NonNull final Map<Integer, Integer> updatedTaggingIndexes,
		@NonNull final COSInteger intValue,
		@NonNull final COSDictionary parentDictionary,
		int currentIndex
	) {
		final var value = intValue.intValue();

		final var structParentsInteger = parentDictionary.getItem(COSName.PG) instanceof COSDictionary pageDictionary &&
				pageDictionary.getItem(COSName.STRUCT_PARENTS) instanceof COSInteger structParents
			? structParents.intValue()
			: null;

		if (value != currentIndex || (structParentsInteger != null && structParentsInteger != this.pageIndex)) {
			return value;
		}

		final var updatedTaggingId = updatedTaggingIndexes.get(value);

		if (updatedTaggingId == null) {
			throw new PrintException(String.format("There is no updated tagging index for the origin index %d", value));
		}

		return updatedTaggingId;
	}

	private COSArray cleanUpAndUpdateKElements(@NonNull final COSArray kElements, boolean isSection) {
		final var resultKElements = new COSArray();
		for (final var kElement : kElements) {
			final var containsKs = updatePageAndParent(kElement, structDictionary, COSName.K, isSection);
			if (containsKs) {
				resultKElements.add(kElement);
			}
		}
		return resultKElements;
	}

	private boolean updatePageAndParent(
		@NonNull final COSBase structObject,
		@NonNull final COSDictionary parentDictionary,
		@NonNull final COSName itemKey,
		boolean isSection
	) {
		switch (structObject) {
			case COSDictionary dictionary -> {
				if (dictionary.containsKey(COSName.P)) {
					dictionary.setItem(COSName.P, parentDictionary);
				}

				final var page = dictionary.getItem(COSName.PG);
				if (page != null) {
					final var originPageIndex = extractOriginPageIndex(page);
					final var pageIndex = isSection ? this.pageIndex : originPageIndex;

					// don't include kElements from sections, which is on next page & elements which don't have a source page in the segment
					if ((isSection && originPageIndex != 0) || !(pageIndex < segmentDocument.getNumberOfPages())) {
						return false;
					}

					dictionary.setItem(COSName.PG, segmentDocument.getPage(pageIndex).getCOSObject());
				}

				final var kItem = dictionary.getItem(COSName.K);
				final var mcidItem = dictionary.getItem(COSName.MCID);

				return updatePageAndParentInDictionary(isSection, dictionary, kItem, mcidItem);
			}
			case COSArray cosArray -> {
				return updatePageAndParentInArray(parentDictionary, itemKey, isSection, cosArray);
			}
			default -> throw new PrintException("This type of recursive 'K' item is not covered");
		}
	}

	private boolean updatePageAndParentInDictionary(boolean isSection, COSDictionary dictionary, COSBase kItem, COSBase mcidItem) {
		if (kItem != null || mcidItem != null) {
			final var item = kItem != null ? kItem : mcidItem;
			if (!(item instanceof COSInteger)) {
				return updatePageAndParent(
					item,
					dictionary,
					kItem != null ? COSName.K : COSName.MCID,
					isSection
				);
			} else {
				return true;
			}
		} else return dictionary.getItem(COSName.S) instanceof COSName name && (
			name == COSName.getPDFName("TD") ||
				name == COSName.getPDFName("TH")
		);
	}

	private boolean updatePageAndParentInArray(COSDictionary parentDictionary, COSName itemKey, boolean isSection, COSArray cosArray) {
		var containsKs = false;
		final var cleanedUpArray = new COSArray();
		for (final var cosObject : cosArray) {
			if (!(cosObject instanceof COSInteger)) {
				final var subContainsKs = updatePageAndParent(cosObject, parentDictionary, itemKey, isSection);
				if (subContainsKs) {
					cleanedUpArray.add(cosObject);
				}
				containsKs = containsKs || subContainsKs;
			} else {
				cleanedUpArray.add(cosObject);
				containsKs = true;
			}
		}
		parentDictionary.setItem(itemKey, cleanedUpArray);
		return containsKs;
	}

	private static int extractOriginPageIndex(@NonNull final COSBase pageObject) {
		if (
			pageObject instanceof COSDictionary pageDictionary &&
				pageDictionary.getItem(COSName.STRUCT_PARENTS) instanceof COSInteger structParents &&
				pageDictionary.getItem(COSName.PARENT) instanceof COSDictionary parentDictionary &&
				parentDictionary.getItem(COSName.KIDS) instanceof COSArray kids
		) {
			for (var i = 0; i < kids.size(); i++) {
				final var kid = kids.get(i);

				if (
					kid instanceof COSDictionary kidDictionary &&
						kidDictionary.getItem(COSName.STRUCT_PARENTS) instanceof COSInteger kidStructParents
				) {
					if (kidStructParents.intValue() == structParents.intValue()) {
						return i;
					}
				} else {
					throw new PrintException("Could not extract page index");
				}
			}
		}

		throw new PrintException("Could not extract page index");
	}

	private static int getTokenInsertIndex(@NonNull final List<Object> tokens) {
		int qCount = 0, QCount = 0, bdcCount = 0, emcCount = 0, artifactIndex = tokens.size(), qIndex = tokens.size();
		boolean allQsInsideArtifact = true;
		for (var i = 0; i < tokens.size(); i++) {
			final var token = tokens.get(i);
			if (token instanceof Operator operator) {
				final var op = operator.getName();
				if (op.equals(SAVE)) {
					if (qCount == QCount && bdcCount == emcCount) {
						allQsInsideArtifact = false;
						qIndex = i;
					}
					qCount++;
				} else if (op.equals(RESTORE)) {
					QCount++;
				} else if (op.equals(BEGIN_MARKED_CONTENT_SEQ)) {
					bdcCount++;
				} else if (op.equals(END_MARKED_CONTENT)) {
					emcCount++;
				}
			} else if (
				token instanceof COSName name &&
					name == COSName.ARTIFACT &&
					bdcCount == emcCount
			) {
				artifactIndex = i;
			}
		}

		return allQsInsideArtifact && qCount != 0 && QCount != 0 ? artifactIndex : qIndex;
	}

	private static int[] getTokenInsertIndices(@NonNull final List<Object> tokens) {
		return IntStream
			.range(0, tokens.size())
			.filter(i -> tokens.get(i) instanceof Operator operator && operator.getName().equals(RESTORE))
			.toArray();
	}

	private static boolean areTokensValid(@NonNull final List<Object> tokens) {
		int qCount = 0, QCount = 0, bdcCount = 0, emcCount = 0;
		for (final var token : tokens) {
			if (token instanceof Operator operator) {
				switch (operator.getName()) {
					case SAVE:
						qCount++;
						break;
					case RESTORE:
						QCount++;
						break;
					case BEGIN_MARKED_CONTENT_SEQ:
						bdcCount++;
						break;
					case END_MARKED_CONTENT:
						emcCount++;
						break;
					default:
						break;
				}
			}
		}

		return qCount == QCount && bdcCount == emcCount;
	}

	private static Optional<ResourceKey> getUsedResourceKey(@NonNull final Object cosName) {
		if (cosName instanceof COSName) {
			for(final var resourceKey : ResourceKey.values()) {
				final var name = ((COSName) cosName).getName();
				if (name.startsWith(resourceKey.getIdentifier())) {
					final var indexString = name.replaceAll(resourceKey.getIdentifier(), Constants.EMPTY_STRING);

					return NumberUtils.isCreatable(indexString) ? Optional.of(resourceKey) : Optional.empty();
				}
			}
		}

		return Optional.empty();
	}

	private static int getPropIndex(@NonNull final COSName name) {
		final var identifier = name.getName();
		if (identifier.startsWith(ResourceKey.PROPERTIES.getIdentifier())) {
			final var indexString = identifier.replaceAll(ResourceKey.PROPERTIES.getIdentifier(), Constants.EMPTY_STRING);

			if (NumberUtils.isCreatable(indexString)) {
				return Integer.parseInt(indexString);
			}
		}

		throw new PrintException("There needs to be an index");
	}
}
