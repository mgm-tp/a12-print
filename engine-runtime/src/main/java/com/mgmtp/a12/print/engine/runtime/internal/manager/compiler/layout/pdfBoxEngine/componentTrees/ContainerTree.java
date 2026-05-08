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

import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.PrintDocumentContext;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalPdfBoxPrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.computation.ComputationExpression;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.pdfBoxEngine.*;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.provider.LogicContainerEvaluationDependency;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.documentHandle.ContainerDocumentHandle;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.documentHandle.SectionDocumentHandle;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.documentHandle.SegmentDocumentHandle;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.Component;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.PreflightedComponent;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.ReferenceComponentDependency;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.BoxComponent;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.Position;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.Size;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.container.BaseReferenceContainer;
import com.mgmtp.a12.print.model.api.model.element.ElementType;
import com.mgmtp.a12.print.model.api.model.element.base.RelativeLayout;
import com.mgmtp.a12.print.model.api.model.element.type.boundingBox.BoundingBox;
import com.mgmtp.a12.print.model.api.model.reference.ElementReference;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NonNull;
import lombok.Value;

import java.util.*;

import static com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.pdfBoxEngine.ComponentTreeResult.*;
import static com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.pdfBoxEngine.componentTrees.DefaultPageBreakInterruptionHandler.resolvePageBreakBehaviorSource;
import static com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.Position.addOffset;

@Value
@Builder(toBuilder = true)
@AllArgsConstructor
public class ContainerTree {
	@NonNull PrintModelTreeTrace<? extends BaseReferenceContainer<? extends ElementReference>> containerTrace;
	@NonNull List<ComponentTreeReference> componentTreeReferences;
	Position positionOffset;
	ComponentTreeReference containerComponentTreeReference;
	Long bottomLineTopMargin;
	@NonNull
	ContainerDocumentHandle containerDocumentHandle;
	PrintDocumentContext printDocumentContext;
	@NonNull InternalPdfBoxPrintEngineRuntime runtime;
	@NonNull PageBreakInterruptionHandler pageBreakInterruptionHandler;

	public interface PageBreakInterruptionHandler {
		boolean shouldInterruptOnPageBreak();
		PageBreakInterruptResult<ComponentRenderer.RenderResult> renderComponent(
			@NonNull Component component,
			@NonNull ContainerDocumentHandle documentHandle,
			@NonNull Position positionWithOffset,
			@NonNull RelativeLayout.PageBreakBehavior pageBreakBehavior
		);
		void addPreflightedComponents(List<PreflightedComponent> preflightedComponents);
	}

