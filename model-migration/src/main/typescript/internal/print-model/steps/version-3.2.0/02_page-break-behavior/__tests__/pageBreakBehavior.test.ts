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

import { loadJsonFiles } from "../../../../../../../../test/typescript/test-utils/files.js";
import { PrintMigrationTool } from "../../../../api.js";
import * as OldModel from "../../01_meta-data-computation/print-model.js";

import * as NewModel from "../print-model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const directoryPath = path.join(__dirname, "__testdata__");

function expectDefaultPageBreakBehavior(refs: NewModel.ElementReferencesDTO[] | undefined, expectedPath: string): void {
	refs?.forEach(ref => {
		expect(ref.pageBreakBehavior).toBeDefined();
		expect(ref.pageBreakBehavior?.source).toBe("DEFAULT");
		expect(ref.pageBreakBehavior?.path).toBe(expectedPath);
	});
}

function expectInheritedPageBreakBehavior(
	refs: NewModel.ElementReferencesDTO[] | undefined,
	expectedPath: string
): void {
	refs?.forEach(ref => {
		expect(ref.pageBreakBehavior).toBeDefined();
		expect(ref.pageBreakBehavior?.source).toBe("INHERITED");
		expect(ref.pageBreakBehavior?.path).toBe(expectedPath);
		expect(ref.pageBreakBehavior?.reference).toBeDefined();
	});
}

describe("pageBreakBehavior.test", () => {
	const models = loadJsonFiles(directoryPath);
	const oldModel = models[0] as OldModel.PrintModelDTO;
	const result = PrintMigrationTool.migrate(models);

	const successResult = result.filter(r => r.status === "success");
	expect(successResult.length).toBe(1);

	const newModel = result[0].model as NewModel.PrintModelDTO;

	it("should transform placeable element references correctly with page break behavior", () => {
		newModel.content.segments?.definitions?.forEach(segment => {
			expectDefaultPageBreakBehavior(
				segment.elementReferences,
				"/content/segments/definitions/elementReferences/pageBreakBehavior/value/"
			);
		});

		newModel.content.sections?.definitions?.forEach(section => {
			expectDefaultPageBreakBehavior(
				section.elementReferences,
				"/content/sections/definitions/elementReferences/pageBreakBehavior/value/"
			);
		});

		newModel.content.watermarks?.definitions?.forEach(watermark => {
			expectDefaultPageBreakBehavior(
				watermark.elementReferences,
				"/content/watermarks/definitions/elementReferences/pageBreakBehavior/value/"
			);
		});

		expect(newModel.content.elementDefinitions?.length).toBe(oldModel.content.elementDefinitions?.length);

		newModel.content.elementDefinitions?.forEach(definition => {
			expectInheritedPageBreakBehavior(
				definition.boundingBox?.elementReferences,
				"/content/elementDefinitions/boundingBox/elementReferences/pageBreakBehavior/value/"
			);
			expectInheritedPageBreakBehavior(
				definition.area?.elementReferences,
				"/content/elementDefinitions/area/elementReferences/pageBreakBehavior/value/"
			);
			expectInheritedPageBreakBehavior(
				definition.override?.boundingBox?.elementReferences,
				"/content/elementDefinitions/override/boundingBox/elementReferences/pageBreakBehavior/value/"
			);
		});
	});
});
