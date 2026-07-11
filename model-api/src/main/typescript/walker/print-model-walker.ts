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
import type { PrintModelElement } from "../model/index.js";
import {
	type AnyContainerElement,
	Area,
	BarChart,
	BoundingBox,
	Calculation,
	type DINTemplateProperties,
	Expression,
	Field,
	isSection,
	isSegment,
	isWatermark,
	Line,
	LineChart,
	Listing,
	Override,
	PageNumber,
	PageNumberTotal,
	PieChart,
	type PrintModel,
	type PrintModelContent,
	type Reference,
	type Section,
	type Segment,
	Switch,
	Table,
	TableLayout,
	Text,
	Image,
	type PlaceableReference,
} from "../model/index.js";

import { PrintModelTrace } from "./print-model-trace.js";
import { DescendCommand, PrintModelVisitor, TraversalCommand } from "./print-model-visitor.js";
import { ReferenceListResolver, type ReferenceResolver } from "./reference-resolver.js";
import { DefaultSectionIdResolver, type SectionIdResolver } from "./section-id-resolver.js";
import { DefaultSegmentIdResolver, type SegmentIdResolver } from "./segment-id-resolver.js";
import { DefaultWatermarkIdResolver, type WatermarkIdResolver } from "./watermark-id-resolver.js";
import { ReferenceElementListResolver, type ReferenceElementResolver } from "./reference-element-resolver.js";
import { PrintModelListResolver, type PrintModelResolver } from "./print-model-resolver.js";

export class PrintModelWalker {
	private visitor: PrintModelVisitor;
	private referenceResolver: ReferenceResolver;
	private segmentIdResolver: SegmentIdResolver;
	private sectionIdResolver: SectionIdResolver;
	private watermarkIdResolver: WatermarkIdResolver;
	private referenceElementResolver: ReferenceElementResolver;
	private printModelResolver: PrintModelResolver;

	constructor(
		visitor: PrintModelVisitor,
		referenceResolver: ReferenceResolver,
		segmentIdResolver: SegmentIdResolver,
		sectionIdResolver: SectionIdResolver,
		watermarkIdResolver: WatermarkIdResolver,
		referenceElementResolver: ReferenceElementResolver = new ReferenceElementListResolver([]),
		printModelResolver: PrintModelResolver = new PrintModelListResolver([])
	) {
		this.visitor = visitor;
		this.referenceResolver = referenceResolver;
		this.segmentIdResolver = segmentIdResolver;
		this.sectionIdResolver = sectionIdResolver;
		this.watermarkIdResolver = watermarkIdResolver;
		this.referenceElementResolver = referenceElementResolver;
		this.printModelResolver = printModelResolver;
	}

	public walkPrintModel(printModel: PrintModel): TraversalCommand {
		let result: TraversalCommand;
		const content = printModel.content;

		switch (this.visitor.descendPrintModel(printModel)) {
			case DescendCommand.DESCEND_FIRST:
				result = this.walkPrintModelContent(content);
				if (result === TraversalCommand.CONTINUE) {
					result = this.visitor.visitPrintModel(printModel);
				}
				break;
			case DescendCommand.ELEMENT_FIRST:
				result = this.visitor.visitPrintModel(printModel);
				if (result === TraversalCommand.CONTINUE) {
					result = this.walkPrintModelContent(content);
				}
				break;
			case DescendCommand.NO_DESCEND:
				result = this.visitor.visitPrintModel(printModel);
				break;
		}

		return result;
	}

	public walkPrintModelContent(content: PrintModelContent): TraversalCommand {
		let result: TraversalCommand;
		const { general } = content;

		result = this.walkStructure(general.structure);
		if (result === TraversalCommand.CONTINUE && general.sections) {
			result = this.walkSections(general.sections);
		}
		if (result === TraversalCommand.CONTINUE && general.watermarks) {
			result = this.walkWatermarks(general.watermarks);
		}

		return result;
	}

	private walkStructure(structure: ReadonlyArray<string>): TraversalCommand {
		for (let index = 0; index < structure.length; index++) {
			const id = structure[index];
			const segment = this.segmentIdResolver.resolveSegmentId(id);

			const result = segment
				? this.walkContainer(segment, PrintModelTrace.ROOT_PATH, index)
				: this.visitor.visitUnresolvedSegment(id, index);

			if (result === TraversalCommand.STOP) {
				break;
			}
			if (result === TraversalCommand.HALT) {
				return result;
			}
		}

		return TraversalCommand.CONTINUE;
	}

	private walkSections(sections: ReadonlyArray<string>): TraversalCommand {
		for (let index = 0; index < sections.length; index++) {
			const id = sections[index];
			const section = this.sectionIdResolver.resolveSectionId(id);

			const result = section
				? this.walkContainer(section, PrintModelTrace.ROOT_PATH, index)
				: this.visitor.visitUnresolvedSection(id, index);

			if (result === TraversalCommand.STOP) {
				break;
			}
			if (result === TraversalCommand.HALT) {
				return result;
			}
		}

		return TraversalCommand.CONTINUE;
	}

