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
import { createMigrationTool } from "@com.mgmtp.a12.migrationtool/migrationtool-core/web";
import { MigrationTool, MigrationResult } from "@com.mgmtp.a12.migrationtool/migrationtool-core/types";
import { PrintSettingModelMarshaller } from "@com.mgmtp.a12.print/print-setting/lib/internal/api/marshaller/print-setting-marshaller.js";

import { buildErrorFieldPaths } from "../utils/validation.js";

import { MIGRATION_PARAMETERS } from "./config.js";

const BasicMigrationTool = createMigrationTool(MIGRATION_PARAMETERS);
const printSettingModelMarshaller = new PrintSettingModelMarshaller();

export const PrintSettingMigrationTool: MigrationTool = {
	migrate: (models: object[]): MigrationResult[] => {
		const migratedModels: MigrationResult[] = BasicMigrationTool.migrate(models);

		return migratedModels.map(migrationResult => {
			if (migrationResult.status === "success") {
				const deserializedResult = printSettingModelMarshaller.deserialize(
					migrationResult.model as Record<string, unknown>,
					[]
				);

				if (!deserializedResult.result) {
					return {
						model: migrationResult.model,
						status: "error",
						errorMessage: `Cannot deserialize the Print Setting model. Details: ${buildErrorFieldPaths(deserializedResult.report.errorMap["@error"])}`,
					};
				}

				const serializedResult = printSettingModelMarshaller.serialize(deserializedResult.result, []);

				if (!serializedResult.result) {
					return {
						model: migrationResult.model,
						status: "error",
						errorMessage: `Cannot serialize the Print Setting model. Details: ${buildErrorFieldPaths(serializedResult.report.errorMap["@error"])}`,
					};
				}

				return {
					...migrationResult,
					model: serializedResult.result,
				};
			}
			return migrationResult;
		});
	},
};
