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
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
	FRAGMENT_SUB_TYPE,
	isFragmentModelReference,
	PrintModelElement,
	type FragmentModelReference,
	type FragmentType,
	type ListingColumn,
	type ListingColumnField,
	type PartialArea,
	type PartialBarChart,
	type PartialCalculation,
	type PartialExpression,
	type PartialField,
	type PartialImage,
	type PartialLineChart,
	type PartialListing,
	type PartialMetadata,
	type PartialPieChart,
	type PartialPlaceableReference,
	type PartialPrintModel,
	type PartialPrintModelElement,
	type PartialReference,
	type PartialSegment,
	type PartialSwitchCaseReference,
	type PartialTable,
	type PartialTextStyle,
	type PartialWatermark,
	type PrintModel,
	type PrintModelEntity,
} from "@com.mgmtp.a12.print/print-model-api/model";
import { ExtendedEntityInstancePathBuilder } from "@com.mgmtp.a12.print/print-model-api/errors";
import type { PartialPrintModelTrace } from "@com.mgmtp.a12.print/print-model-api/walker";
import {
	TraversalCommand,
	createPartialPrintModelWalker,
	getElementDefinitionBasePath,
	PartialPrintModelVisitor,
} from "@com.mgmtp.a12.print/print-model-api/walker";
import type { DeepPartialRecursive } from "@com.mgmtp.a12.print/print-model-api/utils";

import type {
	CollectedComputation,
	CollectedFieldReference,
	CollectedTypesettingUsage,
	MissingFragmentReference,
	CollectedPath,
	ReferenceCollectorResult,
} from "../../types/reference-path.js";

import { extractFieldReferencePath, extractComputationPaths } from "./reference-path-extraction.js";

/**
 * A PartialPrintModelVisitor that collects all objects which includes references to document model paths
 * during a traversal of a PartialPrintModel.
 *
 * This includes:
 * - Computation paths (e.g. precondition, operation)
 * - Field references (e.g. basePath, path, valueField, keyField)
 *
 * @example
 * const visitor = new PartialPrintModelVisitorReferenceCollector();
 * const walker = createPartialPrintModelWalker(printModel, visitor);
 * walker.walkPrintModel(printModel);
 * console.log(visitor.computations, visitor.fieldReferences);
 */
