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
import { DeepPartialErrorMap } from "@com.mgmtp.a12.print/print-model-api/lib/errors/deep-partial-error-map";
import { PRINT_MODEL_METADATA_MAP } from "@com.mgmtp.a12.print/print-model-api/lib/generated/print-model-metadata-map.js";
import { PossibleInputSource } from "@com.mgmtp.a12.print/print-model-api/lib/input-source/input-source";
import { generateAndSaveDtoFiles } from "@com.mgmtp.a12.print/print-model-api/lib/generator/model-dto-files-generator.js";
import { isPrintModel } from "@com.mgmtp.a12.print/print-model-api/lib/model/print-model.js";
import { clonePrintModelElement } from "@com.mgmtp.a12.print/print-model-api/lib/utils/print-model/print-model-element.js";
import { PrintModelVisitor } from "@com.mgmtp.a12.print/print-model-api/lib/walker/print-model-walker.js";

export const example = {
	DeepPartialErrorMap,
	PRINT_MODEL_METADATA_MAP,
	PossibleInputSource,
	generateAndSaveDtoFiles,
	isPrintModel,
	clonePrintModelElement,
	PrintModelVisitor,
};
