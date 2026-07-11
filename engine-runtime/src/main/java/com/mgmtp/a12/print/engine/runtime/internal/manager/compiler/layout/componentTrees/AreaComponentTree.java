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

import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalPdfBoxPrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.ComponentTreeDependency;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.ComponentTreeReference;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.ComponentTreeResult;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.PreflightedComponent;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.Position;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.Variable;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.container.TopLevelReferenceContainer;
import com.mgmtp.a12.print.model.api.model.element.base.DataContext;
import com.mgmtp.a12.print.model.api.model.element.type.area.Area;
import lombok.EqualsAndHashCode;
import lombok.NonNull;
import lombok.Value;

import java.util.ArrayList;
import java.util.List;

import static com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.ComponentTreeResult.*;
import static com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.componentTrees.DefaultPageBreakInterruptionHandler.resolvePageBreakBehaviorSource;
import static com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.componentTrees.NestedContainerPageBreakHandler.handlePageBreakPreventContainerRendering;

@Value
@EqualsAndHashCode(callSuper = true)
public class AreaComponentTree extends ContainerComponentTree {

	@NonNull PrintModelTreeTrace<TopLevelReferenceContainer> parentTopLevelReferenceContainerTrace;
	@NonNull Area area;

	long bottomLineTopMargin;

	@NonNull ComponentTreeReference componentTreeReference;

	public AreaComponentTree(
		@NonNull String id,
		@NonNull Area container,
		@NonNull PrintModelTreeTrace<TopLevelReferenceContainer> parentTopLevelReferenceContainerTrace,
		@NonNull List<ComponentTreeReference> componentTreeReferences,
		long bottomLineTopMargin,
		@NonNull ComponentTreeReference componentTreeReference
	){
		super(id, container, componentTreeReferences);
		this.area = container;
		this.bottomLineTopMargin = bottomLineTopMargin;
		this.componentTreeReference = componentTreeReference;
		this.parentTopLevelReferenceContainerTrace = parentTopLevelReferenceContainerTrace;
	}

	@Override
	public ValueFactory<PageBreakInterruptResult<ComponentTreeResult>> produce(ComponentTreeDependency dependency, PrintJob job, PrintEngine<?> engine, InternalPdfBoxPrintEngineRuntime runtime) {
		final var printDocumentContext = dependency.getPrintDocumentContext();
		final var documentHandle = dependency.getContainerDocumentHandle();
		final var positionOffset = dependency.getPositionOffset();
		final var shouldInterruptOnPageBreak = dependency.shouldInterruptOnPageBreak();
		final var repAreaContext = area.getAreaProperties().getDataContexts().stream()
			.filter(DataContext::isRepetition).findFirst();
		final var pageBreakBehavior = resolvePageBreakBehaviorSource(componentTreeReference, runtime);

		if (positionOffset == null) {
			throw new PrintException("There needs to be a position offset for areas");
		}

		final var containerTreeBuilder = ContainerTree.builder()
			.containerTrace(parentTopLevelReferenceContainerTrace.createDescendent(super.getContainer()))
			.containerComponentTreeReference(componentTreeReference)
			.componentTreeReferences(super.getComponentTreeReferences())
			.bottomLineTopMargin(bottomLineTopMargin)
			.containerDocumentHandle(documentHandle)
			.runtime(runtime);

		if (repAreaContext.isPresent()) {
			final var yPosition = positionOffset.getY();
			final var documentContextRepetitions = printDocumentContext
				.findRepetitions(Variable.abs(repAreaContext.get().getPath()))
				.toList();

			if (documentContextRepetitions.isEmpty()) {
				final var hiddenSpread = getHiddenSpread(yPosition);
				return () -> PageBreakInterruptResult.of(new ComponentTreeResult(
					hiddenSpread,
					hiddenSpread,
					getHiddenGravitationYPosition(yPosition, componentTreeReference),
					0L
				));
			}

			final int documentContextRepetitionCount = documentContextRepetitions.size();
			final int repetitionCount = area.getAreaProperties().getMaxRepetitions().map(maxRepetitions ->
				Math.min(
					documentContextRepetitionCount,
					maxRepetitions
				)
			).orElse(documentContextRepetitionCount);

			long repetitionSpread = yPosition;
			long heightWithoutSections = 0L;
			long extraElementSpace = 0L;
			final var repetitionResults = new ArrayList<ComponentTreeResult>();
			final var preflightedComponents = new ArrayList<PreflightedComponent>();
			for (var i = 0; i < repetitionCount; i++) {
				final var repetition = documentContextRepetitions.get(i);

				final var interruptibleComponentTreeResult = handlePageBreakPreventContainerRendering(
					containerTreeBuilder
						.printDocumentContext(repetition)
						.positionOffset(new Position(positionOffset.getX(), repetitionSpread)),
					documentHandle,
					new Position(positionOffset.getX(), repetitionSpread),
					pageBreakBehavior,
					shouldInterruptOnPageBreak
				);
				if (interruptibleComponentTreeResult.isInterrupted()) {
					return PageBreakInterruptResult::interrupted;
				}
				final var componentTreeResult = interruptibleComponentTreeResult.getResult();
				repetitionResults.add(componentTreeResult);
				repetitionSpread = componentTreeResult.getSpreadWithoutMargin();
				heightWithoutSections += componentTreeResult.getHeightOfElementWithoutSections();
				extraElementSpace += componentTreeResult.getExtraElementSpace();
				preflightedComponents.addAll(componentTreeResult.getPreflightedComponents());
			}

			final var heightOfAllRepetitions = repetitionSpread - yPosition;
			final var spread = getSpread(yPosition, heightOfAllRepetitions, componentTreeReference.getPrimitiveBottomMargin());
			final var spreadWithoutMargin = getSpreadWithoutMargin(yPosition, heightOfAllRepetitions);

			long finalHeightWithoutSections = heightWithoutSections;
			long finalExtraElementSpace = extraElementSpace;
			return () -> PageBreakInterruptResult.of(new ComponentTreeResult(
				spread,
				spreadWithoutMargin,
				getGravitationYPosition(yPosition, heightOfAllRepetitions, componentTreeReference.getSize().getHeight()),
				finalHeightWithoutSections,
				finalExtraElementSpace,
				repetitionResults,
				preflightedComponents
			));
		} else {
			containerTreeBuilder
				.printDocumentContext(printDocumentContext)
				.positionOffset(positionOffset);
			return () -> handlePageBreakPreventContainerRendering(
				containerTreeBuilder,
				documentHandle,
				positionOffset,
				pageBreakBehavior,
				shouldInterruptOnPageBreak
			);
		}
	}
 }
