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
package com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.pdfBoxEngine;

import com.mgmtp.a12.print.engine.api.PrintModelId;
import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.internal.manager.PrintModelCompilerRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.PrintModelCompilationContext;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.MatchingSections;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.SectionUtils;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.pdfBoxEngine.componentTrees.*;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.Position;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.Size;
import com.mgmtp.a12.print.model.api.model.PrintModel;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.container.BaseReferenceContainer;
import com.mgmtp.a12.print.model.api.model.container.PlaceableReferenceContainer;
import com.mgmtp.a12.print.model.api.model.container.TopLevelReferenceContainer;
import com.mgmtp.a12.print.model.api.model.element.base.Margins;
import com.mgmtp.a12.print.model.api.model.element.properties.PageOrientation;
import com.mgmtp.a12.print.model.api.model.element.type.area.Area;
import com.mgmtp.a12.print.model.api.model.element.type.boundingBox.BoundingBox;
import com.mgmtp.a12.print.model.api.model.element.type.override.OverrideElement;
import com.mgmtp.a12.print.model.api.model.element.type.switchCase.Switch;
import com.mgmtp.a12.print.model.api.model.reference.ElementReference;
import com.mgmtp.a12.print.model.api.model.reference.PlaceableReference;
import com.mgmtp.a12.print.model.api.model.section.ModelSection;
import com.mgmtp.a12.print.model.api.model.segment.ModelSegment;
import com.mgmtp.a12.print.model.api.model.watermark.Watermark;
import com.mgmtp.a12.print.model.api.walker.DescendCommand;
import com.mgmtp.a12.print.model.api.walker.TraversalCommand;
import com.mgmtp.a12.print.model.api.walker.model.PrintModelPath;
import com.mgmtp.a12.print.model.api.walker.model.PrintModelVisitor;
import com.mgmtp.a12.print.model.api.walker.model.PrintModelWalker;
import com.mgmtp.a12.print.model.api.walker.model.resolver.PrintModelResolver;
import lombok.Builder;
import lombok.Data;
import lombok.NonNull;

import java.util.*;
import java.util.stream.Stream;

import static com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.PDFUnitUtil.mmToLongPt;

@Builder
public class ComponentTreeDependencyValueProducerFactory {

	@NonNull
	private final PrintModel printModel;

	@NonNull
	private final PrintModelCompilerRuntime printModelCompilerRuntime;

	public void setDependencyValueProducer(PrintModelCompilationContext context) {
		PlaceableReferenceContainerVisitor placeableReferenceContainerVisitor = PrintModelWalker.walkPrintModelWithDefaultResolver(
			printModel,
			getPrintModelResolver(),
			new PlaceableReferenceContainerVisitor(printModel)
		);
		final var componentTreeMap =
			placeableReferenceContainerVisitor.getComponentTreeMap();

		final var componentTreeManager = new ComponentTreeManager(componentTreeMap);

		context.setComponentTreeManager(componentTreeManager);
		context.setComponentTreeDependencySelectorProducer(new ComponentTreeDependencySelectorProducer(componentTreeMap));
	}

	private PrintModelResolver getPrintModelResolver() {
		return id -> {
			final var printModel = printModelCompilerRuntime.get(PrintModelId.fromString(id)).orElseGet(() -> {
				var model = printModelCompilerRuntime.getManagerApi().loadPrintModel(id);
				return printModelCompilerRuntime.compile(model);
			}).awaitCompilation();

			return printModel == null
				? Optional.empty()
				: Optional.of(new PrintModelTreeTrace<>(PrintModelPath.create(printModel), printModel));
		};
	}

	@Data
	private static class PlaceableReferenceContainerVisitor implements PrintModelVisitor {

		private final HashMap<String, ComponentTree> componentTreeMap = new HashMap<>();
		private final Map<String, ComponentTreeReference> componentTreeReferenceMap = new HashMap<>();

		private final HashMap<String, PrintModelTreeTrace<TopLevelReferenceContainer>> segmentsWithDinSegment = new HashMap<>();

		private final PrintModel printModel;

		@Override
		public DescendCommand descendContainer(BaseReferenceContainer<? extends ElementReference> container, PrintModelPath path, int index) {
			return DescendCommand.ELEMENT_FIRST;
		}

		@Override
		public DescendCommand descendDINTemplate(ModelSegment dinTemplate, PrintModelPath path) {
			return DescendCommand.ELEMENT_FIRST;
		}

