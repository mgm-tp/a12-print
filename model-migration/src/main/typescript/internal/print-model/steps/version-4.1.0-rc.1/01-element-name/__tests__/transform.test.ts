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
import { fileURLToPath } from "node:url";
import path from "node:path";

import { ElementType } from "@com.mgmtp.a12.print/print-model-api/model";

import { loadJsonFiles } from "../../../../../../../../test/typescript/test-utils/files.js";
import { PrintMigrationTool } from "../../../../api.js";
import type * as OldModel from "../../../version-4.0.0/05-duplicated-image-dimension-ids/print-model.js";
import type * as NewModel from "../../print-model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const directoryPath = path.join(__dirname, "__testdata__");

describe("transform 4.1.0-rc.1: element name backfill", () => {
	const models = loadJsonFiles(directoryPath);
	const result = PrintMigrationTool.migrate(models);

	const successResult = result.filter(r => r.status === "success");

	it("migrates the test model successfully", () => {
		expect(successResult.length).toBe(1);
	});

	const oldModel = models[0] as OldModel.PrintModelDTO;
	const newModel = result[0]?.model as NewModel.PrintModelDTO;

	it("assigns a name to every element definition", () => {
		const elements = newModel.content.elementDefinitions;
		expect(elements?.length).toBeGreaterThan(0);
		elements?.forEach(elem => {
			expect(elem.name).toBeDefined();
		});
	});

	it("generates names in the format {type}_{hash} for elements without an existing name", () => {
		const elements = newModel.content.elementDefinitions;
		elements
			?.filter(elem => !elem.switch?.name && !elem.calculation?.name)
			.forEach(elem => {
				expect(elem.name).toMatch(/^[A-Za-z]+_.+$/);
			});
	});

	it("generates a name that starts with {type} for each element", () => {
		const elements = newModel.content.elementDefinitions;
		const lineElem = elements?.find(e => e.type === ElementType.Line);
		const areaElem = elements?.find(e => e.type === ElementType.Area);

		expect(lineElem?.name).toMatch(/^Line_/);
		expect(areaElem?.name).toMatch(/^Area_/);
	});

	it("generates unique names across elements", () => {
		const elements = newModel.content.elementDefinitions;
		const names = elements?.map(e => e.name);
		const uniqueNames = new Set(names);
		expect(uniqueNames.size).toBe(names?.length);
	});

	it("fill switch name with element.switch.name", () => {
		const elements = newModel.content.elementDefinitions;
		const oldElements = oldModel.content.elementDefinitions;
		const switchElem = elements?.find(e => e.type === ElementType.Switch);
		const oldSwitchElem = oldElements?.find(e => e.type === ElementType.Switch);
		expect(switchElem?.name).toBe(oldSwitchElem?.switch?.name);
	});

	it("fill calculation name with element.calculation.name", () => {
		const elements = newModel.content.elementDefinitions;
		const oldElements = oldModel.content.elementDefinitions;
		const calcElem = elements?.find(e => e.type === ElementType.Calculation);
		const oldCalcElem = oldElements?.find(e => e.type === ElementType.Calculation);
		expect(calcElem?.name).toBe(oldCalcElem?.calculation?.name);
	});
});
