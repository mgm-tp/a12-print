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
import type { Document } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import type { PrintModelDTO } from "@com.mgmtp.a12.print/print-model-api/generated/a12internal/dto/PrintModelDTO.js";
import { FRAGMENT_SUB_TYPE, MODEL_SUB_TYPE_ANNOTATION_NAME } from "@com.mgmtp.a12.print/print-model-api/model";

/**
 * Shared logic for the {@link isPrintModel} / {@link isFragmentModel} custom conditions: a model is
 * considered a fragment when its header carries the annotation `modelSubType === "fragment"`.
 */
export const FragmentModelDetector = {
	isFragmentModel(document: Document): boolean {
		const printDocument = document as unknown as PrintModelDTO;
		return (
			printDocument.header.annotations?.find(
				annotation =>
					annotation.name === MODEL_SUB_TYPE_ANNOTATION_NAME && annotation.value === FRAGMENT_SUB_TYPE
			) !== undefined
		);
	},
};
