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

import type { ChildProcess } from "node:child_process";
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const BASE_URL = process.env.TEST_APP_URL ?? "http://localhost:9012";

export const TEST_APP_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

const STARTUP_TIMEOUT = 180_000;

export const isTestAppUp = async () => {
	try {
		const response = await fetch(BASE_URL, { signal: AbortSignal.timeout(60_000) });
		return response.ok && (await response.text()).includes("<script");
	} catch {
		return false;
	}
};

const killDevServer = ({ pid }: ChildProcess) => {
	if (pid === undefined) {
		return;
	}
	try {
		if (process.platform === "win32") {
			spawn("taskkill", ["/pid", String(pid), "/t", "/f"], { stdio: "ignore" });
		} else {
			process.kill(-pid, "SIGTERM");
		}
	} catch {
		/* Already gone - nothing left to stop. */
	}
};

export const withTestApp = async (): Promise<() => Promise<void>> => {
	if (await isTestAppUp()) {
		console.log(`Using the Test App that is already running at ${BASE_URL}`);
		return async () => {};
	}
	console.log(`Starting the Test App at ${BASE_URL} ...`);

	const packageManager = process.env.npm_execpath;
	const devServer = spawn(
		packageManager ? process.execPath : "pnpm",
		[...(packageManager ? [packageManager] : []), "run", "start"],
		{ cwd: TEST_APP_DIR, stdio: ["ignore", "pipe", "pipe"], detached: process.platform !== "win32" }
	);

	let output = "";
	const collect = (chunk: Buffer) => {
		output = `${output}${chunk}`.slice(-4000);
	};
	devServer.stdout?.on("data", collect);
	devServer.stderr?.on("data", collect);

	const failed = new Promise<never>((_, fail) => {
		devServer.once("error", fail);
		devServer.once("exit", code => fail(new Error(`The Test App dev server exited with code ${code}:\n${output}`)));
	});
	const ready = (async () => {
		const deadline = Date.now() + STARTUP_TIMEOUT;
		while (!(await isTestAppUp())) {
			if (Date.now() > deadline) {
				throw new Error(`The Test App did not come up at ${BASE_URL} within ${STARTUP_TIMEOUT} ms:\n${output}`);
			}
			await new Promise(done => setTimeout(done, 1000));
		}
	})();

	try {
		await Promise.race([ready, failed]);
	} catch (error) {
		killDevServer(devServer);
		throw error;
	}

	return async () => {
		devServer.removeAllListeners("exit");
		killDevServer(devServer);
		await new Promise(done => setTimeout(done, 1000));
	};
};
