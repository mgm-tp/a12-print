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

import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.AttachmentToAppend;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.pdfBoxEngine.ComponentTreeReference;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.pdfBoxEngine.Spread;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.Position;
import lombok.NonNull;
import org.apache.pdfbox.pdmodel.PDDocument;

import java.util.LinkedHashMap;
import java.util.List;

public interface ContainerDocumentHandle {
	PDDocument getDocument();
	RegionCursor getInitialRegionCursor(@NonNull Position position);

	record FinalYResult(long finalY, boolean whiteSpaceIntersectsWithPageBreak) {}

	default FinalYResult getFinalY(
		@NonNull final ComponentTreeReference componentTreeReference,
		@NonNull final List<Spread> currentSpreads,
		long yWithOffset,
		boolean isNested
	) {
		return getFinalYHelper(componentTreeReference, currentSpreads, yWithOffset, true);
	}

	static FinalYResult getFinalYHelper(
		@NonNull final ComponentTreeReference componentTreeReference,
		@NonNull final List<Spread> currentSpreads,
		long yWithOffset,
		boolean withSections
	) {
		final var topMargin = componentTreeReference.getTopMargin();
		final var maxYPositionDistance = currentSpreads
			.stream()
			.map(res -> Math.max(res.getOriginYPosition() - res.getGravitationYPosition(), 0L))
			.max(Long::compare)
			.orElse(0L);

		// Y position of the current element, if it would be moved upwards by the maximum distance
		final var movedUpY = yWithOffset  - maxYPositionDistance;
		// moved Y position without the top margin
		final var topMostY = movedUpY - topMargin.orElse(0L);
		// distance between the Y position without top margin and the lowest dependent element spread
		final var neededDistance = currentSpreads.stream()
			.map(spread -> (withSections ? spread.getSpread() : spread.getSpreadWithoutSections()) -
				Math.min(withSections ? spread.getSpread() : spread.getSpreadWithoutSections(), topMostY))
			.max(Long::compare)
			.orElse(0L);

		return new FinalYResult(movedUpY + neededDistance, false);
	}

	default RegionCursor getPageBreakRegionCursor(@NonNull Position position, int previousPageNumber) {
		// For Sections & Watermarks this should be never called
		return null;
	}

	record DistanceSectionOffset(long sectionOffset, boolean whiteSpaceIntersectsWithPageBreak) {}

	default DistanceSectionOffset getDistanceSectionOffset(@NonNull Position position, long startYToCheckSectionOffset) {
		return new SegmentDocumentHandle.DistanceSectionOffset(0, false);
	}

	default long getRemainingSpace(@NonNull Position position) {
		return 0L;
	}

	// Attachments for Sections & Watermarks are not included in the final PDF
	default void addAttachmentsToAppend(LinkedHashMap<String, AttachmentToAppend> attachmentsToAppend) {}
}
