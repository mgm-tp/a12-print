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
package com.mgmtp.a12.print.model.api.walker.model;

import com.mgmtp.a12.print.model.api.model.PrintModel;
import com.mgmtp.a12.print.model.api.model.PrintModelContent;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.container.BaseReferenceContainer;
import com.mgmtp.a12.print.model.api.model.element.PrintModelElement;
import com.mgmtp.a12.print.model.api.model.element.type.boundingBox.BoundingBox;
import com.mgmtp.a12.print.model.api.model.element.type.override.OverrideElement;
import com.mgmtp.a12.print.model.api.model.path.PrintModelPathElement;
import com.mgmtp.a12.print.model.api.model.reference.ElementReference;
import com.mgmtp.a12.print.model.api.model.segment.ModelSegment;
import com.mgmtp.a12.print.model.api.model.segment.ModelSegmentReference;
import com.mgmtp.a12.print.model.api.walker.DescendCommand;
import com.mgmtp.a12.print.model.api.walker.TraversalCommand;
import com.mgmtp.a12.print.model.api.walker.model.resolver.*;
import lombok.Data;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.function.Function;

/**
 * Provides functionality to traverse a given {@link com.mgmtp.a12.print.model.api.model.PrintModel} in a structured way.
 */
public class PrintModelWalker {

	protected final PrintModelVisitor visitor;
	protected final ReferenceResolver referenceResolver;
	protected final SegmentIdResolver segmentIdResolver;
	protected final SectionIdResolver sectionIdResolver;
	protected final WatermarkIdResolver watermarkIdResolver;
	protected final ReferenceElementResolver referenceElementResolver;
	protected final PrintModelResolver printModelResolver;

	public PrintModelWalker(
		final PrintModelVisitor visitor,
		final ReferenceResolver referenceResolver,
		final SegmentIdResolver segmentIdResolver,
		final SectionIdResolver sectionIdResolver,
		final WatermarkIdResolver watermarkIdResolver,
		final ReferenceElementResolver referenceElementResolver,
		final PrintModelResolver printModelResolver
	) {
		this.visitor = visitor;
		this.referenceResolver = referenceResolver;
		this.segmentIdResolver = segmentIdResolver;
		this.sectionIdResolver = sectionIdResolver;
		this.watermarkIdResolver = watermarkIdResolver;
		this.referenceElementResolver = referenceElementResolver;
		this.printModelResolver = printModelResolver;
	}

	/**
	 * Uses the given print model to automatically create as many of the needed resolvers as possible.
	 * @param printModelResolver This resolver is used to find other referenced print models, thus cannot be built from the given print model itself.
	 * @param visitor a {@link PrintModelVisitor} that is applied to each walked entity.
	 */
	public static <V extends PrintModelVisitor> V walkPrintModelWithDefaultResolver(
		PrintModel printModel,
		PrintModelResolver printModelResolver,
		V visitor
	) {
		var walker = new PrintModelWalker(
			visitor,
			ReferenceMultiModelResolver.fromModel(printModel),
			SegmentIdListResolver.fromModel(printModel),
			SectionIdListResolver.fromModel(printModel),
			WatermarkIdListResolver.fromModel(printModel),
			ReferenceElementListResolver.fromModel(printModel),
			printModelResolver
		);
		walker.walkPrintModel(printModel);
		return visitor;
	}

	public static <V extends PrintModelVisitor, R> R walkPrintModel(
		final V visitor,
		final ReferenceResolver referenceResolver,
		final SegmentIdResolver segmentIdResolver,
		final SectionIdResolver sectionIdResolver,
		final WatermarkIdResolver watermarkIdResolver,
		final ReferenceElementResolver referenceElementResolver,
		final PrintModelResolver printModelIdResolver,
		final PrintModel printModel,
		final Function<V, R> resultExtractor
	) {
		final PrintModelWalker walker = new PrintModelWalker(
			visitor,
			referenceResolver,
			segmentIdResolver,
			sectionIdResolver,
			watermarkIdResolver,
			referenceElementResolver,
			printModelIdResolver

		);
		walker.walkPrintModel(printModel);
		return resultExtractor.apply(visitor);
	}

