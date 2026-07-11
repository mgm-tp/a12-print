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
	id("frontend-tasks")
	id("npm-publish-tasks")
}

configurations {
	create("documentModelMigration")
}

val documentModelMigration by configurations.getting

dependencies {
	documentModelMigration(variantOf(a12Libs.kernelMdFacade) { classifier("migrator-cli") })
	documentModelMigration(thirdPartyLibs.slf4jNop)
}

val manifest = readManifest("$projectDir/package.json")

val documentModelPaths = listOf(
	"engine-runtime-kernel/src/test/resources",
	"model-api/src/main/resources/models",
	"model-api/src/test/resources/print-models",
	"model-api-utils/src/test/resources/document-models",
	"model-editor-component/src/test/typescript/models",
	"print-shell/src/test/resources/print",
	"print-shell/src/test/resources/printAll",
	"typesetting/src/main/resources/models",
	"typesetting/src/test/resources/models"
)
val documentModelFolderPaths = listOf(
	"engine-runtime-test/src/testFixtures/resources/data",
	"test-app/use-cases"
)

val allDocumentModelPaths = documentModelPaths + documentModelFolderPaths.flatMap { folderPath ->
	val folder = rootProject.file(folderPath)
	folder.listFiles()
		?.filter { it.isDirectory }
		?.map { "$folderPath/${it.name}" }
		?: emptyList()
}

val moduleMigrationTasks = allDocumentModelPaths.map { path ->
	getMigrateDocumentModelTask(path)
 }

tasks.register("migrateDocumentModels") {
	group = "model-migration"
	description = "Migrates all document models across all modules"
	dependsOn(moduleMigrationTasks)
}

tasks.frontendBuild {
	dependsOn(
		":model-api:frontendBuild",
		":model-api-utils:frontendBuild",
		":typesetting:frontendBuild"
	)

	inputs.file("tsconfig.build.json")
	inputs.dir("src/main/typescript")
}

tasks.frontendTests {
	inputs.dir("src/main/typescript")
}
