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

import type * as NewModel from "../print-model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const directoryPath = path.join(__dirname, "__testdata__");

describe("duplicatedImageDimensionIds.test", () => {
	const models = loadJsonFiles(directoryPath);
	const result = PrintMigrationTool.migrate(models);

	const successResult = result.filter(r => r.status === "success");
	expect(successResult.length).toBe(1);

	const newModel = result[0].model as NewModel.PrintModelDTO;
	const elementDefinitions = newModel.content.elementDefinitions ?? [];

	it("should assign a new unique id to originalWidth when it duplicates width id", () => {
		const imageWithDuplicatedIds = elementDefinitions.find(e => e.id === "imageWithDuplicatedIds");
		const dimensions = imageWithDuplicatedIds?.image?.dimensions;

		expect(dimensions?.width?.id).toBe("naturalWidth_DUPLICATE");
		expect(dimensions?.originalWidth?.id).not.toBe("naturalWidth_DUPLICATE");
		expect(dimensions?.originalWidth?.id).toBeDefined();
		expect(typeof dimensions?.originalWidth?.id).toBe("string");
		expect((dimensions?.originalWidth?.id as string).length).toBeGreaterThan(0);
	});

	it("should preserve other dimension values when fixing duplicated id", () => {
		const imageWithDuplicatedIds = elementDefinitions.find(e => e.id === "imageWithDuplicatedIds");
		const dimensions = imageWithDuplicatedIds?.image?.dimensions;

		expect(dimensions?.width?.value).toBe(100);
		expect(dimensions?.width?.unit).toBe("Millimeter");
		expect(dimensions?.originalWidth?.value).toBe(200);
		expect(dimensions?.originalWidth?.unit).toBe("Millimeter");
		expect(dimensions?.height?.id).toBe("height1");
		expect(dimensions?.originalHeight?.id).toBe("originalHeight1");
	});

	it("should not modify image elements with already unique dimension ids", () => {
		const imageWithUniqueIds = elementDefinitions.find(e => e.id === "imageWithUniqueIds");
		const dimensions = imageWithUniqueIds?.image?.dimensions;

		expect(dimensions?.width?.id).toBe("width_unique");
		expect(dimensions?.originalWidth?.id).toBe("originalWidth_unique");
	});

	it("should assign a new unique id to originalHeight when it duplicates height id", () => {
		const imageWithDuplicatedHeightIds = elementDefinitions.find(e => e.id === "imageWithDuplicatedHeightIds");
		const dimensions = imageWithDuplicatedHeightIds?.image?.dimensions;

		expect(dimensions?.height?.id).toBe("naturalHeight_DUPLICATE");
		expect(dimensions?.originalHeight?.id).not.toBe("naturalHeight_DUPLICATE");
		expect(dimensions?.originalHeight?.id).toBeDefined();
		expect(typeof dimensions?.originalHeight?.id).toBe("string");
		expect((dimensions?.originalHeight?.id as string).length).toBeGreaterThan(0);
	});

	it("should preserve other dimension values when fixing duplicated height id", () => {
		const imageWithDuplicatedHeightIds = elementDefinitions.find(e => e.id === "imageWithDuplicatedHeightIds");
		const dimensions = imageWithDuplicatedHeightIds?.image?.dimensions;

		expect(dimensions?.height?.value).toBe(50);
		expect(dimensions?.height?.unit).toBe("Millimeter");
		expect(dimensions?.originalHeight?.value).toBe(100);
		expect(dimensions?.originalHeight?.unit).toBe("Millimeter");
		expect(dimensions?.width?.id).toBe("width3");
		expect(dimensions?.originalWidth?.id).toBe("originalWidth3");
	});

	it("should not modify non-image elements", () => {
		const nonImageElement = elementDefinitions.find(e => e.id === "nonImageElement");

		expect(nonImageElement?.type).toBe("Text");
		expect(nonImageElement?.text?.text).toBe('<p><span style="">Hello World</span></p>');
	});
});
