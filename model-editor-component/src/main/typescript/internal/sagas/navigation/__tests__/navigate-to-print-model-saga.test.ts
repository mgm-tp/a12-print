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

import { NavigationActions } from "../../../redux/index.js";
import type { RequestApi } from "../../../api/request-api.js";

import { buildReferenceNavigationPath, handleNavigateToPrintModel } from "../navigate-to-fragment-source-saga.js";

describe("buildReferenceNavigationPath", () => {
	it("returns undefined when entityType is undefined", () => {
		expect(buildReferenceNavigationPath(undefined, 0)).toBeUndefined();
	});

	it("returns undefined when referenceIndex is undefined", () => {
		expect(buildReferenceNavigationPath("section", undefined)).toBeUndefined();
	});

	it("builds a 1-based path into sectionReferences", () => {
		expect(buildReferenceNavigationPath("section", 2)).toEqual([
			{ elementName: "content", index: 1 },
			{ elementName: "sectionReferences", index: 3 },
		]);
	});

	it("builds a 1-based path into watermarkReferences", () => {
		expect(buildReferenceNavigationPath("watermark", 0)).toEqual([
			{ elementName: "content", index: 1 },
			{ elementName: "watermarkReferences", index: 1 },
		]);
	});

	it("builds a 1-based path into textStyleReferences", () => {
		expect(buildReferenceNavigationPath("textStyle", 4)).toEqual([
			{ elementName: "content", index: 1 },
			{ elementName: "textStyleReferences", index: 5 },
		]);
	});

	it("builds a 1-based path into segmentReferences for segment entities", () => {
		expect(buildReferenceNavigationPath("segment", 1)).toEqual([
			{ elementName: "content", index: 1 },
			{ elementName: "segmentReferences", index: 2 },
		]);
	});
});

describe("handleNavigateToPrintModel", () => {
	it("does nothing when the host does not implement onNavigateToPrintModel", () => {
		const requestApi = {} as RequestApi;
		const action = NavigationActions.navigateToPrintModel({
			printModelId: "pm-1",
			referenceEntityType: "section",
			referenceIndex: 0,
		});

		const gen = handleNavigateToPrintModel(action);
		gen.next(); // getContext("requestApi")
		const result = gen.next(requestApi);

		expect(result.done).toBe(true);
	});

	it("calls onNavigateToPrintModel with the print model id and the built reference navigation path", () => {
		const onNavigateToPrintModel = jest.fn();
		const requestApi = { onNavigateToPrintModel } as unknown as RequestApi;
		const action = NavigationActions.navigateToPrintModel({
			printModelId: "pm-1",
			referenceEntityType: "section",
			referenceIndex: 0,
		});

		const gen = handleNavigateToPrintModel(action);
		gen.next(); // getContext("requestApi")
		const callStep = gen.next(requestApi);

		expect(callStep.done).toBe(false);
		expect(callStep.value).toMatchObject({
			type: "CALL",
			payload: {
				fn: onNavigateToPrintModel,
				args: [
					"pm-1",
					[
						{ elementName: "content", index: 1 },
						{ elementName: "sectionReferences", index: 1 },
					],
				],
			},
		});

		expect(gen.next().done).toBe(true);
	});

	it("calls onNavigateToPrintModel with an undefined path when the reference cannot be located", () => {
		const onNavigateToPrintModel = jest.fn();
		const requestApi = { onNavigateToPrintModel } as unknown as RequestApi;
		const action = NavigationActions.navigateToPrintModel({ printModelId: "pm-1" });

		const gen = handleNavigateToPrintModel(action);
		gen.next();
		const callStep = gen.next(requestApi);

		expect(callStep.value).toMatchObject({
			type: "CALL",
			payload: { fn: onNavigateToPrintModel, args: ["pm-1", undefined] },
		});
	});
});
