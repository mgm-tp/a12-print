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
import { isPartialSection, isPartialSegment, isPartialWatermark } from "../../model/partial.js";
import type {
	PartialAnyPrintModelElement,
	PartialExpression,
	PartialField,
	PartialImage,
	PartialListing,
	PartialPrintModelContent,
	PartialPrintModelElement,
	PartialSection,
	PartialSegment,
	PartialTable,
	PartialTextProperties,
	PartialWatermark,
	PrintModelElement,
	Styleable,
} from "../../model/index.js";
import { TEXT_STYLE } from "../../model/constant.js";
import {
	DefaultPartialSectionIdResolver,
	DefaultPartialSegmentIdResolver,
	DefaultPartialWatermarkIdResolver,
	type PartialPrintModelTrace,
	PartialPrintModelVisitor,
	PartialPrintModelWalker,
	PartialReferenceListResolver,
} from "../../walker/partial/index.js";
import { type TraversalCommand } from "../../walker/print-model-visitor.js";
import { type ExtendedEntityInstancePathBuilder } from "../../errors/extended-entity-instance-path.js";

import { type DeepPartial } from "../type-utils.js";

import { type CloneContext, type ElementGetter } from "./type.js";
import { clonePrintModelElement } from "./print-model-element.js";
import { CloneTreeTrace } from "./clone-tree-trace.js";

export function createFragmentElementGetter(fragmentContent: PartialPrintModelContent): ElementGetter {
	const elementsById = new Map((fragmentContent.elementDefinitions ?? []).map(element => [element.id, element]));
	return elementId => elementsById.get(elementId) as PrintModelElement | undefined;
}

function createFragmentReferenceWalker(
	visitor: PartialPrintModelVisitor,
	fragmentContent: PartialPrintModelContent
): PartialPrintModelWalker {
	return new PartialPrintModelWalker(
		visitor,
		new PartialReferenceListResolver(fragmentContent.elementDefinitions ?? []),
		new DefaultPartialSegmentIdResolver([]),
		new DefaultPartialSectionIdResolver([]),
		new DefaultPartialWatermarkIdResolver([])
	);
}

function walkFragmentContainer(
	walker: PartialPrintModelWalker,
	container: PartialSection | PartialSegment | PartialWatermark | PartialAnyPrintModelElement
): void {
	if (isPartialSegment(container)) {
		walker.walkSegment(container);
	} else if (isPartialSection(container)) {
		walker.walkSection(container);
	} else if (isPartialWatermark(container)) {
		walker.walkWatermark(container);
	} else {
		walker.walkElement(container);
	}
}

class TextStyleIdVisitor extends PartialPrintModelVisitor {
	constructor(private readonly usedIds: Set<string>) {
		super();
	}

	beforeVisitElement(): void {
		// empty override - only need to interact with the element itself
	}

	afterVisitElement(): void {
		// empty override - only need to interact with the element itself
	}

	visitElement(
		element: PartialPrintModelElement,
		trace: PartialPrintModelTrace,
		path: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		this.addTextStyleId((element as PartialPrintModelElement & DeepPartial<Styleable>).textProperties);
		return super.visitElement(element, trace, path);
	}

	visitTable(
		element: PartialTable,
		trace: PartialPrintModelTrace,
		path: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		this.addTextStyleId(element.table?.headerTextProperties);
		return super.visitTable(element, trace, path);
	}

	visitListing(
		element: PartialListing,
		trace: PartialPrintModelTrace,
		path: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		this.addTextStyleId(element.listing?.headerTextProperties);
		element.listing?.columns?.forEach(column => this.addTextStyleId(column?.textProperties));
		return super.visitListing(element, trace, path);
	}

	private addTextStyleId(textProperties: PartialTextProperties | undefined): void {
		const value = textProperties?.textStyleId?.value;
		if (value && value !== TEXT_STYLE.NO_TEXT_STYLE_FALLBACK_ID) {
			this.usedIds.add(value);
		}
	}
}

