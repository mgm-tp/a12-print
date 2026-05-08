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
import * as OldModel from "../../../version-3.1.0/print-model.js";

import * as NewModel from "../print-model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const directoryPath = path.join(__dirname, "__testdata__");

describe("transformMetaDataComputation", () => {
	const models = loadJsonFiles(directoryPath);
	const result = PrintMigrationTool.migrate(models);

	const successResult = result.filter(r => r.status === "success");
	expect(successResult.length).toBe(1);

	const newModel = result[0].model as NewModel.PrintModelDTO;

	it("should transform metadata correctly with full input", () => {
		expect((newModel as unknown as OldModel.PrintModelDTO).content.general?.details).toBeUndefined();
		expect(newModel.content.general?.metadata).toEqual({
			id: expect.any(String),
			titleComputation: [{ id: expect.any(String), operation: '"Test Title"', precondition: undefined }],
			descriptionComputation: [
				{ id: expect.any(String), operation: '"Test Description"', precondition: undefined },
			],
			languageComputation: [{ id: expect.any(String), operation: '"DE"', precondition: undefined }],
			authorComputation: [{ id: expect.any(String), operation: '"Author Name"', precondition: undefined }],
		});
	});
});
