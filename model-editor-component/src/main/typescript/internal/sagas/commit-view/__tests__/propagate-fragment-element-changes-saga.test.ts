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
import type { PlaceableReference, PrintModel } from "@com.mgmtp.a12.print/print-model-api/model";

import type { RequestApi } from "../../../api/index.js";
import type { FragmentUsagePrintModelInfo } from "../../../redux/confirmation-dialog/state.js";
import {
	FRAGMENT_MODEL_ID,
	buildArea,
	buildFragmentElement,
	buildPlaceable,
	buildPrintModel,
	buildSegment,
} from "../../../../../../test/typescript/test-utils/index.js";

import { propagateFragmentElementChanges } from "../propagate-fragment-element-changes-saga.js";

const FRAGMENT_ELEMENT_ID = "frag-el-1";
const FOREIGN_MODEL_ID = "pm-foreign";

/** The fragment model itself: it holds the element definitions whose fragmentDimensions were just committed. */
function buildFragmentModel(elements: ReturnType<typeof buildFragmentElement>[]): PrintModel {
	return buildPrintModel({ elementDefinitions: elements }, FRAGMENT_MODEL_ID);
}

function usage(printModelId: string): FragmentUsagePrintModelInfo {
	return { printModelId, referenceEntityType: "element" };
}

/** Drives the saga up to the per-foreign-model calls. Undefined if it finished before doing any work. */
function runUntilForeignModelCalls(
	initial: PrintModel,
	updated: PrintModel,
	affectedIds: string[],
	usagesByElementId: Record<string, FragmentUsagePrintModelInfo[]> = {},
	requestApi: RequestApi = {} as RequestApi
) {
	const gen = propagateFragmentElementChanges(initial, updated, new Set(affectedIds));
	const selectCount = Object.keys(usagesByElementId).length;

	let step = gen.next();
	if (step.done) {
		return undefined;
	}

	// one select(usageForEntity) per element whose fragmentDimensions actually changed
	const selectSteps = [step];
	for (const elementId of Object.keys(usagesByElementId)) {
		step = gen.next(usagesByElementId[elementId]);
		selectSteps.push(step);
	}

	// the last supplied value resolved the final select, so this step is getContext("requestApi")
	const contextStep = selectSteps[selectCount];
	expect(contextStep.value).toMatchObject({ type: "GET_CONTEXT", payload: "requestApi" });

	const callEffects: { fn: (...args: unknown[]) => Generator; args: unknown[] }[] = [];
	step = gen.next(requestApi);
	while (!step.done) {
		const effect = step.value as { type: string; payload: { fn: () => Generator; args: unknown[] } };
		expect(effect.type).toBe("CALL");
		callEffects.push(effect.payload as never);
		step = gen.next();
	}

	return callEffects;
}

