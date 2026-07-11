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
package com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.componentTrees;

import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.ComponentTreeResult;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.documentHandle.ContainerDocumentHandle;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.Position;
import com.mgmtp.a12.print.model.api.model.element.base.RelativeLayout;
import lombok.NonNull;

public class NestedContainerPageBreakHandler {
	private NestedContainerPageBreakHandler() {}

	static PageBreakInterruptResult<ComponentTreeResult> handlePageBreakPreventContainerRendering(
		@NonNull ContainerTree.ContainerTreeBuilder containerTreeBuilder,
		@NonNull ContainerDocumentHandle documentHandle,
		@NonNull Position positionOffset,
		@NonNull RelativeLayout.PageBreakBehavior pageBreakBehavior,
		boolean parentContainerAvoidPageBreak
	) {
		final var currentContainerAvoidPageBreak = pageBreakBehavior.equals(RelativeLayout.PageBreakBehavior.AVOID);
		final var pageBreakInterruptionHandler = getPageBreakInterruptionHandler(
			currentContainerAvoidPageBreak,
			parentContainerAvoidPageBreak
		);
		var pageBreakInterruptResult = containerTreeBuilder
			.pageBreakInterruptionHandler(pageBreakInterruptionHandler)
			.build()
			.getContainerComponentTreeResult();

		if (pageBreakInterruptResult.isInterrupted()) {
			if (parentContainerAvoidPageBreak) {
				return PageBreakInterruptResult.interrupted();
			}

			final var remainingSpace = documentHandle.getRemainingSpace(positionOffset);
			pageBreakInterruptResult = containerTreeBuilder
				.pageBreakInterruptionHandler(DefaultPageBreakInterruptionHandler.allow())
				.positionOffset(new Position(
					positionOffset.getX(),
					positionOffset.getY() + remainingSpace
				))
				.build()
				.getContainerComponentTreeResult();
			return PageBreakInterruptResult.of(
				pageBreakInterruptResult.getResult().toBuilder()
					.extraElementSpace(remainingSpace)
					.wasInterrupted(true)
					.build()
			);
		} else {
			if (!currentContainerAvoidPageBreak && !parentContainerAvoidPageBreak) {
				return PageBreakInterruptResult.of(pageBreakInterruptResult.getResult());
			} else if (currentContainerAvoidPageBreak && !parentContainerAvoidPageBreak) {
				pageBreakInterruptionHandler.getPreflightedComponents().forEach(preflightedComponent -> {
					final var preflightRenderingResult = preflightedComponent.renderPreflightedComponent();
					preflightRenderingResult.getRegionCursor().getContentStream().addAccessibilityData(
						documentHandle,
						preflightRenderingResult.getComponentResult().getAccessibilityData()
					);
				});
				return PageBreakInterruptResult.of(pageBreakInterruptResult.getResult());
			} else {
				return PageBreakInterruptResult.of(pageBreakInterruptResult.getResult().toBuilder()
						.preflightedComponents(pageBreakInterruptionHandler.getPreflightedComponents())
					.build());
			}
		}
	}

	static DefaultPageBreakInterruptionHandler getPageBreakInterruptionHandler(
		boolean currentContainerAvoidPageBreak,
		boolean parentContainerAvoidPageBreak
	) {
		if (currentContainerAvoidPageBreak) {
			return DefaultPageBreakInterruptionHandler.preflightAndInterrupt();
		} else if (parentContainerAvoidPageBreak) {
			return DefaultPageBreakInterruptionHandler.preflight();
		} else {
			return DefaultPageBreakInterruptionHandler.allow();
		}
	}
}
