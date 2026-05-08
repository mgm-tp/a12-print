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

import com.mgmtp.a12.print.engine.api.PrintModelId;
import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.internal.engine.hashing.IDService;
import com.mgmtp.a12.print.engine.runtime.internal.manager.PrintModelCompilerRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.PrintModelCompilationContext;
import com.mgmtp.a12.print.model.api.model.PrintModel;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.container.BaseReferenceContainer;
import com.mgmtp.a12.print.model.api.model.container.PlaceableReferenceContainer;
import com.mgmtp.a12.print.model.api.model.container.TopLevelReferenceContainer;
import com.mgmtp.a12.print.model.api.model.element.base.Margins;
import com.mgmtp.a12.print.model.api.model.element.base.Measure;
import com.mgmtp.a12.print.model.api.model.element.base.Position;
import com.mgmtp.a12.print.model.api.model.element.type.area.Area;
import com.mgmtp.a12.print.model.api.model.element.type.boundingBox.BoundingBox;
import com.mgmtp.a12.print.model.api.model.element.type.override.OverrideElement;
import com.mgmtp.a12.print.model.api.model.element.type.switchCase.Switch;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.base.MeasureDto;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.base.PositionDto;
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

import static com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.SectionSpreadExpression.SectionType.FOOTER;
import static com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.SectionSpreadExpression.SectionType.HEADER;

@Builder
public class MarginLayoutDependencyValueProducerFactory {

	@NonNull
	private final PrintModel printModel;

	@NonNull
	private final PrintModelCompilerRuntime printModelCompilerRuntime;

