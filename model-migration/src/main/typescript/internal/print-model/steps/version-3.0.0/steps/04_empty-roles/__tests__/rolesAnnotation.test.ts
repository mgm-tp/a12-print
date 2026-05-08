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
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { loadJsonFiles } from "../../../../../../../../../test/typescript/test-utils/files.js";
import { PrintMigrationTool } from "../../../../../api.js";
import { PrintModelDTO } from "../../02_description-field/print-model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const directoryPath = path.join(__dirname, "__testdata__");

describe("v3.0.0 step", () => {
	test("can migrate roles properly", () => {
		const models = loadJsonFiles(directoryPath);
		const result = PrintMigrationTool.migrate(models);
		const successResult = result.filter(r => r.status === "success");
		const skipResult = result.filter(r => r.status === "skip");
		const errorResult = result.filter(r => r.status === "error");
		expect(successResult.length).toBe(3);
		expect(skipResult.length).toBe(0);
		expect(errorResult.length).toBe(0);

		const resultMultiple = getRoles(result[0].model as PrintModelDTO);
		const resultNone = getRoles(result[1].model as PrintModelDTO);
		const resultOne = getRoles(result[2].model as PrintModelDTO);
		expect(resultMultiple).toMatch(/,/g);
		expect(resultMultiple).not.toMatch(/;/g);
		expect(resultNone).toBe(undefined);
		expect(resultOne).not.toMatch(/,/g);
		expect(resultOne).not.toMatch(/;/g);
	});
});

function getRoles(model: PrintModelDTO) {
	return model.header.annotations?.find(entry => entry.name === "roles")?.value;
}
