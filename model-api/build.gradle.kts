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
	id("antlr")
	id("java-library")
	alias(thirdPartyLibs.plugins.lombok)
	id("frontend-tasks")
	id("jar-publish-tasks")
	id("npm-publish-tasks")
}

tasks.javadoc {
	exclude("**/build.gradle", "**/settings.gradle")
}

val manifest = readManifest("$projectDir/package.json")

publishingInfoExtension {
	artifactId = manifest.identifier
}

val config = manifest.manifest["config"] as Map<*, *>
val printMetaModelPreprocessing = config["print_meta_model_preprocessing"] as Map<*, *>

val generatedTypingsOutputDir = layout.buildDirectory.dir("generatedTypings").get().asFile

val typescriptCodeDest = replaceRelativeDirectories(printMetaModelPreprocessing["typescript_output_dir"].toString())
val buildOutputDir = printMetaModelPreprocessing["build_output_dir"].toString()
val javaCodeDest = replaceRelativeDirectories(buildOutputDir) + "/java"
val javascriptCodeDest = replaceRelativeDirectories(buildOutputDir) + "/javascript"
val expandMetaModelDest = replaceRelativeDirectories(printMetaModelPreprocessing["print_model_file"].toString())
val expandElementDefinitionDest = replaceRelativeDirectories(printMetaModelPreprocessing["element_model_file"].toString())

val javascriptMetaModelFile = "${javascriptCodeDest}/print-meta-model-validation.js"
val javascriptElementFile = "${javascriptCodeDest}/print-element-validation.js"

val printModelsPath = "src/main/resources/models"
val metaModelPath = "${printModelsPath}/DomainPrintMetaModel.json"
val elementDefinitionPath = "${printModelsPath}/includes/DomainElementDefinition.json"

val generateMetaModelMapDestJava =
	replaceRelativeDirectories("/build/generated/printMetaModel/main/java/com/mgmtp/a12/print/model/map/PrintMetaModelMap.java")
val generateMetaModelMapDestTypescript =
	replaceRelativeDirectories("/src/main/typescript/generated/print-model-metadata-map.ts")

val validationScriptFolder = "$typescriptCodeDest/validation"

configurations {
	create("printModelValidationCodeGeneration")
	create("runTypedAccessorGeneratorConfig")
	create("generatedTypingsImplementation")
	create("documentModelMigration")
	create("metadataMapGeneration")
}

val generatedTypingsImplementation by configurations.getting
val runTypedAccessorGeneratorConfig by configurations.getting
val printModelValidationCodeGeneration by configurations.getting
val documentModelMigration by configurations.getting
val metadataMapGeneration by configurations.getting

dependencies {
	implementation(a12Libs.baseModelApi)
	implementation(a12Libs.kernelMdRuntimeApi)
	implementation(a12Libs.kernelMdModelApi)
	implementation(a12Libs.kernelMdDocumentApi)
	implementation(a12Libs.kernelMdFacade)
	implementation(a12Libs.kernelMdSerializer)
	implementation(a12Libs.kernelCoreRuntime)

	implementation(thirdPartyLibs.commonsIO)
	implementation(thirdPartyLibs.commonsLang3)
	implementation(thirdPartyLibs.slf4j)
	implementation(thirdPartyLibs.guava)
	implementation(thirdPartyLibs.jacksonAnnotations)

	antlr(thirdPartyLibs.antlr4)

	// TypedAccessorGenerator dependencies
	generatedTypingsImplementation(a12Libs.kernelMdDocument)
	runTypedAccessorGeneratorConfig("${a12Libs.kernelAccessor.get()}:TypedAccessorGenerator-CLI")

	printModelValidationCodeGeneration(a12Libs.kernelMdModel)
	printModelValidationCodeGeneration(a12Libs.kernelMdFacade)
	printModelValidationCodeGeneration(thirdPartyLibs.slf4jSimple)

	documentModelMigration(a12Libs.kernelToolMigration)

	metadataMapGeneration(project(":model-api-codegen"))
	annotationProcessor(project(":model-api-codegen"))

	testImplementation(thirdPartyLibs.jupiterApi)
	testImplementation(thirdPartyLibs.jupiterParams)
	testImplementation(thirdPartyLibs.assertj)
	testImplementation(thirdPartyLibs.mockitoCore)

	testRuntimeOnly(thirdPartyLibs.jupiterEngine)
}

