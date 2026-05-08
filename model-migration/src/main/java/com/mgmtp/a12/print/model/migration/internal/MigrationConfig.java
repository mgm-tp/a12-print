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
package com.mgmtp.a12.print.model.migration.internal;

import com.mgmtp.a12.print.model.migration.internal.utils.Utils;
import com.mgmtp.a12.print.model.migration.internal.versions.version_2_1_0.MigrationVersion_2_1_0;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class MigrationConfig {
	// WARNING: Don't change this version. It is the final java migration version
	public static final String HIGHEST_MIGRATION_VERSION = new MigrationVersion_2_1_0().getTargetVersion();

	public static Map<String, MigrationVersion> getMigrationVersions() {
		Map<String, MigrationVersion> migrationVersions = new HashMap<>();

		List<String> originVersions2_1_0 = List.of("2.0.x", "2.0.0", "2.0.1", "2.0.2", "2.0.3");

		originVersions2_1_0.forEach(version -> migrationVersions.put(version, new MigrationVersion_2_1_0()));

		// WARNING: Don't add a new step here, because the migration is implemented in typescript after the 2.1.0 version

		return migrationVersions;
	}

	public static boolean isVersionSupported(String version) {
		return Utils.compareVersions(version, HIGHEST_MIGRATION_VERSION) <= 0;
	}
}