	private walkWatermarks(watermarks: ReadonlyArray<string>): TraversalCommand {
		for (let index = 0; index < watermarks.length; index++) {
			const id = watermarks[index];
			const watermark = this.watermarkIdResolver.resolveWatermarkId(id);

			const result = watermark
				? this.walkContainer(watermark, PrintModelTrace.ROOT_PATH, index)
				: this.visitor.visitUnresolvedWatermark(id, index);

			if (result === TraversalCommand.STOP) {
				break;
			}
			if (result === TraversalCommand.HALT) {
				return result;
			}
		}

		return TraversalCommand.CONTINUE;
	}

	public walkSegment(segment: Segment): TraversalCommand {
		return this.walkContainer(segment);
	}

	public walkSection(section: Section): TraversalCommand {
		return this.walkContainer(section);
	}

	private walkContainer(
		container: AnyContainerElement,
		printModelTrace: PrintModelTrace = PrintModelTrace.ROOT_PATH,
		index: number = 0
	): TraversalCommand {
		let result: TraversalCommand;
		const newPrintModelInstancePath = printModelTrace.with(container, index);
		const references = getReferences(container);
		if (!references) {
			throw Error("Could not get references from AnyContainerElement");
		}

		switch (this.visitor.descendContainer(container, printModelTrace, index)) {
			case DescendCommand.DESCEND_FIRST:
				result = this.walkReferences(references, newPrintModelInstancePath);
				if (result === TraversalCommand.CONTINUE) {
					result = this.visitor.visitContainer(container, printModelTrace);
				}
				break;
			case DescendCommand.ELEMENT_FIRST:
				result = this.visitor.visitContainer(container, printModelTrace);
				if (result === TraversalCommand.CONTINUE) {
					result = this.walkReferences(references, newPrintModelInstancePath);
				}
				break;
			case DescendCommand.NO_DESCEND:
				result = this.visitor.visitContainer(container, printModelTrace);
				break;
		}

		if (isSegment(container) && container.dinTemplate) {
			result = this.walkDinTemplate(container.dinTemplate, newPrintModelInstancePath);
		}

		return result;
	}

	public walkReferences(
		references: ReadonlyArray<Reference>,
		printModelTrace: PrintModelTrace = PrintModelTrace.ROOT_PATH
	): TraversalCommand {
		for (let index = 0; index < references.length; index++) {
			const result = this.walkReference(references[index], printModelTrace, index);
			if (result === TraversalCommand.STOP) {
				break;
			}
			if (result === TraversalCommand.HALT) {
				return result;
			}
		}

		return TraversalCommand.CONTINUE;
	}

	public walkReference(
		reference: Reference,
		printModelTrace: PrintModelTrace = PrintModelTrace.ROOT_PATH,
		index: number = 0
	): TraversalCommand {
		let result: TraversalCommand = this.visitor.visitReference(reference, printModelTrace, index);
		if (result === TraversalCommand.CONTINUE) {
			const newPrintModelInstancePath = printModelTrace.with(reference, index);
			const element = this.referenceResolver.resolveReference(reference);
			if (element) {
				result = this.walkElement(element, newPrintModelInstancePath, index);
			} else {
				result = this.visitor.visitUnresolvedElement(reference, printModelTrace, index);
			}
		}

		return result;
	}

	public walkElement(
		element: PrintModelElement,
		printModelTrace: PrintModelTrace = PrintModelTrace.ROOT_PATH,
		index: number = 0
	): TraversalCommand {
		this.visitor.beforeVisitElement(element, printModelTrace);
		let result: TraversalCommand;

		if (getReferences(element)) {
			result = this.walkContainer(element as AnyContainerElement, printModelTrace, index);
		} else {
			result = this.visitor.visitElement(element, printModelTrace);
		}

		this.visitor.afterVisitElement(element, printModelTrace);
		return result;
	}

	public walkDinTemplate(templateProperties: DINTemplateProperties, originPath: PrintModelTrace): TraversalCommand {
		const { referenceId, refId } = templateProperties;

		if (!referenceId || !refId) {
			return TraversalCommand.CONTINUE;
		}

		const reference = this.referenceElementResolver.resolveReferenceElement(referenceId);
		const referencedPrintModel = reference && this.printModelResolver.resolvePrintModel(reference.referenceModel);
		const dinTemplateSegment =
			referencedPrintModel && DefaultSegmentIdResolver.fromModel(referencedPrintModel).resolveSegmentId(refId);

		if (!dinTemplateSegment) {
			return this.visitor.visitUnresolvedDinTemplate(refId);
		}

		let result: TraversalCommand;

		const referencedReferenceResolver = ReferenceListResolver.fromModel(referencedPrintModel);

		switch (this.visitor.descendDinTemplate(dinTemplateSegment)) {
			case DescendCommand.DESCEND_FIRST:
				this.walkDINTemplateReferences(dinTemplateSegment, originPath, referencedReferenceResolver);
				result = this.visitor.visitDINTemplate(dinTemplateSegment);
				break;
			case DescendCommand.ELEMENT_FIRST:
				result = this.visitor.visitDINTemplate(dinTemplateSegment);
				this.walkDINTemplateReferences(dinTemplateSegment, originPath, referencedReferenceResolver);
				break;
			case DescendCommand.NO_DESCEND:
				result = this.visitor.visitDINTemplate(dinTemplateSegment);
				break;
		}

		return result;
	}

