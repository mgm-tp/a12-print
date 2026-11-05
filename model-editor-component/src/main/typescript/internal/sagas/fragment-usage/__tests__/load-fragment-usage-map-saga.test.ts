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
import type { Header, ModelReference } from "@com.mgmtp.a12.base/base-model-api";
import type { PrintModel } from "@com.mgmtp.a12.print/print-model-api/model";

import type { RequestApi } from "../../../api/index.js";
import { FragmentUsageActions } from "../../../redux/index.js";
import type { FragmentUsagePrintModelInfo } from "../../../redux/confirmation-dialog/state.js";
import {
	buildArea,
	buildOverride,
	buildPlaceable,
	buildPrintModel as buildPlacementModel,
	buildSection,
	buildSegment,
	buildWatermark,
} from "../../../../../../test/typescript/test-utils/index.js";

import {
	addElementUsages,
	addUsages,
	handleLoadFragmentUsageMap,
	referencesFragmentModel,
} from "../load-fragment-usage-map-saga.js";

const FRAGMENT_MODEL_ID = "fragment-model-1";
const FRAGMENT_MODEL_REFERENCE: ModelReference = {
	purpose: "print-fragment",
	modelType: "print",
	reference: FRAGMENT_MODEL_ID,
};

function buildHeader(id: string, modelReferences?: ModelReference[]): Header {
	return {
		id,
		modelType: "print",
		modelVersion: "4.0",
		...(modelReferences && { modelReferences }),
	} as Header;
}

function buildPrintModel(id: string, content: Partial<PrintModel["content"]> = {}): PrintModel {
	return {
		header: { id, modelType: "print", modelVersion: "4.0", description: "", annotations: [] },
		content: {
			id: `${id}-content`,
			general: { id: `${id}-general`, segmentDefaults: { id: `${id}-sd`, fontSize: 12 } },
			elementDefinitions: [],
			...content,
		},
	} as unknown as PrintModel;
}

describe("referencesFragmentModel", () => {
	it("returns true for a matching print-fragment reference", () => {
		expect(referencesFragmentModel(buildHeader("pm-1", [FRAGMENT_MODEL_REFERENCE]), FRAGMENT_MODEL_ID)).toBe(true);
	});

	it("returns false when the purpose does not match", () => {
		const header = buildHeader("pm-1", [{ ...FRAGMENT_MODEL_REFERENCE, purpose: "other" }]);
		expect(referencesFragmentModel(header, FRAGMENT_MODEL_ID)).toBe(false);
	});

	it("returns false when the modelType does not match", () => {
		const header = buildHeader("pm-1", [{ ...FRAGMENT_MODEL_REFERENCE, modelType: "form" }]);
		expect(referencesFragmentModel(header, FRAGMENT_MODEL_ID)).toBe(false);
	});

	it("returns false when the reference points at a different model", () => {
		const header = buildHeader("pm-1", [{ ...FRAGMENT_MODEL_REFERENCE, reference: "other-model" }]);
		expect(referencesFragmentModel(header, FRAGMENT_MODEL_ID)).toBe(false);
	});

	it("returns false when the header has no modelReferences at all", () => {
		expect(referencesFragmentModel(buildHeader("pm-1"), FRAGMENT_MODEL_ID)).toBe(false);
	});
});

