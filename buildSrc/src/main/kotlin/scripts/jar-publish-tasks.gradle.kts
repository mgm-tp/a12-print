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
import scripts.PublishingInfoExtension
import java.text.SimpleDateFormat
import java.util.*

plugins {
	`maven-publish`
	id("java-publish-tasks")
}

val timestamp: String? = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSZ").format(Date())
val manifestVersion: String = project.version as String? ?: throw GradleException("There is no version defined")
val groupProperty: String = project.group as String? ?: throw GradleException("There is no group defined")

tasks.named<Jar>("jar") {
	val extensionArtifactId = project.extensions.findByType<PublishingInfoExtension>()?.artifactId?.get()
		?: throw GradleException("There is no artifactId defined")

	archiveBaseName = extensionArtifactId
	group = groupProperty
	archiveVersion = manifestVersion
	manifest {
		attributes(
			mapOf(
				"Build-Timestamp" to timestamp,
				"Implementation-Title" to extensionArtifactId,
				"Implementation-Version" to manifestVersion
			)
		)
	}
}

tasks.withType<Jar>().configureEach {
    metaInf {
        from(rootDir) {
            include("LICENSE")
        	include("NOTICE")
        	include("THIRD_PARTY_NOTICES")
			include("licenses/**")
        }
    }
}

publishing {
	publications {
		create<MavenPublication>("jar") {
			from(components["java"])
			afterEvaluate {
				val extensionArtifactId = project.extensions.findByType<PublishingInfoExtension>()?.artifactId?.get()
					?: throw GradleException("There is no artifactId defined")

				groupId = groupProperty
				artifactId = extensionArtifactId
				version = manifestVersion
			}
			artifact("build/reports/sbom/cyclonedx.json") {
				classifier = "cyclonedx"
				builtBy(
					tasks.named("cyclonedxDirectBom")
				)
			}
		}
	}

}

tasks.publish {
	dependsOn("publishToMavenLocal")
}

