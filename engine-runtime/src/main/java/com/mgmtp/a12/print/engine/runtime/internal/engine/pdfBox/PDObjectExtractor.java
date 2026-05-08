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
import lombok.NonNull;
import org.apache.pdfbox.contentstream.operator.Operator;
import org.apache.pdfbox.cos.COSArray;
import org.apache.pdfbox.cos.COSBase;
import org.apache.pdfbox.cos.COSDictionary;
import org.apache.pdfbox.cos.COSName;
import org.apache.pdfbox.multipdf.PDFCloneUtility;
import org.apache.pdfbox.pdfparser.PDFStreamParser;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDFontExtractor;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDResources;
import org.apache.pdfbox.pdmodel.common.COSObjectable;
import org.apache.pdfbox.pdmodel.documentinterchange.logicalstructure.PDParentTreeValue;
import org.apache.pdfbox.pdmodel.documentinterchange.logicalstructure.PDStructureTreeRoot;
import org.apache.pdfbox.pdmodel.interactive.annotation.PDAnnotation;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.apache.pdfbox.contentstream.operator.OperatorName.*;

public class PDObjectExtractor {
	@NonNull
	private final PDDocument segmentDocument;

	public PDObjectExtractor(@NonNull final PDDocument segmentDocument) {
		this.segmentDocument = segmentDocument;
	}

	public ElementPDObject extractMarkupPDObject(PDDocument pdDocument) throws IOException {
		// clone utility needs to be recreated for each clone to not produce same objects
		final var pdfCloneUtility = new PDFCloneUtility(segmentDocument);

		final var pdObjectMap = new HashMap<Integer, ElementPagePDObject>();

		final var clonedStruct = cloneStructureTree(pdDocument, pdfCloneUtility);

		final var parentTreeNumbersPerPage = clonedStruct != null
			? clonedStruct.getParentTree().getNumbers()
			: null;

		for (var pageIndex = 0; pageIndex < pdDocument.getNumberOfPages(); pageIndex++) {
			pdObjectMap.put(pageIndex, collectElementPagePDObjectFromPage(
				pdDocument.getPage(pageIndex),
				parentTreeNumbersPerPage,
				pdfCloneUtility
			));
		}

		final var kElement = clonedStruct != null ? getKElements(clonedStruct) : null;
		final var fonts = PDFontExtractor.getFontsToSubset(pdDocument);
		return new ElementPDObject(pdObjectMap, fonts, pdDocument, kElement);
	}

	private static PDStructureTreeRoot cloneStructureTree(
		@NonNull final PDDocument pdDocument,
		@NonNull final PDFCloneUtility pdfCloneUtility
	) throws IOException {
		PDStructureTreeRoot originStruct = pdDocument.getDocumentCatalog().getStructureTreeRoot();
		if (originStruct == null) return null;
		return new PDStructureTreeRoot((COSDictionary) pdfCloneUtility.cloneForNewDocument(originStruct.getCOSObject()));
	}

	private static ElementPagePDObject collectElementPagePDObjectFromPage(
		@NonNull final PDPage page,
		final Map<Integer, COSObjectable> parentTreeNumbersPerPage,
		@NonNull final PDFCloneUtility pdfCloneUtility
	) throws IOException {
		final var resources = page.getResources();

		final var parser = new PDFStreamParser(page);
		parser.parse();

		final var neededTokens = new ArrayList<>();
		final var neededProps = new ArrayList<COSName>();
		collectRelevantTokensAndProps(parser, neededTokens, neededProps);

		final var subResourcesByKey = collectSubResourcesByKeyMap(resources, neededProps);

		final var parentTreeNumbers = parentTreeNumbersPerPage != null
			? parentTreeNumbersPerPage.get(page.getStructParents())
			: null;

		PDParentTreeValue elementParentTreeValue = null;
		if (parentTreeNumbers != null) {
			if (!(parentTreeNumbers instanceof PDParentTreeValue parentTreeValue)) {
				throw new PrintException("Parent tree is not a PDParentTreeValue");
			}
			elementParentTreeValue = parentTreeValue;
		}

		final var annotations = collectAnnotations(
			page.getAnnotations(),
			parentTreeNumbersPerPage,
			pdfCloneUtility
		);

		return new ElementPagePDObject(
			neededTokens,
			subResourcesByKey,
			elementParentTreeValue,
			annotations
		);
	}

