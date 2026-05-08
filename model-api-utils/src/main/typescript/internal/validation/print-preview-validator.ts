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
import { Document, DocumentServiceFactory } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import { Model } from "@com.mgmtp.a12.base/base-model-api/lib/main/model/index.js";
import { PrintModel, SegmentType } from "@com.mgmtp.a12.print/print-model-api/lib/model/print-model.js";
import { createPartialPrintModelWalker } from "@com.mgmtp.a12.print/print-model-api/lib/walker/partial/create-partial-print-model-walker.js";
import {
	DescendCommand,
	TraversalCommand,
} from "@com.mgmtp.a12.print/print-model-api/lib/walker/print-model-visitor.js";
import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/lib/errors/deep-partial-error-map.js";

import { PrintModelMarshaller } from "../../marshaller/model-marshaller.js";

import { CollectedPath } from "../types/reference-path.js";

import { PrintValidationMode } from "./print-validator.js";
import { PartialPrintModelVisitorReferenceCollector } from "./reference-path-validation/partial-print-model-visitor-reference-collector.js";

export namespace PrintPreviewValidator {
	export interface PrintPreviewError {
		errorCode: string;
		severity: keyof typeof ErrorSeverity;
		parameters?: {
			[key: string]: string | undefined;
		};
	}

	export interface PrintPreviewValidationResult {
		errors?: PrintPreviewError[];
		noErrorOccurred?: boolean;
	}

	export enum PreviewRuleCode {
		NO_SEGMENTS = "NO_SEGMENT",
		NO_REPEATABLE_DATA = "NO_REPEATABLE_DATA",
	}

	export function validate(printModel: Model, document?: object): PrintPreviewValidationResult {
		const printModelMarshaller = new PrintModelMarshaller();
		const deserializedResult = printModelMarshaller.deserialize(
			JSON.stringify(printModel),
			[],
			PrintValidationMode.SKIP_REFERENCES
		);
		const deserializedPrintModel = deserializedResult.result;

		if (!deserializedPrintModel) {
			throw Error("Cannot deserialize print model");
		}

		const noSegmentError = validateNoSegments(deserializedPrintModel);
		if (noSegmentError) {
			return {
				errors: [noSegmentError],
				noErrorOccurred: false,
			};
		}

		const noRepeatableData = validateNoRepeatableData(deserializedPrintModel, document);
		if (noRepeatableData) {
			return {
				errors: [noRepeatableData],
				noErrorOccurred: false,
			};
		}

		return {
			errors: [],
			noErrorOccurred: true,
		};
	}
	function validateNoSegments(printModel: PrintModel): PrintPreviewError | undefined {
		return !printModel.content.segments?.definitions.length
			? {
					errorCode: PreviewRuleCode.NO_SEGMENTS,
					severity: "ERROR",
				}
			: undefined;
	}
	function validateNoRepeatableData(printModel: PrintModel, document?: object): PrintPreviewError | undefined {
		const hasOnlyRepeatable =
			printModel.content.segments.definitions.filter(segment => segment.type === SegmentType.Repeatable)
				.length === printModel.content.segments.definitions.length;

		if (!hasOnlyRepeatable) {
			return undefined;
		}

		const collectedPaths = collectSegmentRepeatableReferences(printModel);

		if (!collectedPaths.length) {
			return undefined;
		}
		const repeatablePaths = [...new Set(collectedPaths.map(path => path.documentModelPath))].join(", ");

		if (!document) {
			return {
				errorCode: PreviewRuleCode.NO_REPEATABLE_DATA,
				severity: "ERROR",
				parameters: { repeatablePaths },
			};
		}

		const documentService = new DocumentServiceFactory().getDocumentService();

		const hasNoData = collectedPaths.map(getDocumentPathInfo).every(({ parent, group }) => {
			const parentObject = documentService.getAssignedObject(document as Document, parent);
			if (typeof parentObject !== "object" || Array.isArray(parentObject) || parentObject instanceof Date) {
				return false;
			}
			const groupObject = parentObject?.[group];
			return !groupObject || !Array.isArray(groupObject) || !groupObject?.length;
		});

		return hasNoData
			? {
					errorCode: PreviewRuleCode.NO_REPEATABLE_DATA,
					severity: "ERROR",
					parameters: { repeatablePaths },
				}
			: undefined;
	}
}

function collectSegmentRepeatableReferences(printModel: PrintModel): CollectedPath[] {
	const visitor = new RepeatableSegmentReferenceCollector();

	const walker = createPartialPrintModelWalker(printModel, visitor);

	walker.walkPrintModelContent(printModel.content);

	return visitor.collectedPaths;
}

function getDocumentPathInfo(path: CollectedPath): {
	group: string;
	parent: { index: number; elementName: string }[];
} {
	const referencePaths = path.documentModelPath.split("/");

	const group = referencePaths.pop();
	if (!group) {
		throw Error("The path contains no group");
	}

	return {
		group,
		parent: referencePaths.map(path => ({ elementName: path, index: 1 })),
	};
}

class RepeatableSegmentReferenceCollector extends PartialPrintModelVisitorReferenceCollector {
	descendContainer() {
		return DescendCommand.NO_DESCEND;
	}

	visitSection(): TraversalCommand {
		return TraversalCommand.STOP;
	}

	visitWatermark(): TraversalCommand {
		return TraversalCommand.STOP;
	}
}
