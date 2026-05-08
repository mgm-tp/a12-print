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
package com.mgmtp.a12.print.engine.runtime.internal.engine.rendering;

import com.mgmtp.a12.print.engine.runtime.internal.engine.document.PrintDocumentContext;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.SpreadExpressionResult;
import lombok.EqualsAndHashCode;
import lombok.NonNull;
import lombok.Value;
import org.apache.commons.lang3.StringUtils;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Value
@EqualsAndHashCode(exclude = {"screenReadingOrderWeight"})
public class MarkupCollectorKey {
	@NonNull
	String elementId;
	int[][] repetitions;
	int screenReadingOrderWeight;

	public static List<MarkupCollectorKey> ofSpreadExpressionResults(
		boolean activeMarkupCollecting,
		List<SpreadExpressionResult> spreadExpressionResults,
		PrintDocumentContext printDocumentContext
	) {
		return activeMarkupCollecting ? spreadExpressionResults.stream().map(
			result -> new MarkupCollectorKey(
				result.getSpreadExpressionId(),
				printDocumentContext,
				result.getSortablePDDocument().getScreenReadingOrderWeight()
			)
		).collect(Collectors.toList()) : List.of();
	}

	public MarkupCollectorKey(
		@NonNull final String elementId,
		final PrintDocumentContext printDocumentContext,
		int screenReadingOrderWeight
	) {
		this.elementId = MarkupCollector.getHtmlReadyId(elementId);
		this.repetitions = printDocumentContext != null ? printDocumentContext.getFlatRepetitions() : new int[0][0];
		this.screenReadingOrderWeight = screenReadingOrderWeight;
	}

	public MarkupCollectorKey(
		@NonNull final String elementId,
		final PrintDocumentContext printDocumentContext
	) {
		this.elementId = MarkupCollector.getHtmlReadyId(elementId);
		this.repetitions = printDocumentContext != null ? printDocumentContext.getFlatRepetitions() : new int[0][0];
		this.screenReadingOrderWeight = 0;
	}

	public MarkupCollectorKey(
		@NonNull final String elementId,
		int[][] repetitions
	) {
		this.elementId = MarkupCollector.getHtmlReadyId(elementId);
		this.repetitions = repetitions;
		this.screenReadingOrderWeight = 0;
	}

	public MarkupCollectorKey(@NonNull final String elementId) {
		this.elementId = MarkupCollector.getHtmlReadyId(elementId);
		this.repetitions = new int[0][0];
		this.screenReadingOrderWeight = 0;
	}

	public String getElementComment() {
		return String.format("<!-- %s %s -->\n",
			this.getElementId(),
			StringUtils.join(Arrays.stream(this.getRepetitions()).map(
				rep -> StringUtils.join(
						Arrays.stream(rep).mapToObj(Integer::toString)
							.toList(), ",")
			).toList(), ";")
		);
	}
}
