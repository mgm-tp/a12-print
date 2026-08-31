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
import org.gradle.kotlin.dsl.register

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

// the kernel is generating gradle files, which should be ignored for javadoc
tasks.javadoc {
	exclude("**/build.gradle", "**/settings.gradle")
}

val config = manifest.manifest["config"] as Map<*, *>
val typesettingModelPreprocessing = config["typesetting_model_preprocessing"] as Map<*, *>

val typescriptCodeDest = replaceRelativeDirectories(typesettingModelPreprocessing["typescript_output_dir"].toString())
val typesettingStaticModels = replaceRelativeDirectories(typesettingModelPreprocessing["typesetting_static_models"].toString())
val outputDir = typesettingModelPreprocessing["build_output_dir"].toString()
val javaCodeDest = replaceRelativeDirectories(outputDir) + "/java"
val javascriptCodeDest = replaceRelativeDirectories(outputDir) + "/javascript"
val expandTypesettingModelDest = replaceRelativeDirectories(typesettingModelPreprocessing["typesetting_model_file"].toString())

val javascriptFile = "${javascriptCodeDest}/typesetting-model-validation.js"

val modelsPath = "src/main/resources/models"
val typesettingModelPath = "${modelsPath}/DomainTypesettingMetaModel.json"

val validationScriptFolder = "${typescriptCodeDest}/validation"

configurations {
	create("printModelValidationCodeGeneration")
}

val printModelValidationCodeGeneration = configurations.getByName("printModelValidationCodeGeneration")

dependencies {
	implementation(project(":model-api"))

	implementation(a12Libs.baseModelApi)
	implementation(a12Libs.kernelMdFacade)

	implementation(thirdPartyLibs.commonsIO)
	implementation(thirdPartyLibs.commonsLang3)
	implementation(thirdPartyLibs.slf4j)
	implementation(thirdPartyLibs.jacksonAnnotations)
	implementation(thirdPartyLibs.jacksonDatabind)
	implementation(thirdPartyLibs.jacksonYaml)

	printModelValidationCodeGeneration(a12Libs.kernelMdFacade)
	printModelValidationCodeGeneration(thirdPartyLibs.slf4jSimple)

	testImplementation(thirdPartyLibs.jupiterApi)

	testRuntimeOnly(thirdPartyLibs.jupiterEngine)
	testRuntimeOnly(thirdPartyLibs.junitLauncher)
}

sourceSets {
	main {
		java {
			srcDirs(listOf("src/main/java", javaCodeDest))
		}
		resources {
			srcDirs(listOf("src/main/resources", "src/main/typescript/generated/model"))
		}
	}
}

val generateJavaValidationCode = getValidationGeneratorTask(
	"TypesettingModel", "JAVA", expandTypesettingModelDest, javaCodeDest
).get()
val generateJavaScriptValidationCode = getValidationGeneratorTask(
	"TypesettingModel", "JAVASCRIPT", expandTypesettingModelDest, javascriptFile
).get()

val generateUsableModelJavaScriptValidation = getGenerateUsableJavaScriptValidationTask(
	"TypesettingModel", "typesetting-model", javascriptFile, validationScriptFolder
).get()

val expandTypesettingModel = getExpandTask(
	"TypesettingModel", modelsPath, typesettingModelPath, "DomainTypesettingMetaModel", expandTypesettingModelDest
).get()

expandTypesettingModel.finalizedBy(generateJavaValidationCode)
tasks.compileJava {
	dependsOn(expandTypesettingModel, generateJavaValidationCode)
}

val pnpmGenerate = tasks.register<PnpmTask>("pnpmGenerate") {
	group = "typesetting"
	description = "Starts the generation"

	dependsOn(expandTypesettingModel, ":model-api-utils:frontendBuild")

	args.set(listOf("run", "generate"))

	inputs.dir("src/main/typescript/internal/api/generator")
	inputs.dir(typesettingStaticModels)
	inputs.files(expandTypesettingModelDest, "../pnpm-lock.yaml", "../pnpm-workspace.yaml", "package.json")
	outputs.dir(typescriptCodeDest)
	outputs.cacheIf { true }
}
generateJavaValidationCode.dependsOn(pnpmGenerate)
generateJavaScriptValidationCode.dependsOn(pnpmGenerate)

tasks.frontendBuild {
	dependsOn(
		":model-api-utils:frontendBuild",
		generateUsableModelJavaScriptValidation,
		pnpmGenerate
	)

	inputs.files("tsconfig.build.json", ".prettierignore")
	inputs.dir("src/main/typescript")
}

tasks.frontendTests {
	inputs.dir("src")
}

expandTypesettingModel.finalizedBy(generateJavaScriptValidationCode)
generateJavaScriptValidationCode.finalizedBy(generateUsableModelJavaScriptValidation)

tasks.processResources {
	dependsOn(expandTypesettingModel)
}
tasks.sourcesJar {
	dependsOn(expandTypesettingModel, generateJavaValidationCode)
}