describe("addUsages", () => {
	it("records a segment fragment reference matching the fragment model", () => {
		const usageByEntityId: Record<string, FragmentUsagePrintModelInfo[]> = {};
		const printModel = buildPrintModel("pm-1", {
			segments: { fragmentReferences: [{ id: "seg-ref-1", refId: "frag-seg-1", model: FRAGMENT_MODEL_ID }] },
		});

		addUsages(usageByEntityId, printModel, FRAGMENT_MODEL_ID);

		expect(usageByEntityId).toEqual({
			"frag-seg-1": [{ printModelId: "pm-1", referenceEntityType: "segment", referenceIndex: 0 }],
		});
	});

	it("records section, watermark and textStyle references matching the fragment model", () => {
		const usageByEntityId: Record<string, FragmentUsagePrintModelInfo[]> = {};
		const printModel = buildPrintModel("pm-1", {
			sections: { references: [{ id: "sec-ref-1", refId: "frag-sec-1", model: FRAGMENT_MODEL_ID }] },
			watermarks: { references: [{ id: "wm-ref-1", refId: "frag-wm-1", model: FRAGMENT_MODEL_ID }] },
			textStyles: { references: [{ id: "ts-ref-1", refId: "frag-ts-1", model: FRAGMENT_MODEL_ID }] },
		});

		addUsages(usageByEntityId, printModel, FRAGMENT_MODEL_ID);

		expect(usageByEntityId["frag-sec-1"]).toEqual([
			{ printModelId: "pm-1", referenceEntityType: "section", referenceIndex: 0 },
		]);
		expect(usageByEntityId["frag-wm-1"]).toEqual([
			{ printModelId: "pm-1", referenceEntityType: "watermark", referenceIndex: 0 },
		]);
		expect(usageByEntityId["frag-ts-1"]).toEqual([
			{ printModelId: "pm-1", referenceEntityType: "textStyle", referenceIndex: 0 },
		]);
	});

	it("ignores references pointing at a different fragment model", () => {
		const usageByEntityId: Record<string, FragmentUsagePrintModelInfo[]> = {};
		const printModel = buildPrintModel("pm-1", {
			segments: { fragmentReferences: [{ id: "seg-ref-1", refId: "frag-seg-1", model: "other-fragment-model" }] },
		});

		addUsages(usageByEntityId, printModel, FRAGMENT_MODEL_ID);

		expect(usageByEntityId).toEqual({});
	});

	it("accumulates multiple usages for the same referenced entity, keeping their reference index", () => {
		const usageByEntityId: Record<string, FragmentUsagePrintModelInfo[]> = {};
		const printModel = buildPrintModel("pm-1", {
			segments: {
				fragmentReferences: [
					{ id: "seg-ref-1", refId: "frag-seg-1", model: FRAGMENT_MODEL_ID },
					{ id: "seg-ref-2", refId: "frag-seg-1", model: FRAGMENT_MODEL_ID },
				],
			},
		});

		addUsages(usageByEntityId, printModel, FRAGMENT_MODEL_ID);

		expect(usageByEntityId["frag-seg-1"]).toEqual([
			{ printModelId: "pm-1", referenceEntityType: "segment", referenceIndex: 0 },
			{ printModelId: "pm-1", referenceEntityType: "segment", referenceIndex: 1 },
		]);
	});

	it("merges usages across multiple addUsages calls for the same map", () => {
		const usageByEntityId: Record<string, FragmentUsagePrintModelInfo[]> = {};
		const printModelA = buildPrintModel("pm-a", {
			segments: { fragmentReferences: [{ id: "seg-ref-1", refId: "frag-seg-1", model: FRAGMENT_MODEL_ID }] },
		});
		const printModelB = buildPrintModel("pm-b", {
			segments: { fragmentReferences: [{ id: "seg-ref-1", refId: "frag-seg-1", model: FRAGMENT_MODEL_ID }] },
		});

		addUsages(usageByEntityId, printModelA, FRAGMENT_MODEL_ID);
		addUsages(usageByEntityId, printModelB, FRAGMENT_MODEL_ID);

		expect(usageByEntityId["frag-seg-1"]).toEqual([
			{ printModelId: "pm-a", referenceEntityType: "segment", referenceIndex: 0 },
			{ printModelId: "pm-b", referenceEntityType: "segment", referenceIndex: 0 },
		]);
	});
});

