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
	id("java-library")
	alias(thirdPartyLibs.plugins.lombok)
	id("jar-publish-tasks")
}

publishingInfoExtension {
	artifactId = "print-engine-runtime-xml"
}

configurations {
	create("schemagen")
}

val schemagen = configurations.getByName("schemagen")
dependencies {
	implementation(project(":engine-api"))
	implementation(project(":engine-runtime"))
	implementation(project(":model-document"))
	implementation(project(":model-api"))

	implementation(a12Libs.baseModelUtils)
	implementation(thirdPartyLibs.xmlBind)
	implementation(thirdPartyLibs.pdfbox)

	runtimeOnly(thirdPartyLibs.jaxb)

	testImplementation(testFixtures(project(":engine-runtime-test")))
	testImplementation(a12Libs.kernelMdFacade)

	testImplementation(thirdPartyLibs.commonsIO)
	testImplementation(thirdPartyLibs.commonsLang3)
	testImplementation(thirdPartyLibs.jupiterApi)
	testImplementation(thirdPartyLibs.assertj)

	testRuntimeOnly(thirdPartyLibs.jupiterEngine)
	testRuntimeOnly(thirdPartyLibs.junitLauncher)

	schemagen(thirdPartyLibs.jaxbJxc)
	schemagen(thirdPartyLibs.xmlBind)
}

tasks.register("generateXsdSchema") {
	group = "engine-runtime-xml"
	description = "Generates an XSD schema from the JAXB-annotated Java classes."

	val input = "src/main/java/com/mgmtp/a12/print/engine/runtime/xml/internal/model"
	val output = "src/main/resources"

	doLast {
		ant.withGroovyBuilder {
			"taskdef"(
				"name" to "schemagen",
				"classname" to "com.sun.tools.jxc.SchemaGenTask",
				"classpath" to schemagen.asPath
			)
			"schemagen"(
				"srcdir" to input,
				"destdir" to output,
				"includeAntRuntime" to false,
				"debug" to true,
				"verbose" to true
			) {
				"schema"("file" to "PrintDocument.xsd", "namespace" to "")
				"classpath" {
					"pathelement"("path" to schemagen.asPath)
				}
			}
		}
	}

	inputs.dir(input)
	inputs.file("gradle.lockfile")
	outputs.dir(output)
}