describe("propagateFragmentElementChanges", () => {
	it("does nothing when none of the affected elements changed their fragmentDimensions", () => {
		const model = buildFragmentModel([buildFragmentElement(FRAGMENT_ELEMENT_ID, 40, 20)]);
		const gen = propagateFragmentElementChanges(model, model, new Set([FRAGMENT_ELEMENT_ID]));

		expect(gen.next().done).toBe(true);
	});

	it("does nothing when the changed element is not a fragment element", () => {
		const plainElement = { id: "plain-el", name: "plain", type: "Text" } as never;
		const initial = buildFragmentModel([plainElement]);
		const updated = buildFragmentModel([plainElement]);

		expect(propagateFragmentElementChanges(initial, updated, new Set(["plain-el"])).next().done).toBe(true);
	});

	it("does nothing when the changed element was not part of the commit", () => {
		const initial = buildFragmentModel([buildFragmentElement(FRAGMENT_ELEMENT_ID, 40, 20)]);
		const updated = buildFragmentModel([buildFragmentElement(FRAGMENT_ELEMENT_ID, 100, 50)]);

		expect(propagateFragmentElementChanges(initial, updated, new Set(["other-el"])).next().done).toBe(true);
	});

	it("does nothing when the committed print model has no header id", () => {
		const initial = buildFragmentModel([buildFragmentElement(FRAGMENT_ELEMENT_ID, 40, 20)]);
		const updated = buildFragmentModel([buildFragmentElement(FRAGMENT_ELEMENT_ID, 100, 50)]);
		const withoutId = { ...updated, header: { ...updated.header, id: "" } } as PrintModel;

		expect(propagateFragmentElementChanges(initial, withoutId, new Set([FRAGMENT_ELEMENT_ID])).next().done).toBe(
			true
		);
	});

	it("treats a newly added fragment element as changed", () => {
		const initial = buildFragmentModel([]);
		const updated = buildFragmentModel([buildFragmentElement(FRAGMENT_ELEMENT_ID, 100, 50)]);

		const calls = runUntilForeignModelCalls(initial, updated, [FRAGMENT_ELEMENT_ID], {
			[FRAGMENT_ELEMENT_ID]: [usage(FOREIGN_MODEL_ID)],
		});

		expect(calls).toHaveLength(1);
	});

	it("calls each referencing print model exactly once, even when several changed elements share it", () => {
		const initial = buildFragmentModel([
			buildFragmentElement("frag-el-1", 40, 20),
			buildFragmentElement("frag-el-2", 40, 20),
		]);
		const updated = buildFragmentModel([
			buildFragmentElement("frag-el-1", 100, 50),
			buildFragmentElement("frag-el-2", 60, 30),
		]);

		const calls = runUntilForeignModelCalls(initial, updated, ["frag-el-1", "frag-el-2"], {
			"frag-el-1": [usage("pm-a"), usage("pm-b")],
			"frag-el-2": [usage("pm-a")],
		});

		expect(calls?.map(call => call.args[1])).toEqual(["pm-a", "pm-b"]);
		expect(calls?.[0].args[2]).toBe(FRAGMENT_MODEL_ID);
	});

	it("skips a changed element that is not placed anywhere", () => {
		const initial = buildFragmentModel([buildFragmentElement(FRAGMENT_ELEMENT_ID, 40, 20)]);
		const updated = buildFragmentModel([buildFragmentElement(FRAGMENT_ELEMENT_ID, 100, 50)]);

		const calls = runUntilForeignModelCalls(initial, updated, [FRAGMENT_ELEMENT_ID], {
			[FRAGMENT_ELEMENT_ID]: [],
		});

		expect(calls).toEqual([]);
	});
});

