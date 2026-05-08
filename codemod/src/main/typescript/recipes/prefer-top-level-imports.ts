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
import {
	ImportMigrationConfiguration,
	migrateImports,
	PathMigrationConfiguration,
	Recipe,
} from "@com.mgmtp.a12.devtools/codemod";

import { modelApiImportMigrationConfig } from "./importMigrationConfigs/model-api.js";
import { modelApiUtilsImportMigrationConfig } from "./importMigrationConfigs/model-api-utils.js";
import { modelEditorComponentImportMigrationConfig } from "./importMigrationConfigs/model-editor-component.js";
import { modelMigrationImportMigrationConfig } from "./importMigrationConfigs/model-migration.js";
import { printFontsImportMigrationConfiguration } from "./importMigrationConfigs/print-fonts.js";

const migrationConfig: ImportMigrationConfiguration = {
	pathMigrations: [
		...(modelApiImportMigrationConfig.pathMigrations as PathMigrationConfiguration[]),
		...(modelApiUtilsImportMigrationConfig.pathMigrations as PathMigrationConfiguration[]),
		...(modelEditorComponentImportMigrationConfig.pathMigrations as PathMigrationConfiguration[]),
		...(modelMigrationImportMigrationConfig.pathMigrations as PathMigrationConfiguration[]),
		...(printFontsImportMigrationConfiguration.pathMigrations as PathMigrationConfiguration[]),
	],
};

export const preferTopLevelImports: Recipe = {
	metadata: {
		id: "prefer-top-level-imports",
		description: "Migrates imports from deep paths to top-level imports",
		supportedVersions: "^3.1.1",
	},

	execute(project): void {
		const sourceFiles = project.getSourceFiles();

		for (const sourceFile of sourceFiles) {
			console.log(`Processing file: ${sourceFile.getFilePath()}`);
			migrateImports(sourceFile, migrationConfig);
		}
	},
};