	public PageBreakInterruptResult<ComponentTreeResult> getContainerComponentTreeResult() {
		var totalPageCount = -1;
		var currentPageCount = -1;
		if (containerDocumentHandle instanceof SectionDocumentHandle sectionDocumentHandle) {
			totalPageCount = sectionDocumentHandle.getTotalPageCount();
			currentPageCount = sectionDocumentHandle.getCurrentPageCount();
		}

		final var elementReferences = componentTreeReferences.stream().map(ref ->
			ref.getReferenceTrace().getTracedElement()
		).toList();
		final var components = runtime.streamReferenceComponentDependency(ReferenceComponentDependency.ofReferences(
			containerTrace, elementReferences, printDocumentContext, containerDocumentHandle.getDocument(), totalPageCount, currentPageCount
		)).toList();

		final var dependentSpreadsResult = renderComponents(components);

		if (dependentSpreadsResult.isInterrupted()) {
			return PageBreakInterruptResult.interrupted();
		}
		final var dependentSpreads = dependentSpreadsResult.getResult();

		// only for top level reference container
		if (positionOffset == null) {
			return PageBreakInterruptResult.of(EMPTY_RESULT);
		}

		final var originHeight = containerComponentTreeReference.getSize().getHeight();
		final var maxElementSpread = dependentSpreads.values().stream()
			.max(Comparator.comparingLong(Spread::getSpread))
			.orElse(null);
		final var containerHeight = maxElementSpread != null ? maxElementSpread.getSpread() - positionOffset.getY() : 0;
		final var containerHeightWithoutSections = maxElementSpread != null ? maxElementSpread.getSpreadWithoutSections() - positionOffset.getY() : 0;

		long elementHeight;
		long elementHeightWithoutSections;
		final var containerHeightWithMargin = containerHeight + (bottomLineTopMargin == null ? 0 : bottomLineTopMargin);
		final var containerHeightWithoutSectionsWithMargin = containerHeightWithoutSections + (bottomLineTopMargin == null ? 0 : bottomLineTopMargin);

		if (containerHeightWithMargin > originHeight) {
			if (containerDocumentHandle instanceof SegmentDocumentHandle && bottomLineTopMargin != null) {
				final var maxSpread = positionOffset.getY() + containerHeight;
				final var distanceSectionOffset = containerDocumentHandle.getDistanceSectionOffset(
					new Position(positionOffset.getX(), maxSpread + bottomLineTopMargin),
					maxSpread
				);
				if (distanceSectionOffset.whiteSpaceIntersectsWithPageBreak() && pageBreakInterruptionHandler.shouldInterruptOnPageBreak()) {
					return PageBreakInterruptResult.interrupted();
				}
				elementHeight = containerHeightWithMargin + distanceSectionOffset.sectionOffset();
			} else {
				elementHeight = containerHeightWithMargin;
			}
			elementHeightWithoutSections = containerHeightWithoutSectionsWithMargin;
		} else {
			if (containerDocumentHandle instanceof SegmentDocumentHandle) {
				// Check if a page break is between end of elements and end of container element
				final var maxSpread = positionOffset.getY() + containerHeight;
				final var distanceSectionOffset = containerDocumentHandle.getDistanceSectionOffset(
					new Position(positionOffset.getX(), positionOffset.getY() + originHeight),
					maxSpread
				);
				if (distanceSectionOffset.whiteSpaceIntersectsWithPageBreak() && pageBreakInterruptionHandler.shouldInterruptOnPageBreak()) {
					return PageBreakInterruptResult.interrupted();
				}
				elementHeight = originHeight + distanceSectionOffset.sectionOffset();
			} else {
				elementHeight = originHeight;
			}
			elementHeightWithoutSections = originHeight;
		}

		final var originYPosition = positionOffset.getY();
		return PageBreakInterruptResult.of(new ComponentTreeResult(
			getSpread(originYPosition, elementHeight, containerComponentTreeReference.getPrimitiveBottomMargin()),
			getSpreadWithoutMargin(originYPosition, elementHeight),
			getGravitationYPosition(originYPosition, elementHeight, originHeight),
			elementHeightWithoutSections
		));
	}

	private boolean isEmptyComponent(Component component) {
		final var optComponent = Optional.ofNullable(component);
		return optComponent.isEmpty() || (!(optComponent.get() instanceof BoxComponent) && optComponent.get().getSize().getHeight() == 0);
	}

