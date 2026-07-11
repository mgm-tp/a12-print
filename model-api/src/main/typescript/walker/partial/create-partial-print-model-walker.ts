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
import { type PartialPrintModel } from "../../model/partial.js";
import { type PrintModel } from "../../model/print-model.js";

import { PrintModelListResolver, CachedPrintModelListResolver } from "../print-model-resolver.js";

import { PartialPrintModelWalker } from "./partial-print-model-walker.js";
import { PartialReferenceListResolver, PartialCachedReferenceResolver } from "./partial-reference-resolver.js";
import type { PartialPrintModelVisitor } from "./partial-print-model-visitor.js";
import { DefaultPartialSegmentIdResolver, CachedPartialSegmentIdResolver } from "./partial-segment-id-resolver.js";
import { DefaultPartialSectionIdResolver, CachedPartialSectionIdResolver } from "./partial-section-id-resolver.js";
import {
	DefaultPartialWatermarkIdResolver,
	CachedPartialWatermarkIdResolver,
} from "./partial-watermark-id-resolver.js";
import {
	PartialReferenceElementListResolver,
	CachedPartialReferenceElementListResolver,
} from "./parital-reference-element-resolver.js";

export function createPartialPrintModelWalker(
	printModel: PartialPrintModel,
	visitor: PartialPrintModelVisitor,
	printModelList: PrintModel[] = []
) {
	const refResolver = PartialReferenceListResolver.fromModel(printModel);
	const segmentIdResolver = DefaultPartialSegmentIdResolver.fromModel(printModel);
	const sectionIdResolver = DefaultPartialSectionIdResolver.fromModel(printModel);
	const watermarkIdResolver = DefaultPartialWatermarkIdResolver.fromModel(printModel);
	const referenceElementListResolver = PartialReferenceElementListResolver.fromModel(printModel);
	const printModelListResolver = PrintModelListResolver.fromModelList(printModelList);

	const cachedRefResolver = new PartialCachedReferenceResolver(refResolver);
	const cachedSegmentIdResolver = new CachedPartialSegmentIdResolver(segmentIdResolver);
	const cachedSectionIdResolver = new CachedPartialSectionIdResolver(sectionIdResolver);
	const cachedWatermarkIdResolver = new CachedPartialWatermarkIdResolver(watermarkIdResolver);
	const cachedReferenceElementListResolver = new CachedPartialReferenceElementListResolver(
		referenceElementListResolver
	);
	const cachedPrintModelListResolver = new CachedPrintModelListResolver(printModelListResolver);

	return new PartialPrintModelWalker(
		visitor,
		cachedRefResolver,
		cachedSegmentIdResolver,
		cachedSectionIdResolver,
		cachedWatermarkIdResolver,
		cachedReferenceElementListResolver,
		cachedPrintModelListResolver
	);
}
