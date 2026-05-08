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
	id ("node")
	id("npm-sbom-tasks")
}

val pnpmBuild = tasks.register<PnpmTask>("pnpmBuild") {
	group = "documentation"
	description = "Builds the documentation frontend"

	dependsOn("copySourceCode")

	args.set(listOf("run", "build"))

	inputs.file("../pnpm-lock.yaml")
	inputs.dir("src")
	outputs.dir("build")
	outputs.cacheIf { true }
}

tasks.named("assemble") {
	dependsOn(pnpmBuild)
}

val sourceCodeDir = "./src/main/asciidoc/print-technical-documentation/sourceCode/"

val pnpmTouchSourceCode = tasks.register<PnpmTask>("pnpmTouchSourceCode") {
	group = "documentation"
	description = "Creates source code directory if it does not exist"

	args.set(listOf("run", "touch-sourceCode"))
}

val copyEngineApi = tasks.register<Copy>("copyEngineApi") {
	group = "documentation"
	description = "Copies engine API source code files to the documentation module."

    from("../engine-api/src/main/java/com/mgmtp/a12/print/engine/api/.")
    into("${sourceCodeDir}/engine-api/")
}
val copyEngineRuntime = tasks.register<Copy>("copyEngineRuntime") {
	group = "documentation"
	description = "Copies engine runtime source code files to the documentation module."

    from("../engine-runtime/src/.")
    into("${sourceCodeDir}/engine-runtime/")
}
val copyEngineRuntimeTest = tasks.register<Copy>("copyEngineRuntimeTest") {
	group = "documentation"
	description = "Copies engine runtime test source code files to the documentation module."

    from("../engine-runtime-test/src/testFixtures/java/.")
    into("${sourceCodeDir}/engine-runtime-test/")
}
val copyPrintShell = tasks.register<Copy>("copyPrintShell") {
	group = "documentation"
	description = "Copies print shell source code files to the documentation module."

    from("../print-shell/src/main/java/com/mgmtp/a12/print/shell/internal/configuration/.")
    into("${sourceCodeDir}/print-shell/")
}
val copyEngineRuntimeXmlPdf = tasks.register<Copy>("copyEngineRuntimeXmlPdf") {
	group = "documentation"
	description = "Copies engine runtime XML PDF source code files to the documentation module."

    from("../engine-runtime-xml/src/main/java/com/mgmtp/a12/print/engine/runtime/xml/PdfWithXmlPrintEngine.java")
    into("${sourceCodeDir}/engine-runtime-xml/src/main/java/com/mgmtp/a12/print/engine/runtime/xml/")
}
val copyEngineRuntimeXmlXml = tasks.register<Copy>("copyEngineRuntimeXmlXml") {
	group = "documentation"
	description = "Copies engine runtime XML XML source code files to the documentation module."

    from("../engine-runtime-xml/src/main/java/com/mgmtp/a12/print/engine/runtime/xml/XmlPrintEngine.java")
    into("${sourceCodeDir}/engine-runtime-xml/src/main/java/com/mgmtp/a12/print/engine/runtime/xml/")
}

tasks.register("copySourceCode") {
	group = "documentation"
	description = "Copies all relevant source code files to the documentation module."

    dependsOn(
		pnpmTouchSourceCode,
        copyEngineApi,
        copyEngineRuntime,
        copyEngineRuntimeTest,
        copyPrintShell,
        copyEngineRuntimeXmlPdf,
        copyEngineRuntimeXmlXml
    )
}


val frontendClean = tasks.register<PnpmTask>("frontendClean") {
	args.set(listOf("run", "clean"))
}

tasks.named("clean") {
	dependsOn(frontendClean)
}