		@Override
		public TraversalCommand visitContainer(
			final BaseReferenceContainer<? extends ElementReference> container,
			final PrintModelPath path
		) {
			if (container instanceof PlaceableReferenceContainer placeableReferenceContainer) {
				if (container instanceof ModelSection section) {
					addSectionComponentTrees(section, path);
				} else if (container instanceof ModelSegment segment) {
					final var dinTemplate = segment.getDinTemplate();
					if (dinTemplate.isPresent()) {
						segmentsWithDinSegment.put(dinTemplate.get().getRefId(), new PrintModelTreeTrace<>(
							path,
							segment
						));
					} else {
						final PrintModelTreeTrace<TopLevelReferenceContainer> segmentTrace = new PrintModelTreeTrace<>(path, segment);
						addTopLevelComponentTreeContainer(segmentTrace, placeableReferenceContainer.getReferences().stream().map(segmentTrace::createDescendent).toList());
					}
				} else if (container instanceof Watermark watermark) {
					final PrintModelTreeTrace<TopLevelReferenceContainer> watermarkTrace = new PrintModelTreeTrace<>(path, watermark);
					addTopLevelComponentTreeContainer(watermarkTrace, placeableReferenceContainer.getReferences().stream().map(watermarkTrace::createDescendent).toList());
				} else {
					final var rcTrace = new PrintModelTreeTrace<>(path, placeableReferenceContainer);
					addReferenceAndNestedContainerComponentTree(rcTrace, placeableReferenceContainer.getReferences().stream().map(rcTrace::createDescendent).toList());
				}
			} else if (container instanceof Switch elementReferenceContainer) {
				final var parentTopLevelReferenceContainerTrace = path.findParentTopLevelReferenceContainer().orElseThrow(() -> new PrintException(
					String.format("The nested container %s does not have a segment/section as parent", elementReferenceContainer.getId())
				));
				addNestedContainerComponentTree(elementReferenceContainer, parentTopLevelReferenceContainerTrace, List.of(), 0, null);
			}
			return TraversalCommand.CONTINUE;
		}

		@Override
		public TraversalCommand visitDINTemplate(ModelSegment dinTemplate, PrintModelPath path) {
			final PrintModelTreeTrace<TopLevelReferenceContainer> relatedSegmentTrace = segmentsWithDinSegment.get(dinTemplate.getId());

			if (relatedSegmentTrace == null) {
				throw new PrintException("The corresponding segment was not visited before");
			}

			final var relatedSegment = relatedSegmentTrace.getTracedElement();

			final var dinTemplateTrace = new PrintModelTreeTrace<>(path, dinTemplate);

			addTopLevelComponentTreeContainer(
				relatedSegmentTrace,
				Stream.concat(
					relatedSegment.getReferences().stream().map(relatedSegmentTrace::createDescendent),
					dinTemplate.getReferences().stream().map(dinTemplateTrace::createDescendent)
				).toList()
			);

			return TraversalCommand.CONTINUE;
		}

		@Override
		public TraversalCommand visitOverriddenBoundingBox(BoundingBox boundingBox, PrintModelPath path, OverrideElement overrideElement) {

			final var boundBoxTrace = new PrintModelTreeTrace<PlaceableReferenceContainer>(path, boundingBox);
			addReferenceAndNestedContainerComponentTree(
				boundBoxTrace,
				Stream.concat(
					boundingBox.getReferences().stream().map(boundBoxTrace::createDescendent),
					overrideElement.getReferences().stream().map(boundBoxTrace::createDescendent)
				).toList()
			);

			return TraversalCommand.CONTINUE;
		}

		private void addTopLevelComponentTreeContainer(
			final PrintModelTreeTrace<TopLevelReferenceContainer> containerTrace,
			final Collection<PrintModelTreeTrace<PlaceableReference>> references
		) {
			final var container = containerTrace.getTracedElement();

			final var componentTreeReferences = getComponentTreeReferenceMap(
				references,
				container.getPageOrientation(),
				container instanceof ModelSegment modelSegment
					? getMatchingSections(modelSegment)
					: null
			);

			final var containerComponentTree = new SegmentComponentTree(container.getId(), containerTrace, componentTreeReferences);
			this.componentTreeMap.put(containerComponentTree.getId(), containerComponentTree);
		}

