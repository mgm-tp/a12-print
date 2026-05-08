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
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./src/test/typescript",

	snapshotPathTemplate: "{testDir}/{testFilePath}/../__snapshots__/{testName}{ext}",

	ignoreSnapshots: process.env.SKIP_SNAPSHOTS ? true : false,

	timeout: 100 * 1000,

	expect: {
		toHaveScreenshot: {
			maxDiffPixelRatio: process.env.CI ? 0 : 0.06,
			pathTemplate: "{testDir}/{testFilePath}/../__screenshots__/{arg}{ext}",
		},
		timeout: 30 * 1000, // 30sec
	},

	fullyParallel: true,

	forbidOnly: !!process.env.CI,

	retries: process.env.CI ? 2 : 0,

	workers: process.env.CI ? 1 : 4,

	reporter: [["html", { open: "never" }]],

	use: {
		baseURL: "http://localhost:9012/",
		trace: "on-first-retry",
	},

	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],

	globalSetup: "./src/test/typescript/utils/global-setup/index.ts",
	globalTeardown: "./src/test/typescript/utils/global-teardown/index.ts",

	webServer: {
		command: "npm run start:test",
		timeout: 120000,
		url: "http://localhost:9012/",
		reuseExistingServer: !process.env.CI,
	},
});