	private static Map<ResourceKey, COSBase> collectSubResourcesByKeyMap(
		@NonNull final PDResources resources,
		@NonNull final List<COSName> neededProps
	) {
		final var subResourcesByKey = new HashMap<ResourceKey, COSBase>();
		for (final var resourceKey : ResourceKey.values()) {
			final var subResources = (COSDictionary) resources.getCOSObject().getDictionaryObject(
				resourceKey.getCosName()
			);

			// save only needed properties
			if (resourceKey.equals(ResourceKey.PROPERTIES) && subResources != null) {
				final var propDictionary = new COSDictionary();
				for (final var resKey : subResources.keySet()) {
					if (neededProps.contains(resKey)) {
						propDictionary.setItem(resKey, subResources.getItem(resKey));
					}
				}
				subResourcesByKey.put(resourceKey, propDictionary);
				// all other resources are taken fully into account
			} else {
				subResourcesByKey.put(resourceKey, subResources);
			}
		}
		return subResourcesByKey;
	}

	private static void collectRelevantTokensAndProps(
		@NonNull final PDFStreamParser pdfStreamParser,
		@NonNull final List<Object> neededTokens,
		@NonNull final List<COSName> neededProps
	) {
		final var tokens = pdfStreamParser.getTokens();

		var isReading = false;
		var tokenIndex = 0;

		while (tokenIndex < tokens.size()) {
			final var currentToken = tokens.get(tokenIndex);

			if (!isReading && isEndPathOperator(currentToken)) {
				isReading = true;
				tokenIndex++;
				continue;
			}

			if (isReading && tokenIndex != tokens.size() - 1) {
				if (isEmptyBBoxArtifact(tokens, tokenIndex)) {
					tokenIndex += 4;
					continue;
				}

				if (isNeededProperty(currentToken)) {
					neededProps.add((COSName) currentToken);
				}

				neededTokens.add(currentToken);
			}

			tokenIndex++;
		}
	}

	private static List<PDAnnotationWrapper> collectAnnotations(
		@NonNull final List<PDAnnotation> pageAnnotations,
		final Map<Integer, COSObjectable> parentTreeNumbersPerPage,
		@NonNull final PDFCloneUtility pdfCloneUtility
	) throws IOException {
		final var annotations = new ArrayList<PDAnnotationWrapper>();
		for (final var anno: pageAnnotations) {
			final var tree = parentTreeNumbersPerPage != null
				? parentTreeNumbersPerPage.get(anno.getStructParent())
				: null;
			if (tree != null) {
				if (!(tree instanceof PDParentTreeValue annotationParentTreeValue)) {
					throw new PrintException("Parent tree is not a PDParentTreeValue");
				}
				final var clonedAnnotation = PDAnnotation.createAnnotation(
					pdfCloneUtility.cloneForNewDocument(anno.getCOSObject())
				);
				annotations.add(new PDAnnotationWrapper(clonedAnnotation, annotationParentTreeValue));
			}
		}
		return annotations;
	}

	private static boolean isEndPathOperator(Object token) {
		return token instanceof Operator operator && operator.getName().equals(ENDPATH);
	}

	private static boolean isEmptyBBoxArtifact(List<Object> tokens, int tokenIndex) {
		final var token = tokens.get(tokenIndex);

		if (token instanceof COSName cosName && cosName.equals(COSName.ARTIFACT)) {
			final var prop = getNextToken(tokens, tokenIndex, 1);
			final var bdc = getNextToken(tokens, tokenIndex, 2);
			final var emc = getNextToken(tokens, tokenIndex, 3);

			return prop instanceof COSName propName &&
				propName.getName().startsWith(ResourceKey.PROPERTIES.getIdentifier()) &&
				bdc instanceof Operator bdcOperator && bdcOperator.getName().equals(BEGIN_MARKED_CONTENT_SEQ) &&
				emc instanceof Operator emcOperator && emcOperator.getName().equals(END_MARKED_CONTENT);
		}

		return false;
	}

	private static boolean isNeededProperty(Object token) {
		return token instanceof COSName cosName && cosName.getName().startsWith(ResourceKey.PROPERTIES.getIdentifier());
	}

	private static Object getNextToken(@NonNull final List<Object> tokens, int index, int forward) {
		if (index + forward >= tokens.size()) {
			return null;
		}

		return tokens.get(index + forward);
	}

	private static COSArray getKElements(
		@NonNull final PDStructureTreeRoot sourceStruct
	) {
		if (!(sourceStruct.getK() instanceof final COSDictionary sourceStructDictionary) ||
			!sourceStructDictionary.getCOSName(COSName.S).equals(COSName.DOCUMENT)
		) {
			throw new PrintException("This type of 'K' structure is not covered");
		}
		final var kElement = sourceStructDictionary.getItem(COSName.K);
		if (kElement instanceof COSArray cosArray) {
			return cosArray;
		} else {
			final var kElements = new COSArray();
			kElements.add(kElement);
			return kElements;
		}
	}
}
