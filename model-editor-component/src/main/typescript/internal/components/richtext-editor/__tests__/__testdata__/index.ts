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
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_TEXTS_FILE = path.resolve(__dirname, "./extracted-texts.txt");
const TEST_REPO_DATA: string[] = fs
	.readFileSync(TEST_TEXTS_FILE, "utf-8")
	.replace(/^\uFEFF/, "") // Remove BOM from start of file
	.split("\n")
	.filter(line => line.trim().length > 0)
	.map(line => line.replaceAll(String.raw`\n`, "\n"));

const TEST_EMPTY_BR_SPAN = "<p><br><span><em><br></em></span></p>";
const TEST_COLOR_BOLD_ITALIC = `<p><span style="">Hallo</span><span style="color: #ff8040"><em><strong>Welt</strong></em></span></p>`;
const TEST_COLOR_PLAIN = `<p><span style="color: #00ff00">Hallo</span><span style=""> Welt</span></p>`;
const TEST_COLOR_SPACE_BOLD = `<p><span style="color: #00ff00">Hallo</span><span style=""> </span><span style=""><strong>Welt</strong></span></p>`;
const TEST_MIXED_STYLES = `<p><span style="">Hallo</span><span style="color: #ff8040; background-color: #ffff00"><u><em><strong>Welt</strong></em></u></span></p>`;
const TEST_NBSP_PARAGRAPHS = `<p><span style="">Hallo&nbsp;</span></p> <p><span style="">Welt</span></p>`;
const TEST_EMPTY_PARAGRAPH = `<p><span style="">Hallo</span></p> <p><br></p> <p><span style="">Welt</span></p>`;
const TEST_STYLED_EMPTY_PARAGRAPH = `<p><span style="color: #ff8000"><strong>Hallo</strong></span></p> <p><br></p> <p><span style="color: #ff8000"><strong>Welt</strong></span></p>`;
const TEST_BARE_TEXT = "<p>Hallo Welt</p>";
const TEST_BR_IN_FORMATTING =
	'<p><span style=""><em><strong>Hallo<br>\n</strong></em></span><span style=""><br>\nWelt</span></p>';
const TEST_BR_IN_SPAN = "<p><span>Hallo<br>Welt</span></p>";
const TEST_ANCHOR_TAG = `<p><a href="#"><span style=""><strong>Hallo Welt</strong></span></a></p>`;
const TEST_CODE_WITH_ENTITY = `<p><span style=""><strong>Hallo</strong></span><span style=""><code><strong>: </strong></code></span><span entity-id="E1" entity-type="Calculation"><span style=""><code>Welt</code></span></span></p>`;
const TEST_MERGE_STYLES =
	'<p><span style="">Hel</span><span style="color: #00ff00; background-color: #0000ff;"><strong>lo </strong></span><span style="color: #00ff00; background-color: #0000ff"><strong>World</strong></span></p>';

export const TEST_CASES = [
	...TEST_REPO_DATA,
	TEST_COLOR_BOLD_ITALIC,
	TEST_COLOR_PLAIN,
	TEST_COLOR_SPACE_BOLD,
	TEST_MIXED_STYLES,
	TEST_EMPTY_PARAGRAPH,
	TEST_STYLED_EMPTY_PARAGRAPH,
	TEST_NBSP_PARAGRAPHS,
	TEST_BARE_TEXT,
	TEST_BR_IN_FORMATTING,
	TEST_BR_IN_SPAN,
	TEST_EMPTY_BR_SPAN,
	TEST_ANCHOR_TAG,
	TEST_CODE_WITH_ENTITY,
	TEST_MERGE_STYLES,
];