	public static <V extends PrintModelVisitor, R> R walkPrintModelContent(
		final V visitor,
		final ReferenceResolver referenceResolver,
		final SegmentIdResolver segmentIdResolver,
		final SectionIdResolver sectionIdResolver,
		final WatermarkIdResolver watermarkIdResolver,
		final ReferenceElementResolver referenceElementResolver,
		final PrintModelResolver printModelIdResolver,
		final PrintModelPath path,
		final PrintModelContent printModelContent,
		final Function<V, R> resultExtractor
	) {
		final PrintModelWalker walker = new PrintModelWalker(
			visitor,
			referenceResolver,
			segmentIdResolver,
			sectionIdResolver,
			watermarkIdResolver,
			referenceElementResolver,
			printModelIdResolver
		);
		walker.walkPrintModelContent(path, printModelContent);
		return resultExtractor.apply(visitor);
	}

	public static <V extends PrintModelVisitor> V walkPrintModelContentWithDefaultResolver(
		PrintModel printModel,
		PrintModelPath path,
		PrintModelResolver printModelResolver,
		V visitor
	) {
		var walker = new PrintModelWalker(
			visitor,
			ReferenceMultiModelResolver.fromModel(printModel),
			SegmentIdListResolver.fromModel(printModel),
			SectionIdListResolver.fromModel(printModel),
			WatermarkIdListResolver.fromModel(printModel),
			ReferenceElementListResolver.fromModel(printModel),
			printModelResolver
		);
		walker.walkPrintModelContent(path, printModel.getContent());
		return visitor;
	}

	public static <V extends PrintModelVisitor, R> R walkReferenceContainer(
		final V visitor,
		final ReferenceResolver referenceResolver,
		final SegmentIdResolver segmentIdResolver,
		final SectionIdResolver sectionIdResolver,
		final WatermarkIdResolver watermarkIdResolver,
		final ReferenceElementResolver referenceElementResolver,
		final PrintModelResolver printModelIdResolver,
		final PrintModelPath path,
		final BaseReferenceContainer<? extends ElementReference> container,
		final Function<V, R> resultExtractor
	) {
		final PrintModelWalker walker = new PrintModelWalker(
			visitor,
			referenceResolver,
			segmentIdResolver,
			sectionIdResolver,
			watermarkIdResolver,
			referenceElementResolver,
			printModelIdResolver
		);
		walker.walkContainer(container, path, 0);
		return resultExtractor.apply(visitor);
	}

	public static <V extends PrintModelVisitor, R> R walkReference(
		final V visitor,
		final ReferenceResolver referenceResolver,
		final SegmentIdResolver segmentIdResolver,
		final SectionIdResolver sectionIdResolver,
		final WatermarkIdResolver watermarkIdResolver,
		final ReferenceElementResolver referenceElementResolver,
		final PrintModelResolver printModelResolver,
		final PrintModelPath path,
		final ElementReference elementReference,
		final Function<V, R> resultExtractor
	) {
		final PrintModelWalker walker = new PrintModelWalker(
			visitor,
			referenceResolver,
			segmentIdResolver,
			sectionIdResolver,
			watermarkIdResolver,
			referenceElementResolver,
			printModelResolver
		);
		walker.walkReference(elementReference, path, 0);
		return resultExtractor.apply(visitor);
	}

	public static <V extends PrintModelVisitor, R> R walkElement(
		final V visitor,
		final ReferenceResolver referenceResolver,
		final SegmentIdResolver segmentIdResolver,
		final SectionIdResolver sectionIdResolver,
		final WatermarkIdResolver watermarkIdResolver,
		final ReferenceElementResolver referenceElementResolver,
		final PrintModelResolver printModelResolver,
		final PrintModelPath path,
		final PrintModelElement element,
		final Function<V, R> resultExtractor
	) {
		final PrintModelWalker walker = new PrintModelWalker(
			visitor,
			referenceResolver,
			segmentIdResolver,
			sectionIdResolver,
			watermarkIdResolver,
			referenceElementResolver,
			printModelResolver
		);
		walker.walkElement(element, path, 0);
		return resultExtractor.apply(visitor);
	}


