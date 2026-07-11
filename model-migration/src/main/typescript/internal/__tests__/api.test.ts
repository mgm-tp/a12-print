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

import type { MigrationResult } from "@com.mgmtp.a12.migrationtool/migrationtool-core/types";

import { loadJsonFiles } from "../../../../test/typescript/test-utils/files.js";

import { PrintMigrationTool } from "../print-model/api.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const directoryPath = path.join(__dirname, "__testdata__");

describe("api.ts", () => {
	let models: object[] = [];
	const browserLog = console.log;

	beforeAll(() => {
		// prevent display logs from migration
		console.log = () => undefined;
		models = loadJsonFiles(directoryPath);
	});

	afterAll(() => {
		console.log = browserLog;
	});

	test("can migrate models properly", () => {
		const result = PrintMigrationTool.migrate(models);
		const successResult = result.filter(r => r.status === "success");
		const skipResult = result.filter(r => r.status === "skip");
		const errorResult = result.filter(r => r.status === "error");
		expect(successResult.length).toBe(1);
		expect(skipResult.length).toBe(0);
		expect(errorResult.length).toBe(1);
		expectedError(errorResult);
	});
});
function expectedError(errors: MigrationResult[]) {
	// There should be one error from the unsupported version
	const firstError = errors[0];
	if (!("errorMessage" in firstError)) {
		throw Error("There is no errorMessage in er");
	}

	expect(firstError.errorMessage).toBe(
		"Model version_2.0.3 has version 2.0.3 which is lower than the minimum supported version 2.1.0"
	);
}