describe("propagateFragmentElementChanges — writing into a referencing print model", () => {
	const requestApi = {
		loadPrintModel: jest.fn(),
		persistInteractionLog: jest.fn(),
		persistTransactionLog: jest.fn(),
	} as unknown as RequestApi;

	/** Resolves the CALL effect for the single foreign model and returns its inner generator. */
	function foreignModelGenerator(newWidth: number, newHeight: number) {
		const initial = buildFragmentModel([buildFragmentElement(FRAGMENT_ELEMENT_ID, 40, 20)]);
		const updated = buildFragmentModel([buildFragmentElement(FRAGMENT_ELEMENT_ID, newWidth, newHeight)]);

		const calls = runUntilForeignModelCalls(
			initial,
			updated,
			[FRAGMENT_ELEMENT_ID],
			{ [FRAGMENT_ELEMENT_ID]: [usage(FOREIGN_MODEL_ID)] },
			requestApi
		);
		if (!calls?.length) {
			throw new Error("expected the saga to call into the referencing print model");
		}
		return calls[0].fn(...calls[0].args);
	}

	function foreignModelWithPlacement(): PrintModel {
		return buildPrintModel(
			{
				segments: [buildSegment("seg-1", [buildPlaceable("ref-1", FRAGMENT_ELEMENT_ID, FRAGMENT_MODEL_ID)])],
			},
			FOREIGN_MODEL_ID
		);
	}

	it("persists the new dimensions on the placement and an interaction log entry describing it", () => {
		const gen = foreignModelGenerator(100, 50);

		gen.next(); // call(loadPrintModel, FOREIGN_MODEL_ID)
		const interactionStep = gen.next({
			printModel: foreignModelWithPlacement(),
			logPersistentEntries: [],
		});

		expect(interactionStep.value).toMatchObject({
			type: "CALL",
			payload: {
				fn: requestApi.persistInteractionLog,
				args: [FOREIGN_MODEL_ID, expect.objectContaining({ type: "SET", regionId: FRAGMENT_MODEL_ID })],
			},
		});

		const transactionStep = gen.next();
		const { args } = (transactionStep.value as { payload: { fn: unknown; args: [unknown[], string] } }).payload;
		expect(args[1]).toBe(FOREIGN_MODEL_ID);
		expect(args[0].length).toBeGreaterThan(0);

		// the persisted entries must carry the fragment's new dimensions, not the placement's stale 40x20
		const serialized = JSON.stringify(args[0]);
		expect(serialized).toContain('"value":100');
		expect(serialized).toContain('"value":50');
		expect(serialized).not.toContain('"value":40');

		expect(gen.next().done).toBe(true);
	});

	it("persists nothing when the placement already has the fragment's dimensions", () => {
		const gen = foreignModelGenerator(100, 50);
		const upToDateModel = buildPrintModel(
			{
				segments: [
					buildSegment("seg-1", [
						{
							...buildPlaceable("ref-1", FRAGMENT_ELEMENT_ID, FRAGMENT_MODEL_ID),
							dimensions: {
								id: "ref-1-dim",
								minWidth: { id: "w", value: 100, unit: "Millimeter" },
								minHeight: { id: "h", value: 50, unit: "Millimeter" },
							},
						} as unknown as PlaceableReference,
					]),
				],
			},
			FOREIGN_MODEL_ID
		);

		gen.next();
		const step = gen.next({ printModel: upToDateModel, logPersistentEntries: [] });

		expect(step.done).toBe(true);
	});

	it("persists nothing when the referencing model has no placement of the changed element", () => {
		const gen = foreignModelGenerator(100, 50);
		const unrelatedModel = buildPrintModel(
			{ segments: [buildSegment("seg-1", [buildPlaceable("ref-1", "other-el", "other-model")])] },
			FOREIGN_MODEL_ID
		);

		gen.next();

		expect(gen.next({ printModel: unrelatedModel, logPersistentEntries: [] }).done).toBe(true);
	});

	it("patches a placement nested inside a wrapper element", () => {
		const gen = foreignModelGenerator(100, 50);
		const nestedModel = buildPrintModel(
			{
				segments: [buildSegment("seg-1", [])],
				elementDefinitions: [
					buildArea("wrap-1", [buildPlaceable("ref-1", FRAGMENT_ELEMENT_ID, FRAGMENT_MODEL_ID)]),
				],
			},
			FOREIGN_MODEL_ID
		);

		gen.next();
		const interactionStep = gen.next({ printModel: nestedModel, logPersistentEntries: [] });
		expect(interactionStep.done).toBe(false);

		const transactionStep = gen.next();
		const { args } = (transactionStep.value as { payload: { args: [unknown[], string] } }).payload;
		const serialized = JSON.stringify(args[0]);
		expect(serialized).toContain('"value":100');
		expect(serialized).toContain('"value":50');
	});

	it("logs and gives up on the model when it cannot be loaded", () => {
		const logErrorSpy = jest
			.spyOn(LoggerFactory.getLogger("PropagateFragmentElementChangesSaga"), "error")
			.mockImplementation(() => {});
		const gen = foreignModelGenerator(100, 50);

		gen.next();
		const step = gen.next(undefined);

		expect(step.done).toBe(true);
		expect(logErrorSpy).toHaveBeenCalledWith(expect.stringContaining(FOREIGN_MODEL_ID));
		logErrorSpy.mockRestore();
	});
});
