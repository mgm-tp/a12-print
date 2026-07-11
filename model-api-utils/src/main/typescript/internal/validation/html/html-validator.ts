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
import { Parser } from "htmlparser2";

import {
	ALLOWED_HTML_TAGS,
	ALLOWED_ATTRIBUTES,
	ALLOWED_STYLES,
	DISALLOWED_CSS_VALUE_PATTERNS,
	VALID_TEXT_ALIGN_VALUES,
	VOID_ELEMENTS,
	IGNORED_TAGS,
	CSS_PROPERTY_COLOR,
	CSS_PROPERTY_BACKGROUND_COLOR,
	CSS_PROPERTY_TEXT_ALIGN,
	HTML_ATTR_STYLE,
} from "./html-validation-config.js";
import { type HtmlValidationResult, type HtmlValidationIssue, HtmlIssueType } from "./html-validation-result.js";

// Matches opening and closing HTML tags. Captures: (1) optional "/", (2) tag name, (3) rest up to ">"
// Bounded quantifiers limit the amount of text matched and reduce ReDoS risk.
// Limitation: stops at first ">" — attribute values containing ">" would confuse this pattern.
// Acceptable for Print Model HTML where such values are not expected.
const TAG_PATTERN = /<(\/?)\s*([a-z][a-z0-9]{0,30})\s*([^>]{0,5000})>/gi;

/**
 * Validates the given HTML string and returns all detected issues.
 * Returns an empty result for empty or whitespace-only input.
 */
export function validateHtml(html: string | null | undefined): HtmlValidationResult {
	if (!html?.trim()) {
		return buildResult([]);
	}

	const issues: HtmlValidationIssue[] = [];

	// Well-formedness check: regex-based stack approach, independent of lenient htmlparser2
	if (!isWellFormed(html)) {
		issues.push({
			type: HtmlIssueType.MALFORMED,
			severity: "ERROR",
			message: "HTML is malformed (unclosed or mismatched tags).",
		});
	}

	// Tag, attribute, and CSS checks via htmlparser2
	runParserCallback(html, issues);

	return buildResult(issues);
}

/**
 * Checks tag balance using a simple regex-based stack.
 * Void elements and self-closing tags are skipped.
 */
function isWellFormed(html: string): boolean {
	const stack: string[] = [];
	for (const match of html.matchAll(TAG_PATTERN)) {
		const closingSlash = match[1].trim();
		const tagName = match[2].trim().toLowerCase();
		const isSelfClose = match[3].trimEnd().endsWith("/");

		if (VOID_ELEMENTS.has(tagName) || isSelfClose) {
			continue;
		}

		if (!closingSlash) {
			stack.push(tagName);
		} else {
			if (stack.length === 0 || stack.at(-1) !== tagName) {
				return false;
			}
			stack.pop();
		}
	}
	return stack.length === 0;
}

function runParserCallback(html: string, issues: HtmlValidationIssue[]): void {
	const parser = new Parser({
		onopentag(name: string, attrs: Record<string, string>) {
			handleTag(name, attrs, issues);
		},
	});
	parser.write(html);
	parser.end();
}

function handleTag(tagName: string, attrs: Record<string, string>, issues: HtmlValidationIssue[]): void {
	if (IGNORED_TAGS.has(tagName)) {
		return;
	}
	const isAllowedTag = ALLOWED_HTML_TAGS.has(tagName);
	if (!isAllowedTag) {
		issues.push({
			type: HtmlIssueType.UNUSED_TAG,
			severity: "WARNING",
			message: `Unused tag: <${tagName}>`,
		});
	}
	checkAttributes(tagName, attrs, isAllowedTag, issues);
}

function checkAttributes(
	tagName: string,
	attrs: Record<string, string>,
	isAllowedTag: boolean,
	issues: HtmlValidationIssue[]
): void {
	const allowedAttrs = ALLOWED_ATTRIBUTES[tagName] ?? new Set<string>();
	for (const [attrName, attrValue] of Object.entries(attrs)) {
		if (attrName === HTML_ATTR_STYLE && isAllowedTag) {
			checkStyle(attrValue, issues);
		} else if (isAllowedTag && !allowedAttrs.has(attrName)) {
			issues.push({
				type: HtmlIssueType.UNUSED_ATTRIBUTE,
				severity: "WARNING",
				message: `Unused attribute: ${attrName} on <${tagName}>`,
			});
		}
	}
}

function checkStyle(styleValue: string, issues: HtmlValidationIssue[]): void {
	for (const part of styleValue.split(";")) {
		const colonIdx = part.indexOf(":");
		if (colonIdx === -1) {
			continue;
		}
		const property = part.substring(0, colonIdx).trim();
		const value = part.substring(colonIdx + 1).trim();
		if (!property || !value) {
			continue;
		}

		checkCssValuePattern(property, value, issues);
		checkCssPropertyAllowed(property, issues);
		checkCssPropertyValue(property, value, issues);
	}
}

function checkCssValuePattern(property: string, value: string, issues: HtmlValidationIssue[]): void {
	const matchedPattern = DISALLOWED_CSS_VALUE_PATTERNS.find(pattern => value.toLowerCase().includes(pattern));
	if (matchedPattern !== undefined) {
		issues.push({
			type: HtmlIssueType.UNUSED_CSS_VALUE,
			severity: "WARNING",
			message: `Unused CSS value '${matchedPattern}' in property: ${property}`,
		});
	}
}

function checkCssPropertyAllowed(property: string, issues: HtmlValidationIssue[]): void {
	if (!ALLOWED_STYLES.has(property)) {
		issues.push({
			type: HtmlIssueType.UNUSED_CSS_PROPERTY,
			severity: "WARNING",
			message: `Unused CSS property: ${property}`,
		});
	}
}

function checkCssPropertyValue(property: string, value: string, issues: HtmlValidationIssue[]): void {
	if (property === CSS_PROPERTY_COLOR || property === CSS_PROPERTY_BACKGROUND_COLOR) {
		if (!isValidHexColor(value)) {
			issues.push({
				type: HtmlIssueType.INVALID_CSS_PROPERTY,
				severity: "ERROR",
				message: `Invalid color value: '${value}'. Only hex colors (#RGB or #RRGGBB) are supported.`,
			});
		}
	} else if (property === CSS_PROPERTY_TEXT_ALIGN && !VALID_TEXT_ALIGN_VALUES.has(value)) {
		issues.push({
			type: HtmlIssueType.INVALID_CSS_PROPERTY,
			severity: "ERROR",
			message: `Invalid text-align value: '${value}'. Allowed values: left, right, center, justify.`,
		});
	}
}

/**
 * Validates CSS hex color values.
 */
function isValidHexColor(value: string): boolean {
	if (!value.startsWith("#")) {
		return false;
	}
	if (value.length !== 4 && value.length !== 7) {
		return false;
	}
	return /^#[0-9A-Fa-f]+$/.test(value);
}

function buildResult(issues: HtmlValidationIssue[]): HtmlValidationResult {
	const errors = issues.filter(i => i.severity === "ERROR");
	const warnings = issues.filter(i => i.severity === "WARNING");
	return {
		issues,
		errors,
		warnings,
		hasErrors: errors.length > 0,
		hasWarnings: warnings.length > 0,
		hasIssueOfType: (type: HtmlIssueType) => issues.some(i => i.type === type),
	};
}
