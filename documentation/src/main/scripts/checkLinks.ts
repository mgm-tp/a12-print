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
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { glob } from "glob";
import fs from "fs-extra";

const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), "../../../");
const docsDir = join(projectDir, "build", "docs");

const htmlFiles = glob.sync(join(docsDir, "**", "*.html").replaceAll("\\", "/"), { posix: true });

if (!htmlFiles.length) {
	console.error("No generated documentation files found");
	process.exit(1);
}

let hasErrors = false;
for (const htmlFile of htmlFiles) {
	const content = fs.readFileSync(htmlFile, "utf-8");

	const anchorIds = new Set<string>();
	const idPattern = /\sid="([^"]+)"/g;
	let match: RegExpExecArray | null;
	while ((match = idPattern.exec(content)) !== null) {
		anchorIds.add(match[1]);
	}

	const hrefPattern = /href="#([^"]+)"/g;
	while ((match = hrefPattern.exec(content)) !== null) {
		const anchor = match[1];
		if (!anchorIds.has(anchor)) {
			console.error(`Broken internal link in ${htmlFile}: #${anchor}`);
			hasErrors = true;
		}
	}
}

if (hasErrors) {
	process.exit(1);
} else {
	console.log("All internal links are valid.");
}