	public void setDependencyValueProducer(PrintModelCompilationContext context) {
		PlaceableReferenceContainerVisitor placeableReferenceContainerVisitor = PrintModelWalker.walkPrintModelWithDefaultResolver(
			printModel,
			getPrintModelResolver(),
			new PlaceableReferenceContainerVisitor(printModel, PrintModelId.fromString(printModel.getHeader().getId()))
		);
		final var spreadExpressions =
			placeableReferenceContainerVisitor.getSpreadExpressionMap();

		final var spreadExpressionManager = new SpreadExpressionManager(spreadExpressions);

		context.setSpreadExpressionManager(spreadExpressionManager);
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

		private final HashMap<String, SpreadExpression> spreadExpressionMap = new HashMap<>();

		private final HashMap<String, MatchingSections> matchingSectionsPerSegment = new HashMap<>();

		private final HashMap<String, PrintModelTreeTrace<ModelSegment>> segmentsWithDinSegment = new HashMap<>();

		private final PrintModel printModel;

		private final PrintModelId printModelId;

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
					addSectionExpressionContainers(section, path);
				} else if (container instanceof ModelSegment segment) {
					if (segment.getDinTemplate().isEmpty()) {
						final var segmentTrace = new PrintModelTreeTrace<>(path, segment);
						addTopLevelExpressionContainer(segmentTrace, placeableReferenceContainer.getReferences().stream().map(segmentTrace::createDescendent).toList());
					} else {
						segmentsWithDinSegment.put(segment.getDinTemplate().get().getRefId(), new PrintModelTreeTrace<>(
							path,
							segment
						));
					}
				} else if (container instanceof Watermark watermark) {
					final var watermarkTrace = new PrintModelTreeTrace<>(path, watermark);
					addTopLevelExpressionContainer(watermarkTrace, placeableReferenceContainer.getReferences().stream().map(watermarkTrace::createDescendent).toList());
				} else {
					final var rcTrace = new PrintModelTreeTrace<>(path, placeableReferenceContainer);
					addReferenceAndNestedContainerSpreadExpression(rcTrace, placeableReferenceContainer.getReferences().stream().map(rcTrace::createDescendent).toList());
				}
			} else if (container instanceof Switch elementReferenceContainer) {
				final var parentTopLevelReferenceContainer = path.findParentTopLevelReferenceContainer().orElseThrow(() -> new PrintException(
					String.format("The nested container %s does not have a segment/section as parent", elementReferenceContainer.getId())
				)).getTracedElement();
				final var matchingSections = parentTopLevelReferenceContainer instanceof ModelSegment segment
					? getMatchingSections(segment)
					: null;
				addNestedContainerSpreadExpression(elementReferenceContainer, parentTopLevelReferenceContainer, new String[]{}, matchingSections, 0, true);
			}
			return TraversalCommand.CONTINUE;
		}

		@Override
		public TraversalCommand visitDINTemplate(ModelSegment dinTemplate, PrintModelPath path) {
			final var relatedSegmentTrace = segmentsWithDinSegment.get(dinTemplate.getId());

			if (relatedSegmentTrace == null) {
				throw new PrintException("The corresponding segment was not visited before");
			}

			final var relatedSegment = relatedSegmentTrace.getTracedElement();

			final var dinTemplateTrace = new PrintModelTreeTrace<>(path, dinTemplate);

			addTopLevelExpressionContainer(
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
			addReferenceAndNestedContainerSpreadExpression(
				boundBoxTrace,
				Stream.concat(
					boundingBox.getReferences().stream().map(boundBoxTrace::createDescendent),
					overrideElement.getReferences().stream().map(boundBoxTrace::createDescendent)
				).toList()
			);

			return TraversalCommand.CONTINUE;
		}

		private <T extends TopLevelReferenceContainer> void addTopLevelExpressionContainer(
			final PrintModelTreeTrace<T> containerTrace,
			final Collection<PrintModelTreeTrace<PlaceableReference>> references
		) {
			final var container = containerTrace.getTracedElement();
			// matching sections only relevant for elements on model segment
			final var matchingSections = container instanceof ModelSegment segment
					? getMatchingSections(segment)
					: null;

			matchingSectionsPerSegment.put(container.getId(), matchingSections);

			final var spreadExpressions = getSpreadExpressionMap(
				references,
				container,
				matchingSections,
				0,
				true
			);

			final var containerSpreadExpression = new SegmentSpreadExpression(
				container.getId(),
				container,
				getExpressionIds(spreadExpressions),
				printModelId,
				matchingSections
			);
			this.spreadExpressionMap.put(containerSpreadExpression.getId(), containerSpreadExpression);
		}

		private void addReferenceAndNestedContainerSpreadExpression(
			final PrintModelTreeTrace<PlaceableReferenceContainer> placeableReferenceContainerTrace,
			final Collection<PrintModelTreeTrace<PlaceableReference>> references
		) {
			final var placeableReferenceContainer = placeableReferenceContainerTrace.getTracedElement();
			final var parentTopLevelReferenceContainer = placeableReferenceContainerTrace.getPath().findParentTopLevelReferenceContainer().orElseThrow(() -> new PrintException(
				String.format("The nested container %s does not have a segment/section as parent", placeableReferenceContainer.getId())
			)).getTracedElement();

			final var matchingSections = parentTopLevelReferenceContainer instanceof ModelSegment segment
				? matchingSectionsPerSegment.get(segment.getId())
				: null;

			final var spreadExpressions = getSpreadExpressionMap(
				references,
				parentTopLevelReferenceContainer,
				matchingSections,
				0,
				false
			);

			final var isChildOfSwitch = placeableReferenceContainerTrace
				.getPath()
				.findParentPath(false, (a, e) -> e.getElement() instanceof Switch, s -> s)
				.isPresent();

			addNestedContainerSpreadExpression(
				placeableReferenceContainer,
				parentTopLevelReferenceContainer,
				getExpressionIds(spreadExpressions),
				matchingSections,
				getBottomLineTopMargin(placeableReferenceContainer, spreadExpressions),
				isChildOfSwitch
			);
		}

		private void addNestedContainerSpreadExpression(
			BaseReferenceContainer<? extends ElementReference> container,
			TopLevelReferenceContainer parentTopLevelReferenceContainer,
			String[] childSpreadExpressionIds,
			MatchingSections matchingSections,
			int bottomLineTopMargin,
			boolean isChildOfSwitch
		) {
			var referenceSpreadExpression = spreadExpressionMap.get(container.getId());
			if (Objects.isNull(referenceSpreadExpression)) {
				if(isChildOfSwitch) {
					return;
				}
				throw new PrintException("Each nested container needs to have a related placeable reference");
			}

			if (!(referenceSpreadExpression instanceof ReferenceSpreadExpression)) {
				throw new PrintException("Each nested container needs to have a related placeable reference");
			}

			final var containerSpreadExpression = new NestedContainerSpreadExpression(
				container.getId(),
				container,
				parentTopLevelReferenceContainer,
				childSpreadExpressionIds,
				matchingSections,
				printModelId,
				(ReferenceSpreadExpression) referenceSpreadExpression,
				bottomLineTopMargin
			);
			this.spreadExpressionMap.put(container.getId(), containerSpreadExpression);
		}

		private void addSectionExpressionContainers(final ModelSection section, final PrintModelPath path) {
			final var headerReferences = new ArrayList<PrintModelTreeTrace<PlaceableReference>>();
			final var footerReferences = new ArrayList<PrintModelTreeTrace<PlaceableReference>>();
			final var sectionPath = new PrintModelTreeTrace<>(path, section);
			section.getReferences().forEach(reference -> {
				if (SectionUtils.isInSection(section, reference, true)) {
					headerReferences.add(sectionPath.createDescendent(reference));
				} else if (SectionUtils.isInSection(section, reference, false)) {
					footerReferences.add(sectionPath.createDescendent(reference));
				}
			});

			final var headerSpreadExpressions = getSpreadExpressionMap(
				headerReferences,
				section
			);
			final var footerSpreadExpressions = getSpreadExpressionMap(
				footerReferences,
				section,
				section.getActualFooterHeight()
			);

			final var containerSpreadExpressionBuilder = SectionSpreadExpression.builder()
				.id(section.getId())
				.printModelId(printModelId)
				.container(section);

			final var headerId = SectionUtils.getHeaderSectionId(section.getId());
			final var footerId = SectionUtils.getFooterSectionId(section.getId());

			spreadExpressionMap.put(headerId, containerSpreadExpressionBuilder
				.sectionType(HEADER)
				.childSpreadExpressionIds(getExpressionIds(headerSpreadExpressions))
				.build()
			);

			spreadExpressionMap.put(footerId, containerSpreadExpressionBuilder
				.sectionType(FOOTER)
				.childSpreadExpressionIds(getExpressionIds(footerSpreadExpressions))
				.build()
			);
		}

		private List<ReferenceSpreadExpression> getSpreadExpressionMap(
			final Collection<PrintModelTreeTrace<PlaceableReference>> references,
			final TopLevelReferenceContainer parentTopLevelReferenceContainer
		) {
			return getSpreadExpressionMap(references, parentTopLevelReferenceContainer, null, 0, false);
		}

		private List<ReferenceSpreadExpression> getSpreadExpressionMap(
			final Collection<PrintModelTreeTrace<PlaceableReference>> references,
			final TopLevelReferenceContainer parentTopLevelReferenceContainer,
			final int initialOffset
		) {
			return getSpreadExpressionMap(references, parentTopLevelReferenceContainer, null, initialOffset, false);
		}

		private List<ReferenceSpreadExpression> getSpreadExpressionMap(
			final Collection<PrintModelTreeTrace<PlaceableReference>> references,
			final TopLevelReferenceContainer parentTopLevelReferenceContainer,
			final MatchingSections matchingSections,
			final int initialOffset,
			final boolean addSectionOffset
		) {
			final var constructedSpreadExpressions =
				constructAndSortSpreadExpressions(
					references,
					parentTopLevelReferenceContainer,
					matchingSections,
					initialOffset,
					addSectionOffset
				);

			for (var i = 0; i < constructedSpreadExpressions.size(); i++) {
				final var spreadExpression = constructedSpreadExpressions.get(i);
				final var dependentSpreadExpressions = getDirectDependencies(
					i, spreadExpression, constructedSpreadExpressions
				);

				setMargins(spreadExpression, dependentSpreadExpressions);

				spreadExpression.setDependentSpreadExpressionIds(dependentSpreadExpressions.stream()
																						   .map(ReferenceSpreadExpression::getId)
																						   .toArray(String[]::new)
				);
			}

			constructedSpreadExpressions.forEach(constructedSpreadExpression -> spreadExpressionMap.put(
				constructedSpreadExpression.getId(),
				constructedSpreadExpression
			));

			return constructedSpreadExpressions;
		}

		private String[] getExpressionIds(
			List<ReferenceSpreadExpression> spreadExpressions
		) {
			return spreadExpressions.stream()
									.map(ReferenceSpreadExpression::getId)
									.toArray(String[]::new);
		}

		private MatchingSections getMatchingSections(
			final ModelSegment segment
		) {
			if (
				this.printModel.getContent().getSections().isPresent() &&
					!this.printModel.getContent().getSections().get().getDefinitions().isEmpty()
			) {
				final var isFirstSegment = this.printModel.getContent().getGeneral().getStructure().get(0).equals(segment.getId());
				final var pageOrientation = segment.getPageOrientation();
				final var sections = this.printModel.getContent().getSections().get().getDefinitions();
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

		private Measure getMmMeasure(final int value) {
			return MeasureDto.builder()
							 .id(IDService.getId())
							 .value(value)
							 .unit(Measure.MeasureUnit.MILLIMETER)
							 .build();
		}

		private Position getNewPosition(int y, int x) {
			return PositionDto.builder()
							  .id(IDService.getId())
							  .y(getMmMeasure(y))
							  .x(getMmMeasure(x))
							  .build();
		}

		private int getBottomLineTopMargin(
			final PlaceableReferenceContainer placeableReferenceContainer,
			final List<ReferenceSpreadExpression> spreadExpressions
		) {
			if (
				placeableReferenceContainer instanceof Area area &&
					!spreadExpressions.isEmpty()
			) {
				final var overflowSpread = area.getAreaProperties().getDimensions().getHeight().getValue()
					+ area.getAreaProperties().getDimensions().getOverflowHeight().getValue();

				return spreadExpressions.stream()
										.map(a -> a.getPosition().getY().getValue() + a.getPlaceableReference().getDimensions().getHeight().getValue())
										.reduce((a, b) -> a > b ? a : b)
										.map(a -> overflowSpread - a)
										.orElse(0);
			}

			return 0;
		}

		private void setMargins(
			final ReferenceSpreadExpression currentExpression,
			final List<ReferenceSpreadExpression> dependentSpreadExpressions
		) {
			var allBottomMarginsAreSetBefore = true;
			var lowestPointForTopMargin = 0;

			for (final var dependentSpreadExpression : dependentSpreadExpressions) {
				if (dependentSpreadExpression.getBottomMargin().isEmpty()) {
					allBottomMarginsAreSetBefore = false;

                    final var bottomMargin =
						currentExpression.getPosition().getY().getValue() -
							currentExpression.getTopMargin().orElse(0) -
							dependentSpreadExpression.getBottom();
					assert bottomMargin >= 0;
					dependentSpreadExpression.setBottomMargin(bottomMargin);
				} else {
					lowestPointForTopMargin = Math.max(
						dependentSpreadExpression.getBottom() + dependentSpreadExpression.getBottomMargin().get(),
						lowestPointForTopMargin
					);
				}
			}

			if (!dependentSpreadExpressions.isEmpty() && allBottomMarginsAreSetBefore && currentExpression.getTopMargin().isEmpty()) {
				final var topMargin = currentExpression.getPosition().getY().getValue() - lowestPointForTopMargin;
				assert topMargin >= 0;
				currentExpression.setTopMargin(topMargin);
			}
		}

		private List<ReferenceSpreadExpression> getDirectDependencies(
			final int currentExpressionIndex,
			final ReferenceSpreadExpression currentExpression,
			final List<ReferenceSpreadExpression> spreadExpressions
		) {
			final var dependentSpreadExpressions = new ArrayList<ReferenceSpreadExpression>();
			for (var j = currentExpressionIndex - 1; j >= 0; j--) {
				final var overlyingSpreadExpression = spreadExpressions.get(j);

				if (
					isOverlap(currentExpression, overlyingSpreadExpression) &&
						!isDependencyOfAlreadyDependentExpression(overlyingSpreadExpression, dependentSpreadExpressions)
				) {
					dependentSpreadExpressions.add(overlyingSpreadExpression);
				}
			}

			return dependentSpreadExpressions;
		}

		private List<ReferenceSpreadExpression> constructAndSortSpreadExpressions(
			final Collection<PrintModelTreeTrace<PlaceableReference>> references,
			final TopLevelReferenceContainer parentTopLevelReferenceContainer,
			final MatchingSections matchingSections,
			final int initialOffset,
			final boolean addSectionOffset
		) {
			return references.stream()
							 .sorted(
								 Comparator
									 .comparingInt((PrintModelTreeTrace<PlaceableReference> o) -> o.getTracedElement().getPosition().getY().getValue())
									 .thenComparingInt(o -> o.getTracedElement().getPosition().getX().getValue())
							 )
							 .map(refTrace -> {
								 final var ref = refTrace.getTracedElement();
								 final var sectionOffset = addSectionOffset ? getSectionOffset(
									 matchingSections,
									 ref.getPosition().getY().getValue()
								 ) : 0;

								 final var position = (initialOffset != 0 || sectionOffset != 0)
									 ? getNewPosition(
									 ref.getPosition().getY().getValue() - initialOffset - sectionOffset,
									 ref.getPosition().getX().getValue()
								 )
									 : ref.getPosition();

								 return new ReferenceSpreadExpression(
									 ref.getRefId(),
									 position,
									 ref,
									 refTrace.getPath(),
									 printModelId,
									 parentTopLevelReferenceContainer,
									 matchingSections,
									 null,
									 ref.getMargins().flatMap(Margins::getBottom).map(bottomMargin -> bottomMargin.getMargin().getValue()).orElse(null),
									 ref.getMargins().flatMap(Margins::getTop).map(topMargin -> topMargin.getMargin().getValue()).orElse(null)
								 );
							 }).toList();
		}

		private int getSectionOffset(
			final MatchingSections matchingSections,
			final int y
		) {
			if (matchingSections == null) {
				return 0;
			}

			var sectionOffset = 0;
			final var pageHeight = matchingSections.getFirstPageSection() != null
				? matchingSections.getFirstPageSection().getPageOrientation().getPageHeight()
				: matchingSections.getRemainingPageSection().getPageOrientation().getPageHeight();
			final var pageIndex = y / pageHeight;

			// add first header
			sectionOffset = matchingSections.getFirstPageSection() != null
				? matchingSections.getFirstPageSection().getHeaderHeight().getValue()
				: matchingSections.getRemainingPageSection().getHeaderHeight().getValue();

			if (pageIndex > 0) {
				// add header per page
				sectionOffset += pageIndex * (
					matchingSections.getRemainingPageSection() != null
						? matchingSections.getRemainingPageSection().getHeaderHeight().getValue()
						: 0
				);

				// add first footer
				sectionOffset += matchingSections.getFirstPageSection() != null
					? matchingSections.getFirstPageSection().getFooterHeight().getValue()
					: matchingSections.getRemainingPageSection().getFooterHeight().getValue();

				// add footer per page - 1
				sectionOffset += (pageIndex - 1) * (
					matchingSections.getRemainingPageSection() != null
						? matchingSections.getRemainingPageSection().getFooterHeight().getValue()
						: 0
				);
			}
			return sectionOffset;
		}

		private boolean isOverlap(
			final ReferenceSpreadExpression firstSpreadExpression,
			final ReferenceSpreadExpression secondSpreadExpression
		) {
			return secondSpreadExpression.getPosition().getY().getValue() < firstSpreadExpression.getPosition().getY().getValue() &&
				firstSpreadExpression.getPosition().getX().getValue() < (
					secondSpreadExpression.getPosition().getX().getValue() +
						secondSpreadExpression.getPlaceableReference().getDimensions().getWidth().getValue()
				) &&
				secondSpreadExpression.getPosition().getX().getValue() < (
					firstSpreadExpression.getPosition().getX().getValue() +
						firstSpreadExpression.getPlaceableReference().getDimensions().getWidth().getValue()
				);
		}

		private boolean isDependencyOfAlreadyDependentExpression(
			final ReferenceSpreadExpression overlyingSpreadExpression,
			final List<ReferenceSpreadExpression> dependentSpreadExpressions
		) {
			for (var i = dependentSpreadExpressions.size() - 1; i >= 0; i--) {
				if (isOverlap(overlyingSpreadExpression, dependentSpreadExpressions.get(i))) {
					return true;
				}
			}

			return false;
		}
	}
}