	public static <V extends PrintModelVisitor, R> R walkContainer(
		final V visitor,
		final ReferenceResolver referenceResolver,
		final SegmentIdResolver segmentIdResolver,
		final SectionIdResolver sectionIdResolver,
		final WatermarkIdResolver watermarkIdResolver,
		final ReferenceElementResolver referenceElementResolver,
		final PrintModelResolver printModelResolver,
		final PrintModelPath path,
		BaseReferenceContainer<? extends ElementReference> container,
		final Function<V, R> resultExtractor
	) {
		final PrintModelWalker walker = new PrintModelWalker(
			visitor,
			referenceResolver,
			segmentIdResolver,
			sectionIdResolver,
			watermarkIdResolver,
			referenceElementResolver,
			printModelResolver
		);
		walker.walkContainer(container, path, 0);
		return resultExtractor.apply(visitor);
	}

	/**
	 * Uses the given print model to automatically create as many of the needed resolvers as possible.
	 * @param printModelResolver This resolver is used to find other referenced print models, thus cannot be built from the given print model itself.
	 * @param visitor a {@link PrintModelVisitor} that is applied to each walked entity.
	 */
	public static <V extends PrintModelVisitor> V walkElementWithDefaultResolver(
		PrintModel printModel,
		PrintModelElement element,
		PrintModelPath path,
		PrintModelResolver printModelResolver,
		V visitor
	) {
		var walker = new PrintModelWalker(
			visitor,
			ReferenceMultiModelResolver.fromModel(printModel),
			SegmentIdListResolver.fromModel(printModel),
			SectionIdListResolver.fromModel(printModel),
			WatermarkIdListResolver.fromModel(printModel),
			ReferenceElementListResolver.fromModel(printModel),
			printModelResolver
		);
		walker.walkElement(element, path, 0);
		return visitor;
	}

	public TraversalCommand walkPrintModel(final PrintModel printModel) {
		final PrintModelContent printModelContent = printModel.getContent();
		TraversalCommand result = TraversalCommand.CONTINUE;

		switch (visitor.descendPrintModel(printModel)) {
			case DESCEND_FIRST: {
				result = walkPrintModelContent(PrintModelPath.create(printModel), printModelContent);
				if (result == TraversalCommand.CONTINUE) {
					result = visitor.visitPrintModel(printModel);
				}
				break;
			}
			case ELEMENT_FIRST: {
				result = visitor.visitPrintModel(printModel);
				if (result == TraversalCommand.CONTINUE) {
					result = walkPrintModelContent(PrintModelPath.create(printModel), printModelContent);
				}
				break;
			}
			case NO_DESCEND: {
				result = visitor.visitPrintModel(printModel);
				break;
			}
		}

		return result;
	}

	/**
	 * Walks all segments first and then all used sections and watermarks afterward.
	 */
	public TraversalCommand walkPrintModelContent(final PrintModelPath path, final PrintModelContent printModelContent) {
		TraversalCommand traversalCommand = walkMetadata(path, printModelContent.getGeneral().getMetadata());
		if (traversalCommand == TraversalCommand.CONTINUE) {
			traversalCommand = walkStructure(path, printModelContent.getGeneral().getStructure());
		}
		if (traversalCommand == TraversalCommand.CONTINUE) {
			traversalCommand = walkSections(path, printModelContent.getGeneral().getSections());
		}
		if (traversalCommand == TraversalCommand.CONTINUE) {
			traversalCommand = walkWatermarks(path, printModelContent.getGeneral().getWatermarks());
		}

		return traversalCommand;
	}

	public TraversalCommand walkMetadata(PrintModelPath path, final com.mgmtp.a12.print.model.api.model.general.Metadata metadata) {
		return visitor.visitMetadata(metadata, path);
	}

