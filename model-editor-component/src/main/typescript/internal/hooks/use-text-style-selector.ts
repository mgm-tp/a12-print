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
import { useSelector } from "react-redux";

import { InputValueSourceResolver } from "@com.mgmtp.a12.print/print-model-api/input-source";
import type { PrintModelElement, Styleable } from "@com.mgmtp.a12.print/print-model-api/model";
import type { DeepPartial } from "@com.mgmtp.a12.widgets/widgets-core";

import type { PrintEngineState } from "../../a12internal/api/PrintEngineState.js";

import { PrintEngineSelectors } from "../store/selectors.js";
import { TEXT_PROPERTIES_PATH } from "../constant/element-property-path.js";

export const useTextStyleSelector = (element: PrintModelElement & DeepPartial<Styleable>) => {
	const textStyleId = InputValueSourceResolver.getSourceStringValue(
		element.textProperties?.textStyleId,
		element,
		TEXT_PROPERTIES_PATH.textStyleId
	);
	return useSelector((state: PrintEngineState) =>
		textStyleId ? PrintEngineSelectors.textStyle(state, textStyleId) : undefined
	);
};