export class PartialPrintModelVisitorReferenceCollector
	extends PartialPrintModelVisitor
	implements ReferenceCollectorResult
{
	// document model references
	collectedPaths: CollectedPath[] = [];
	// fragment model references
	missingFragmentReferences: MissingFragmentReference[] = [];
	// typesetting models used by a text style, be it a local one or one of a fragment model
	typesettingUsages: CollectedTypesettingUsage[] = [];

	constructor(private readonly printModel?: PartialPrintModel) {
		super();
	}

	addComputation(computation: CollectedComputation | undefined, printModelPath: ExtendedEntityInstancePathBuilder) {
		if (!computation) {
			return;
		}
		extractComputationPaths(this.collectedPaths, computation, printModelPath, "precondition");
		extractComputationPaths(this.collectedPaths, computation, printModelPath, "operation");
	}

	addFieldReference(field: CollectedFieldReference | undefined, printModelPath: ExtendedEntityInstancePathBuilder) {
		if (!field) {
			return;
		}
		extractFieldReferencePath(this.collectedPaths, field, printModelPath);
	}

	beforeVisitElement(element: PartialPrintModelElement, printModelTrace: PartialPrintModelTrace): void {
		// reference collector does not need to do anything before visiting an element
	}

	afterVisitElement(element: PartialPrintModelElement, printModelTrace: PartialPrintModelTrace): void {
		// reference collector does not need to do anything after visiting an element
	}

	visitMetadata(metadata: PartialMetadata, printModelPath: ExtendedEntityInstancePathBuilder): TraversalCommand {
		metadata.titleComputation?.forEach((computation, index) => {
			this.addComputation(computation, printModelPath.with("titleComputation", index));
		});
		metadata.descriptionComputation?.forEach((computation, index) => {
			this.addComputation(computation, printModelPath.with("descriptionComputation", index));
		});
		metadata.authorComputation?.forEach((computation, index) => {
			this.addComputation(computation, printModelPath.with("authorComputation", index));
		});
		metadata.languageComputation?.forEach((computation, index) => {
			this.addComputation(computation, printModelPath.with("languageComputation", index));
		});
		return TraversalCommand.CONTINUE;
	}

	visitField(
		element: PartialField,
		printModelTrace: PartialPrintModelTrace,
		printModelPath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		this.addFieldReference(element.field, printModelPath);
		return TraversalCommand.CONTINUE;
	}

	visitArea(
		element: PartialArea,
		printModelTrace: PartialPrintModelTrace,
		printModelPath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		element.area?.dataContexts?.forEach((dataContext, index) => {
			this.addFieldReference(dataContext, printModelPath.with("dataContexts", index));
		});
		return TraversalCommand.CONTINUE;
	}

	visitSegment(
		segment: PartialSegment,
		printModelTrace: PartialPrintModelTrace,
		printModelPath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		segment.dataContexts?.forEach((dataContext, index) => {
			this.addFieldReference(dataContext, printModelPath.with("dataContexts", index));
		});
		return TraversalCommand.CONTINUE;
	}

	visitTable(
		element: PartialTable,
		printModelTrace: PartialPrintModelTrace,
		printModelPath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		this.addFieldReference(element.table, printModelPath);
		return TraversalCommand.CONTINUE;
	}

	visitImage(
		element: PartialImage,
		printModelTrace: PartialPrintModelTrace,
		printModelPath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		this.addFieldReference(element.image?.fieldSource, printModelPath.with("fieldSource"));
		return TraversalCommand.CONTINUE;
	}

	visitBarChart(
		element: PartialBarChart,
		printModelTrace: PartialPrintModelTrace,
		printModelPath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		this.addFieldReference(element.barChart, printModelPath);
		return TraversalCommand.CONTINUE;
	}

	visitPieChart(
		element: PartialPieChart,
		printModelTrace: PartialPrintModelTrace,
		printModelPath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		this.addFieldReference(element.pieChart, printModelPath);
		return TraversalCommand.CONTINUE;
	}

	visitLineChart(
		element: PartialLineChart,
		printModelTrace: PartialPrintModelTrace,
		printModelPath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		this.addFieldReference(element.lineChart, printModelPath);
		return TraversalCommand.CONTINUE;
	}

	visitExpression(
		element: PartialExpression,
		printModelTrace: PartialPrintModelTrace,
		printModelPath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		this.addFieldReference(element.expression, printModelPath.with("model"));
		return TraversalCommand.CONTINUE;
	}

	visitCalculation(
		element: PartialCalculation,
		printModelTrace: PartialPrintModelTrace,
		printModelPath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		element.calculation?.computationAlternatives?.forEach((computation, i) => {
			this.addComputation(computation, printModelPath?.with("computationAlternatives", i));
		});
		return TraversalCommand.CONTINUE;
	}

	visitSwitchCaseReference(
		reference: PartialSwitchCaseReference,
		printModelTrace: PartialPrintModelTrace,
		index: number,
		printModelPath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		this.addComputation(reference, printModelPath);
		return TraversalCommand.CONTINUE;
	}

	visitPlaceableReference(
		reference: PartialPlaceableReference,
		printModelTrace: PartialPrintModelTrace,
		index: number,
		printModelPath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		reference.hideConditions?.forEach((hideCondition, hideConditionIndex) => {
			this.addComputation(hideCondition, printModelPath.with("hideConditions", hideConditionIndex));
		});
		return TraversalCommand.CONTINUE;
	}

	visitWatermark(
		watermark: PartialWatermark,
		printModelTrace: PartialPrintModelTrace,
		printModelPath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		watermark.conditions?.forEach((watermarkCondition, i) => {
			this.addComputation(watermarkCondition, printModelPath.with("conditions", i));
		});
		return TraversalCommand.CONTINUE;
	}
	visitListing(
		element: PartialListing,
		printModelTrace: PartialPrintModelTrace,
		printModelPath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		this.addFieldReference(element.listing, printModelPath);

		element.listing?.columns?.forEach((column, columnIndex) => {
			const columnPath = printModelPath?.with("columns", columnIndex);

			this.visitListingColumnDefault(column, columnPath);

			column.field?.forEach((field, fieldIndex) => this.visitListingColumnField(columnPath, field, fieldIndex));

			this.visitListingColumnGroup(column, columnPath);
		});

		// rowPropertyComputations
		element.listing?.rowPropertyComputations?.forEach((rowPropertyComputation, pcIndex) => {
			const path = printModelPath?.with("rowPropertyComputations", pcIndex);
			rowPropertyComputation.computationAlternatives?.forEach((computation, compIndex) => {
				this.addComputation(computation, path?.with("computationAlternatives", compIndex));
			});
		});

		//groupPropertyComputations
		element.listing?.groupPropertyComputations?.forEach((groupPropertyComputation, gcIndex) => {
			const path = printModelPath?.with("groupPropertyComputations", gcIndex);
			groupPropertyComputation.computationAlternatives?.forEach((computation, compIndex) => {
				this.addComputation(computation, path?.with("computationAlternatives", compIndex));
			});
		});

		return TraversalCommand.CONTINUE;
	}

	visitListingColumnDefault(
		column: DeepPartialRecursive<ListingColumn> & PrintModelEntity,
		columnPath: ExtendedEntityInstancePathBuilder
	) {
		const defaultPath = columnPath?.with("default");
		column.default?.propertyComputations?.forEach((propertyComputation, pcIndex) => {
			const path = defaultPath?.with("propertyComputations", pcIndex);
			propertyComputation.computationAlternatives?.forEach((computation, compIndex) => {
				this.addComputation(computation, path?.with("computationAlternatives", compIndex));
			});
		});
		column.default?.valueComputationAlternatives?.forEach((valueComputation, compIndex) => {
			this.addComputation(valueComputation, defaultPath?.with("valueComputationAlternatives", compIndex));
		});
	}

	visitListingColumnField(
		columnPath: ExtendedEntityInstancePathBuilder,
		field: DeepPartialRecursive<ListingColumnField> & PrintModelEntity,
		fieldIndex: number
	) {
		const fieldPath = columnPath?.with("field", fieldIndex);

		field.propertyComputations?.forEach((propertyComputation, pcIndex) => {
			const path = fieldPath?.with("propertyComputations", pcIndex);
			propertyComputation.computationAlternatives?.forEach((computation, compIndex) => {
				this.addComputation(computation, path?.with("computationAlternatives", compIndex));
			});
		});

		field.valueComputationAlternatives?.forEach((valueComputation, compIndex) => {
			this.addComputation(valueComputation, fieldPath?.with("valueComputationAlternatives", compIndex));
		});
	}

	visitListingColumnGroup(
		column: DeepPartialRecursive<ListingColumn> & PrintModelEntity,
		columnPath: ExtendedEntityInstancePathBuilder
	) {
		const groupPath = columnPath?.with("group");
		column.group?.propertyComputations?.forEach((propertyComputation, pcIndex) => {
			const path = groupPath?.with("propertyComputations", pcIndex);
			propertyComputation.computationAlternatives?.forEach((computation, compIndex) => {
				this.addComputation(computation, path?.with("computationAlternatives", compIndex));
			});
		});
		column.group?.valueComputationAlternatives?.forEach((valueComputation, compIndex) => {
			this.addComputation(valueComputation, groupPath?.with("valueComputationAlternatives", compIndex));
		});
	}

	// --- Fragment Related Handling ---

	addMissingFragmentReference(
		type: FragmentType,
		unresolvedFragment: Pick<FragmentModelReference, "model" | "refId">,
		index: number = 0,
		path?: ExtendedEntityInstancePathBuilder
	) {
		let printModelPath = path ?? ExtendedEntityInstancePathBuilder.ROOT_PATH;
		if (type !== "element") {
			printModelPath = getTopLevelFragmentReferenceContainerBasePath(type, index);
		}
		this.missingFragmentReferences.push({
			type,
			model: unresolvedFragment.model,
			refId: unresolvedFragment.refId,
			index,
			printModelPath,
		});
	}

	getUnresolvedReference(key: "textStyles" | "segments" | "watermarks" | "sections", id: string) {
		const content = this.printModel?.content;
		// Segments are the only ones not keeping their fragment references in `references`.
		const references = key === "segments" ? content?.segments?.fragmentReferences : content?.[key]?.references;
		const referenceIndex = references?.findIndex(reference => reference.id === id) ?? -1;
		const unresolvedFragment = referenceIndex < 0 ? undefined : references?.[referenceIndex];
		return { referenceIndex, unresolvedFragment };
	}

	visitUnresolvedElement(
		reference: PartialReference,
		printModelTrace: PartialPrintModelTrace,
		index?: number,
		path?: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		if (isFragmentModelReference(reference)) {
			this.addMissingFragmentReference("element", reference, index, path);
			return TraversalCommand.CONTINUE;
		}
		/*
		 * Placements inside a fragment element name no model of their own - they are local to their fragment model - so
		 * the model is taken from the reference that led into the fragment.
		 */
		const fragmentReference = findParentFragmentModelReference(printModelTrace);
		if (fragmentReference && reference.refId) {
			this.addMissingFragmentReference(
				"element",
				{ model: fragmentReference.model, refId: reference.refId },
				index,
				path
			);
			return TraversalCommand.CONTINUE;
		}
		return TraversalCommand.HALT;
	}

	/*
	 * The walker reports the position within `general.*`, but the error path points into the reference list, so the
	 * index has to be looked up there instead of being taken from the visit.
	 */
	visitUnresolvedSegment(id: string): TraversalCommand {
		const { referenceIndex, unresolvedFragment } = this.getUnresolvedReference("segments", id);
		if (isFragmentModelReference(unresolvedFragment)) {
			this.addMissingFragmentReference("segment", unresolvedFragment, referenceIndex);
			return TraversalCommand.CONTINUE;
		}
		return TraversalCommand.HALT;
	}

	visitUnresolvedSection(id: string): TraversalCommand {
		const { referenceIndex, unresolvedFragment } = this.getUnresolvedReference("sections", id);
		if (isFragmentModelReference(unresolvedFragment)) {
			this.addMissingFragmentReference("section", unresolvedFragment, referenceIndex);
			return TraversalCommand.CONTINUE;
		}
		return TraversalCommand.HALT;
	}

	visitUnresolvedWatermark(id: string): TraversalCommand {
		const { referenceIndex, unresolvedFragment } = this.getUnresolvedReference("watermarks", id);
		if (isFragmentModelReference(unresolvedFragment)) {
			this.addMissingFragmentReference("watermark", unresolvedFragment, referenceIndex);
			return TraversalCommand.CONTINUE;
		}
		return TraversalCommand.HALT;
	}

	visitUnresolvedTextStyle(id: string): TraversalCommand {
		const { referenceIndex, unresolvedFragment } = this.getUnresolvedReference("textStyles", id);
		if (isFragmentModelReference(unresolvedFragment)) {
			this.addMissingFragmentReference("textStyle", unresolvedFragment, referenceIndex);
			return TraversalCommand.CONTINUE;
		}
		return TraversalCommand.CONTINUE;
	}

	/*
	 * Reached for a local text style as well as for one of a fragment model, with a path that already points at the
	 * definition or at the reference that pulled it in.
	 */
	visitTextStyle(textStyle: PartialTextStyle, printModelPath: ExtendedEntityInstancePathBuilder): TraversalCommand {
		if (textStyle.typesettingModelName) {
			this.typesettingUsages.push({
				typesettingModelName: textStyle.typesettingModelName,
				textStyleId: textStyle.id,
				printModelPath,
			});
		}
		return TraversalCommand.CONTINUE;
	}
}