	/**
	 * Walks the segments referenced by the IDs in the structure in order.
	 */
	public TraversalCommand walkStructure(PrintModelPath path, final List<String> structure) {
		path = path.with(new PrintModelPathElement.ObjectProperty("structure"), 0);
		for (int containerIndex = 0; containerIndex < structure.size(); containerIndex++) {
			var segmentId = structure.get(containerIndex);
			var segment = segmentIdResolver.resolveSegmentId(segmentId);
			final TraversalCommand traversalCommand;
			if (segment.isEmpty()) {
				traversalCommand = visitor.visitUnresolvedSegment(segmentId, containerIndex);
			} else {
				final var segmentPath = segment.get();
				traversalCommand = walkContainer(segmentPath.getTracedElement(), path.with(segmentPath.getPath(), 0), containerIndex);
			}
			if (traversalCommand == TraversalCommand.STOP) {
				break;
			} else if (traversalCommand == TraversalCommand.HALT) {
				return traversalCommand;
			}
		}
		return TraversalCommand.CONTINUE;
	}

	public TraversalCommand walkSections(PrintModelPath path, final List<String> sections) {
		for (int containerIndex = 0; containerIndex < sections.size(); containerIndex++) {
			var sectionId = sections.get(containerIndex);
			var section = sectionIdResolver.resolveSectionId(sectionId);
			final TraversalCommand traversalCommand;
			if (section.isEmpty()) {
				traversalCommand = visitor.visitUnresolvedSection(sectionId, containerIndex);
			} else {
				final var sectionPath = section.get();
				traversalCommand = walkContainer(section.get().getTracedElement(), path.with(sectionPath.getPath(), 0), containerIndex);
			}
			if (traversalCommand == TraversalCommand.STOP) {
				break;
			} else if (traversalCommand == TraversalCommand.HALT) {
				return traversalCommand;
			}
		}
		return TraversalCommand.CONTINUE;
	}

	public TraversalCommand walkWatermarks(PrintModelPath path, final List<String> watermarks) {
		for (int containerIndex = 0; containerIndex < watermarks.size(); containerIndex++) {
			var watermarkId = watermarks.get(containerIndex);
			var watermark = watermarkIdResolver.resolveWatermarkId(watermarkId);
			final TraversalCommand traversalCommand;
			if (watermark.isEmpty()) {
				traversalCommand = visitor.visitUnresolvedWatermark(watermarkId, containerIndex);
			} else {
				final var watermarkPath = watermark.get();
				traversalCommand = walkContainer(watermark.get().getTracedElement(), path.with(watermarkPath.getPath(), 0), containerIndex);
			}
			if (traversalCommand == TraversalCommand.STOP) {
				break;
			} else if (traversalCommand == TraversalCommand.HALT) {
				return traversalCommand;
			}
		}
		return TraversalCommand.CONTINUE;
	}

	public TraversalCommand walkReferenceContainers(
		PrintModelPath path,
		final List<? extends BaseReferenceContainer<? extends ElementReference>> containers
	) {
		int containerIndex = 0;
		for (BaseReferenceContainer<? extends ElementReference> container : containers) {
			final TraversalCommand traversalCommand = walkContainer(container, path, containerIndex);
			if (traversalCommand == TraversalCommand.STOP) {
				break;
			} else if (traversalCommand == TraversalCommand.HALT) {
				return traversalCommand;
			}
			containerIndex += 1;
		}
		return TraversalCommand.CONTINUE;
	}

	/**
	 * If the given container is a {@link ModelSegment} that references a DINTemplate, the DINTemplate will be walked after the segment content.
	 */
	protected TraversalCommand walkContainer(
		final BaseReferenceContainer<? extends ElementReference> container,
		final PrintModelPath path,
		final int index
	) {
		TraversalCommand result = TraversalCommand.CONTINUE;
		final PrintModelPath newPath = path.with(container, index);

		switch (visitor.descendContainer(container, newPath, index)) {
			case DESCEND_FIRST: {
				result = walkReferences(container.getReferences(), newPath);
				if (result == TraversalCommand.CONTINUE) {
					result = visitor.visitContainer(container, newPath);
				}
				break;
			}
			case ELEMENT_FIRST: {
				result = visitor.visitContainer(container, newPath);
				if (result == TraversalCommand.CONTINUE) {
					result = walkReferences(container.getReferences(), newPath);
				}
				break;
			}
			case NO_DESCEND: {
				result = visitor.visitContainer(container, newPath);
				break;
			}
		}

		if (container instanceof ModelSegment modelSegment) {
			if (modelSegment.getDinTemplate().isPresent()) {
				result = walkDinTemplate(modelSegment.getDinTemplate().get(), newPath);
				if (result.equals(TraversalCommand.STOP)) {
					return result;
				}
			}
		}

		return result;
	}