describe("addElementUsages", () => {
	const usageMapFor = (printModel: PrintModel) => {
		const usageByEntityId: Record<string, FragmentUsagePrintModelInfo[]> = {};
		addElementUsages(usageByEntityId, printModel, FRAGMENT_MODEL_ID);
		return usageByEntityId;
	};

	it("records an element placement sitting directly in a segment", () => {
		const printModel = buildPlacementModel({
			segments: [buildSegment("seg-1", [buildPlaceable("ref-1", "frag-el-1", FRAGMENT_MODEL_ID)])],
		});

		expect(usageMapFor(printModel)).toEqual({
			"frag-el-1": [
				{
					printModelId: "pm-1",
					referenceEntityType: "element",
					elementPath: [
						{ elementName: "content", index: 1 },
						{ elementName: "segments", index: 1 },
						{ elementName: "definitions", index: 1 },
						{ elementName: "elementReferences", index: 1 },
					],
				},
			],
		});
	});

	it("records element placements in section and watermark containers", () => {
		const printModel = buildPlacementModel({
			sections: [buildSection("sec-1", [buildPlaceable("ref-1", "frag-el-1", FRAGMENT_MODEL_ID)])],
			watermarks: [buildWatermark("wm-1", [buildPlaceable("ref-2", "frag-el-2", FRAGMENT_MODEL_ID)])],
		});

		const usageByEntityId = usageMapFor(printModel);

		expect(usageByEntityId["frag-el-1"]?.[0].elementPath).toEqual([
			{ elementName: "content", index: 1 },
			{ elementName: "sections", index: 1 },
			{ elementName: "definitions", index: 1 },
			{ elementName: "elementReferences", index: 1 },
		]);
		expect(usageByEntityId["frag-el-2"]?.[0].elementPath).toEqual([
			{ elementName: "content", index: 1 },
			{ elementName: "watermarks", index: 1 },
			{ elementName: "definitions", index: 1 },
			{ elementName: "elementReferences", index: 1 },
		]);
	});

	it("records a placement nested inside an Area wrapper with the wrapper's own path", () => {
		const printModel = buildPlacementModel({
			elementDefinitions: [
				buildArea("wrap-1", [
					buildPlaceable("ref-local", "local-el", undefined),
					buildPlaceable("ref-1", "frag-el-1", FRAGMENT_MODEL_ID),
				]),
			],
		});

		expect(usageMapFor(printModel)["frag-el-1"]?.[0].elementPath).toEqual([
			{ elementName: "content", index: 1 },
			{ elementName: "elementDefinitions", index: 1 },
			{ elementName: "area", index: 1 },
			{ elementName: "elementReferences", index: 2 },
		]);
	});

	it("records a placement nested inside an Override, which owns its references below boundingBox", () => {
		const printModel = buildPlacementModel({
			elementDefinitions: [buildOverride("wrap-1", [buildPlaceable("ref-1", "frag-el-1", FRAGMENT_MODEL_ID)])],
		});

		expect(usageMapFor(printModel)["frag-el-1"]?.[0].elementPath).toEqual([
			{ elementName: "content", index: 1 },
			{ elementName: "elementDefinitions", index: 1 },
			{ elementName: "override", index: 1 },
			{ elementName: "boundingBox", index: 1 },
			{ elementName: "elementReferences", index: 1 },
		]);
	});

	it("records every placement of the same fragment element with its own distinct path", () => {
		const printModel = buildPlacementModel({
			segments: [
				buildSegment("seg-1", [
					buildPlaceable("ref-1", "frag-el-1", FRAGMENT_MODEL_ID),
					buildPlaceable("ref-2", "frag-el-1", FRAGMENT_MODEL_ID),
				]),
			],
			elementDefinitions: [buildArea("wrap-1", [buildPlaceable("ref-3", "frag-el-1", FRAGMENT_MODEL_ID)])],
		});

		const usages = usageMapFor(printModel)["frag-el-1"];

		expect(usages).toHaveLength(3);
		expect(usages?.map(usage => usage.elementPath?.at(-1)?.index)).toEqual([1, 2, 1]);
		expect(usages?.map(usage => usage.elementPath?.at(-2)?.elementName)).toEqual([
			"definitions",
			"definitions",
			"area",
		]);
	});

	it("ignores local placements and placements pointing at another fragment model", () => {
		const printModel = buildPlacementModel({
			segments: [
				buildSegment("seg-1", [
					buildPlaceable("ref-local", "local-el", undefined),
					buildPlaceable("ref-other", "frag-el-1", "another-fragment-model"),
				]),
			],
		});

		expect(usageMapFor(printModel)).toEqual({});
	});

	it("appends to entries an earlier addUsages call already put in the same map", () => {
		const usageByEntityId: Record<string, FragmentUsagePrintModelInfo[]> = {};
		const segmentUsageModel = buildPrintModel("pm-1", {
			segments: { fragmentReferences: [{ id: "seg-ref-1", refId: "frag-el-1", model: FRAGMENT_MODEL_ID }] },
		});
		const elementUsageModel = buildPlacementModel({
			segments: [buildSegment("seg-1", [buildPlaceable("ref-1", "frag-el-1", FRAGMENT_MODEL_ID)])],
		});

		addUsages(usageByEntityId, segmentUsageModel, FRAGMENT_MODEL_ID);
		addElementUsages(usageByEntityId, elementUsageModel, FRAGMENT_MODEL_ID);

		expect(usageByEntityId["frag-el-1"]).toHaveLength(2);
		expect(usageByEntityId["frag-el-1"]?.map(usage => usage.referenceEntityType)).toEqual(["segment", "element"]);
	});
});

