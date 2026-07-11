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
import { useMemo } from "react";
import { useSelector } from "react-redux";

import type { DeepPartialErrorMap, PrintError } from "@com.mgmtp.a12.print/print-model-api/errors";

import { ValidationSelectors } from "../../../../redux/validation/selectors.js";
import { collectAggregatedMessages } from "../../../../utils/validation-utils.js";

export type MetadataComputationField =
	"titleComputation" | "descriptionComputation" | "authorComputation" | "languageComputation";

export function useMetadataFieldErrors(field: MetadataComputationField): {
	errors: PrintError[];
	warnings: PrintError[];
	info: PrintError[];
} {
	const metadataErrorMap = useSelector(ValidationSelectors.metadata);
	const computationArray = metadataErrorMap?.[field];

	const operationErrorMaps = useMemo(() => {
		if (!computationArray) return undefined;
		return computationArray
			.map(item => item.operation)
			.filter((op): op is DeepPartialErrorMap<string> => op !== undefined);
	}, [computationArray]);

	return collectAggregatedMessages(operationErrorMaps);
}
