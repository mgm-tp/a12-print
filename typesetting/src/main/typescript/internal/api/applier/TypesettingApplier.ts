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
import { StaticHyphenatorKey, getStaticHyphenator } from "../constant/static-hyphenator.js";
import { TypesettingModel } from "../model/index.js";

import Hyphenator, {
	HyphenationResultCharEntry,
	HyphenationResultEntry,
	HyphenationResultHyphenEntry,
} from "./hyphenator/Hyphenator.js";
import { LineBreakPreventIndex } from "./line-break-preventer/LineBreakIndex.js";
import { LineBreakPreventer, PatternLineBreakPreventer } from "./line-break-preventer/LineBreakPreventer.js";

export interface TypesettingApplier {
	applyToWord(word: string): string;

	applyToText(text: string): string;

	applyToHtml(html: string): string;
}

export class BaseTypesettingApplier implements TypesettingApplier {
	private static DELIMITER: RegExp = /\b/;

	private readonly staticHyphenator: Hyphenator | undefined;
	private readonly typesettingModel: TypesettingModel | undefined;
	private readonly lineBreakPreventer: LineBreakPreventer | undefined;
	private readonly hyphenSymbol: string;
	private readonly preventLineBreakStartSymbol: string;
	private readonly preventLineBreakEndSymbol: string;

	constructor(
		staticHyphenatorKey?: StaticHyphenatorKey,
		typesettingModel?: TypesettingModel,
		hyphenSymbol?: string,
		preventLineBreakStartSymbol?: string,
		preventLineBreakEndSymbol?: string
	) {
		this.staticHyphenator = staticHyphenatorKey ? getStaticHyphenator(staticHyphenatorKey) : undefined;
		this.typesettingModel = typesettingModel;
		this.lineBreakPreventer = typesettingModel ? new PatternLineBreakPreventer(typesettingModel) : undefined;

		this.hyphenSymbol = hyphenSymbol || "-";
		this.preventLineBreakStartSymbol = preventLineBreakStartSymbol || "{start}";
		this.preventLineBreakEndSymbol = preventLineBreakEndSymbol || "{end}";
	}

	applyToWord(word: string): string {
		if (this.noRulesApplicable()) {
			return word;
		}

		const hyphenationResult = this.applyHyphenationToWord(word);
		const lineBreakPositions = this.lineBreakPreventer
			? this.lineBreakPreventer.findLineBreakPreventPositions(word)
			: {};
		return this.insertSymbols(hyphenationResult, lineBreakPositions);
	}

	applyToText(text: string): string {
		if (this.noRulesApplicable()) {
			return text;
		}

		const lineBreakPositions = this.lineBreakPreventer
			? this.lineBreakPreventer.findLineBreakPreventPositions(text)
			: {};
		const hyphenationResult = text
			.split(BaseTypesettingApplier.DELIMITER)
			.map(word => this.applyHyphenationToWord(word))
			.flat();

		return this.insertSymbols(hyphenationResult, lineBreakPositions);
	}

	applyToHtml(html: string): string {
		if (this.noRulesApplicable()) {
			return html;
		}

		const regex = /<[^>]+>/g;
		let output = "";
		let match;
		let lastTagEnd = 0;
		while ((match = regex.exec(html)) !== null) {
			const tagStart = match.index;
			const tagEnd = tagStart + match[0].length;

			if (tagStart !== lastTagEnd) {
				const content = html.substring(lastTagEnd, tagStart);
				const hyphenatedContent = this.applyToText(content);
				output += hyphenatedContent;
			}

			const tag = html.substring(tagStart, tagEnd);
			output += tag;

			lastTagEnd = tagEnd;
		}

		if (html.length > lastTagEnd) {
			const content = html.substring(lastTagEnd);
			const hyphenatedContent = this.applyToText(content);
			output += hyphenatedContent;
		}
		return output;
	}

	private noRulesApplicable(): boolean {
		return !this.staticHyphenator && !this.lineBreakPreventer;
	}

	private applyHyphenationToWord(word: string): HyphenationResultEntry[] {
		if (word.length === 0) {
			return [];
		}

		if (this.staticHyphenator) {
			return this.staticHyphenator.findHyphenPositions(
				word,
				this.typesettingModel?.content.customHyphenationExclusions
			);
		}

		return [...word].map(char => {
			return new HyphenationResultCharEntry(char);
		});
	}

	private insertSymbols(
		hyphenationResult: HyphenationResultEntry[],
		lineBreakPreventIndex: LineBreakPreventIndex
	): string {
		const builder: string[] = [];
		let originIndex = 0;

		for (let i = 0; i <= hyphenationResult.length; i++) {
			const hyphenationEntry = i === hyphenationResult.length ? undefined : hyphenationResult[i];
			const lineBreakEntry =
				i === 0 || hyphenationResult[i - 1] instanceof HyphenationResultCharEntry
					? lineBreakPreventIndex[originIndex]
					: undefined;

			if (lineBreakEntry?.end) {
				builder.push(...Array(lineBreakEntry.end).fill(this.preventLineBreakEndSymbol));
			}
			if (hyphenationEntry && hyphenationEntry instanceof HyphenationResultHyphenEntry) {
				builder.push(this.hyphenSymbol);
			}
			if (lineBreakEntry?.start) {
				builder.push(...Array(lineBreakEntry.start).fill(this.preventLineBreakStartSymbol));
			}
			if (hyphenationEntry && hyphenationEntry instanceof HyphenationResultCharEntry) {
				builder.push(hyphenationEntry.getCharValue());
				originIndex++;
			}
		}

		return builder.join("");
	}
}
