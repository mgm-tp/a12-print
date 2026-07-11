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
import { nanoid } from "nanoid";

import type { PartialExpression, PartialTable, TextProperties } from "@com.mgmtp.a12.print/print-model-api/model";
import { PossibleInputSource, InputValueSourceResolver } from "@com.mgmtp.a12.print/print-model-api/input-source";

import { TEXT_PROPERTIES_PATH } from "../../../constant/element-property-path.js";

export function setInheritForExpressionTextProperties(
	expression: PartialExpression,
	table: PartialTable
): TextProperties {
	function createInheritedGroup(path: string) {
		return {
			id: nanoid(),
			source: PossibleInputSource.INHERITED,
			path: InputValueSourceResolver.getInputSourceMetadata(expression, path).path,
			reference: table.id,
		};
	}
	return {
		id: nanoid(),
		textStyleId: createInheritedGroup(TEXT_PROPERTIES_PATH.textStyleId),
		color: createInheritedGroup(TEXT_PROPERTIES_PATH.color),
		backgroundColor: createInheritedGroup(TEXT_PROPERTIES_PATH.backgroundColor),
		bold: createInheritedGroup(TEXT_PROPERTIES_PATH.bold),
		italic: createInheritedGroup(TEXT_PROPERTIES_PATH.italic),
		underlined: createInheritedGroup(TEXT_PROPERTIES_PATH.underlined),
		alignment: createInheritedGroup(TEXT_PROPERTIES_PATH.alignment),
	};
}