	private PageBreakInterruptResult<Map<String, Spread>> renderComponents(List<Component> components) {
		final var dependentSpreads = new HashMap<String, Spread>();
		for (var i = 0; i < components.size(); i++) {
			var optComponent = Optional.ofNullable(components.get(i));
			final var componentTreeReference = componentTreeReferences.get(i);
			final var refId = componentTreeReference.getId();
			final var bottomMargin = componentTreeReference.getPrimitiveBottomMargin();

			final var dependentReferenceIds = Arrays.asList(componentTreeReference.getDependentReferenceIds());
			final var currentSpreads = getCurrentSpreads(dependentReferenceIds, dependentSpreads);

			final var positionWithOffset = addOffset(componentTreeReference.getPosition(), positionOffset);
			final long yWithOffset = positionWithOffset.getY();
			final long xWithOffset = positionWithOffset.getX();

			// Handles section offsets for top most elements inside nested elements
			final var distanceSectionOffset = currentSpreads.isEmpty() && positionOffset != null
				? containerDocumentHandle.getDistanceSectionOffset(positionWithOffset, positionOffset.getY())
				: new SegmentDocumentHandle.DistanceSectionOffset(0, false);

			if (distanceSectionOffset.whiteSpaceIntersectsWithPageBreak() && pageBreakInterruptionHandler.shouldInterruptOnPageBreak()) {
				return PageBreakInterruptResult.interrupted();
			}

			final var finalYResultWithOffset = containerDocumentHandle.getFinalY(
				componentTreeReference,
				currentSpreads,
				yWithOffset + distanceSectionOffset.sectionOffset(),
				positionOffset != null
			);

			if (finalYResultWithOffset.whiteSpaceIntersectsWithPageBreak() && pageBreakInterruptionHandler.shouldInterruptOnPageBreak()) {
				return PageBreakInterruptResult.interrupted();
			}

			final long finalYWithOffset = finalYResultWithOffset.finalY();

			final var finalPositionWithOffset = new Position(xWithOffset, finalYWithOffset);

			// Return empty spread if the element is hidden
			if (isEmptyComponent(optComponent.orElse(null))) {
				dependentSpreads.put(
					refId,
					optComponent.map(component ->
						getEmptySpread(finalYWithOffset, yWithOffset, component.getSize(), bottomMargin, componentTreeReference)
					).orElseGet(() -> getHiddenDependentSpread(finalYWithOffset, yWithOffset, componentTreeReference))
				);
				continue;
			}
			var component = optComponent.get();
			if (!component.getId().equals(refId)) {
				throw new PrintException("The component and reference are not in line");
			}

			// if the element is a switch, bounding box or area
			ComponentTreeResult componentTreeResult = null;
			ElementType elementType = null;
			if (component instanceof BoxComponent boxComponent) {
				elementType = boxComponent.getElementType();
				if (elementType.equals(ElementType.OVERRIDE)) {
					component = getSpecialOverrideComponent(component, printDocumentContext);
					elementType = ElementType.BOUNDING_BOX;
					if (component == null || component.getSize().getHeight() == 0) {
						dependentSpreads.put(
							refId,
							component == null
								? getHiddenDependentSpread(finalYWithOffset, yWithOffset, componentTreeReference)
								: getEmptySpread(finalYWithOffset, yWithOffset, component.getSize(), bottomMargin, componentTreeReference)
						);
						continue;
					}
				}

				final var nestedContainerResult = runtime.provide(new ComponentTreeManagerDependency(
					refId,
					containerDocumentHandle,
					printDocumentContext,
					finalPositionWithOffset,
					pageBreakInterruptionHandler.shouldInterruptOnPageBreak()
				)).get();
				if (nestedContainerResult.isInterrupted()) {
					return PageBreakInterruptResult.interrupted();
				}
				componentTreeResult = nestedContainerResult.getResult();
				pageBreakInterruptionHandler.addPreflightedComponents(componentTreeResult.getPreflightedComponents());
			}

			final var pageBreakBehavior = resolvePageBreakBehaviorSource(componentTreeReference, runtime);
			final var renderResult = getRenderResult(
				componentTreeResult,
				component,
				xWithOffset,
				finalYWithOffset,
				elementType,
				finalPositionWithOffset,
				pageBreakBehavior
			);

			if (renderResult.isInterrupted()) {
				return PageBreakInterruptResult.interrupted();
			}

			final var yWithoutSections = ContainerDocumentHandle.getFinalYHelper(
				componentTreeReference,
				currentSpreads,
				yWithOffset,
				false
			).finalY();
			// use container spread if the current element is a nested container
			if (componentTreeResult != null && !elementType.equals(ElementType.BOUNDING_BOX)) {
				final var spreadWithoutSections = getSpread(
					yWithoutSections,
					componentTreeResult.getHeightOfElementWithoutSections() + componentTreeResult.getExtraElementSpace(),
					bottomMargin
				);
				dependentSpreads.put(refId, new Spread(
					componentTreeResult.getSpread(),
					componentTreeResult.getGravitationYPosition(),
					yWithOffset,
					componentTreeResult.getSpreadWithoutMargin(),
					spreadWithoutSections
				));
			} else if (renderResult.getResult().isPresent()) {
				final var renderResultValue = renderResult.getResult().get();
				final var evaluatedHeight = renderResultValue.getEvaluatedHeight();
				final var spread = getSpread(finalYWithOffset, evaluatedHeight, bottomMargin);
				final var spreadWithoutSections = getSpread(yWithoutSections, renderResultValue.getEvaluatedHeightWithoutSections(), bottomMargin);
				dependentSpreads.put(
					refId,
					new Spread(
						spread,
						getGravitationYPosition(finalYWithOffset, evaluatedHeight, componentTreeReference.getSize().getHeight()),
						yWithOffset,
						spread - bottomMargin,
						spreadWithoutSections
					)
				);
			} else {
				throw new PrintException("There is no container result and element rendering result");
			}
		}
		return PageBreakInterruptResult.of(dependentSpreads);
	}

