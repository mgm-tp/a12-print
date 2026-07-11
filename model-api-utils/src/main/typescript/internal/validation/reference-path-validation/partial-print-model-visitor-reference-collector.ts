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
import type {
	ListingColumn,
	ListingColumnField,
	PartialArea,
	PartialBarChart,
	PartialCalculation,
	PartialExpression,
	PartialField,
	PartialImage,
	PartialLineChart,
	PartialListing,
	PartialMetadata,
	PartialPieChart,
	PartialPlaceableReference,
	PartialPrintModel,
	PartialPrintModelElement,
	PartialSegment,
	PartialSwitchCaseReference,
	PartialTable,
	PartialWatermark,
	PrintModelEntity,
} from "@com.mgmtp.a12.print/print-model-api/model";
import type { ExtendedEntityInstancePathBuilder } from "@com.mgmtp.a12.print/print-model-api/errors";
import type { PartialPrintModelTrace } from "@com.mgmtp.a12.print/print-model-api/walker";
import {
	TraversalCommand,
	createPartialPrintModelWalker,
	PartialPrintModelVisitor,
} from "@com.mgmtp.a12.print/print-model-api/walker";
import type { DeepPartialRecursive } from "@com.mgmtp.a12.print/print-model-api/utils";

import type { CollectedComputation, CollectedFieldReference, CollectedPath } from "../../types/reference-path.js";

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
export class PartialPrintModelVisitorReferenceCollector extends PartialPrintModelVisitor {
	computations: { computation: CollectedComputation; printModelPath: ExtendedEntityInstancePathBuilder }[] = [];
	fieldReferences: { field: CollectedFieldReference; printModelPath: ExtendedEntityInstancePathBuilder }[] = [];
	collectedPaths: CollectedPath[] = [];

	addComputation(computation: CollectedComputation | undefined, printModelPath: ExtendedEntityInstancePathBuilder) {
		if (!computation) {
			return;
		}
		extractComputationPaths(this.collectedPaths, computation, printModelPath, "precondition");
		extractComputationPaths(this.collectedPaths, computation, printModelPath, "operation");
		this.computations.push({ computation, printModelPath });
	}

	addFieldReference(field: CollectedFieldReference | undefined, printModelPath: ExtendedEntityInstancePathBuilder) {
		if (!field) {
			return;
		}
		extractFieldReferencePath(this.collectedPaths, field, printModelPath);
		this.fieldReferences.push({ field, printModelPath });
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
}

/**
 * Traverses a PartialPrintModel and collects all paths that reference a document model.
 *
 * @param printModel The PartialPrintModel to traverse.
 * @returns An array of all referenced paths, including their path string and the path in the print model structure.
 */
export function getAllReferencedPaths(printModel: PartialPrintModel) {
	const visitor = new PartialPrintModelVisitorReferenceCollector();
	const walker = createPartialPrintModelWalker(printModel, visitor);

	if (!printModel.content) {
		return [];
	}
	walker.walkPrintModelContent(printModel.content);

	return visitor.collectedPaths;
}
