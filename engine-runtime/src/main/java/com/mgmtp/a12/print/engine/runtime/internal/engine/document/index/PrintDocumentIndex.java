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
package com.mgmtp.a12.print.engine.runtime.internal.engine.document.index;

import com.mgmtp.a12.kernel.md.document.api.IEntityInstance;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.MutablePrintDocument;
import lombok.Data;

import java.util.Collections;
import java.util.List;

@Data
public class PrintDocumentIndex {
	protected final int elementIndex;
	protected final boolean existing;

	public static int comparePrefix(String a, String b, int end) {
		final var aLen = a.length();
		final var bLen = b.length();

		final var len = Math.min(end, Math.min(aLen, bLen));
		for (var i = 0; i < len; i++) {
			final var cmp = Character.compare(a.charAt(i), b.charAt(i));
			if (cmp != 0) {
				return cmp;
			}
		}

		if (a.length() < end) {
			return -1;
		} else {
			return 0;
		}
	}

	public static int compare(IEntityInstance a, IEntityInstance b) {
		final var aPath = a.getPath();
		final var bPath = b.getPath();
		final var aRepeat = a.getRepetitions();
		final var bRepeat = b.getRepetitions();

		final var absPathDelimiter = aPath.charAt(0);

		if (absPathDelimiter != MutablePrintDocument.PATH_DELIMITER || bPath.charAt(0) != absPathDelimiter) {
			throw new IllegalArgumentException("Paths of the Entity Instance require to be absolute");
		}

		var repetitionIndex = 0;
		var shortestPathLen = Math.min(aPath.length(), bPath.length());
		int i = 1;
		for (; i < shortestPathLen; i++) {

			final var aKey = aPath.charAt(i);
			final var bKey = bPath.charAt(i);

			final var cmp = Character.compare(aKey, bKey);

			if (cmp != 0) {
				return cmp;
			}
			if (aKey == MutablePrintDocument.PATH_DELIMITER) {
				final var rCmp = Integer.compare(aRepeat[repetitionIndex], bRepeat[repetitionIndex]);
				if (rCmp != 0) {
					return rCmp;
				}
				repetitionIndex += 1;
			}

		}

		final var pDelta = Integer.compare(aPath.length(), bPath.length());

		if (pDelta > 0 && aPath.charAt(i) != MutablePrintDocument.PATH_DELIMITER) {
			return pDelta;
		}
		if (pDelta < 0 && bPath.charAt(i) != MutablePrintDocument.PATH_DELIMITER) {
			return pDelta;
		}

		final var rCmp = Integer.compare(aRepeat[repetitionIndex], bRepeat[repetitionIndex]);
		if (rCmp != 0) {
			return rCmp;
		}

		return pDelta;
	}

	public static PrintDocumentIndex find(
		IEntityInstance entityInstance,
		List<IEntityInstance> entityInstances
	) {
		return from(Collections.binarySearch(
			entityInstances,
			entityInstance,
			PrintDocumentIndex::compare
		));
	}

	static PrintDocumentIndex from(int binarySearchResult) {
		if (binarySearchResult < 0) {
			return new PrintDocumentIndex((binarySearchResult + 1) * -1, false);
		} else {
			return new PrintDocumentIndex(binarySearchResult, true);
		}
	}
}