		private void addReferenceAndNestedContainerComponentTree(
			final PrintModelTreeTrace<PlaceableReferenceContainer> placeableReferenceContainerTrace,
			final Collection<PrintModelTreeTrace<PlaceableReference>> references
		) {
			final var placeableReferenceContainer = placeableReferenceContainerTrace.getTracedElement();
			final var parentTopLevelReferenceContainerTrace = placeableReferenceContainerTrace.getPath().findParentTopLevelReferenceContainer().orElseThrow(() -> new PrintException(
				String.format("The nested container %s does not have a segment/section as parent", placeableReferenceContainer.getId())
			));

			final var componentTrees = getComponentTreeReferenceMap(references);

			final var parentSwitch = placeableReferenceContainerTrace
				.getPath()
				.findParentPath(false, (a, e) -> e.getElement() instanceof Switch, s -> s)
				.map(trace -> (Switch) trace.getTracedElement().getElement());

			addNestedContainerComponentTree(
				placeableReferenceContainer,
				parentTopLevelReferenceContainerTrace,
				componentTrees,
				getBottomLineTopMargin(placeableReferenceContainer, componentTrees),
				parentSwitch.orElse(null)
			);
		}

		private void addNestedContainerComponentTree(
			BaseReferenceContainer<? extends ElementReference> container,
			PrintModelTreeTrace<TopLevelReferenceContainer> parentTopLevelReferenceContainerTrace,
			List<ComponentTreeReference> componentTreeReferences,
			long bottomLineTopMargin,
			Switch parentSwitchElement
		) {
			var reference = componentTreeReferenceMap.get(container.getId());
			if (reference == null && parentSwitchElement == null) {
				throw new PrintException("Each nested container needs to have a related placeable reference");
			}

			switch (container) {
				case Area area -> {
					var areaRef = reference;
					if (areaRef == null) {
						final var switchRef = componentTreeReferenceMap.get(parentSwitchElement.getId());
						if (switchRef == null) {
							throw new PrintException("Each Area inside a Switch needs to have a related placeable reference");
						}

						areaRef = new ComponentTreeReference(
							container.getId(),
							switchRef.getPosition(),
							switchRef.getSize(),
							switchRef.getReferenceTrace(),
							switchRef.getPageBreakBehavior(),
							new String[]{},
							null,
							null
						);
					}

					this.componentTreeMap.put(container.getId(), new AreaComponentTree(
						container.getId(),
						area,
						parentTopLevelReferenceContainerTrace,
						componentTreeReferences,
						bottomLineTopMargin,
						areaRef
					));
				}
				case BoundingBox boundingBox -> {
					assert reference != null;
					this.componentTreeMap.put(container.getId(), new BoundingBoxComponentTree(
						container.getId(),
						boundingBox,
						parentTopLevelReferenceContainerTrace,
						componentTreeReferences,
						reference
					));
				}
				case Switch switchElement -> {
					assert reference != null;
					this.componentTreeMap.put(container.getId(), new SwitchComponentTree(
						container.getId(),
						switchElement,
						parentTopLevelReferenceContainerTrace,
						componentTreeReferences,
						reference
					));
				}
				default -> throw new PrintException(String.format("The nested container %s does not have a component", container));
			}
		}

		private void addSectionComponentTrees(final ModelSection section, final PrintModelPath path) {
			final var headerReferences = new ArrayList<PrintModelTreeTrace<PlaceableReference>>();
			final var footerReferences = new ArrayList<PrintModelTreeTrace<PlaceableReference>>();
			final PrintModelTreeTrace<TopLevelReferenceContainer> sectionTrace = new PrintModelTreeTrace<>(path, section);
			section.getReferences().forEach(reference -> {
				if (SectionUtils.isInSection(section, reference, true)) {
					headerReferences.add(sectionTrace.createDescendent(reference));
				} else if (SectionUtils.isInSection(section, reference, false)) {
					footerReferences.add(sectionTrace.createDescendent(reference));
				}
			});

			final var headerComponentTrees = getComponentTreeReferenceMap(headerReferences);
			final var footerComponentTrees = getComponentTreeReferenceMap(footerReferences);

			final var containerComponentTreeBuilder = SectionComponentTree.builder()
				.id(section.getId())
				.containerTrace(sectionTrace);

			final var headerId = SectionUtils.getHeaderSectionId(section.getId());
			final var footerId = SectionUtils.getFooterSectionId(section.getId());

			componentTreeMap.put(headerId, containerComponentTreeBuilder
				.sectionType(SectionComponentTree.SectionType.HEADER)
				.componentTreeReferences(headerComponentTrees)
				.build()
			);

			componentTreeMap.put(footerId, containerComponentTreeBuilder
				.sectionType(SectionComponentTree.SectionType.FOOTER)
				.componentTreeReferences(footerComponentTrees)
				.build()
			);
		}

