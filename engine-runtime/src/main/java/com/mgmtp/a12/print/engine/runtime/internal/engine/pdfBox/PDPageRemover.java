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
import org.apache.pdfbox.cos.*;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;

import java.util.ArrayList;
import java.util.List;

public class PDPageRemover {
	private PDPageRemover() {}

	public static void remove(
		@NonNull final PDDocument document,
		int startCount,
		int endCount
	) {
		final var removedPages = new ArrayList<COSDictionary>();
		removedPages.addAll(remove(document, startCount, true));
		removedPages.addAll(remove(document, endCount, false));

		deleteElementsWithRemovedPage(document, removedPages);
	}

	public static COSDictionary remove(
		@NonNull final PDDocument document,
		boolean isStart
	) {
		final PDPage page = document.getPage(isStart ? 0 : document.getNumberOfPages() - 1);
		document.removePage(page);
		return page.getCOSObject();
	}

	public static void deleteElementsWithRemovedPage(
		@NonNull final PDDocument document,
		@NonNull List<COSDictionary> removedPages
	) {
		if (removedPages.isEmpty()) {
			return;
		}
		final var structureTreeRoot = document.getDocumentCatalog().getStructureTreeRoot();
		if (structureTreeRoot != null && structureTreeRoot.getK() instanceof final COSDictionary sourceStructDictionary &&
			sourceStructDictionary.getCOSName(COSName.S).equals(COSName.DOCUMENT)
		) {
			deleteElementsWithRemovedPage(sourceStructDictionary, sourceStructDictionary, COSName.K, removedPages);
		}
	}

	public static List<COSDictionary> remove(
		@NonNull final PDDocument document,
		int count,
		boolean isStart
	) {
		final var removedPages = new ArrayList<COSDictionary>();
		for (var i = 0; i < count; i++) {
			removedPages.add(remove(document, isStart));
		}
		return removedPages;
	}

	private static boolean deleteElementsWithRemovedPage(
		@NonNull final COSBase structObject,
		@NonNull final COSDictionary parentDictionary,
		@NonNull final COSName itemKey,
		@NonNull List<COSDictionary> removedPages
	) {
		return switch (structObject) {
			case COSDictionary dictionary -> deletePageOutOfDictionary(dictionary, removedPages);
			case COSArray cosArray -> deletePageOutOfArray(cosArray, parentDictionary, itemKey, removedPages);
			default -> throw new PrintException("This type of recursive 'K' item is not covered");
		};
	}

	private static boolean deletePageOutOfDictionary(
		@NonNull final COSDictionary dictionary,
		@NonNull List<COSDictionary> removedPages
	) {
		final var page = dictionary.getItem(COSName.PG);
		if (page instanceof COSDictionary pageDict && removedPages.contains(pageDict)) {
			return false;
		}

		final var kItem = dictionary.getItem(COSName.K);
		final var mcidItem = dictionary.getItem(COSName.MCID);

		if (kItem != null || mcidItem != null) {
			final var item = kItem != null ? kItem : mcidItem;
			if (!(item instanceof COSInteger)) {
				return deleteElementsWithRemovedPage(item, dictionary, kItem != null ? COSName.K : COSName.MCID, removedPages);
			} else {
				return true;
			}
		} else return dictionary.getItem(COSName.S) instanceof COSName name && (
			name == COSName.getPDFName("TD") ||
				name == COSName.getPDFName("TH")
		);
	}

	private static boolean deletePageOutOfArray(
		@NonNull final COSArray cosArray,
		@NonNull final COSDictionary parentDictionary,
		@NonNull final COSName itemKey,
		@NonNull List<COSDictionary> removedPages
	) {
		var containsKs = false;
		final var cleanedUpArray = new COSArray();
		for (final var cosObject : cosArray) {
			if (!(cosObject instanceof COSInteger)) {
				final var subContainsKs = deleteElementsWithRemovedPage(cosObject, parentDictionary, itemKey, removedPages);
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
}