	private PageBreakInterruptResult<Optional<ComponentRenderer.RenderResult>> getRenderResult(
		final ComponentTreeResult componentTreeResult,
		@NonNull final Component component,
		long xWithOffset,
		long finalYWithOffset,
		final ElementType elementType,
		@NonNull final Position finalPositionWithOffset,
		RelativeLayout.PageBreakBehavior pageBreakBehavior
	) {
		final var pageBreakBehaviorToApply =
			componentTreeResult != null && !componentTreeResult.wasInterrupted()
				? RelativeLayout.PageBreakBehavior.ALLOW
				: pageBreakBehavior;
		// render repeatable area
		if (componentTreeResult != null && !componentTreeResult.getRepeatableResults().isEmpty()) {
			var repYPosition = 0L;
			for (var repeatableResult : componentTreeResult.getRepeatableResults()) {
				final var subRenderResult = pageBreakInterruptionHandler.renderComponent(
					((BoxComponent) component).toBuilder()
						.size(new Size(component.getSize().getWidth(), repeatableResult.getHeightOfElementWithoutSections()))
						.build(),
					containerDocumentHandle,
					new Position(xWithOffset, finalYWithOffset + repYPosition),
					!repeatableResult.wasInterrupted() ? RelativeLayout.PageBreakBehavior.ALLOW : pageBreakBehavior
				);
				if (subRenderResult.isInterrupted()) {
					return PageBreakInterruptResult.interrupted();
				}
				repYPosition += subRenderResult.getResult().getEvaluatedHeight();
			}
		// render area with new height
		} else if (componentTreeResult != null && elementType.equals(ElementType.AREA)) {
			if(pageBreakInterruptionHandler.renderComponent(
				((BoxComponent) component).toBuilder()
					.size(new Size(component.getSize().getWidth(), componentTreeResult.getHeightOfElementWithoutSections()))
					.build(),
				containerDocumentHandle,
				finalPositionWithOffset,
				pageBreakBehaviorToApply
			).isInterrupted()) {
				return PageBreakInterruptResult.interrupted();
			}
		// render all leaf elements & bounding box. Switch element dont needs to be rendered
		} else if (componentTreeResult == null || elementType.equals(ElementType.BOUNDING_BOX)) {
			final var elementRenderResult = pageBreakInterruptionHandler.renderComponent(component, containerDocumentHandle, finalPositionWithOffset, pageBreakBehaviorToApply);
			return elementRenderResult.isInterrupted()
				? PageBreakInterruptResult.interrupted()
				: PageBreakInterruptResult.of(Optional.of(elementRenderResult.getResult()));
		}
		return PageBreakInterruptResult.of(Optional.empty());
	}

	private static List<Spread> getCurrentSpreads(
		@NonNull final List<String> dependentReferenceIds,
		@NonNull final Map<String, Spread> dependentSpreads
	) {
		return dependentReferenceIds.stream().map(dependentReferenceId -> {
				final var dependentSpread =  dependentSpreads.get(dependentReferenceId);
				if (dependentSpread == null) {
					throw new PrintException("Dependent reference spread for id " + dependentReferenceId + " not found");
				}
				return dependentSpread;
			})
			.toList();
	}

	private static Spread getHiddenDependentSpread(
		long finalYWithOffset,
		long yWithOffset,
		ComponentTreeReference componentTreeReference
	) {
		final var hiddenSpread = getHiddenSpread(finalYWithOffset);
		return new Spread(
			hiddenSpread,
			getHiddenGravitationYPosition(finalYWithOffset, componentTreeReference),
			yWithOffset,
			hiddenSpread,
			hiddenSpread
		);
	}

	private static Spread getEmptySpread(
		long finalYWithOffset,
		long yWithOffset,
		final Size size,
		long bottomMargin,
		ComponentTreeReference componentTreeReference
	) {
		final var spread = getSpread(finalYWithOffset, size.getHeight(), bottomMargin);
		return new Spread(
			spread,
			getGravitationYPosition(finalYWithOffset, size.getHeight(), componentTreeReference.getSize().getHeight()),
			yWithOffset,
			spread - bottomMargin,
			spread
		);
	}

	private Component getSpecialOverrideComponent(
		Component component,
		PrintDocumentContext printDocumentContext
	) {
		final var refId = component.getId();
		final var componentTree = (BoundingBoxComponentTree) runtime.provide(new ComponentTreeDependencySelector(refId)).get();
		final var ref = Optional.of(componentTree.getComponentTreeReference().getReferenceTrace());

		if (ref.filter(p -> !p.getTracedElement()
				.getHideConditions()
				.isEmpty()
			)
			.isPresent()
		) {
			var placeableReference = ref.get();
			var hidden = runtime.provide(
				new LogicContainerEvaluationDependency(placeableReference,
					new ComputationExpression.Parameters()
						.withPrintDocumentContext(printDocumentContext))
			).get();
			if (hidden.getValue().filter(e -> Objects.equals(e, true)).isPresent()) {
				return null;
			}
		}

		final var boundingBox = ((BoundingBox) componentTree.getContainer());
		return new BoxComponent(
			refId,
			Size.ofDimensions(boundingBox.getBoundingBoxProperties().getDimensions()),
			boundingBox.getBorderProperties().orElse(null),
			ElementType.BOUNDING_BOX
		);
	}
}