tasks.generateGrammarSource {
	source = fileTree("src/main/antlr/DateTimeFormat.g4")
	arguments.addAll(listOf("-visitor", "-long-messages", "-package", "com.mgmtp.a12.print.engine.runtime.kernel.internal.antlr"))
	outputDirectory = file("${layout.buildDirectory.get().asFile.absolutePath}/generated-src/antlr/main/com/mgmtp/a12/print/engine/runtime/kernel/internal/antlr")
}

val generateTypeScriptGrammar = tasks.register<AntlrTask>("generateTypeScriptGrammar") {
	group = "model-api"
	description = "Generates TypeScript parser code for DateTimeFormat.g4 ANTLR grammar"

	val antlrPath = "src/main/typescript/generated/internal/antlr/datetimeformat"

	source = fileTree("src/main/antlr/DateTimeFormat.g4")
	arguments.addAll(listOf("-visitor", "-long-messages", "-Dlanguage=TypeScript"))
	outputDirectory = file(antlrPath)

	doLast {
		val parserFile = file("$antlrPath/DateTimeFormatParser.ts")
		val lexerFile = file("$antlrPath/DateTimeFormatLexer.ts")
		parserFile.writeText("// @ts-nocheck\n" + parserFile.readText()
			.replace("type int = number;", "")
		)
		lexerFile.writeText(lexerFile.readText().replace("RuleContext,", ""))
	}

	inputs.files("src/main/antlr/DateTimeFormat.g4", "gradle.lockfile")
	outputs.dir(antlrPath)
}

sourceSets {
	create("generatedTypings", Action {
		java.srcDir(generatedTypingsOutputDir)
	})
	main {
		java {
			srcDirs(listOf("src/main/java", javaCodeDest, generatedTypingsOutputDir))
			compileClasspath += sourceSets["generatedTypings"].output
			runtimeClasspath += sourceSets["generatedTypings"].output
		}
		resources {
			srcDirs(listOf("src/main/resources", "src/main/typescript/generated/internal/model"))
		}
	}
	test {
		compileClasspath += sourceSets["generatedTypings"].output
		runtimeClasspath += sourceSets["generatedTypings"].output
	}
}

val runTypedAccessorGenerator = tasks.register<JavaExec>("runTypedAccessorGenerator") {
	group = "model-api"
	description = "Generates typed accessors for the print meta model."

	dependsOn(expandPrintMetaModel)

	classpath = configurations["runTypedAccessorGeneratorConfig"]
	mainClass = "com.mgmtp.a12.kernel.md.document.typed_accessor_gen.TypedAccessorGenerator"

	val packagePrefix = "com.mgmtp.a12.print.model.api.domain.typings"

	args(
		"--document-model-file", expandMetaModelDest,
		"--package-prefix", packagePrefix,
		"--output-dir", generatedTypingsOutputDir
	)

	doLast {
		val files = fileTree(generatedTypingsOutputDir) {
			include("**/*.java")
		}
		files.forEach { file ->
			val text = file.readText()
			val replaced = text.replace("@Override", "@java.lang.Override")
			file.writeText(replaced)
		}
	}

	inputs.files(expandMetaModelDest, "gradle.lockfile")
	outputs.dir(generatedTypingsOutputDir)
}

tasks.withType<Javadoc> {
	classpath += sourceSets["generatedTypings"].output
}

val generateJavaValidationCode = getValidationGeneratorTask(
	"MetaModel", "JAVA", expandMetaModelDest, javaCodeDest
).get()
val generateJavaScriptValidationCode = getValidationGeneratorTask(
	"MetaModel", "JAVASCRIPT", expandMetaModelDest, javascriptMetaModelFile
).get()
val generateJavaScriptElementValidationCode = getValidationGeneratorTask(
	"ElementDefinition", "JAVASCRIPT", expandElementDefinitionDest, javascriptElementFile
).get()

val generateUsableModelJavaScriptValidation = getGenerateUsableJavaScriptValidationTask(
	"MetaModel", "meta-model", javascriptMetaModelFile, validationScriptFolder
)
val generateUsableElementJavaScriptValidation = getGenerateUsableJavaScriptValidationTask(
	"ElementDefinition", "element-definition", javascriptElementFile, validationScriptFolder
)
val expandPrintMetaModel = getExpandTask(
	"MetaModel", printModelsPath, metaModelPath, expandMetaModelDest
).get()
val expandElementDefinition = getExpandTask(
	"ElementDefinition", printModelsPath, elementDefinitionPath, expandElementDefinitionDest
).get()

