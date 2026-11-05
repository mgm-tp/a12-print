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

/*
 * Writes the screenshots used by the Print Modeling Documentation.
 *
 *   pnpm run screenshots [pattern ...] [--update-documentation]
 *
 * A pattern narrows the run to the groups whose name, or one of whose figure names, contains it.
 * `--update-documentation` is what `gradle :test-app:documentationScreenshots` runs.
 *
 * A script rather than a test, because the output is a build artifact and not an assertion, and a
 * `*.spec.ts` under `playwright.config.ts` would be picked up by `pnpm test` in CI.
 */
import { copyFile, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { chromium } from "@playwright/test";

import { DEVICE_SCALE_FACTOR, SCREENSHOT_DIR, shotFor, VIEWPORT } from "./capture.ts";
import { openUseCase, waitForInteractionSagasSettled } from "./editor-actions.ts";
import { boundingBox } from "./figures/bounding-box.ts";
import { commitChanges } from "./figures/commit-changes.ts";
import { editorTour } from "./figures/editor-tour.ts";
import { elementDetails } from "./figures/element-details.ts";
import type { Figure, FigureGroup } from "./figures/figure.ts";
import { fragmentModel, fragmentUsage } from "./figures/fragments.ts";
import { modelReferences } from "./figures/model-references.ts";
import { BASE_URL, TEST_APP_DIR, withTestApp } from "./test-app.ts";

const USE_CASES_DIR = resolve(TEST_APP_DIR, "use-cases");

const DOCUMENTATION_ASSETS_DIR = resolve(
	TEST_APP_DIR,
	"../documentation/src/main/asciidoc/print-modeling-documentation/assets"
);

const FIGURE_GROUPS: readonly FigureGroup[] = [
	editorTour,
	boundingBox,
	commitChanges,
	modelReferences,
	elementDetails,
	fragmentModel,
	fragmentUsage,
];

const USAGE = "usage: pnpm run screenshots [pattern ...] [--update-documentation]";

/**
 * What a write the Test App has already been asked for is given to arrive in. It persists a change
 * 500 ms after the last one, so a figure's last interaction is still on its way when its group ends.
 */
const WRITE_BACK_GRACE = 2000;

const listFiles = async (directory: string): Promise<string[]> => {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = await Promise.all(
		entries.map(entry => {
			const path = resolve(directory, entry.name);
			return entry.isDirectory() ? listFiles(path) : Promise.resolve([path]);
		})
	);
	return files.flat();
};

const snapshot = async (useCase: string) => {
	const files = await listFiles(resolve(USE_CASES_DIR, useCase));
	return new Map(await Promise.all(files.map(async file => [file, await readFile(file)] as const)));
};

const restore = async (useCase: string, files: ReadonlyMap<string, Buffer>) => {
	for (const [file, content] of files) {
		if (!(await readFile(file).catch(() => undefined))?.equals(content)) {
			await writeFile(file, content);
		}
	}
	const created = (await listFiles(resolve(USE_CASES_DIR, useCase))).filter(file => !files.has(file));
	await Promise.all(created.map(file => rm(file, { force: true })));
};

/** They are replayed when the use case is opened, so a group would inherit the ones before it. */
const clearInteractionLogs = async (useCase: string) => {
	const logs = (await listFiles(resolve(USE_CASES_DIR, useCase))).filter(file => file.endsWith(".wal"));
	await Promise.all(logs.map(file => rm(file, { force: true })));
};

const select = (patterns: readonly string[]) =>
	FIGURE_GROUPS.filter(
		group =>
			patterns.length === 0 ||
			patterns.some(pattern => group.name.includes(pattern) || group.figures.some(f => f.name.includes(pattern)))
	);

const checkedInFigure = ({ name, chapter }: Figure) => resolve(DOCUMENTATION_ASSETS_DIR, chapter, `${name}.png`);

const updateDocumentation = async (figures: readonly Figure[]) => {
	for (const figure of figures) {
		const target = checkedInFigure(figure);
		await mkdir(dirname(target), { recursive: true });
		await copyFile(resolve(SCREENSHOT_DIR, `${figure.name}.png`), target);
	}
	console.log(`${figures.length} figures copied into ${DOCUMENTATION_ASSETS_DIR}`);
};

const main = async () => {
	const args = process.argv.slice(2).filter(argument => argument !== "--");
	const unknown = args.filter(argument => argument.startsWith("--") && argument !== "--update-documentation");
	if (unknown.length) {
		throw new Error(`Unknown argument ${unknown[0]}.\n${USAGE}`);
	}
	const groups = select(args.filter(argument => !argument.startsWith("--")));
	if (!groups.length) {
		throw new Error(`No figure matches.\n${USAGE}`);
	}

	await rm(SCREENSHOT_DIR, { recursive: true, force: true });
	await mkdir(SCREENSHOT_DIR, { recursive: true });

	const useCases = [...new Set(groups.map(group => group.useCase))];
	const snapshots = new Map(await Promise.all(useCases.map(async u => [u, await snapshot(u)] as const)));

	const stopTestApp = await withTestApp();
	const browser = await chromium.launch({ headless: process.env.HEADED !== "true" });
	const written: Figure[] = [];
	const failures: string[] = [];

	try {
		for (const group of groups) {
			console.log(`\n${group.name} (${group.useCase})`);
			await clearInteractionLogs(group.useCase);
			const context = await browser.newContext({
				/* The E2E suite's use case opener navigates to the context's base URL. */
				baseURL: BASE_URL,
				viewport: VIEWPORT,
				deviceScaleFactor: DEVICE_SCALE_FACTOR,
			});
			const page = await context.newPage();
			try {
				await openUseCase({ page, useCase: group.useCase });
				await page.evaluate(() => document.fonts.ready.then(() => undefined));
				await group.prepare?.(page);
				for (const figure of group.figures) {
					process.stdout.write(`  ${figure.name} ... `);
					await figure.take(page, shotFor(page, figure.name));
					process.stdout.write("done\n");
					written.push(figure);
				}
			} catch (error) {
				/* The rest of the group is skipped; the other groups are independent and still run. */
				process.stdout.write("FAILED\n");
				await page.screenshot({ path: resolve(SCREENSHOT_DIR, `${group.name}-failed.png`) }).catch(() => {});
				failures.push(`${group.name}: ${error instanceof Error ? (error.stack ?? error.message) : error}`);
			} finally {
				await new Promise(done => setTimeout(done, WRITE_BACK_GRACE));
				await waitForInteractionSagasSettled(page).catch(() => {});
				await context.close();
				await restore(group.useCase, snapshots.get(group.useCase)!);
			}
		}

		console.log(`\n${written.length} figures written to ${SCREENSHOT_DIR}`);
		if (written.length && args.includes("--update-documentation")) {
			await updateDocumentation(written);
		}
		failures.forEach(failure => console.log(`\n${failure}`));
		return failures.length ? 1 : 0;
	} finally {
		await browser.close();
		await stopTestApp();
		/* After the Test App is gone: a write still in flight would land after the restore. */
		for (const [useCase, files] of snapshots) {
			await restore(useCase, files);
		}
	}
};

process.exitCode = await main();
