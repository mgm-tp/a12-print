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
// Script to update the model version constant with the latest version from the migration steps.

import * as fs from "node:fs";
import * as path from "node:path";

interface ModelConfig {
	stepsIndexFile: string;
	versionFile: string;
	versionConstant: string;
}

const MODEL_CONFIG: Record<string, ModelConfig> = {
	"print-model": {
		stepsIndexFile: "../print-model/steps/index.ts",
		versionFile: "../../../../../../model-api/src/main/typescript/constant/model.ts",
		versionConstant: "PRINT_MODEL_VERSION",
	},
	"print-setting-model": {
		stepsIndexFile: "../print-setting-model/steps/index.ts",
		versionFile: "../../../../../../print-setting/src/main/typescript/internal/api/constant/model.ts",
		versionConstant: "PRINT_SETTING_MODEL_VERSION",
	},
	"typesetting-model": {
		stepsIndexFile: "../typesetting-model/steps/index.ts",
		versionFile: "../../../../../../typesetting/src/main/typescript/internal/api/constant/model.ts",
		versionConstant: "TYPESETTING_MODEL_VERSION",
	},
};

function main(): void {
	const modelName = process.argv[2];

	if (!modelName) {
		printUsage();
		throw new Error("Model argument required");
	}

	const config = MODEL_CONFIG[modelName];
	if (!config) {
		printUsage();
		throw new Error(`Unknown model "${modelName}"`);
	}

	const scriptDir = path.dirname(process.argv[1]);

	const stepsIndexPath = path.resolve(scriptDir, config.stepsIndexFile);
	const latestStepsVersion = getLatestStepsVersion(stepsIndexPath);
	const versionFilePath = path.resolve(scriptDir, config.versionFile);
	const moduleVersion = getModuleVersion(versionFilePath, config.versionConstant);

	if (moduleVersion === latestStepsVersion) {
		console.log("Version is already up to date.");
		return;
	}

	updateModuleVersionFile(versionFilePath, config.versionConstant, latestStepsVersion);
}

function printUsage(): void {
	console.log("Usage: pnpm run update-model-version <model>");
	console.log("");
	console.log("Arguments:");
	console.log(`  model: ${Object.keys(MODEL_CONFIG).join(" | ")}`);
	console.log("");
	console.log("Example:");
	console.log("  pnpm run update-model-version print-model");
	console.log("");
}

function getLatestStepsVersion(filePath: string): string {
	if (!fs.existsSync(filePath)) {
		throw new Error(`Steps index file not found: ${filePath}`);
	}

	const content = fs.readFileSync(filePath, "utf-8");

	// Find all version strings in the MIGRATION_STEPS array
	const versionRegex = /version:\s*"([^"]+)"/g;
	const versions: string[] = [];
	let match;
	while ((match = versionRegex.exec(content)) !== null) {
		versions.push(match[1]);
	}

	if (versions.length === 0) {
		throw new Error(`No versions found in ${filePath}`);
	}

	return versions[versions.length - 1];
}

function getModuleVersion(filePath: string, constantName: string): string {
	if (!fs.existsSync(filePath)) {
		throw new Error(`Version file not found: ${filePath}`);
	}

	const content = fs.readFileSync(filePath, "utf-8");
	const regex = new RegExp(`export const ${constantName} = "(.*?)";`);
	const match = regex.exec(content);

	if (!match) {
		throw new Error(`Could not find ${constantName} in ${filePath}`);
	}

	return match[1];
}

function updateModuleVersionFile(filePath: string, constantName: string, newVersion: string): void {
	let content = fs.readFileSync(filePath, "utf-8");
	const regex = new RegExp(`(export const ${constantName} = ").*?(";)`);
	content = content.replace(regex, `$1${newVersion}$2`);
	fs.writeFileSync(filePath, content, "utf-8");

	console.log(`Updated ${constantName} to ${newVersion}`);
}

try {
	main();
} catch (e) {
	console.error((e as Error).message);
	process.exit(1);
}