	protected TraversalCommand walkReferences(
		final Collection<? extends ElementReference> references,
		final PrintModelPath path
	) {
		int index = 0;
		for (final ElementReference elementReference : references) {
			TraversalCommand traversalCommand = walkReference(elementReference, path, index);
			if (traversalCommand == TraversalCommand.STOP) {
				break;
			} else if (traversalCommand == TraversalCommand.HALT) {
				return traversalCommand;
			}
			index += 1;
		}
		return TraversalCommand.CONTINUE;
	}

	public TraversalCommand walkReference(final ElementReference elementReference, final PrintModelPath path, final int index) {
		TraversalCommand traversalCommand = visitor.visitReference(elementReference, path, index);

		if (traversalCommand == TraversalCommand.CONTINUE) {

			var element = referenceResolver.resolveReference(new PrintModelTreeTrace<>(
				path,
				elementReference
			));

			if (element.isEmpty()) {
				traversalCommand = visitor.visitUnresolvedElement(elementReference, path, index);
			} else {
				final var sectionPath = element.get();
				final PrintModelPath newReferencePath = path.with(elementReference, index).with(sectionPath.getPath(), 0);
				traversalCommand = walkElement(sectionPath.getTracedElement(), newReferencePath, index);
			}
		}

		return traversalCommand;
	}

	public TraversalCommand walkElement(
		final PrintModelElement element,
		final PrintModelPath path,
		final int index
	) {
		visitor.beforeVisitElement(element, path);
		TraversalCommand result;

		if (element instanceof BaseReferenceContainer) {
			result = walkContainer((BaseReferenceContainer<? extends ElementReference>) element, path, 0);
		} else {
			result = visitor.visitElement(element, path);
		}

		visitor.afterVisitElement(element, path);

		return result;
	}

	protected TraversalCommand walkDinTemplate(
		final ModelSegmentReference modelSegmentReference,
		final PrintModelPath path
	) {
		final var referenceId = modelSegmentReference.getReferenceId();
		final var templateId = modelSegmentReference.getRefId();
		final var reference = referenceElementResolver.resolveReferenceElement(referenceId);

		return reference
			.flatMap(ref -> printModelResolver.resolvePrintModel(ref.getTracedElement().getReferenceModel()))
			.flatMap(dinTemplate -> SegmentIdListResolver
				.fromModel(dinTemplate.getTracedElement())
				.resolveSegmentId(templateId)
			)
			.map(dinTemplateSegment -> {
				var result = TraversalCommand.CONTINUE;
				switch (visitor.descendDINTemplate(dinTemplateSegment.getTracedElement(), dinTemplateSegment.getPath())) {
					case DESCEND_FIRST: {
						result = walkDINTemplateReferences(path, dinTemplateSegment);
						if (result == TraversalCommand.CONTINUE) {
							result = visitor.visitDINTemplate(
								dinTemplateSegment.getTracedElement(),
								dinTemplateSegment.getPath()
							);
						}
						break;
					}
					case ELEMENT_FIRST: {
						result = visitor.visitDINTemplate(
							dinTemplateSegment.getTracedElement(),
							dinTemplateSegment.getPath()
						);
						if (result == TraversalCommand.CONTINUE) {
							result = walkDINTemplateReferences(path, dinTemplateSegment);
						}
						break;
					}
					case NO_DESCEND: {
						result = visitor.visitDINTemplate(
							dinTemplateSegment.getTracedElement(),
							dinTemplateSegment.getPath()
						);
						break;
					}
				}
				return result;
		}).orElseGet(() -> visitor.visitUnresolvedDinTemplate(templateId));
	}