/** The reference that led into a print fragment model, looked up from the innermost trace element outwards. */
function findParentFragmentModelReference(
	printModelTrace: PartialPrintModelTrace
): Pick<FragmentModelReference, "model" | "refId"> | undefined {
	for (let index = printModelTrace.parents.length - 1; index >= 0; index--) {
		const { parent } = printModelTrace.parents[index];
		if (isFragmentModelReference(parent)) {
			return parent;
		}
	}
	return undefined;
}

function getTopLevelFragmentReferenceContainerBasePath(
	element: Exclude<FragmentType, "element">,
	index: number
): ExtendedEntityInstancePathBuilder {
	const path = new ExtendedEntityInstancePathBuilder().append("content");
	if (element === "segment") {
		return path.append("segments").append("fragmentReferences", index);
	}
	if (element === "section") {
		return path.append("sections").append("references", index);
	}
	if (element === "watermark") {
		return path.append("watermarks").append("references", index);
	}
	if (element === "textStyle") {
		return path.append("textStyles").append("references", index);
	}
	throw new Error("Element is not a top level fragment");
}

/**
 * Traverses a PartialPrintModel and collects all paths that reference a document model.
 *
 * @param printModel The PartialPrintModel to traverse.
 * @returns An array of all referenced paths, including their path string and the path in the print model structure.
 */
export function getAllReferencedLocations(
	printModel: PartialPrintModel,
	fragmentModels?: PrintModel[]
): ReferenceCollectorResult {
	const visitor = new PartialPrintModelVisitorReferenceCollector(printModel);
	const walker = createPartialPrintModelWalker(printModel, visitor, fragmentModels);

	if (!printModel.content) {
		return {
			collectedPaths: [],
			missingFragmentReferences: [],
			typesettingUsages: [],
		};
	}
	walker.walkPrintModelContent(printModel.content);

	/*
	 * A fragment model does not place its own element fragments, so walking its content does not reach them. They are
	 * walked on their own to still validate their references.
	 */
	if (printModel.header?.modelSubType === FRAGMENT_SUB_TYPE) {
		printModel.content.elementDefinitions?.forEach((element, index) => {
			if (PrintModelElement.isInstance(element) && PrintModelElement.isFragmentElement(element)) {
				walker.walkElement(element, undefined, getElementDefinitionBasePath(element, index), index);
			}
		});
	}

	return {
		collectedPaths: visitor.collectedPaths,
		missingFragmentReferences: visitor.missingFragmentReferences,
		typesettingUsages: visitor.typesettingUsages,
	};
}
