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
plugins {
	id("antlr")
	id("java-library")
	alias(thirdPartyLibs.plugins.lombok)
	id("frontend-tasks")
	id("jar-publish-tasks")
	id("npm-publish-tasks")
}

val manifest = readManifest(file("$projectDir/package.json").path)
val config = manifest.manifest["config"] as Map<*, *>
val printGrammarGen = config["print_grammar_generation"] as Map<*, *>
val typescriptCodeDest = printGrammarGen["typescript_output_dir"].toString().replace(
	"src", projectDir.absolutePath + "/src"
)

publishingInfoExtension {
	artifactId = manifest.identifier
}

dependencies {
	antlr(thirdPartyLibs.antlr4)

	implementation(project(":engine-api"))
	implementation(project(":model-api"))

	implementation(a12Libs.kernelMdModelApi)
	implementation(a12Libs.kernelMdModel)
	implementation(a12Libs.kernelMdA12internal)
	implementation(a12Libs.kernelMdFacade)

	implementation(thirdPartyLibs.jacksonYaml)

	testImplementation(a12Libs.kernelMdSerializer)

	testImplementation(thirdPartyLibs.jupiterApi)
	testImplementation(thirdPartyLibs.jupiterParams)
	testImplementation(thirdPartyLibs.assertj)

	testRuntimeOnly(thirdPartyLibs.jupiterEngine)
}

tasks.generateGrammarSource {
	source = fileTree("src/main/antlr/PrintComputation.g4")
	arguments.addAll(listOf("-visitor", "-long-messages", "-package", "com.mgmtp.a12.print.engine.runtime.kernel.internal.antlr"))
	outputDirectory = file("${layout.buildDirectory.get().asFile.absolutePath}/generated-src/antlr/main/com/mgmtp/a12/print/engine/runtime/kernel/internal/antlr")
}

val generateTypeScriptGrammar = tasks.register<AntlrTask>("generateTypeScriptGrammar") {
	group = "engine-runtime-kernel"
	description = "Generates TypeScript parser and lexer from ANTLR grammar."

	source = fileTree("src/main/antlr/PrintComputationTS.g4")
	arguments.addAll(listOf("-visitor", "-long-messages", "-Dlanguage=TypeScript"))
	outputDirectory = file("${typescriptCodeDest}/antlr")

	doLast {
		val file = file("${typescriptCodeDest}/antlr/PrintComputationTSParser.ts")
		// Unused generated declaration which is not fixed by eslint:fix
		val oldString = "type int = number;"
		val newString = ""
		val content = file.readText()
		file.writeText("// @ts-nocheck\n" + content.replace(oldString, newString))
	}

	inputs.files("src/main/antlr/PrintComputationTS.g4")
	outputs.dir("${typescriptCodeDest}/antlr")
}

tasks.frontendBuild {
	dependsOn(generateTypeScriptGrammar, ":model-api:frontendBuild")

	inputs.files("tsconfig.build.json", ".prettierignore")
	inputs.dir("src/main/typescript")
}

tasks.frontendTests {
	inputs.dir("src/main/typescript")
}

tasks.generateGrammarSource { dependsOn(generateTypeScriptGrammar) }
tasks.delombok { dependsOn("generateGrammarSource") }
tasks.sourcesJar { dependsOn("generateGrammarSource") }
