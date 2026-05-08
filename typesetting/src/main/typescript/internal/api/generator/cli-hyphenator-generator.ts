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
import fs from "fs/promises";
import path from "path";

const inputFolder = process.env.npm_package_config_typesetting_model_preprocessing_typesetting_static_models;
const outputFolder = process.env.npm_package_config_typesetting_model_preprocessing_typescript_output_dir;

if (inputFolder && outputFolder) {
	(async () => {
		const files = await fs.readdir(inputFolder);

		for (const file of files) {
			const filePath = path.join(inputFolder, file);
			const basename = path.parse(file).name.replace("-", "_");
			const stat = await fs.stat(filePath);

			if (stat.isFile()) {
				const model = await fs.readFile(filePath, "utf8");

				const outputPath = path.join(outputFolder, basename + ".ts");
				let fileContent = `// Automatically generated from ${basename} on ${new Date().toLocaleString()}.\n`;
				fileContent = fileContent + `export const ${basename} = ${model}`;
				fs.writeFile(outputPath, fileContent);
			}
		}
	})();
} else {
	throw new Error(
		"Please specify both typesetting_model_preprocessing_typesetting_static_models and typesetting_model_preprocessing_typescript_output_dir in package.json/config."
	);
}
