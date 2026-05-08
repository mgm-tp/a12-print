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
	id("node")
}

val frontendBuild = tasks.register<PnpmTask>("frontendBuild") {
	args.set(listOf("run", "compile"))

	inputs.files(
		"../pnpm-lock.yaml",
		"package.json",
		"../pnpm-workspace.yaml",
		"tsconfig.json",
		".prettierrc.mjs",
		"eslint.config.mjs",
		".madgerc"
	)
	inputs.files(fileTree("../print-dev-tools") {
		include("*")
		exclude("build", "node_modules")
	})
	outputs.dir("lib")
	outputs.cacheIf { true }
}

tasks.named("assemble") {
	dependsOn(frontendBuild)
}

val frontendTests = tasks.register<PnpmTask>("frontendTests") {
	dependsOn(frontendBuild)
	val testScript = if (project.findProperty("testReport") == "true") {
		"test:report"
	} else {
		"test"
	}
	args.set(listOf(testScript))

	inputs.files("../pnpm-lock.yaml", "jest.config.js")
	inputs.files(fileTree("../print-dev-tools") {
		include("*")
		exclude("build", "node_modules")
	})
	outputs.file("build/test-results/jest/report.xml")
	outputs.cacheIf { true }
}

tasks.named("check") {
	dependsOn(frontendTests)
}

val frontendClean = tasks.register<PnpmTask>("frontendClean") {
	args.set(listOf("run", "clean"))
}

tasks.named("clean") {
	dependsOn(frontendClean)
}
