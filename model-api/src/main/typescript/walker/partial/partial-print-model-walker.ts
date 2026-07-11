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
import {
	type DINTemplateProperties,
	isPartialSection,
	isPartialSegment,
	isPartialWatermark,
	type PartialAnyContainerElement,
	type PartialAnyPrintModelElement,
	PartialAnyTopLevelContainerElement,
	PartialArea,
	PartialBarChart,
	PartialBoundingBox,
	PartialCalculation,
	PartialExpression,
	PartialField,
	PartialImage,
	PartialLine,
	PartialLineChart,
	PartialListing,
	type PartialMetadata,
	PartialOverride,
	PartialPageNumber,
	PartialPageNumberTotal,
	PartialPieChart,
	type PartialPrintModel,
	type PartialPrintModelContent,
	type PartialPrintModelElement,
	type PartialReference,
	type PartialSection,
	type PartialSegment,
	PartialSwitch,
	PartialTable,
	PartialTableLayout,
	PartialText,
	type PartialWatermark,
	PrintModelElement,
	type Segment,
} from "../../model/index.js";
import { ExtendedEntityInstancePathBuilder } from "../../errors/extended-entity-instance-path.js";

import { DescendCommand, TraversalCommand } from "../print-model-visitor.js";
import { ReferenceListResolver, type ReferenceResolver } from "../reference-resolver.js";
import { PrintModelListResolver, type PrintModelResolver } from "../print-model-resolver.js";
import { DefaultSegmentIdResolver } from "../segment-id-resolver.js";
import { walkReferencedBoundingBoxes } from "../print-model-walker.js";

import type { PartialPrintModelVisitor } from "./partial-print-model-visitor.js";
import { type PartialSectionIdResolver } from "./partial-section-id-resolver.js";
import { type PartialWatermarkIdResolver } from "./partial-watermark-id-resolver.js";
import { type PartialSegmentIdResolver } from "./partial-segment-id-resolver.js";
import { type PartialReferenceResolver } from "./partial-reference-resolver.js";
import {
	PartialReferenceElementListResolver,
	type PartialReferenceElementResolver,
} from "./parital-reference-element-resolver.js";
import { PartialPrintModelTrace } from "./partial-print-model-trace.js";

export class PartialPrintModelWalker {
	private visitor: PartialPrintModelVisitor;
	private referenceResolver: PartialReferenceResolver;
	private segmentIdResolver: PartialSegmentIdResolver;
	private sectionIdResolver: PartialSectionIdResolver;
	private watermarkIdResolver: PartialWatermarkIdResolver;
	private referenceElementResolver: PartialReferenceElementResolver;
	private printModelResolver: PrintModelResolver;

