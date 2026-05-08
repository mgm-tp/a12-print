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
	CachedReferenceResolver,
	CachedSectionIdResolver,
	CachedSegmentIdResolver,
	CachedWatermarkIdResolver,
	DefaultSectionIdResolver,
	DefaultSegmentIdResolver,
	DefaultWatermarkIdResolver,
	DescendCommand,
	PrintModelTrace,
	PrintModelVisitor,
	PrintModelWalker,
	ReferenceListResolver,
	TraversalCommand,
} from "@com.mgmtp.a12.print/print-model-api/lib/walker/index.js";
import {
	BoundingBox,
	PageOrientation,
	PrintModel,
	PrintModelElement,
	Segment,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { Model } from "@com.mgmtp.a12.base/base-model-api/lib/main/model/index.js";
import { PrintModelMarshaller } from "@com.mgmtp.a12.print/print-model-api-utils/lib/marshaller/index.js";
import {
	CachedReferenceElementListResolver,
	ReferenceElementListResolver,
} from "@com.mgmtp.a12.print/print-model-api/lib/walker/reference-element-resolver.js";
import {
	CachedPrintModelListResolver,
	PrintModelListResolver,
} from "@com.mgmtp.a12.print/print-model-api/lib/walker/print-model-resolver.js";
import { PrintValidationMode } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/validation/print-validator.js";

import { DINTemplatePrintModels, DINTemplateSegment } from "../../../../api/index.js";

class TemplateReferenceVisitor extends PrintModelVisitor {
	templateReferences: Set<string> = new Set();

	visitElement(element: PrintModelElement, printModelTrace: PrintModelTrace): TraversalCommand {
		if (!BoundingBox.isInstance(element)) {
			const rootParent = printModelTrace.parents[0];
			this.templateReferences.delete(rootParent.parent.id);
			return TraversalCommand.STOP;
		}
		return TraversalCommand.CONTINUE;
	}

	visitSegment(segment: Segment): TraversalCommand {
		if (segment.dinTemplate || !segment.elementReferences?.length) {
			return TraversalCommand.CONTINUE;
		}
		this.templateReferences.add(segment.id);
		return TraversalCommand.CONTINUE;
	}

	beforeVisitElement(): void {
		// No preprocessing needed
	}

	afterVisitElement(): void {
		// No post-processing needed
	}

	descendContainer() {
		return DescendCommand.ELEMENT_FIRST;
	}
}
const printModelMarshaller = new PrintModelMarshaller();

export const getDinTemplatePrintModels = (printModels: Model[]): DINTemplatePrintModels[] => {
	const dinTemplatePrintModels: DINTemplatePrintModels[] = [];
	printModels.forEach(printModel => {
		const deserializedResult = printModelMarshaller.deserialize(
			printModel as unknown as Record<string, unknown>,
			[],
			PrintValidationMode.SKIP_REFERENCES
		);
		if (deserializedResult.result) {
			const dinTemplatePrintModel = getDinTemplatePrintModel(deserializedResult.result);

			dinTemplatePrintModel && dinTemplatePrintModels.push(dinTemplatePrintModel);
		}
	});

	return dinTemplatePrintModels;
};

const templateReferenceVisitor = new TemplateReferenceVisitor();

const getDinTemplatePrintModel = (printModel: PrintModel): DINTemplatePrintModels | undefined => {
	const refResolver = ReferenceListResolver.fromModel(printModel);
	const segmentIdResolver = DefaultSegmentIdResolver.fromModel(printModel);
	const sectionIdResolver = DefaultSectionIdResolver.fromModel(printModel);
	const watermarkIdResolver = DefaultWatermarkIdResolver.fromModel(printModel);
	const referenceElementListResolver = ReferenceElementListResolver.fromModel(printModel);
	const printModelListResolver = PrintModelListResolver.fromModelList([printModel]);
	const cachedRefResolver = new CachedReferenceResolver(refResolver);
	const cachedSegmentIdResolver = new CachedSegmentIdResolver(segmentIdResolver);
	const cachedSectionIdResolver = new CachedSectionIdResolver(sectionIdResolver);
	const cachedWatermarkIdResolver = new CachedWatermarkIdResolver(watermarkIdResolver);
	const cachedReferenceElementListResolver = new CachedReferenceElementListResolver(referenceElementListResolver);
	const cachedPrintModelListResolver = new CachedPrintModelListResolver(printModelListResolver);

	const printModelWalker = new PrintModelWalker(
		templateReferenceVisitor,
		cachedRefResolver,
		cachedSegmentIdResolver,
		cachedSectionIdResolver,
		cachedWatermarkIdResolver,
		cachedReferenceElementListResolver,
		cachedPrintModelListResolver
	);

	const templateSegments: DINTemplateSegment[] = [];
	printModelWalker.walkPrintModel(printModel);

	templateReferenceVisitor.templateReferences.forEach(value => {
		const segment = cachedSegmentIdResolver.resolveSegmentId(value);
		if (segment) {
			templateSegments.push({
				pageOrientation: segment.defaultSegment?.pageOrientation || PageOrientation.Portrait,
				segmentId: segment.id,
				segmentTitle: segment.title,
			});
		}
	});

	return templateSegments.length
		? {
				printModelId: printModel.header.id,
				templateSegments,
			}
		: undefined;
};
