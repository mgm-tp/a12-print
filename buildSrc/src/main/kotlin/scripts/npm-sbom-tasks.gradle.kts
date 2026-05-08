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

val generatePnpmLock = tasks.register<PnpmTask>("generatePnpmLock") {
	description = "Generates pnpm-lock.yaml for ${project.path}"
	workingDir.set(project.projectDir)

	args.set(
		listOf(
			"install",
			"--frozen-lockfile",
			"--lockfile-only",
			"--lockfile-dir=./",
			"--fix-lockfile",
			"--filter=./",
			"--no-link-workspace-packages",
			"--config.dedupe-peer-dependents=false"
		)
	)

    inputs.files("package.json", "../pnpm-lock.yaml")
	outputs.file("pnpm-lock.yaml")
}


val generatePnpmSbom = tasks.register<Exec>("generatePnpmSbom") {
	description = "Generates cyclonedx sbom file based on ${project.path}/pnpm-lock.yaml"
	dependsOn(generatePnpmLock)
	workingDir(project.projectDir)

	commandLine(
		"trivy", "fs", "pnpm-lock.yaml",
		"--format", "cyclonedx",
		"--output", "cyclonedx.json",
		"--include-dev-deps"
	)

	inputs.files("pnpm-lock.yaml")
	outputs.file("cyclonedx.json")

	doLast {
		println("SBOM generated for ${project.path}")
	}
}

tasks.named("clean") {
	delete("cyclonedx.json")
	delete("pnpm-lock.yaml")
}
