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

import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalPdfBoxPrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.computation.ComputationExpression;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.pdfBoxEngine.ComponentTreeDependency;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.pdfBoxEngine.ComponentTreeManagerDependency;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.pdfBoxEngine.ComponentTreeReference;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.pdfBoxEngine.ComponentTreeResult;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.provider.LogicContainerEvaluationDependency;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.PreflightedComponent;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.Position;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.container.TopLevelReferenceContainer;
import com.mgmtp.a12.print.model.api.model.element.type.switchCase.Switch;
import com.mgmtp.a12.print.model.api.model.element.type.switchCase.SwitchCase;
import lombok.EqualsAndHashCode;
import lombok.NonNull;
import lombok.Value;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import static com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.pdfBoxEngine.ComponentTreeResult.*;

@Value
@EqualsAndHashCode(callSuper = true)
public class SwitchComponentTree extends ContainerComponentTree {

	@NonNull PrintModelTreeTrace<TopLevelReferenceContainer> parentTopLevelReferenceContainerTrace;
	@NonNull Switch switchElement;

	@NonNull ComponentTreeReference componentTreeReference;

	public SwitchComponentTree(
		@NonNull String id,
		@NonNull Switch switchElement,
		@NonNull PrintModelTreeTrace<TopLevelReferenceContainer> parentTopLevelReferenceContainerTrace,
		@NonNull List<ComponentTreeReference> componentTreeReferences,
		@NonNull ComponentTreeReference componentTreeReference
	){
		super(id, switchElement, componentTreeReferences);
		this.switchElement = switchElement;
		this.componentTreeReference = componentTreeReference;
		this.parentTopLevelReferenceContainerTrace = parentTopLevelReferenceContainerTrace;
	}

	@Override
	public ValueFactory<PageBreakInterruptResult<ComponentTreeResult>> produce(ComponentTreeDependency dependency, PrintJob job, PrintEngine<?> engine, InternalPdfBoxPrintEngineRuntime runtime) {
		final var printDocumentContext = dependency.getPrintDocumentContext();
		final var documentHandle = dependency.getContainerDocumentHandle();
		final var positionOffset = dependency.getPositionOffset();

		final var visibleAreas = switchElement
			.getReferences()
			.stream()
			.map(SwitchCase.class::cast)
			.filter(switchCase -> {
				final var logicContainerEvaluation = runtime.provide(
					new LogicContainerEvaluationDependency(
						new PrintModelTreeTrace<>(componentTreeReference.getReferenceTrace().getPath(), switchCase),
						new ComputationExpression.Parameters().withPrintDocumentContext(printDocumentContext)
					)
				).get();
				return logicContainerEvaluation.getValue().filter(e -> Objects.equals(e, true)).isPresent();
			})
			.toList();

		final var yPosition = positionOffset.getY();
		if (visibleAreas.isEmpty()) {
			final var hiddenSpread = getHiddenSpread(yPosition);
			return () -> PageBreakInterruptResult.of(new ComponentTreeResult(
				hiddenSpread,
				hiddenSpread,
				getHiddenGravitationYPosition(yPosition, componentTreeReference),
				0L
			));
		}

		long repetitionSpread = yPosition;
		long heightWithoutSections = 0L;
		long extraElementSpace = 0L;
		final var preflightedComponents = new ArrayList<PreflightedComponent>();

		for (final var visibleArea : visibleAreas) {
			final var interruptibleComponentTreeResult = runtime.provide(new ComponentTreeManagerDependency(
				visibleArea.getRefId(),
				documentHandle,
				printDocumentContext,
				new Position(positionOffset.getX(), repetitionSpread),
				dependency.shouldInterruptOnPageBreak()
			)).get();

			if (interruptibleComponentTreeResult.isInterrupted()) {
				return PageBreakInterruptResult::interrupted;
			}
			final var componentTreeResult = interruptibleComponentTreeResult.getResult();

			repetitionSpread = componentTreeResult.getSpreadWithoutMargin();
			heightWithoutSections += componentTreeResult.getHeightOfElementWithoutSections();
			extraElementSpace += componentTreeResult.getExtraElementSpace();
			preflightedComponents.addAll(componentTreeResult.getPreflightedComponents());
		}

		final var heightOfAllRepetitions = repetitionSpread - yPosition;
		final var spread = getSpread(yPosition, heightOfAllRepetitions, componentTreeReference.getPrimitiveBottomMargin());
		final var spreadWithoutMargin = getSpreadWithoutMargin(yPosition, heightOfAllRepetitions);
		final var gravitationYPosition = getGravitationYPosition(
			yPosition,
			heightOfAllRepetitions,
			componentTreeReference.getSize().getHeight()
		);

		long finalHeightWithoutSections = heightWithoutSections;
		long finalExtraElementSpace = extraElementSpace;
		return () -> PageBreakInterruptResult.of(new ComponentTreeResult(
			spread,
			spreadWithoutMargin,
			gravitationYPosition,
			finalHeightWithoutSections,
			finalExtraElementSpace,
			new ArrayList<>(),
			preflightedComponents
		));
	}
}
