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
import org.cyclonedx.gradle.CyclonedxDirectTask
import org.cyclonedx.model.ExternalReference

plugins {
	java
	`maven-publish`
	id("node")
    alias(thirdPartyLibs.plugins.cyclonedxBom) apply false
}


allprojects {
	apply(plugin = "base")

	tasks.withType<Copy>().configureEach {
		duplicatesStrategy = DuplicatesStrategy.INCLUDE
	}
	tasks.withType<Jar>().configureEach {
		duplicatesStrategy = DuplicatesStrategy.INCLUDE
	}
}

val pnpmInstallFrozen = tasks.register<PnpmTask>("pnpmInstallFrozen") {
	group = "pnpm-install"
	description = "Runs pnpm install in all subprojects"

	onlyIf {
		(!project.hasProperty("skipDependencies") || project.findProperty("skipDependencies") != "true") &&
		(!gradle.taskGraph.hasTask(":setVersion") && !gradle.taskGraph.hasTask(":rollback"))
	}

	args.set(listOf("recursive", "install", "--frozen-lockfile", "--prefer-offline") )

	inputs.files("pnpm-lock.yaml", "pnpm-workspace.yaml", "package.json")
	outputs.file("node_modules/.modules.yaml")
	outputs.cacheIf { true }
}

tasks.matching {
	it.name in listOf("build", "check", "assemble", "test", "clean")
}.configureEach {
	dependsOn(pnpmInstallFrozen)
}

val manifest = readManifest("$projectDir/package.json")

version = manifest.version


subprojects {
	println("$projectDir")

	apply(plugin = "idea")


	configure<org.gradle.plugins.ide.idea.model.IdeaModel> {
		module {
			isDownloadJavadoc = true
			isDownloadSources = true
		}
	}

	if (file("$projectDir/build.gradle.kts").exists()) {
		if (
			file("$projectDir/src/main/java").exists() ||
			file("$projectDir/src/testFixtures/java").exists()
		) {
			apply(plugin = "java")

			apply(plugin = "org.cyclonedx.bom")


			tasks.named<CyclonedxDirectTask>("cyclonedxDirectBom") {
				xmlOutput.unsetConvention()
				externalReferences.set(listOf(
					ExternalReference().apply {
						url = "https://git.geta12.com"
						type = ExternalReference.Type.VCS
					}
				))
				includeBuildSystem.set(false)
				jsonOutput.set(layout.buildDirectory.file("reports/sbom/cyclonedx.json"))
			}

			java {
				withJavadocJar()
				withSourcesJar()

				sourceCompatibility = JavaVersion.VERSION_21
				targetCompatibility = JavaVersion.VERSION_21
			}

			tasks.test {
				useJUnitPlatform()
				maxParallelForks = (Runtime.getRuntime().availableProcessors() / 2).takeIf { it > 0 } ?: 1
				minHeapSize = "1G"
				maxHeapSize = "1G"
				jvmArgs = listOf("-XX:MaxMetaspaceSize=384m")
			}

			tasks.javadoc {
				exclude("**/internal/**")
			}

			tasks.withType<Javadoc> {
				(options as StandardJavadocDocletOptions).addBooleanOption("Xdoclint:-missing", true)
			}
		}

		dependencyLocking {
			lockAllConfigurations()
			// the lock mode is important to fail a build when there is a violation
			lockMode = LockMode.STRICT
			// you can ignore specific packages where you are in control of the version
			ignoredDependencies.addAll(listOf("com.mgmtp.a12.print:*"))
		}
	}
}