	constructor(
		visitor: PartialPrintModelVisitor,
		referenceResolver: PartialReferenceResolver,
		segmentIdResolver: PartialSegmentIdResolver,
		sectionIdResolver: PartialSectionIdResolver,
		watermarkIdResolver: PartialWatermarkIdResolver,
		referenceElementResolver: PartialReferenceElementResolver = new PartialReferenceElementListResolver([]),
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

	public walkPrintModel(printModel: PartialPrintModel): TraversalCommand {
		let result: TraversalCommand;
		const content = printModel.content;

		if (!content) {
			return TraversalCommand.HALT;
		}

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

	public walkPrintModelContent(content: PartialPrintModelContent): TraversalCommand {
		let result: TraversalCommand = TraversalCommand.CONTINUE;
		const { general } = content;

		if (!general) {
			return result;
		}

		if (general.metadata) {
			result = this.walkMetadata(general.metadata);
		}
		if (result === TraversalCommand.CONTINUE && general.structure) {
			result = this.walkStructure(general.structure);
		}
		if (result === TraversalCommand.CONTINUE && general.sections) {
			result = this.walkSections(general.sections);
		}
		if (result === TraversalCommand.CONTINUE && general.watermarks) {
			result = this.walkWatermarks(general.watermarks);
		}

		return result;
	}

	private walkMetadata(metadata: PartialMetadata): TraversalCommand {
		const printModelPath = new ExtendedEntityInstancePathBuilder()
			.append("content")
			.append("general")
			.append("metadata");
		return this.visitor.visitMetadata(metadata, printModelPath);
	}

	private walkStructure(structure: ReadonlyArray<string>): TraversalCommand {
		for (let index = 0; index < structure.length; index++) {
			const id = structure[index];
			const segment = this.segmentIdResolver.resolveSegmentId(id);

			let result;
			if (segment) {
				const printModelPath = getTopLevelContainerBasePath(segment, index);
				result = this.walkContainer(segment, PartialPrintModelTrace.ROOT_PATH, printModelPath, index);
			} else {
				result = this.visitor.visitUnresolvedSegment(id, index);
			}

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

			let result;
			if (section) {
				const printModelPath = getTopLevelContainerBasePath(section, index);
				result = this.walkContainer(section, PartialPrintModelTrace.ROOT_PATH, printModelPath, index);
			} else {
				result = this.visitor.visitUnresolvedSection(id, index);
			}

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

			let result;
			if (watermark) {
				const printModelPath = getTopLevelContainerBasePath(watermark, index);
				result = this.walkContainer(watermark, PartialPrintModelTrace.ROOT_PATH, printModelPath, index);
			} else {
				result = this.visitor.visitUnresolvedWatermark(id, index);
			}

			if (result === TraversalCommand.STOP) {
				break;
			}
			if (result === TraversalCommand.HALT) {
				return result;
			}
		}

		return TraversalCommand.CONTINUE;
	}

	public walkSegment(segment: PartialSegment, index: number = 0): TraversalCommand {
		const printModelPath = getTopLevelContainerBasePath(segment, index);

		return this.walkContainer(segment, PartialPrintModelTrace.ROOT_PATH, printModelPath, index);
	}

	public walkSection(section: PartialSection, index: number = 0): TraversalCommand {
		const printModelPath = getTopLevelContainerBasePath(section, index);

		return this.walkContainer(section, PartialPrintModelTrace.ROOT_PATH, printModelPath, index);
	}

	public walkWatermark(watermark: PartialWatermark, index: number = 0): TraversalCommand {
		const printModelPath = getTopLevelContainerBasePath(watermark, index);

		return this.walkContainer(watermark, PartialPrintModelTrace.ROOT_PATH, printModelPath, index);
	}

	private walkContainer(
		container: PartialAnyContainerElement,
		printModelTrace: PartialPrintModelTrace,
		printModelPath: ExtendedEntityInstancePathBuilder,
		index: number
	): TraversalCommand {
		let result: TraversalCommand;
		const newPrintModelInstancePath = printModelTrace.with(container, index);
		const references = getPartialReferences(container) ?? [];

		switch (this.visitor.descendContainer(container, printModelTrace, index)) {
			case DescendCommand.DESCEND_FIRST:
				result = this.walkReferences(references, newPrintModelInstancePath, printModelPath);
				if (result === TraversalCommand.CONTINUE) {
					result = this.visitor.visitContainer(container, printModelTrace, printModelPath);
				}
				break;
			case DescendCommand.ELEMENT_FIRST:
				result = this.visitor.visitContainer(container, printModelTrace, printModelPath);
				if (result === TraversalCommand.CONTINUE) {
					result = this.walkReferences(references, newPrintModelInstancePath, printModelPath);
				}
				break;
			case DescendCommand.NO_DESCEND:
				result = this.visitor.visitContainer(container, printModelTrace, printModelPath);
				break;
		}

		if (isPartialSegment(container) && container.dinTemplate) {
			result = this.walkDinTemplate(container.dinTemplate, newPrintModelInstancePath);
		}

		return result;
	}

	public walkReferences(
		references: ReadonlyArray<PartialReference>,
		printModelTrace: PartialPrintModelTrace,
		printModelPath: ExtendedEntityInstancePathBuilder = ExtendedEntityInstancePathBuilder.ROOT_PATH
	): TraversalCommand {
		for (let index = 0; index < references.length; index++) {
			const referencesParent = printModelTrace.getParent()?.parent;
			const extendedBasePath = extendContainerReferencesBasePath(referencesParent, printModelPath, index);
			const result = this.walkReference(references[index], printModelTrace, extendedBasePath, index);
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
		reference: PartialReference,
		printModelTrace: PartialPrintModelTrace = PartialPrintModelTrace.ROOT_PATH,
		printModelPath: ExtendedEntityInstancePathBuilder = ExtendedEntityInstancePathBuilder.ROOT_PATH,
		index: number = 0
	): TraversalCommand {
		let result: TraversalCommand = this.visitor.visitReference(reference, printModelTrace, index, printModelPath);

		if (result === TraversalCommand.CONTINUE) {
			const newPrintModelInstancePath = printModelTrace.with(reference, index);

			const resolvedReference = this.referenceResolver.resolveReferenceWithIndex(reference);
			if (resolvedReference) {
				const { element, index } = resolvedReference;
				// the referenced element has a different print model path than the reference itself
				const elementDefinitionBasePath = getElementDefinitionBasePath(
					element as PartialAnyPrintModelElement,
					index
				);
				result = this.walkElement(element, newPrintModelInstancePath, elementDefinitionBasePath, index);
			} else {
				result = this.visitor.visitUnresolvedElement(reference, printModelTrace, index);
			}
		}

		return result;
	}

	public walkElement(
		element: PartialPrintModelElement,
		printModelTrace: PartialPrintModelTrace = PartialPrintModelTrace.ROOT_PATH,
		printModelPath: ExtendedEntityInstancePathBuilder = ExtendedEntityInstancePathBuilder.ROOT_PATH,
		index: number = 0
	): TraversalCommand {
		this.visitor.beforeVisitElement(element, printModelTrace);
		let result: TraversalCommand;

		if (!PrintModelElement.isInstance(element)) {
			result = this.visitor.visitUndefinedElement(element, printModelTrace);
			this.visitor.afterVisitElement(element, printModelTrace);
			return result;
		}

		if (getPartialReferences(element)) {
			result = this.walkContainer(element, printModelTrace, printModelPath, index);
		} else {
			result = this.visitor.visitElement(element, printModelTrace, printModelPath);
		}

		this.visitor.afterVisitElement(element, printModelTrace);
		return result;
	}

	public walkDinTemplate(
		templateProperties: DINTemplateProperties,
		originPath: PartialPrintModelTrace
	): TraversalCommand {
		const { referenceId, refId } = templateProperties;

		if (!referenceId || !refId) {
			return TraversalCommand.CONTINUE;
		}

		const reference = this.referenceElementResolver.resolveReferenceElement(referenceId);

		if (!reference?.referenceModel) {
			return TraversalCommand.CONTINUE;
		}

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
		originPath: PartialPrintModelTrace,
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

		if (!originSegment?.parent || !isPartialSegment(originSegment?.parent)) {
			return result;
		}

		const dinTemplate = originSegment?.parent.dinTemplate;

		if (!dinTemplate) {
			return result;
		}

		referencedBoundingBoxes.forEach(boundingBox => {
			const override = this.referenceResolver.findReference(el => {
				return (
					PrintModelElement.isInstance(el) &&
					PartialOverride.isInstance(el) &&
					el.override?.refId === boundingBox.id
				);
			}) as PartialOverride;

			if (!override) {
				return;
			}

			const reference = dinTemplateSegment.elementReferences.find(ref => ref.refId === boundingBox.id)!;
			const pathWithElement = originPath.with(reference, 0).with(override, 0);

			switch (this.visitor.descendContainer(override, originPath, 0)) {
				case DescendCommand.DESCEND_FIRST:
					result = this.walkReferences(
						override.override?.boundingBox?.elementReferences || [],
						pathWithElement
					);
					if (result === TraversalCommand.CONTINUE) {
						result = this.visitor.visitOverriddenBoundingBox(boundingBox, override, pathWithElement);
					}
					break;
				case DescendCommand.ELEMENT_FIRST:
					if (result === TraversalCommand.CONTINUE) {
						result = this.visitor.visitOverriddenBoundingBox(boundingBox, override, pathWithElement);
					}
					result = this.walkReferences(
						(override as PartialOverride).override?.boundingBox?.elementReferences || [],
						pathWithElement
					);
					break;
				case DescendCommand.NO_DESCEND:
					if (result === TraversalCommand.CONTINUE) {
						result = this.visitor.visitOverriddenBoundingBox(boundingBox, override, pathWithElement);
					}
					break;
			}
		});

		return result;
	}
}

export function getPartialReferences(
	element: PartialAnyPrintModelElement | PartialAnyTopLevelContainerElement
): readonly PartialReference[] | undefined {
	if (isPartialSegment(element) || isPartialSection(element) || isPartialWatermark(element)) {
		return element.elementReferences || [];
	}

	if (PartialText.isInstance(element)) {
		return element.text?.entities || [];
	}
	if (PartialTable.isInstance(element)) {
		return element.table?.columns || [];
	}
	if (PartialTableLayout.isInstance(element)) {
		return element?.tableLayout?.cells || [];
	}
	if (PartialBoundingBox.isInstance(element)) {
		return element.boundingBox?.elementReferences || [];
	}
	if (PartialArea.isInstance(element)) {
		return element.area?.elementReferences || [];
	}
	if (PartialOverride.isInstance(element)) {
		return element.override?.boundingBox?.elementReferences || [];
	}
	if (PartialSwitch.isInstance(element)) {
		return element.switch?.cases;
	}

	if (
		PartialBarChart.isInstance(element) ||
		PartialCalculation.isInstance(element) ||
		PartialExpression.isInstance(element) ||
		PartialField.isInstance(element) ||
		PartialImage.isInstance(element) ||
		PartialLine.isInstance(element) ||
		PartialLineChart.isInstance(element) ||
		PartialListing.isInstance(element) ||
		PartialPageNumber.isInstance(element) ||
		PartialPageNumberTotal.isInstance(element) ||
		PartialPieChart.isInstance(element)
	) {
		return undefined;
	}

	throw Error(`Element: ${JSON.stringify(element)} does not exist in getPartialReferences`);
}

export function getTopLevelContainerBasePath(
	element: PartialAnyTopLevelContainerElement,
	index: number
): ExtendedEntityInstancePathBuilder {
	const path = new ExtendedEntityInstancePathBuilder().append("content");
	if (isPartialSegment(element)) {
		return path.append("segments").append("definitions", index);
	}
	if (isPartialSection(element)) {
		return path.append("sections").append("definitions", index);
	}
	if (isPartialWatermark(element)) {
		return path.append("watermarks").append("definitions", index);
	}

	throw new Error("unknown toplevel container");
}

export function getElementDefinitionBasePath(
	element: PartialAnyPrintModelElement,
	index: number = 1
): ExtendedEntityInstancePathBuilder {
	const path = new ExtendedEntityInstancePathBuilder().append("content").append("elementDefinitions", index);
	if (PartialText.isInstance(element)) {
		return path.append("text");
	} else if (PartialTable.isInstance(element)) {
		return path.append("table");
	} else if (PartialTableLayout.isInstance(element)) {
		return path.append("tableLayout");
	} else if (PartialBoundingBox.isInstance(element)) {
		return path.append("boundingBox");
	} else if (PartialArea.isInstance(element)) {
		return path.append("area");
	} else if (PartialOverride.isInstance(element)) {
		return path.append("override");
	} else if (PartialSwitch.isInstance(element)) {
		return path.append("switch");
	} else if (
		PartialBarChart.isInstance(element) ||
		PartialCalculation.isInstance(element) ||
		PartialExpression.isInstance(element) ||
		PartialField.isInstance(element) ||
		PartialImage.isInstance(element) ||
		PartialLine.isInstance(element) ||
		PartialLineChart.isInstance(element) ||
		PartialListing.isInstance(element) ||
		PartialPageNumber.isInstance(element) ||
		PartialPageNumberTotal.isInstance(element) ||
		PartialPieChart.isInstance(element)
	) {
		return path.append(toCamelCase(element.type));
	}

	return path;
}

export function extendContainerReferencesBasePath(
	element: PartialAnyPrintModelElement | PartialAnyTopLevelContainerElement | undefined,
	path: ExtendedEntityInstancePathBuilder,
	referenceIndex: number
): ExtendedEntityInstancePathBuilder {
	if (!element || PartialAnyTopLevelContainerElement.isInstance(element)) {
		return path.with("elementReferences", referenceIndex);
	}
	if (PartialText.isInstance(element)) {
		path = path.with("entities", referenceIndex);
	} else if (PartialTable.isInstance(element)) {
		path = path.with("coulumns", referenceIndex);
	} else if (PartialTableLayout.isInstance(element)) {
		path = path.with("cells", referenceIndex);
	} else if (PartialBoundingBox.isInstance(element)) {
		path = path.with("elementReferences", referenceIndex);
	} else if (PartialArea.isInstance(element)) {
		path = path.with("elementReferences", referenceIndex);
	} else if (PartialOverride.isInstance(element)) {
		path = path.with("boundingBox").append("elementReferences", referenceIndex);
	} else if (PartialSwitch.isInstance(element)) {
		path = path.with("cases", referenceIndex);
	}

	return path;
}

const toCamelCase = (s: string) => s[0].toLowerCase() + s.slice(1);
