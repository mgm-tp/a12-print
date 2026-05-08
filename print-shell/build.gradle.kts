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
	alias(thirdPartyLibs.plugins.springDependencyManagement)
	alias(thirdPartyLibs.plugins.lombok)
	id("java")
	id("bootJar-publish-tasks")
}

publishingInfoExtension {
	artifactId = "print-shell"
}

configurations {
	testImplementation {
		exclude(group = "com.vaadin.external.google")
	}
}

dependencies {
	implementation(project(":model-api"))
	implementation(project(":model-api-utils"))
	implementation(project(":print-workspace"))
	implementation(project(":model-migration"))
	implementation(project(":engine-runtime"))
	implementation(project(":engine-api"))
	implementation(project(":typesetting"))

	implementation(a12Libs.kernelMdModelApi)
	implementation(a12Libs.kernelMdModel)
	implementation(a12Libs.kernelMdDocumentApi)

	implementation(thirdPartyLibs.springBootStarter);
	implementation(thirdPartyLibs.springShellStarter)

	implementation(thirdPartyLibs.jacksonCore) {
		version {
			strictly(thirdPartyLibs.versions.jackson.get())
		}
	}
	// This is needed because of versions conflict between spring-boot-starter and kernel
	implementation(thirdPartyLibs.commonsLang3)

	implementation(thirdPartyLibs.jmhCore)
	implementation(thirdPartyLibs.jmhGenreratorBytecode)
	implementation(thirdPartyLibs.pdfbox)
	implementation(thirdPartyLibs.imageComparison)
	implementation(thirdPartyLibs.commonsIO)

	annotationProcessor(thirdPartyLibs.jmhGeneratorAnnprocess)

	testImplementation(thirdPartyLibs.springBootStarterTest) {
		exclude(group = "com.vaadin.external.google", module = "android-json")
	}
	testImplementation(thirdPartyLibs.springShellTest)
	testImplementation(thirdPartyLibs.springShellTestAuto)
}


tasks.named("clean") {
	delete("spring-shell.log")
}