describe("handleLoadFragmentUsageMap", () => {
	const requestApi = {
		loadPrintModelHeaders: jest.fn(),
		loadPrintModel: jest.fn(),
	} as unknown as RequestApi;

	it("builds the usage map from the resolved candidate print models", () => {
		const referencingPrintModel = buildPrintModel("pm-1", {
			sections: { references: [{ id: "sec-ref-1", refId: "frag-sec-1", model: FRAGMENT_MODEL_ID }] },
		});

		const gen = handleLoadFragmentUsageMap(FragmentUsageActions.loadUsageMap(FRAGMENT_MODEL_ID));

		gen.next(); // getContext("requestApi")
		gen.next(requestApi); // call(loadPrintModelHeaders) -> supply headers
		const allStep = gen.next([buildHeader("pm-1", [FRAGMENT_MODEL_REFERENCE]), buildHeader(FRAGMENT_MODEL_ID)]);
		expect(allStep.done).toBe(false); // all(candidateIds.map(loadCandidate))

		const putStep = gen.next([referencingPrintModel]); // supply resolved print models
		expect(putStep.done).toBe(false);
		expect(putStep.value).toMatchObject({
			type: "PUT",
			payload: {
				action: FragmentUsageActions.setUsageMap({
					"frag-sec-1": [{ printModelId: "pm-1", referenceEntityType: "section", referenceIndex: 0 }],
				}),
			},
		});

		expect(gen.next().done).toBe(true);
	});

	it("includes element placements next to the other fragment reference types", () => {
		const referencingPrintModel = buildPlacementModel({
			segments: [buildSegment("seg-1", [buildPlaceable("ref-1", "frag-el-1", FRAGMENT_MODEL_ID)])],
		});

		const gen = handleLoadFragmentUsageMap(FragmentUsageActions.loadUsageMap(FRAGMENT_MODEL_ID));

		gen.next(); // getContext("requestApi")
		gen.next(requestApi); // call(loadPrintModelHeaders) -> supply headers
		gen.next([buildHeader("pm-1", [FRAGMENT_MODEL_REFERENCE])]);

		const putStep = gen.next([referencingPrintModel]);
		const usageMap = (putStep.value as { payload: { action: { payload: Record<string, unknown> } } }).payload.action
			.payload;
		expect(usageMap["frag-el-1"]).toEqual([
			{
				printModelId: "pm-1",
				referenceEntityType: "element",
				elementPath: [
					{ elementName: "content", index: 1 },
					{ elementName: "segments", index: 1 },
					{ elementName: "definitions", index: 1 },
					{ elementName: "elementReferences", index: 1 },
				],
			},
		]);
	});

	it("skips print models that failed to load (undefined in the resolved array)", () => {
		const gen = handleLoadFragmentUsageMap(FragmentUsageActions.loadUsageMap(FRAGMENT_MODEL_ID));

		gen.next();
		gen.next(requestApi);
		gen.next([buildHeader("pm-1", [FRAGMENT_MODEL_REFERENCE])]);

		const putStep = gen.next([undefined]);
		expect(putStep.value).toMatchObject({
			type: "PUT",
			payload: { action: FragmentUsageActions.setUsageMap({}) },
		});
	});

	it("dispatches setUsageMapError and logs when loading the headers fails", () => {
		const logErrorSpy = jest
			.spyOn(LoggerFactory.getLogger("LoadFragmentUsageMapSaga"), "error")
			.mockImplementation(() => {});

		const gen = handleLoadFragmentUsageMap(FragmentUsageActions.loadUsageMap(FRAGMENT_MODEL_ID));

		gen.next(); // getContext
		gen.next(requestApi); // call(loadPrintModelHeaders)
		const errorStep = gen.throw(new Error("boom")); // simulate the call throwing

		expect(errorStep.done).toBe(false);
		expect(errorStep.value).toMatchObject({
			type: "PUT",
			payload: { action: FragmentUsageActions.setUsageMapError() },
		});
		expect(logErrorSpy).toHaveBeenCalledWith(expect.stringContaining(FRAGMENT_MODEL_ID), expect.any(Error));

		expect(gen.next().done).toBe(true);
		logErrorSpy.mockRestore();
	});
});
