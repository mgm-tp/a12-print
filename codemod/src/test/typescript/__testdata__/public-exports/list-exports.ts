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
import { dirname, resolve, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readdirSync, writeFileSync } from "node:fs";

import ts from "typescript";

type DeprecationInfo = {
	isDeprecated: boolean;
	version?: string;
};

export interface ExportEntry {
	filePath: string;
	symbolName: string;
	deprecationInfo: DeprecationInfo;
}

const repoRoot = dirname(fileURLToPath(import.meta.url));

function main() {
	const packageDir = process.argv[2];
	const packageVer = process.argv[3];
	const shouldOutputJson = process.argv.includes("--json");
	if (!packageDir || !packageVer) {
		console.error("Usage: npx tsx list-exports.ts <package-dir> <package-version> [--json]");
		console.error("Example: npx tsx list-exports.ts model-api-utils 3.1.1 --json");
		process.exit(1);
	}

	const packagePath = resolve(repoRoot, packageDir);
	const srcRoot = join(packagePath, "src", "main", "typescript");

	if (!existsSync(srcRoot)) {
		console.error(`Source root not found: ${srcRoot}`);
		process.exit(1);
	}

	const tsconfigPath = existsSync(join(packagePath, "tsconfig.build.json"))
		? join(packagePath, "tsconfig.build.json")
		: join(packagePath, "tsconfig.json");

	const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
	if (configFile.error) {
		console.error("Error reading tsconfig:", ts.flattenDiagnosticMessageText(configFile.error.messageText, "\n"));
		process.exit(1);
	}

	const parsedConfig = ts.parseJsonConfigFileContent(configFile.config, ts.sys, packagePath);

	const sourceFiles = collectSourceFiles(srcRoot);

	const program = ts.createProgram(sourceFiles, parsedConfig.options);
	const checker = program.getTypeChecker();

	const symbolToShortestPath = new Map<string, { path: string; deprecated: boolean }>();
	deduplicateExports(sourceFiles, program, checker, packagePath, symbolToShortestPath);

	const exportsByFile = new Map<string, { name: string; deprecated: boolean }[]>();
	for (const [name, info] of symbolToShortestPath) {
		if (!exportsByFile.has(info.path)) {
			exportsByFile.set(info.path, []);
		}
		exportsByFile.get(info.path)?.push({ name, deprecated: info.deprecated });
	}

	const finalExports: ExportEntry[] = [];
	const sortedPaths = Array.from(exportsByFile.keys()).sort((a, b) => a.localeCompare(b));
	generateExportReport(sortedPaths, exportsByFile, finalExports, packageDir, packageVer, shouldOutputJson);
}

function generateExportReport(
	sortedPaths: string[],
	exportsByFile: Map<string, { name: string; deprecated: boolean }[]>,
	finalExports: ExportEntry[],
	packageDir: string,
	packageVer: string,
	shouldOutputJson: boolean = false
) {
	for (const filePath of sortedPaths) {
		const symbols = exportsByFile.get(filePath)?.sort((a, b) => a.name.localeCompare(b.name));
		if (symbols) {
			for (const { name, deprecated } of symbols) {
				const suffix = deprecated ? "\tDEPRECATED" : "";
				console.log(`${filePath}\t${name}${suffix}`);
				finalExports.push({
					filePath,
					symbolName: name,
					deprecationInfo: { isDeprecated: deprecated, version: packageVer },
				});
			}
		}
	}
	if (shouldOutputJson) {
		writeFileSync(
			join(repoRoot, `${packageDir}-${packageVer}.json`),
			JSON.stringify(finalExports, null, 2),
			"utf-8"
		);
	}
}

function isDeprecated(symbol: ts.Symbol, checker: ts.TypeChecker): boolean {
	return symbol.getJsDocTags(checker).some(tag => tag.name === "deprecated");
}

function deduplicateExports(
	sourceFiles: string[],
	program: ts.Program,
	checker: ts.TypeChecker,
	packagePath: string,
	symbolToShortestPath: Map<string, { path: string; deprecated: boolean }>
) {
	for (const filePath of sourceFiles) {
		const sourceFile = program.getSourceFile(filePath);
		if (!sourceFile) continue;

		const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
		if (!moduleSymbol) continue;

		const exports = checker.getExportsOfModule(moduleSymbol);
		const relativePath = relative(packagePath, filePath);

		for (const exportedSymbol of exports) {
			const name = exportedSymbol.name;
			const deprecated = isDeprecated(exportedSymbol, checker);
			const existing = symbolToShortestPath.get(name);
			if (!existing || relativePath.length < existing.path.length) {
				symbolToShortestPath.set(name, { path: relativePath, deprecated });
			}
		}
	}
}

function collectSourceFiles(dir: string): string[] {
	const files: string[] = [];

	function walk(currentDir: string) {
		for (const entry of readdirSync(currentDir, {
			withFileTypes: true,
		})) {
			const fullPath = join(currentDir, entry.name);
			if (entry.isDirectory()) {
				if (entry.name === "__tests__") continue;
				walk(fullPath);
			} else if (
				entry.isFile() &&
				(entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) &&
				!entry.name.endsWith(".d.ts")
			) {
				files.push(fullPath);
			}
		}
	}

	walk(dir);
	return files;
}

main();
