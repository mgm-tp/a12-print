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
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import type { ExportEntry } from "./__testdata__/public-exports/list-exports.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const snapshotDir = resolve(__dirname, "__testdata__/public-exports/3.1.1");
const listExportsScript = resolve(__dirname, "__testdata__/public-exports/list-exports.ts");
const allowedRemovalsFile = resolve(__dirname, "__testdata__/public-exports/allowed-removals.csv");
const repoRoot = resolve(__dirname, "../../../..");

function parseExportsFromLog(content: string): ExportEntry[] {
	return content
		.split("\n")
		.filter(line => line.trim().length > 0)
		.map(line => {
			const [filePath, symbolName, deprecatedMarker] = line.split("\t");
			return { filePath, symbolName, deprecationInfo: { isDeprecated: deprecatedMarker === "DEPRECATED" } };
		});
}

function parseExports(content: string): ExportEntry[] {
	return JSON.parse(content) as ExportEntry[];
}

function filterOutInternal(exports: ExportEntry[]): ExportEntry[] {
	return exports.filter(entry => !entry.filePath.includes("internal"));
}

function getSnapshotExports(packageName: string): ExportEntry[] {
	const snapshotFile = join(snapshotDir, `${packageName}-3.1.1.json`);
	const content = readFileSync(snapshotFile, "utf-8");
	return filterOutInternal(parseExports(content));
}

function getCurrentExports(packageName: string): ExportEntry[] {
	const packageDir = relative(dirname(listExportsScript), join(repoRoot, packageName));
	const output = execSync(`npx tsx ${listExportsScript} ${packageDir} currentVer`, {
		cwd: repoRoot,
		encoding: "utf-8",
		env: { ...process.env, NODE_NO_WARNINGS: "1" },
	});
	return filterOutInternal(parseExportsFromLog(output));
}

function findMissingExports(
	baselineExports: ExportEntry[],
	currentExports: ExportEntry[],
	allowedRemovals: Set<string>
): string[] {
	const currentSymbols = new Set(currentExports.map(e => e.symbolName));
	return baselineExports
		.filter(e => !currentSymbols.has(e.symbolName) && !allowedRemovals.has(e.symbolName))
		.map(e => `${e.symbolName} (was in ${e.filePath})`);
}

function loadAllowedRemovals(packageName: string): Set<string> {
	if (!existsSync(allowedRemovalsFile)) {
		return new Set();
	}
	const content = readFileSync(allowedRemovalsFile, "utf-8");
	return new Set(
		content
			.split("\n")
			.map(line => line.trim())
			.filter(line => line.length > 0)
			.filter(line => {
				const [pkg] = line.split(",");
				return pkg === packageName;
			})
			.map(line => line.split(",")[1])
	);
}

const snapshotPackages = readdirSync(snapshotDir)
	.filter(f => f.endsWith(".json"))
	.map(f => f.replace(/-3\.1\.1\.json$/, ""));

describe("public export compatibility with 3.1.1", () => {
	it.each(snapshotPackages)("should not have removed any public exports from %s since 3.1.1", packageName => {
		const baselineExports = getSnapshotExports(packageName);
		const currentExports = getCurrentExports(packageName);
		const allowedRemovals = loadAllowedRemovals(packageName);
		const missing = findMissingExports(baselineExports, currentExports, allowedRemovals);

		expect(missing).toEqual([]);
	});
});
