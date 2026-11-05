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
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { PRINT_MODEL_VERSION } from "@com.mgmtp.a12.print/print-model-api/constant";
import type { PrintModelDTO } from "@com.mgmtp.a12.print/print-model-api/generated/a12internal";

export interface LoadedPrintModel {
	/** Path of the file, relative to the repository root. */
	readonly path: string;
	/** The model id from its header, unique enough to name a test case. */
	readonly id: string;
	/** The file as it is stored - reading it is left to the test, so that a model that cannot be read fails. */
	readonly json: PrintModelDTO;
}

export interface LoadPrintModelsOptions {
	/** Where to search, the repository root by default. */
	readonly directory?: string;
	/** Only models written for this version, {@link PRINT_MODEL_VERSION} by default. Pass null for all of them. */
	readonly modelVersion?: string | null;
	/** Directory names to stay out of, on top of the build output and dependency folders. */
	readonly skipDirectories?: readonly string[];
}

const ALWAYS_SKIPPED = [".git", ".gradle", "node_modules", "build", "lib", "dist", "coverage", "documentation"];

const cache = new Map<string, readonly LoadedPrintModel[]>();

function findRepositoryRoot(): string {
	let directory = dirname(fileURLToPath(import.meta.url));
	while (!existsInDirectory(directory, "pnpm-workspace.yaml")) {
		const parent = dirname(directory);
		if (parent === directory) {
			throw new Error("Could not find the repository root - no pnpm-workspace.yaml in any parent directory");
		}
		directory = parent;
	}
	return directory;
}

function existsInDirectory(directory: string, name: string): boolean {
	try {
		return readdirSync(directory).includes(name);
	} catch {
		return false;
	}
}

function collectJsonFiles(directory: string, skipped: ReadonlySet<string>, files: string[]): void {
	for (const entry of readdirSync(directory, { withFileTypes: true })) {
		if (skipped.has(entry.name)) {
			continue;
		}
		const full = join(directory, entry.name);
		if (entry.isDirectory()) {
			collectJsonFiles(full, skipped, files);
		} else if (entry.name.endsWith(".json")) {
			files.push(full);
		}
	}
}

function readPrintModelJson(file: string, modelVersion: string | null): PrintModelDTO | undefined {
	if (statSync(file).size > 20_000_000) {
		return undefined;
	}

	const content = readFileSync(file, "utf8");
	// cheap pre-filter: parsing every json in the repository costs seconds, this costs milliseconds
	if (!content.includes('"modelType"')) {
		return undefined;
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(content);
	} catch {
		return undefined; // not every json in the repository is a model
	}

	const header = (parsed as { header?: { modelType?: string; modelVersion?: string } })?.header;
	if (header?.modelType !== "print" || !(parsed as { content?: unknown })?.content) {
		return undefined;
	}
	if (modelVersion !== null && header.modelVersion !== modelVersion) {
		return undefined;
	}

	return parsed as PrintModelDTO;
}

/**
 * Every print model stored in the repository, for tests that want to run against all of them rather than a
 * hand-picked fixture. Models the marshaller cannot read are left out.
 */
export function loadPrintModels(options: LoadPrintModelsOptions = {}): readonly LoadedPrintModel[] {
	const root = options.directory ?? findRepositoryRoot();
	const modelVersion = options.modelVersion === undefined ? PRINT_MODEL_VERSION : options.modelVersion;
	const skipped = new Set([...ALWAYS_SKIPPED, ...(options.skipDirectories ?? [])]);

	const cacheKey = `${root}|${modelVersion}|${[...skipped].sort().join(",")}`;
	const cached = cache.get(cacheKey);
	if (cached) {
		return cached;
	}

	const files: string[] = [];
	collectJsonFiles(root, skipped, files);

	const models = files.sort().flatMap(file => {
		const json = readPrintModelJson(file, modelVersion);
		if (!json) {
			return [];
		}
		return [{ path: relative(root, file).split(sep).join("/"), id: json.header.id, json }];
	});

	cache.set(cacheKey, models);
	return models;
}
