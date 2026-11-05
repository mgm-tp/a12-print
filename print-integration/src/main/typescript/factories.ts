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
import type { SagaGenerator } from "typed-redux-saga";

import { watchFormPrintButtonSaga } from "./internal/sagas/form-print-button-saga.js";
import { watchOverviewPrintButtonSaga } from "./internal/sagas/overview-print-button-saga.js";

export namespace PrintFactories {
	/**
	 * Creates the sagas of the Print client extension, watching the Form and the Overview Engine
	 * for clicks on a print button.
	 *
	 * @param showLoadingIndicatorDuringPrint - A boolean which defines if a loading spinner should be shown during print execution
	 * @param validateAndSaveBeforePrint - A boolean which defines if the form should be validated and saved before print execution
	 */
	export const createSagas: (
		showLoadingIndicatorDuringPrint?: boolean,
		validateAndSaveBeforePrint?: boolean
	) => (() => SagaGenerator<void>)[] = (
		showLoadingIndicatorDuringPrint = true,
		validateAndSaveBeforePrint = true
	) => [
		() => watchFormPrintButtonSaga(showLoadingIndicatorDuringPrint, validateAndSaveBeforePrint),
		() => watchOverviewPrintButtonSaga(showLoadingIndicatorDuringPrint),
	];
}