		private List<ComponentTreeReference> getComponentTreeReferenceMap(
			final Collection<PrintModelTreeTrace<PlaceableReference>> references
		) {
			return getComponentTreeReferenceMap(references, null, null);
		}

		private List<ComponentTreeReference> getComponentTreeReferenceMap(
			final Collection<PrintModelTreeTrace<PlaceableReference>> references,
			final PageOrientation pageOrientation,
			final MatchingSections matchingSections
		) {
			final var constructComponentTreeReferences = constructAndSortComponentTreeReferences(references, pageOrientation, matchingSections);

			for (var i = 0; i < constructComponentTreeReferences.size(); i++) {
				final var componentTreeReference = constructComponentTreeReferences.get(i);
				final var dependentComponentTreeReferences = getDirectDependencies(
					i, componentTreeReference, constructComponentTreeReferences
				);

				setMargins(componentTreeReference, dependentComponentTreeReferences);

				componentTreeReference.setDependentReferenceIds(dependentComponentTreeReferences.stream()
					.map(ComponentTreeReference::getId)
					.toArray(String[]::new)
				);
			}

			constructComponentTreeReferences.forEach(componentTreeReference ->
				componentTreeReferenceMap.put(componentTreeReference.getId(), componentTreeReference)
			);

			return constructComponentTreeReferences;
		}

		private long getBottomLineTopMargin(
			final PlaceableReferenceContainer placeableReferenceContainer,
			final List<ComponentTreeReference> componentTrees
		) {
			if (
				placeableReferenceContainer instanceof Area area &&
					!componentTrees.isEmpty()
			) {
				final var overflowSpread = mmToLongPt((float) area.getAreaProperties().getDimensions().getHeight().getValue()
					+ area.getAreaProperties().getDimensions().getOverflowHeight().getValue());

				return componentTrees.stream()
										.map(a ->
											a.getPosition().getY() + a.getSize().getHeight())
										.reduce((a, b) -> a > b ? a : b)
										.map(a -> overflowSpread - a)
										.orElse(0L);
			}

			return 0L;
		}

		private void setMargins(
			final ComponentTreeReference currentReference,
			final List<ComponentTreeReference> dependentComponentTreeReferences
		) {
			var allBottomMarginsAreSetBefore = true;
			var lowestPointForTopMargin = 0L;

			for (final var dependentComponentTreeReference : dependentComponentTreeReferences) {
				if (dependentComponentTreeReference.getBottomMargin().isEmpty()) {
					allBottomMarginsAreSetBefore = false;

                    final var bottomMargin =
						currentReference.getPosition().getY() -
							currentReference.getTopMargin().orElse(0L) -
							dependentComponentTreeReference.getBottom();
					dependentComponentTreeReference.setBottomMargin(bottomMargin);
				} else {
					lowestPointForTopMargin = Math.max(
						dependentComponentTreeReference.getBottom() + dependentComponentTreeReference.getBottomMargin().get(),
						lowestPointForTopMargin
					);
				}
			}

			if (!dependentComponentTreeReferences.isEmpty() && allBottomMarginsAreSetBefore && currentReference.getTopMargin().isEmpty()) {
				final var topMargin = currentReference.getPosition().getY() - lowestPointForTopMargin;
				currentReference.setTopMargin(topMargin);
			}
		}

		private List<ComponentTreeReference> getDirectDependencies(
			final int currentExpressionIndex,
			final ComponentTreeReference currentExpression,
			final List<ComponentTreeReference> componentTreeReferences
		) {
			final var dependentComponentTreeReferences = new ArrayList<ComponentTreeReference>();
			for (var j = currentExpressionIndex - 1; j >= 0; j--) {
				final var overlyingComponentTreeReference = componentTreeReferences.get(j);

				if (
					isOverlap(currentExpression, overlyingComponentTreeReference) &&
						!isDependencyOfAlreadyDependentComponentTreeReference(overlyingComponentTreeReference, dependentComponentTreeReferences)
				) {
					dependentComponentTreeReferences.add(overlyingComponentTreeReference);
				}
			}

			return dependentComponentTreeReferences;
		}

