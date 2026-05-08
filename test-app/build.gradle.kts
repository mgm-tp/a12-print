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
import com.github.gradle.node.pnpm.task.PnpmTask

plugins {
	id("frontend-tasks")
	id("npm-sbom-tasks")
}


tasks.frontendBuild {
	dependsOn(
		":model-editor-component:frontendBuild",
		":model-api:frontendBuild",
		":print-setting:frontendBuild",
		":print-fonts:frontendBuild",
	)

	inputs.dir("src")
	inputs.dir("use-cases")
	inputs.file("playwright.config.ts")
	outputs.cacheIf { true }
}

val playwrightTests = tasks.register<PnpmTask>("playwrightTests") {
	group = "test-app"
	description = "Runs the frontend tests for the test-app."

	val testScript = if (project.findProperty("testReport") == "true") {
		"test:report"
	} else {
		"test"
	}

	val testArgs = mutableListOf(testScript)
	if (project.findProperty("ignoreSnapshots") == "true") {
		testArgs += "--ignore-snapshots"
	}
	args.set(testArgs)

	inputs.dir("./")
	outputs.cacheIf { true }
}

tasks.frontendTests {
	enabled = false
}
