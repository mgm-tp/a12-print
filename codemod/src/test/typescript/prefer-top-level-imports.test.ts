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
import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("prefer-top-level-imports codemod", () => {
	let tempDir: string;
	const testDataDir = path.resolve(__dirname, "__testdata__/prefer-top-level-imports");
	const cliPath = path.resolve(__dirname, "../../../lib/cli.js");

	// temp test directory setup and teardown
	beforeEach(() => {
		tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "codemod-test-"));
		fs.cpSync(testDataDir, tempDir, { recursive: true });
	});

	afterEach(() => {
		fs.rmSync(tempDir, { recursive: true, force: true });
	});

	it("should migrate model-api deep imports to top-level imports", () => {
		const testFilePath = path.join(tempDir, "model-api-deep-imports.ts");

		runCodemod(tempDir);

		const transformedContent = fs.readFileSync(testFilePath, "utf-8");

		expect(transformedContent).toContain('from "@com.mgmtp.a12.print/print-model-api/errors"');
		expect(transformedContent).toContain('from "@com.mgmtp.a12.print/print-model-api/generated"');
		expect(transformedContent).toContain('from "@com.mgmtp.a12.print/print-model-api/input-source"');
		expect(transformedContent).toContain('from "@com.mgmtp.a12.print/print-model-api/generator"');
		expect(transformedContent).toContain('from "@com.mgmtp.a12.print/print-model-api/model"');
		expect(transformedContent).toContain('from "@com.mgmtp.a12.print/print-model-api/utils"');
		expect(transformedContent).toContain('from "@com.mgmtp.a12.print/print-model-api/walker"');

		expect(transformedContent).not.toContain("/lib/errors/");
		expect(transformedContent).not.toContain("/lib/generated/");
		expect(transformedContent).not.toContain("/lib/input-source/");
		expect(transformedContent).not.toContain("/lib/generator/");
		expect(transformedContent).not.toContain("/lib/model/");
		expect(transformedContent).not.toContain("/lib/utils/");
		expect(transformedContent).not.toContain("/lib/walker/");
	});

	it("should migrate model-api-utils deep imports to top-level imports", () => {
		const testFilePath = path.join(tempDir, "model-api-utils-deep-imports.ts");

		runCodemod(tempDir);

		const transformedContent = fs.readFileSync(testFilePath, "utf-8");

		expect(transformedContent).toContain('from "@com.mgmtp.a12.print/print-model-api-utils/garbage-collector"');
		expect(transformedContent).toContain('from "@com.mgmtp.a12.print/print-model-api-utils/marshaller"');

		expect(transformedContent).not.toContain("/lib/garbage-collector/");
		expect(transformedContent).not.toContain("/lib/marshaller/");
	});

	it("should not modify imports that are already top-level", () => {
		const testFilePath = path.join(tempDir, "already-top-level-imports.ts");
		const originalContent = fs.readFileSync(testFilePath, "utf-8");

		runCodemod(tempDir);

		const transformedContent = fs.readFileSync(testFilePath, "utf-8");

		expect(transformedContent).toContain('from "@com.mgmtp.a12.print/print-model-api/errors"');
		expect(transformedContent).toContain('from "@com.mgmtp.a12.print/print-model-api-utils/garbage-collector"');
		expect(transformedContent).toBe(originalContent);
	});

	it("should handle multiple files including nested directories", () => {
		runCodemod(tempDir);

		const transformedModelApi = fs.readFileSync(path.join(tempDir, "model-api-deep-imports.ts"), "utf-8");
		const transformedNested = fs.readFileSync(path.join(tempDir, "subdir/nested-file.ts"), "utf-8");

		expect(transformedModelApi).toContain('from "@com.mgmtp.a12.print/print-model-api/errors"');
		expect(transformedNested).toContain('from "@com.mgmtp.a12.print/print-model-api-utils/marshaller"');
		expect(transformedNested).not.toContain("/lib/marshaller/");
	});

	it("should handle namespace imports", () => {
		const testFilePath = path.join(tempDir, "namespace-imports.ts");

		runCodemod(tempDir);

		const transformedContent = fs.readFileSync(testFilePath, "utf-8");

		expect(transformedContent).toContain('from "@com.mgmtp.a12.print/print-model-api/errors"');
		expect(transformedContent).toContain('from "@com.mgmtp.a12.print/print-model-api-utils/marshaller"');
	});

	it("should migrate print-fonts deep imports to top-level imports", () => {
		const testFilePath = path.join(tempDir, "print-fonts-deep-imports.ts");

		runCodemod(tempDir);

		const transformedContent = fs.readFileSync(testFilePath, "utf-8");

		expect(transformedContent).toContain('from "@com.mgmtp.a12.print/print-fonts"');
		expect(transformedContent).not.toContain("/lib/types/font");
	});

	it("should migrate model-migration deep imports to top-level imports", () => {
		const testFilePath = path.join(tempDir, "model-migration-deep-imports.ts");

		runCodemod(tempDir);

		const transformedContent = fs.readFileSync(testFilePath, "utf-8");

		expect(transformedContent).toContain('from "@com.mgmtp.a12.print/print-model-migration"');
		expect(transformedContent).not.toContain("/lib/internal/print-model/api");
		expect(transformedContent).not.toContain("/lib/internal/print-setting-model/api");
		expect(transformedContent).not.toContain("/lib/internal/typesetting-model/api");
	});

	function runCodemod(targetDir: string): void {
		const codemodDir = path.resolve(__dirname, "../../..");
		execSync(`node ${cliPath} --no-git-check prefer-top-level-imports ${targetDir}`, {
			cwd: codemodDir,
			stdio: "pipe",
			env: { ...process.env, NODE_NO_WARNINGS: "1" },
		});
	}
});