		private List<ComponentTreeReference> constructAndSortComponentTreeReferences(
			final Collection<PrintModelTreeTrace<PlaceableReference>> references,
			final PageOrientation pageOrientation,
			final MatchingSections matchingSections
		) {
			final var pageHeight = pageOrientation != null
				? pageOrientation.getPageHeight()
				: null;
			return references.stream()
							 .sorted(
								 Comparator
									 .comparingInt((PrintModelTreeTrace<PlaceableReference> o) -> o.getTracedElement().getPosition().getY().getValue())
									 .thenComparingInt(o -> o.getTracedElement().getPosition().getX().getValue())
							 )
							 .map(refTrace -> {
								 final var ref = refTrace.getTracedElement();

								 final var position = getPositionWithoutSections(ref, pageHeight, matchingSections);
								 return new ComponentTreeReference(
									 ref.getRefId(),
									 position,
									 Size.ofReference(ref),
									 refTrace,
									 ref.getPageBreakBehavior(),
									 null,
									 ref.getMargins().flatMap(Margins::getBottom).map(bottomMargin -> mmToLongPt(bottomMargin.getMargin().getValue())).orElse(null),
									 ref.getMargins().flatMap(Margins::getTop).map(topMargin -> mmToLongPt(topMargin.getMargin().getValue())).orElse(null)
								 );
							 }).toList();
		}

		private boolean isOverlap(
			final ComponentTreeReference firstComponentTreeReference,
			final ComponentTreeReference secondComponentTreeReference
		) {
			final var firstPosition = firstComponentTreeReference.getPosition();
			final var firstDimension = firstComponentTreeReference.getSize();

			final var secondPosition = secondComponentTreeReference.getPosition();
			final var secondDimension = secondComponentTreeReference.getSize();

			return secondPosition.getY() < firstPosition.getY() &&
				firstPosition.getX() < (secondPosition.getX() + secondDimension.getWidth()) &&
				secondPosition.getX() < (firstPosition.getX() + firstDimension.getWidth());
		}

		private MatchingSections getMatchingSections(final ModelSegment segment) {
			final var sectionDefinitions = this.printModel.getContent().getSections();
			if (sectionDefinitions.isPresent() && !sectionDefinitions.get().getDefinitions().isEmpty()) {
				final var isFirstSegment = this.printModel.getContent().getGeneral().getStructure().getFirst().equals(segment.getId());
				final var pageOrientation = segment.getPageOrientation();
				final var sections = sectionDefinitions.get().getDefinitions();
				final var firstPageSection = isFirstSegment
					? sections.stream().filter(section ->
						section.getSectionUsage().equals(ModelSection.SectionUsage.FIRST) && section.getPageOrientation().equals(pageOrientation)
					).findFirst().orElse(null)
					: null;

				final var remainingPageSection = sections.stream().filter(section ->
					section.getSectionUsage().equals(ModelSection.SectionUsage.REMAINING) && section.getPageOrientation().equals(pageOrientation)
				).findFirst().orElse(null);

				if (firstPageSection != null || remainingPageSection != null) {
					return new MatchingSections(firstPageSection, remainingPageSection);
				}
			}
			return null;
		}

		private Position getPositionWithoutSections(
			PlaceableReference ref,
			Integer pageHeight,
			MatchingSections matchingSections
		) {
			if (matchingSections == null || pageHeight == null) {
				return Position.ofReference(ref);
			}

			var yPosition = ref.getPosition().getY().getValue();
			final var pageNumber = yPosition == 0 ? 1 : (int) Math.ceil((double) yPosition / pageHeight);

			final var firstPageAppliedSection = matchingSections.getFirstPageSection() != null
				? matchingSections.getFirstPageSection()
				: matchingSections.getRemainingPageSection();

			if (firstPageAppliedSection != null) {
				yPosition -= firstPageAppliedSection.getHeaderHeight().getValue();

				if (pageNumber > 1) {
					yPosition -= firstPageAppliedSection.getFooterHeight().getValue();
				}
			}

			if (matchingSections.getRemainingPageSection() != null && pageNumber > 1) {
				final var remainingSection = matchingSections.getRemainingPageSection();
				final var headerCount = pageNumber - 1;
				final var footerCount = pageNumber - 2;
				yPosition -= (footerCount * remainingSection.getFooterHeight().getValue()) +
					(headerCount * remainingSection.getHeaderHeight().getValue());
			}

			return new Position(
				mmToLongPt(ref.getPosition().getX().getValue()),
				mmToLongPt(yPosition)
			);
		}

		private boolean isDependencyOfAlreadyDependentComponentTreeReference(
			final ComponentTreeReference overlyingComponentTreeReference,
			final List<ComponentTreeReference> dependentComponentTreeReferences
		) {
			for (var i = dependentComponentTreeReferences.size() - 1; i >= 0; i--) {
				if (isOverlap(overlyingComponentTreeReference, dependentComponentTreeReferences.get(i))) {
					return true;
				}
			}

			return false;
		}
	}
}
