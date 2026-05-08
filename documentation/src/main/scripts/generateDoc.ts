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
import path, { resolve } from "path";

import fs from "fs-extra";
import asciidoctor from "@asciidoctor/core";

const aDocInstance = asciidoctor();
const memoryLogger = aDocInstance.MemoryLogger.create();
aDocInstance.LoggerManager.setLogger(memoryLogger);

const projectDir = resolve(__dirname, "../../../");

export function generateDocumentation(asciidocDir: string) {
	const asciidocDirPath = path.join(projectDir, "src", "main", "asciidoc", asciidocDir);
	const outputDir = path.join(projectDir, "build", "docs", asciidocDir);
	const imagesPath = path.resolve(asciidocDirPath, "assets");

	aDocInstance.convertFile(path.resolve(asciidocDirPath, "index.adoc"), {
		to_dir: outputDir,
		mkdirs: true,
		safe: 0,
		attributes: {
			icons: "font",
			["source-highlighter"]: "highlightjs",
			toclevels: 5,
			["toc-title"]: "Table of Contents",
			docinfo: "shared",
			toc: "left",
			doctype: "article",
			["source-linenums-option"]: true,
			tabsize: 2,
			sectnums: true,
			sectanchors: true,
			sectlinks: true,
			experimental: true,
			sectids: true,
			encoding: "utf-8",
			lang: "en",
			fragment: true,
			xrefstyle: "short",
			standalone: true,
			author: "Print Engine Team",
		},
	});

	memoryLogger.getMessages().forEach(message => {
		console.log(message.getText());
	});

	if (memoryLogger.getMessages().some(message => message.getSeverity() === "ERROR")) {
		process.exit(1);
	}

	// copy images into the outputDir if there are any
	if (fs.existsSync(imagesPath)) {
		fs.copySync(imagesPath, path.resolve(outputDir, "assets"));
	}
}
