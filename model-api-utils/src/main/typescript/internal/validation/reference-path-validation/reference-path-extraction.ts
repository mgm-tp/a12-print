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
	Variable,
	VisitationState,
	SyntaxTreeElementVisitor,
} from "@com.mgmtp.a12.print/print-engine-runtime-kernel/lib/internal/index.js";
import { ComputationParser } from "@com.mgmtp.a12.print/print-engine-runtime-kernel/lib/internal/computation-parser.js";
import { SyntaxTreeRenderer } from "@com.mgmtp.a12.print/print-engine-runtime-kernel/lib/internal/elements/visitor/SyntaxTreeRenderer.js";
import { ExtendedEntityInstancePathBuilder } from "@com.mgmtp.a12.print/print-model-api/lib/errors/extended-entity-instance-path.js";

import { CollectedComputation, CollectedFieldReference, CollectedPath } from "../../types/reference-path.js";

export const PARSER_ERROR = "PARSER_ERROR";

export function extractComputationPaths(
	collectedPaths: CollectedPath[],
	computation: CollectedComputation,
	printModelPath: ExtendedEntityInstancePathBuilder,
	attribute: "precondition" | "operation"
) {
	const computationStatement = computation[attribute as keyof CollectedComputation];
	if (!computationStatement) {
		return;
	}

	const entityPath = printModelPath.with(attribute);
	const { extractedPaths, parsedSuccessfully } = extractComputationReferencePaths(computationStatement);
	if (parsedSuccessfully) {
		extractedPaths.forEach(documentModelPath =>
			collectedPaths.push({
				id: computation.id,
				documentModelPath,
				printModelPath: entityPath,
				usedIn: attribute,
			})
		);
	} else {
		collectedPaths.push({
			id: computation.id,
			documentModelPath: "",
			printModelPath: entityPath,
			error: PARSER_ERROR,
			usedIn: attribute,
		});
	}
}

export function extractFieldReferencePath(
	collectedPaths: CollectedPath[],
	field: CollectedFieldReference,
	printModelPath: ExtendedEntityInstancePathBuilder
) {
	if (!field.id || !field.model) {
		return;
	}

	if ("basePath" in field && field.basePath) {
		collectedPaths.push({
			id: field.id,
			documentModelPath: `${field.model}${field.basePath}`,
			printModelPath: printModelPath.with("basePath"),
			usedIn: "fieldPath",
		});
	}
	if ("path" in field && field.path) {
		collectedPaths.push({
			id: field.id,
			documentModelPath: `${field.model}${field.path}`,
			printModelPath: printModelPath.with("path"),
			usedIn: "fieldPath",
		});
	}
	if ("data" in field && Array.isArray(field.data)) {
		field.data.forEach((data, dataIndex) => {
			if (data.valueField) {
				collectedPaths.push({
					id: data.id,
					documentModelPath: `${field.model}${data.valueField}`,
					printModelPath: printModelPath.with("data", dataIndex).with("valueField"),
					usedIn: "valueField",
				});
			}
			if (data.keyField) {
				collectedPaths.push({
					id: data.id,
					documentModelPath: `${field.model}${data.keyField}`,
					printModelPath: printModelPath.with("data", dataIndex).with("keyField"),
					usedIn: "keyField",
				});
			}
		});
	}
	if ("data" in field && typeof field.data === "object") {
		if ("valueField" in field.data) {
			collectedPaths.push({
				id: field.data.id,
				documentModelPath: `${field.model}${field.data.valueField}`,
				printModelPath: printModelPath.with("data").with("valueField"),
				usedIn: "valueField",
			});
		}
		if ("keyField" in field.data) {
			collectedPaths.push({
				id: field.data.id,
				documentModelPath: `${field.model}${field.data.keyField}`,
				printModelPath: printModelPath.with("data").with("keyField"),
				usedIn: "keyField",
			});
		}
	}
}

export function extractComputationReferencePaths(computationStatement: string | undefined): {
	extractedPaths: string[];
	parsedSuccessfully?: boolean;
} {
	const PARSER = new ComputationParser();
	if (!computationStatement) {
		return { extractedPaths: [], parsedSuccessfully: undefined };
	}
	try {
		const parseResult = PARSER.parseScript(computationStatement);
		const collector = new ReferencePathCollector();

		collector.visit(parseResult, VisitationState.stateless());
		return { extractedPaths: collector.getPaths(), parsedSuccessfully: true };
	} catch {
		return { extractedPaths: [], parsedSuccessfully: false };
	}
}

class ReferencePathCollector extends SyntaxTreeElementVisitor {
	private paths: string[] = [];

	override visitVariable(node: Variable, state: VisitationState): void {
		const path = SyntaxTreeRenderer.getPath(node.isAbsolute, node.segments);

		this.paths.push(path);
		super.visitVariable(node, state);
	}

	public getPaths(): string[] {
		return this.paths;
	}
}
