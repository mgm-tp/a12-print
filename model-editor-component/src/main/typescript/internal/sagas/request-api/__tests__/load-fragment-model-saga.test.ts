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

import { LoggerFactory } from "@com.mgmtp.a12.utils/utils-logging";
import type { PrintModel } from "@com.mgmtp.a12.print/print-model-api/model";

import { FragmentActions } from "../../../redux/index.js";

import { handleLoadFragmentSaga } from "../load-fragment-model-saga.js";

const FRAGMENT_MODEL_ID = "fragment-model-1";

const minimalPrintModel: PrintModel = {
	header: { id: FRAGMENT_MODEL_ID, modelType: "print", modelVersion: "4.0", description: "", annotations: [] },
	content: {
		id: "c1",
		general: { id: "g1", segmentDefaults: { id: "sd1", fontSize: 12 } },
		elementDefinitions: [],
	},
} as unknown as PrintModel;

describe("handleLoadFragmentSaga", () => {
	const mockRequestApi = { loadFragmentModel: jest.fn() };

	it("returns early without calling loadFragmentModel when the model is already cached", () => {
		const gen = handleLoadFragmentSaga(FragmentActions.loadFragment(FRAGMENT_MODEL_ID));

		gen.next(); // advance to select
		const result = gen.next(minimalPrintModel); // provide cached model → early return

		expect(result.done).toBe(true);
	});

	it("logs an error and dispatches setFragmentModelError when loadFragmentModel returns falsy", () => {
		const logErrorSpy = jest
			.spyOn(LoggerFactory.getLogger("LoadFragmentSaga"), "error")
			.mockImplementation(() => {});

		const gen = handleLoadFragmentSaga(FragmentActions.loadFragment(FRAGMENT_MODEL_ID));

		gen.next(); // select
		gen.next(undefined); // no cached model → continue
		gen.next(mockRequestApi); // getContext → requestApi
		const putStep = gen.next(undefined); // call returns falsy → log.error → put(setFragmentModelError)

		expect(putStep.done).toBe(false);
		expect(putStep.value).toMatchObject({ type: "PUT" });
		expect(logErrorSpy).toHaveBeenCalledWith(expect.stringContaining(FRAGMENT_MODEL_ID));

		const result = gen.next();
		expect(result.done).toBe(true);

		logErrorSpy.mockRestore();
	});

	it("dispatches setFragmentModel when loadFragmentModel succeeds", () => {
		const gen = handleLoadFragmentSaga(FragmentActions.loadFragment(FRAGMENT_MODEL_ID));

		gen.next(); // select
		gen.next(undefined); // no cache
		gen.next(mockRequestApi); // getContext
		const putStep = gen.next({ printModel: minimalPrintModel }); // call returns model → put

		expect(putStep.done).toBe(false);
		expect(putStep.value).toMatchObject({ type: "PUT" });

		const done = gen.next();
		expect(done.done).toBe(true);
	});
});