/**
 * Collects the ids of every fragment text style used by `container`, by walking the
 * original, un-cloned fragment section/segment/watermark/element directly - no clone is
 * created or needed to call this.
 */
export function collectUsedTextStyleIds(
	container: PartialSection | PartialSegment | PartialWatermark | PartialAnyPrintModelElement,
	fragmentContent: PartialPrintModelContent
): Set<string> {
	const usedIds = new Set<string>();
	const walker = createFragmentReferenceWalker(new TextStyleIdVisitor(usedIds), fragmentContent);

	walkFragmentContainer(walker, container);

	return usedIds;
}

export interface RequiredModelReferences {
	documentModels: Set<string>;
	typesettingModels: Set<string>;
}

class ModelReferenceVisitor extends PartialPrintModelVisitor {
	constructor(private readonly documentModels: Set<string>) {
		super();
	}

	beforeVisitElement(): void {
		// empty override - only need to interact with the element itself
	}

	afterVisitElement(): void {
		// empty override - only need to interact with the element itself
	}

	visitField(
		element: PartialField,
		trace: PartialPrintModelTrace,
		path: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		if (element.field?.model) {
			this.documentModels.add(element.field.model);
		}
		return super.visitField(element, trace, path);
	}

	visitExpression(
		element: PartialExpression,
		trace: PartialPrintModelTrace,
		path: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		if (element.expression?.model) {
			this.documentModels.add(element.expression.model);
		}
		return super.visitExpression(element, trace, path);
	}

	visitSegment(
		segment: PartialSegment,
		trace: PartialPrintModelTrace,
		path: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		segment.dataContexts?.forEach(dataContext => {
			if (dataContext?.model) {
				this.documentModels.add(dataContext.model);
			}
		});
		return super.visitSegment(segment, trace, path);
	}

	visitImage(
		element: PartialImage,
		trace: PartialPrintModelTrace,
		path: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		if (element.image?.fieldSource?.model) {
			this.documentModels.add(element.image.fieldSource.model);
		}
		return super.visitImage(element, trace, path);
	}
}

/**
 * Determines which document-model and typesetting-model references the content of
 * `container` needs, so the host header can be reconciled before the content is copied.
 */
export function collectRequiredModelReferences(
	container: PartialSection | PartialSegment | PartialWatermark | PartialAnyPrintModelElement,
	fragmentContent: PartialPrintModelContent,
	usedTextStyleIds: Set<string>
): RequiredModelReferences {
	const documentModels = new Set<string>();
	const typesettingModels = new Set<string>();

	for (const styleId of usedTextStyleIds) {
		const style = fragmentContent.textStyles?.definitions?.find(textStyle => textStyle.id === styleId);
		if (style?.typesettingModelName) {
			typesettingModels.add(style.typesettingModelName);
		}
	}

	const walker = createFragmentReferenceWalker(new ModelReferenceVisitor(documentModels), fragmentContent);

	walkFragmentContainer(walker, container);

	return { documentModels, typesettingModels };
}

export function cloneFragmentElements(
	elementDefinitions: readonly PrintModelElement[],
	context: CloneContext,
	trace: CloneTreeTrace = new CloneTreeTrace([])
): { clonedElements: PrintModelElement[] } {
	const clonedElements: PrintModelElement[] = [];

	elementDefinitions.forEach(element => {
		if (!element.isFragment || context.clonedElements?.has(element.id)) {
			return;
		}

		const clonedFragmentElements = clonePrintModelElement(element, context, trace);

		if (!clonedFragmentElements[0]?.id) {
			throw new Error(`Cloned element does not have an id. Original element id: ${element.id}`);
		}

		// fragment elements are their own anchor - there is no placeable reference pointing at them,
		// so the element id itself has to be remapped for inherited input sources
		context.elementIdMap.set(element.id, clonedFragmentElements[0].id);
		clonedElements.push(...clonedFragmentElements);
	});

	return { clonedElements };
}