expandPrintMetaModel.finalizedBy(generateJavaValidationCode)
tasks.compileJava {
	dependsOn(generatePrintModelMetadataMap, generateJavaValidationCode)
}

val pnpmGenerate = tasks.register<PnpmTask>("pnpmGenerate") {
	group = "model-api"
	description = "Generates TypeScript DTOs"

	dependsOn(expandPrintMetaModel)

	args.set(listOf("run", "generate"))

	inputs.dir("src/main/typescript/generator")
	inputs.files(expandMetaModelDest, "../pnpm-lock.yaml", "package.json", "../pnpm-workspace.yaml")
	outputs.dirs("$typescriptCodeDest/constant", "$typescriptCodeDest/dto")
	outputs.cacheIf { true }
}

val pnpmTypedoc = tasks.register<PnpmTask>("pnpmTypedoc") {
	group = "model-api"
	description = "Generates TypeScript documentation using TypeDoc"

	dependsOn(generatePrintModelMetadataMap)

	args.set(listOf("run", "typedoc"))

	inputs.files(
		fileTree("src/main/typescript") {
			exclude("**/internal/**/*", "**/__tests__/**/*", "**/node_modules/**/*")
		}
	)
	inputs.files("tsconfig.build.json", "tsconfig.json", "../pnpm-lock.yaml")
	inputs.files(fileTree("../print-dev-tools") {
		include("*")
		exclude("build", "node_modules")
	})
	outputs.dir("build/docs/typedoc")
	outputs.cacheIf { true }
}

tasks.frontendBuild {
	dependsOn(
		generateTypeScriptGrammar,
		generateUsableModelJavaScriptValidation,
		generateUsableElementJavaScriptValidation,
		expandElementDefinition,
		pnpmGenerate,
		pnpmTypedoc
	)

	inputs.files("tsconfig.build.json", ".prettierignore")
	inputs.dir("src/main/typescript")
}

tasks.frontendTests {
	inputs.dir("src")
}

tasks.generateGrammarSource {
	dependsOn(generateTypeScriptGrammar)
}

expandPrintMetaModel.finalizedBy(generateJavaScriptValidationCode)
expandElementDefinition.finalizedBy(generateJavaScriptElementValidationCode)
generateJavaScriptValidationCode.finalizedBy(generateUsableModelJavaScriptValidation)
generateJavaScriptElementValidationCode.finalizedBy(generateUsableElementJavaScriptValidation)

tasks.processResources {
	dependsOn(expandPrintMetaModel, expandElementDefinition)
}
tasks.sourcesJar {
	dependsOn(
		"generateGrammarSource",
		expandElementDefinition,
		runTypedAccessorGenerator,
		generatePrintModelMetadataMap,
		generateJavaValidationCode
	)
}

tasks.named("compileGeneratedTypingsJava") {
	dependsOn(runTypedAccessorGenerator)
}

val migrateDocumentModels = tasks.register<JavaExec>("migrateDocumentModels") {
	group = "model-api"
	description = "Migrates document models in '$printModelsPath' to the latest print meta model."

	classpath = configurations["documentModelMigration"]
	mainClass = "com.mgmtp.a12.kernel.tool.migration.MigratorCli"

	val documentModelFolder = file(printModelsPath)
	args(documentModelFolder.path)

	inputs.dir(documentModelFolder.path)
	inputs.file("gradle.lockfile")
	outputs.dir(documentModelFolder.path)
}

val generatePrintModelMetadataMap = tasks.register<JavaExec>("generatePrintModelMetadataMap") {
	group = "model-api"
	description = "Generates a print model metadata map for Java and TypeScript."

	dependsOn(":model-api-codegen:assemble", expandPrintMetaModel)
	classpath = configurations["metadataMapGeneration"]
	mainClass = "com.mgmtp.a12.print.model.codegen.internal.PrintModelMetadataMapGenerator"

	args(
		file(expandMetaModelDest).path,
		file(generateMetaModelMapDestJava).path,
		file(generateMetaModelMapDestTypescript).path
	)

	inputs.files(expandMetaModelDest, "gradle.lockfile")
	outputs.files(generateMetaModelMapDestJava, generateMetaModelMapDestTypescript)
}

expandPrintMetaModel.finalizedBy(generatePrintModelMetadataMap)
