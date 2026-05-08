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
const VirtualModulesPlugin = require("webpack-virtual-modules");
const Path = require("path");
const fs = require("fs");

module.exports = class VirtualResourcePlugin {
	constructor(options = {}) {
		this.options = options;
	}
	apply(compiler) {
		const virtualModules = new VirtualModulesPlugin();
		virtualModules.apply(compiler);

		compiler.hooks.beforeCompile.tapAsync("VirtualResourcePlugin", (params, callback) => {
			const scanDirectory = dir => {
				let results = [];
				const items = fs.readdirSync(dir, { withFileTypes: true });
				items.forEach(item => {
					const fullPath = Path.join(dir, item.name);
					if (item.isDirectory()) {
						results = results.concat(scanDirectory(fullPath));
					} else if (item.name === "case.config.json") {
						results.push(fullPath);
					}
				});
				return results;
			};

			try {
				const configFiles = scanDirectory(Path.resolve(__dirname), "use-cases");

				configFiles.forEach(configFile => {
					const dirname = Path.dirname(configFile);
					const basename = Path.basename(configFile);
					const virtualPath = Path.join(dirname, basename.replace(".json", ".resource.json"));

					virtualModules.writeModule(
						virtualPath,
						JSON.stringify({
							sourceConfig: configFile,
						})
					);
				});

				callback();
			} catch (error) {
				console.error("Error in VirtualResourcePlugin:", error);
				callback(error);
			}
		});
	}
};