	private TraversalCommand visitOverrideElements(
		final BoundingBoxListVisitor boundingBoxListVisitor,
		final PrintModelPath originPath
	) {
		var result = TraversalCommand.CONTINUE;

		for(final var visitedBoundingBox: boundingBoxListVisitor.getVisitedBoundingBoxes()) {
			final var boundingBox = visitedBoundingBox.getBoundingBox();
			final var boundingBoxPath = visitedBoundingBox.getPrintModelPath();
			final var placeableReference = boundingBoxPath.findReferenceCallSite(boundingBox);

			if (placeableReference.isPresent()) {
				final var reference = new PrintModelTreeTrace<>(originPath, placeableReference.get().getTracedElement());
				final var element = referenceResolver.resolveReference(reference);

				if (element.isPresent() && element.get().getTracedElement() instanceof OverrideElement overrideBoundingBox) {
					final var pathWithElement = originPath
						.with(reference.getTracedElement(), 0)
						.with(overrideBoundingBox, 0);

					result = visitOverrideElement(overrideBoundingBox, boundingBox, pathWithElement);
				}
			}

			if (result == TraversalCommand.STOP) {
				break;
			} else if (result == TraversalCommand.HALT) {
				return result;
			}
		}

		return result;
	}

	private TraversalCommand visitOverrideElement(OverrideElement overrideBoundingBox, BoundingBox boundingBox, PrintModelPath pathWithElement) {
		var result = TraversalCommand.CONTINUE;
		switch (visitor.descendContainer(overrideBoundingBox, pathWithElement, 0)) {
			case DESCEND_FIRST -> {
				result = walkReferences(overrideBoundingBox.getReferences(), pathWithElement);
				if (result == TraversalCommand.CONTINUE) {
					result = visitor.visitOverriddenBoundingBox(
						boundingBox,
						pathWithElement,
						overrideBoundingBox
					);
				}
			}
			case ELEMENT_FIRST -> {
				result = visitor.visitOverriddenBoundingBox(
					boundingBox,
					pathWithElement,
					overrideBoundingBox
				);
				if (result == TraversalCommand.CONTINUE) {
					result = walkReferences(overrideBoundingBox.getReferences(), pathWithElement);
				}
			}
			case NO_DESCEND -> {
				result = visitor.visitOverriddenBoundingBox(
					boundingBox,
					pathWithElement,
					overrideBoundingBox
				);
			}
		}
		return result;
	}

	protected TraversalCommand walkDINTemplateReferences(
		final PrintModelPath originPath,
		final PrintModelTreeTrace<ModelSegment> dinTemplateSegment
	) {
		final var boundingBoxListVisitor = new BoundingBoxListVisitor();

		var result = new PrintModelWalker(
			boundingBoxListVisitor,
			referenceResolver,
			(segmentId) -> Optional.empty(),
			(sectionId) -> Optional.empty(),
			(watermarkId) -> Optional.empty(),
			(templateId) -> Optional.empty(),
			printModelResolver
		).walkReferences(
			dinTemplateSegment.getTracedElement().getReferences(),
			dinTemplateSegment.getPath()
		);

		if (result == TraversalCommand.CONTINUE) {
			result = visitOverrideElements(boundingBoxListVisitor, originPath);
		}

		return result;
	}

	@Data
	private static class BoundingBoxListVisitor implements PrintModelVisitor {
		private final List<VisitedBoundingBox> visitedBoundingBoxes = new ArrayList<>();

		@Override
		public DescendCommand descendContainer(BaseReferenceContainer<? extends ElementReference> container, PrintModelPath path, int index) {
			return DescendCommand.ELEMENT_FIRST;
		}

		@Override
		public TraversalCommand visitBoundingBox(BoundingBox box, PrintModelPath path) {
			visitedBoundingBoxes.add(new VisitedBoundingBox(box, path));
			return TraversalCommand.CONTINUE;
		}

		@Data
		private static class VisitedBoundingBox {
			private final BoundingBox boundingBox;
			private final PrintModelPath printModelPath;
		}
	}
}
