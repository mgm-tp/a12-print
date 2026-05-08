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
import { actionCreatorFactory } from "typescript-fsa";

import { PayloadWithContainerId } from "../detail-data/index.js";

import { Wrapper } from "./state.js";

const factory = actionCreatorFactory("Print/Wrapper");

export namespace WrapperActions {
	export const addWrapperStage = factory<WrapperStagePayload>("ADD_WRAPPER");
	export type WrapperStagePayload = PayloadWithContainerId<Wrapper>;

	export const updateWrapperStage = factory<WrapperStagePayload>("UPDATE_WRAPPER");

	export const removeWrapperStage = factory<PayloadWithContainerId<{ id: string }>>("REMOVE_WRAPPER");

	export const removeAllWrapperStages = factory<PayloadWithContainerId>("REMOVE_ALL_WRAPPER");
}
