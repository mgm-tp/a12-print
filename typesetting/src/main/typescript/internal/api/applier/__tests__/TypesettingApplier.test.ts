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
import fs from "node:fs";
import fsAsync from "node:fs/promises";
import { createInterface } from "node:readline";
import { EventEmitter } from "node:events";

import { StaticHyphenatorKey } from "../../../../a12internal/api/constant/static-hyphenator.js";
import { TypesettingModelMarshaller } from "../../../../a12internal/api/marshaller/model-marshaller.js";
import type { TypesettingApplier } from "../../../../a12internal/api/applier/TypesettingApplier.js";
import { BaseTypesettingApplier } from "../../../../a12internal/api/applier/TypesettingApplier.js";

describe("TypesettingApplier", () => {
	let applier_de: TypesettingApplier;
	let applier_en: TypesettingApplier;

	beforeAll(async () => {
		const content = await fsAsync.readFile("src/test/resources/models/custom-typesetting-model.json", "utf8");
		const model = new TypesettingModelMarshaller().deserialize(content);

		expect(model.result).toBeDefined();
		expect(model.report.noErrorOccurred).toBe(true);

		applier_de = new BaseTypesettingApplier(StaticHyphenatorKey.de_1996, model.result);
		applier_en = new BaseTypesettingApplier(StaticHyphenatorKey.en_US, model.result);
	});

	it("should apply to German words correctly", () => {
		expect(applier_de.applyToWord("Sache")).toBe("Sa-che");
		expect(applier_de.applyToWord("Silbentrennung")).toBe("Sil-ben-tren-nung");
		expect(applier_de.applyToWord("Umwelt")).toBe("Um-welt");
		expect(applier_de.applyToWord("Rechtschreibungsregel")).toBe("Recht-schrei-bungs-re-gel");
	});

	it("should apply to English words correctly", () => {
		expect(applier_en.applyToWord("associate")).toBe("as-so-ci-ate");
		expect(applier_en.applyToWord("obligatory")).toBe("ob-lig-a-to-ry");
		expect(applier_en.applyToWord("present")).toBe("present");
		expect(applier_en.applyToWord("philanthropic")).toBe("phil-an-throp-ic");

		expect(applier_en.applyToWord("emphasized")).toBe("e{start}m-pha-s{end}ized");
		expect(applier_en.applyToWord("following")).toBe("fol-l{start}{start}ow-ing{end}{end}");
	});

	it("should apply with custom exclusions", () => {
		expect(applier_en.applyToWord("tettttet")).toBe("tet-tttet");
	});

	it("should apply to English text correctly", () => {
		expect(applier_en.applyToText("Sentences, with symbols: don't. Two classes'. Second sentence.")).toBe(
			"Sen-tences, with sym-bols: don't. Two classes'. Sec-ond sen-tence."
		);
		expect(applier_en.applyToText("l'interview")).toBe("{start}l'i{end}n-ter-view");
	});

	it("should apply to English HTML correctly", () => {
		expect(
			applier_en.applyToHtml(
				"Sentence. <body><p>Sentences, with <b>symbols</b>: don't.</p><p>Two classes'. Second sentence.</p></body> Sentence."
			)
		).toBe(
			"Sen-tence. <body><p>Sen-tences, with <b>sym-bols</b>: don't.</p><p>Two classes'. Sec-ond sen-tence.</p></body> Sen-tence."
		);

		// Line Break Prevent not working
		expect("<span>s<em>y</em>mbols</span>").toBe("<span>s<em>y</em>mbols</span>");
	});

	it("should apply to English words correctly from Wordlist", async () => {
		const tsApplier = new BaseTypesettingApplier(StaticHyphenatorKey.en_US);
		const rl = createInterface({
			input: fs.createReadStream("src/test/resources/patterns/all-words-sorted-by-frequency.txt"),
			crlfDelay: Infinity,
		});

		let correctHyphenationCount = 0;
		let lineCount = 0;

		rl.on("line", line => {
			lineCount++;

			const inputWord = line.replaceAll(";", "");
			const correctHyphenation = line.replaceAll(";", "-");

			const actualHyphenation = tsApplier.applyToWord(inputWord);
			if (correctHyphenation === actualHyphenation) {
				correctHyphenationCount++;
			}
		});

		await EventEmitter.once(rl, "close");

		const hyphenationSuccessPercentage = (correctHyphenationCount / lineCount) * 100;
		expect(hyphenationSuccessPercentage).toBeGreaterThanOrEqual(55);
	});
});
