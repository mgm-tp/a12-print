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
	id("java-library")
	alias(thirdPartyLibs.plugins.lombok)
	id("frontend-tasks")
	id("jar-publish-tasks")
	id("npm-publish-tasks")
}

val manifest = readManifest("$projectDir/package.json")

publishingInfoExtension {
	artifactId = manifest.identifier
}

tasks.javadoc {
	exclude("**/build.gradle", "**/settings.gradle")
}

dependencies {
	implementation(project(":model-api"))

	implementation(a12Libs.baseModelApi)

	implementation(thirdPartyLibs.commonsIO)
	implementation(thirdPartyLibs.commonsLang3)
	implementation(thirdPartyLibs.slf4j)
	implementation(thirdPartyLibs.jacksonCore)
	implementation(thirdPartyLibs.jacksonDatabind)
	implementation(thirdPartyLibs.jacksonAnnotations)
	implementation(thirdPartyLibs.jacksonDatatypeJdk8)

	testImplementation(thirdPartyLibs.jupiterApi)
	testImplementation(thirdPartyLibs.assertj)

	testRuntimeOnly(thirdPartyLibs.jupiterEngine)
}

val pnpmTypedoc = tasks.register<PnpmTask>("pnpmTypedoc") {
	group = "model-api-utils"
	description = "Generates TypeDoc documentation for the TypeScript code."

	dependsOn(":model-api:frontendBuild", ":engine-runtime-kernel:frontendBuild")

	args.set(listOf("run", "typedoc"))

	inputs.files("tsconfig.build.json", "tsconfig.json", "../pnpm-lock.yaml")
	inputs.dir("src/main/typescript")
	inputs.files(fileTree("../print-dev-tools") {
		include("*")
		exclude("build", "node_modules")
	})
	outputs.dir("build/docs/typedoc")
	outputs.cacheIf { true }
}

tasks.frontendBuild {
	dependsOn(pnpmTypedoc)
	inputs.file("tsconfig.build.json")
	inputs.dir("src/main/typescript")
}

tasks.frontendTests {
	inputs.dir("src/main/typescript")
}
