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

import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.inputSource.ReferenceInputSourceResolver;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalPdfBoxPrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.ComponentTreeReference;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.documentHandle.ContainerDocumentHandle;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.Component;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.PreflightedComponent;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.Position;
import com.mgmtp.a12.print.model.api.inputSource.InputValueSourceResolver;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.element.base.RelativeLayout;
import lombok.Data;
import lombok.NonNull;

import java.util.ArrayList;
import java.util.List;

@Data
public class DefaultPageBreakInterruptionHandler implements ContainerTree.PageBreakInterruptionHandler {
	private final PageBreakInterruptionMode pageBreakInterruptionMode;

	public enum PageBreakInterruptionMode {
		ALLOW,
		PREFLIGHT,
		PREFLIGHT_AND_INTERRUPT
	}

	private List<PreflightedComponent> preflightedComponents;

	private DefaultPageBreakInterruptionHandler(PageBreakInterruptionMode pageBreakInterruptionMode) {
		this.pageBreakInterruptionMode = pageBreakInterruptionMode;
		this.preflightedComponents = new ArrayList<>();
	}

	public static DefaultPageBreakInterruptionHandler allow() {
		return new DefaultPageBreakInterruptionHandler(PageBreakInterruptionMode.ALLOW);
	}

	public static DefaultPageBreakInterruptionHandler preflight() {
		return new DefaultPageBreakInterruptionHandler(PageBreakInterruptionMode.PREFLIGHT);
	}

	public static DefaultPageBreakInterruptionHandler preflightAndInterrupt() {
		return new DefaultPageBreakInterruptionHandler(PageBreakInterruptionMode.PREFLIGHT_AND_INTERRUPT);
	}

	@Override
	public boolean shouldInterruptOnPageBreak() {
		return pageBreakInterruptionMode.equals(PageBreakInterruptionMode.PREFLIGHT_AND_INTERRUPT);
	}

	@Override
	public PageBreakInterruptResult<ComponentRenderer.RenderResult> renderComponent(
		@NonNull final Component component,
		@NonNull final ContainerDocumentHandle documentHandle,
		@NonNull final Position positionWithOffset,
		@NonNull final RelativeLayout.PageBreakBehavior pageBreakBehavior
	) {
		final var currentElementPreventPageBreak = pageBreakBehavior.equals(RelativeLayout.PageBreakBehavior.AVOID);
		if (pageBreakInterruptionMode.equals(PageBreakInterruptionMode.PREFLIGHT_AND_INTERRUPT)) {
			if (currentElementPreventPageBreak && component.isLocatedOnPageBreak(
				documentHandle.getInitialRegionCursor(positionWithOffset)
			)) {
				return PageBreakInterruptResult.interrupted();
			} else {
				return preflightRendering(
					component, documentHandle, positionWithOffset, currentElementPreventPageBreak
				);
			}
		} else if (pageBreakInterruptionMode.equals(PageBreakInterruptionMode.PREFLIGHT)) {
			return preflightRendering(
				component, documentHandle, positionWithOffset, currentElementPreventPageBreak
			);
		}
		return PageBreakInterruptResult.of(ComponentRenderer.renderComponent(
			component, documentHandle, positionWithOffset, currentElementPreventPageBreak
		));
	}

	@Override
	public void addPreflightedComponents(List<PreflightedComponent> preflightedComponents) {
		this.preflightedComponents.addAll(preflightedComponents);
	}

	private PageBreakInterruptResult<ComponentRenderer.RenderResult> preflightRendering(
		@NonNull final Component component,
		@NonNull final ContainerDocumentHandle documentHandle,
		@NonNull final Position positionWithOffset,
		boolean preventPageBreak
	) {
		final var preflightResult = ComponentRenderer.preflightComponent(
			component, documentHandle, positionWithOffset, preventPageBreak
		);
		addPreflightedComponents(preflightResult.getPreflightedComponents());
		return PageBreakInterruptResult.of(preflightResult);
	}

	static RelativeLayout.PageBreakBehavior resolvePageBreakBehaviorSource(
		@NonNull ComponentTreeReference componentTreeReference,
		@NonNull InternalPdfBoxPrintEngineRuntime runtime
	) {
		final var referenceTrace = componentTreeReference.getReferenceTrace();
		return InputValueSourceResolver.getInputValue(
			componentTreeReference.getPageBreakBehavior(),
			RelativeLayout.PageBreakBehavior::fromString,
			ReferenceInputSourceResolver.builder()
				.runtime(runtime)
				.printModelTreeTrace(new PrintModelTreeTrace<>(
					referenceTrace.getPath(),
					referenceTrace.getTracedElement()
				))
				.build()
		).orElseThrow();
	}
}
