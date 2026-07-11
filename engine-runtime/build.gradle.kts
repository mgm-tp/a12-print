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
import org.gradle.api.tasks.testing.logging.TestExceptionFormat

plugins {
	id("java-library")
	alias(thirdPartyLibs.plugins.lombok)
	id("jar-publish-tasks")
}

publishingInfoExtension {
	artifactId = "print-engine-runtime"
}

dependencies {
	annotationProcessor(project(":engine-runtime-codegen"))

	implementation(project(":engine-api"))
	implementation(project(":model-api"))
	implementation(project(":model-api-utils"))
	implementation(project(":model-document"))
	implementation(project(":engine-runtime-kernel"))
	implementation(project(":typesetting"))

	implementation(a12Libs.baseModelApi)
	implementation(a12Libs.kernelMdFacade)

	implementation(thirdPartyLibs.pdfbox)
	implementation(thirdPartyLibs.xmpbox)
	implementation(thirdPartyLibs.nashornCore)
	implementation(thirdPartyLibs.slf4j)
	implementation(thirdPartyLibs.commonsIO)
	implementation(thirdPartyLibs.commonsLang3)
	implementation(thirdPartyLibs.metadataExtractor)
	implementation(thirdPartyLibs.guava)
	implementation(thirdPartyLibs.collections4)
	implementation(thirdPartyLibs.jacksonCore)
	implementation(thirdPartyLibs.jacksonDatabind)
	implementation(thirdPartyLibs.jacksonAnnotations)
	implementation(thirdPartyLibs.jacksonYaml)
	implementation(thirdPartyLibs.jsoup)
	implementation(thirdPartyLibs.owaspJavaHtmlSanitizer)
	implementation(thirdPartyLibs.commonmark)
	implementation(thirdPartyLibs.xchart) {
	    exclude(group = "org.apache.pdfbox")
		exclude(group = "de.rototor.pdfbox")
	}

	compileOnly(a12Libs.baseModelUtils)

	testImplementation(testFixtures(project(":engine-runtime-test")))

	testImplementation(thirdPartyLibs.jupiterApi)
	testImplementation(thirdPartyLibs.assertj)
	testImplementation(thirdPartyLibs.jupiterParams)
	testImplementation(thirdPartyLibs.mockitoCore)

	testRuntimeOnly(thirdPartyLibs.logbackClassic)
	testRuntimeOnly(thirdPartyLibs.jupiterEngine)
	testRuntimeOnly(thirdPartyLibs.junitLauncher)
}

tasks.named<ProcessResources>("processResources") {
	from("../print-fonts/src/main/resources") {
		into("fonts")
	}
}

tasks.withType<Test>().configureEach {
	testLogging {
		exceptionFormat = TestExceptionFormat.FULL
		showStackTraces = true
	}
}


tasks.named("delombok") {
    dependsOn(tasks.named("compileJava"))

    (this as io.freefair.gradle.plugins.lombok.tasks.Delombok).input.from(
        file("build/generated/sources/annotationProcessor/java/main")
    )
}

tasks.named("clean") {
	delete("development.log")
}
