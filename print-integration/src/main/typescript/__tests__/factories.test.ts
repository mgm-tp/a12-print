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
import { jest } from "@jest/globals";

const watchFormPrintButtonSaga = jest.fn(() => "form-saga");
const watchOverviewPrintButtonSaga = jest.fn(() => "overview-saga");

// The real sagas pull the A12 client packages in, which need a DOM while loading;
// mocking them keeps this suite in the module's default "node" environment.
jest.unstable_mockModule("../internal/sagas/form-print-button-saga.js", () => ({
	watchFormPrintButtonSaga,
}));
jest.unstable_mockModule("../internal/sagas/overview-print-button-saga.js", () => ({
	watchOverviewPrintButtonSaga,
}));

const { PrintFactories } = await import("../factories.js");

/** Starts every created saga, which is what the application setup does with them. */
function startSagas(showLoadingIndicatorDuringPrint?: boolean, validateAndSaveBeforePrint?: boolean): void {
	PrintFactories.createSagas(showLoadingIndicatorDuringPrint, validateAndSaveBeforePrint).forEach(saga => saga());
}

beforeEach(() => {
	watchFormPrintButtonSaga.mockClear();
	watchOverviewPrintButtonSaga.mockClear();
});

describe("createSagas", () => {
	it("should create one saga per print button location", () => {
		expect(PrintFactories.createSagas()).toHaveLength(2);
	});

	it("should enable the loading indicator by default", () => {
		startSagas();

		expect(watchFormPrintButtonSaga).toHaveBeenCalledWith(true, true);
		expect(watchOverviewPrintButtonSaga).toHaveBeenCalledWith(true);
	});

	it("should pass an explicitly enabled loading indicator through", () => {
		startSagas(true);

		expect(watchFormPrintButtonSaga).toHaveBeenCalledWith(true, true);
		expect(watchOverviewPrintButtonSaga).toHaveBeenCalledWith(true);
	});

	it("should honour a disabled loading indicator", () => {
		startSagas(false);

		expect(watchFormPrintButtonSaga).toHaveBeenCalledWith(false, true);
		expect(watchOverviewPrintButtonSaga).toHaveBeenCalledWith(false);
	});

	it("should enable validate and save before print by default", () => {
		startSagas();

		expect(watchFormPrintButtonSaga).toHaveBeenCalledWith(true, true);
	});

	it("should pass an explicitly enabled validate and save through", () => {
		startSagas(true, true);

		expect(watchFormPrintButtonSaga).toHaveBeenCalledWith(true, true);
	});

	it("should honour a disabled validate and save", () => {
		startSagas(true, false);

		expect(watchFormPrintButtonSaga).toHaveBeenCalledWith(true, false);
	});

	it("should not pass validate and save to the Overview print, which has no form to validate", () => {
		startSagas(true, false);

		expect(watchOverviewPrintButtonSaga).toHaveBeenCalledWith(true);
	});

	it("should not start the sagas before the application does", () => {
		PrintFactories.createSagas();

		expect(watchFormPrintButtonSaga).not.toHaveBeenCalled();
		expect(watchOverviewPrintButtonSaga).not.toHaveBeenCalled();
	});
});
