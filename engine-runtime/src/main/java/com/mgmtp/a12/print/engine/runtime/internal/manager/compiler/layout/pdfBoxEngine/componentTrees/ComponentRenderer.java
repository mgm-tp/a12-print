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
package com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.pdfBoxEngine.componentTrees;

import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.documentHandle.ContainerDocumentHandle;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.documentHandle.SegmentDocumentHandle;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.Component;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.ComponentResult;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.PreflightedComponent;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.Position;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NonNull;
import lombok.Value;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class ComponentRenderer {

	static PreflightResult preflightComponent(
		@NonNull Component component,
		@NonNull ContainerDocumentHandle documentHandle,
		@NonNull Position positionWithOffset,
		boolean preventPageBreak
	) {
		return renderComponent(component, documentHandle, positionWithOffset, preventPageBreak, true);
	}

	static RenderResult renderComponent(
		@NonNull Component component,
		@NonNull ContainerDocumentHandle documentHandle,
		@NonNull Position positionWithOffset,
		boolean preventPageBreak
	) {
		return renderComponent(component, documentHandle, positionWithOffset, preventPageBreak, false);
	}

	private static PreflightResult renderComponent(
		@NonNull Component component,
		@NonNull ContainerDocumentHandle documentHandle,
		@NonNull Position positionWithOffset,
		boolean preventPageBreak,
		boolean isPreflight
	) {
		final var preflightedComponents = new ArrayList<PreflightedComponent>();

		var iteratedY = positionWithOffset.getY();
		Integer pageNumber = null;
		long evaluatedHeightWithoutSections = 0;

		var componentToEvaluate = Optional.of(component);
		while (componentToEvaluate.isPresent()) {
			final var newPosition = new Position(positionWithOffset.getX(), iteratedY);
			final var regionCursor = pageNumber == null
				? documentHandle.getInitialRegionCursor(newPosition)
				: documentHandle.getPageBreakRegionCursor(newPosition, pageNumber);

			if (regionCursor == null) {
				break;
			}
			pageNumber = regionCursor.getPageNumber();

			final ComponentResult componentResult;

			if (isPreflight) {
				final var preflightedComponent = componentToEvaluate.get().preflight(regionCursor, preventPageBreak);
				preflightedComponents.add(preflightedComponent);
				componentResult = preflightedComponent.getPreflightedComponentResult();
			} else {
				componentResult = componentToEvaluate.get().render(regionCursor, preventPageBreak);
				regionCursor.getContentStream().addAccessibilityData(
					documentHandle,
					componentResult.getAccessibilityData()
				);
			}

			componentToEvaluate = documentHandle instanceof SegmentDocumentHandle
				? componentResult.getRemainingComponent()
				: Optional.empty();

			final var subEvaluatedHeight = componentResult.getEvaluatedHeight();
			iteratedY += subEvaluatedHeight + regionCursor.getSectionOffset();
			evaluatedHeightWithoutSections += subEvaluatedHeight;
		}
		return new PreflightResult(
			iteratedY - positionWithOffset.getY(),
			evaluatedHeightWithoutSections,
			preflightedComponents
		);
	}

	@Data
	public static class RenderResult {
		private final long evaluatedHeight;
		private final long evaluatedHeightWithoutSections;
	}

	@Value
	@EqualsAndHashCode(callSuper = true)
	public static class PreflightResult extends RenderResult {
		List<PreflightedComponent> preflightedComponents;

		public PreflightResult(
			long evaluatedHeight,
			long evaluatedHeightWithoutSections,
			List<PreflightedComponent> preflightedComponents
		) {
			super(evaluatedHeight, evaluatedHeightWithoutSections);
			this.preflightedComponents = preflightedComponents;
		}
	}
}
