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
import com.fasterxml.jackson.core.type.TypeReference
import java.io.File
import java.util.regex.Pattern
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper

data class Manifest(
	val name: String,
	val identifier: String,
	val version: String,
	val manifest: Map<String, Any>,
	val matcher: java.util.regex.Matcher
)

fun readManifest(p: String): Manifest {
	val mapper = jacksonObjectMapper()
	val pkgManifest: Map<String, Any> = mapper.readValue(
		File(p),
		object : TypeReference<Map<String, Any>>() {}
	)

	val semverPattern = Pattern.compile("^(\\d+\\.\\d+\\.\\d+)(?:-([\\w-]+)(?:\\.(\\d+))?)?\$")
	val matcher = semverPattern.matcher(pkgManifest["version"] as String)

	var versionString = pkgManifest["version"] as String
	if (matcher.find()) {
		val versionLiteral = matcher.group(1)
		val buildLabel = matcher.group(2)
		val prereleaseNumber = matcher.group(3)
		versionString = when {
			prereleaseNumber != null -> "$versionLiteral-$buildLabel.${prereleaseNumber.toLong()}"
			buildLabel != null -> "$versionLiteral-$buildLabel"
			else -> versionString
		}
	}
	val name = pkgManifest["name"] as String
	val identifier = name.substring(name.indexOf("/") + 1)
	return Manifest(name, identifier, versionString, pkgManifest, matcher)
}
