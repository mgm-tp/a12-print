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
import type {
	EntityInstanceValueMapping,
	ICustomCondition,
	Document,
	EntityInstancePath,
} from "@com.mgmtp.a12.kernel/kernel-md-facade";
import type { PrintModelDTO } from "@com.mgmtp.a12.print/print-model-api/generated/a12internal/dto/PrintModelDTO.js";

export const OnlyOneIsSortingColumn: ICustomCondition = {
	check(
		document: Document,
		_documentModelId: string,
		_relevantEntityInstances: EntityInstancePath[] | undefined,
		_formallyIncorrectEntityInstances: EntityInstancePath[],
		errorEntityInstance: EntityInstancePath,

		_valuesOfFieldInstancesToConsider: EntityInstanceValueMapping | undefined
	): boolean {
		const printDocument = document as unknown as PrintModelDTO;
		const listingIndex = errorEntityInstance[1].index - 1;
		const listingColumns = printDocument.content.elementDefinitions?.[listingIndex]?.listing?.columns;
		if (!listingColumns) {
			throw Error("Cannot get listing columns during executing validation rule print_OnlyOneIsSortingColumn");
		}
		return listingColumns.filter(col => col.isSortingIndex).length > 1;
	},
};
