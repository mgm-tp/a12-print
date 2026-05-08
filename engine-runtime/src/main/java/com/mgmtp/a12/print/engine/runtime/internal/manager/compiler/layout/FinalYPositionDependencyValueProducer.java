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
package com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout;

import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.runtime.internal.PdfDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalPdfPrintEngineRuntime;

import java.util.ArrayList;
import java.util.Arrays;


public class FinalYPositionDependencyValueProducer implements PdfDependencyValueProvider<Integer, FinalYPositionDependency> {

	@Override
	public ValueFactory<Integer> produce(FinalYPositionDependency dependency, PrintJob job, PrintEngine<?> engine, InternalPdfPrintEngineRuntime runtime) {
		final var dependentSpreadExpressionIds = dependency.getDependentSpreadExpressionIds();
		final var evaluatedHeightOffset = dependency.getEvaluatedHeightOffset();
		final var printDocumentContext = dependency.getPrintDocumentContext();
		final var originPosition = dependency.getOriginPosition();
		final var topMargin = dependency.getTopMargin();

		final var spreads = new ArrayList<Integer>();

		// maximum of the distances between the gravitation Y position and the origin Y position of the dependent elements
		final var maxYPositionDistance = runtime.streamSpreadExpressionManagerDependency(Arrays.stream(dependentSpreadExpressionIds).map(
				dependentSpreadExpressionId -> new SpreadExpressionManagerDependency(
					dependentSpreadExpressionId,
					printDocumentContext,
					evaluatedHeightOffset,
					dependency.getTotalPageCount(),
					dependency.getInitialPageCount(),
					dependency.getRepeatableSegmentIndex()
				)
			)).map(res -> {
				spreads.add(res.getSpread());
				return Math.max(res.getOriginYPosition() - res.getGravitationYPosition(), 0);
			})
			.max(Integer::compare)
			.orElse(0);

		// Y position of the current element, if it would be moved upwards by the maximum distance
		final var movedUpY = originPosition.getY().getValue() - maxYPositionDistance;

		// moved Y position without the top margin
		final var topMostY = movedUpY - topMargin.orElse(0);

		// distance between the Y position without top margin and the lowest dependent element spread
		final var neededDistance = spreads.stream().map(spread -> spread - Math.min(spread, topMostY)).max(Integer::compare).orElse(0);

		final var finalY = movedUpY + neededDistance;

		return () -> finalY;
	}
}