	private walkDINTemplateReferences(
		dinTemplateSegment: Segment,
		originPath: PrintModelTrace,
		referenceResolver: ReferenceResolver
	): TraversalCommand {
		const referencedResult = walkReferencedBoundingBoxes(
			this.printModelResolver,
			referenceResolver,
			dinTemplateSegment.elementReferences
		);

		let result = referencedResult[0];
		const referencedBoundingBoxes = referencedResult[1];

		const originSegment = originPath.findParentTopLevelReferenceContainer();
		if (!originSegment?.parent || !isSegment(originSegment?.parent)) {
			return result;
		}

		const dinTemplate = originSegment?.parent.dinTemplate;
		if (!dinTemplate) {
			return result;
		}
		referencedBoundingBoxes.forEach(boundingBox => {
			const override = this.referenceResolver.findReference(
				el => Override.isInstance(el) && el.override?.refId === boundingBox.id
			);

			if (!override) {
				return;
			}

			const reference = dinTemplateSegment.elementReferences.find(ref => ref.refId === boundingBox.id)!;
			const pathWithElement = originPath.with(reference, 0).with(override, 0);

			switch (this.visitor.descendContainer(override, originPath, 0)) {
				case DescendCommand.DESCEND_FIRST:
					result = this.walkReferences(
						(override as Override).override.boundingBox?.elementReferences || [],
						pathWithElement
					);
					if (result === TraversalCommand.CONTINUE) {
						result = this.visitor.visitOverriddenBoundingBox(
							boundingBox,
							override as Override,
							pathWithElement
						);
					}
					break;
				case DescendCommand.ELEMENT_FIRST:
					if (result === TraversalCommand.CONTINUE) {
						result = this.visitor.visitOverriddenBoundingBox(
							boundingBox,
							override as Override,
							pathWithElement
						);
					}
					result = this.walkReferences(
						(override as Override).override.boundingBox?.elementReferences || [],
						pathWithElement
					);
					break;
				case DescendCommand.NO_DESCEND:
					if (result === TraversalCommand.CONTINUE) {
						result = this.visitor.visitOverriddenBoundingBox(
							boundingBox,
							override as Override,
							pathWithElement
						);
					}
					break;
			}
		});

		return result;
	}
}

export function walkReferencedBoundingBoxes(
	printModelResolver: PrintModelResolver,
	referenceResolver: ReferenceResolver,
	elementReferences: readonly PlaceableReference[]
): [TraversalCommand, BoundingBox[]] {
	class BoundingBoxListVisitor extends PrintModelVisitor {
		public visitedBoundingBoxes: Array<BoundingBox> = [];

		descendContainer(): DescendCommand {
			return DescendCommand.ELEMENT_FIRST;
		}

		visitBoundingBox(element: BoundingBox): TraversalCommand {
			this.visitedBoundingBoxes.push(element);
			return TraversalCommand.CONTINUE;
		}

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		afterVisitElement(element: PrintModelElement) {
			// do nothing
		}

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		beforeVisitElement(element: PrintModelElement) {
			// do nothing
		}
	}

	const boundingBoxVisitor = new BoundingBoxListVisitor();

	const result = new PrintModelWalker(
		boundingBoxVisitor,
		referenceResolver,
		new DefaultSegmentIdResolver([]),
		new DefaultSectionIdResolver([]),
		new DefaultWatermarkIdResolver([]),
		new ReferenceElementListResolver([]),
		printModelResolver
	).walkReferences(elementReferences);

	return [result, boundingBoxVisitor.visitedBoundingBoxes];
}

export function getReferences(element: PrintModelElement | AnyContainerElement): readonly Reference[] | undefined {
	if (isSegment(element) || isSection(element) || isWatermark(element)) {
		return element.elementReferences || [];
	}
	if (Text.isInstance(element)) {
		return element.text.entities || [];
	}
	if (Table.isInstance(element)) {
		return element.table.columns || [];
	}
	if (TableLayout.isInstance(element)) {
		return element.tableLayout.cells || [];
	}
	if (BoundingBox.isInstance(element)) {
		return element.boundingBox.elementReferences || [];
	}
	if (Area.isInstance(element)) {
		return element.area.elementReferences || [];
	}
	if (Override.isInstance(element)) {
		return element.override.boundingBox?.elementReferences || [];
	}
	if (Switch.isInstance(element)) {
		return element.switch.cases;
	}

	if (
		BarChart.isInstance(element) ||
		Calculation.isInstance(element) ||
		Expression.isInstance(element) ||
		Field.isInstance(element) ||
		Image.isInstance(element) ||
		Line.isInstance(element) ||
		LineChart.isInstance(element) ||
		Listing.isInstance(element) ||
		PageNumber.isInstance(element) ||
		PageNumberTotal.isInstance(element) ||
		PieChart.isInstance(element)
	) {
		return undefined;
	}

	throw Error(`Element of type ${element.type} does not exist in getReferences`);
}
