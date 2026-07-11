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
import { validateHtml } from "../html-validator.js";
import { HtmlIssueType, type HtmlValidationIssue } from "../html-validation-result.js";

const { MALFORMED, INVALID_CSS_PROPERTY, UNUSED_TAG, UNUSED_ATTRIBUTE, UNUSED_CSS_PROPERTY, UNUSED_CSS_VALUE } =
	HtmlIssueType;

type Severity = "error" | "warning";

interface ExpectedIssue {
	type: HtmlIssueType;
	severity: Severity;
	fragment?: string;
}

interface TestCase {
	label: string;
	html: string | null;
	expected?: ExpectedIssue[];
	forbidden?: HtmlIssueType[];
}

function hasIssue(issues: HtmlValidationIssue[], type: HtmlIssueType, fragment: string): boolean {
	return issues.some(i => i.type === type && i.message.includes(fragment));
}

describe("validateHtml", () => {
	it.each<TestCase>([
		// --- Valid inputs: no issues expected ---
		{ label: "null input", html: null },
		{ label: "empty string", html: "" },
		{
			label: "valid HTML with allowed tags and styles",
			html: '<p style="color: #FF0000; text-align: center"><span>text</span></p>',
		},
		{ label: "nested allowed tags", html: "<p><strong><em>text</em></strong></p>" },
		{ label: "plain text without tags", html: "plain text without any tags" },
		{ label: "short hex color (#RGB)", html: '<p style="color: #F00"></p>' },
		{ label: "all allowed tags", html: "<p><span></span><u></u><strong></strong><em></em><br></p>" },
		{
			label: "all allowed attributes on span",
			html: '<span style="color: #FF0000" class="foo" entity-id="1" entity-type="bar">text</span>',
		},
		// --- ERRORs ---
		{
			label: "non-hex color name",
			html: '<p style="color: red"></p>',
			expected: [{ type: INVALID_CSS_PROPERTY, severity: "error", fragment: "Invalid color value: 'red'" }],
		},
		{
			label: "rgb() color function",
			html: '<p style="color: rgb(255,0,0)"></p>',
			expected: [
				{ type: INVALID_CSS_PROPERTY, severity: "error", fragment: "Invalid color value: 'rgb(255,0,0)'" },
			],
		},
		{
			label: "background-color with invalid hex chars",
			html: '<p style="background-color: #GGGGGG"></p>',
			expected: [{ type: INVALID_CSS_PROPERTY, severity: "error", fragment: "Invalid color value: '#GGGGGG'" }],
		},
		{
			label: "invalid text-align value",
			html: '<p style="text-align: start"></p>',
			expected: [
				{ type: INVALID_CSS_PROPERTY, severity: "error", fragment: "Invalid text-align value: 'start'" },
			],
		},
		{ label: "unclosed tag", html: "<p>text", expected: [{ type: MALFORMED, severity: "error" }] },
		{ label: "mismatched tags", html: "<p><span>text</p>", expected: [{ type: MALFORMED, severity: "error" }] },
		// --- WARNINGs ---
		{
			label: "disallowed tag",
			html: "<div>text</div>",
			expected: [{ type: UNUSED_TAG, severity: "warning", fragment: "Unused tag: <div>" }],
		},
		{
			label: "disallowed attribute on span",
			html: '<span id="x">text</span>',
			expected: [{ type: UNUSED_ATTRIBUTE, severity: "warning", fragment: "Unused attribute: id on <span>" }],
		},
		{
			label: "disallowed CSS property",
			html: '<span style="z-index: 1">text</span>',
			expected: [{ type: UNUSED_CSS_PROPERTY, severity: "warning", fragment: "Unused CSS property: z-index" }],
		},
		{
			label: "CSS url() in style",
			html: '<span style="background-color: url(http://example.com)">text</span>',
			expected: [
				{
					type: UNUSED_CSS_VALUE,
					severity: "warning",
					fragment: "Unused CSS value 'url(' in property: background-color",
				},
				{
					type: INVALID_CSS_PROPERTY,
					severity: "error",
					fragment: "Invalid color value: 'url(http://example.com)'",
				},
			],
			forbidden: [UNUSED_CSS_PROPERTY],
		},
		{
			label: "disallowed tag with style is not checked",
			html: '<div style="color: red">text</div>',
			expected: [{ type: UNUSED_TAG, severity: "warning", fragment: "Unused tag: <div>" }],
			forbidden: [INVALID_CSS_PROPERTY],
		},
		// --- Combined ERROR + WARNING ---
		{
			label: "disallowed tag + invalid color on allowed child",
			html: '<div><p style="color: red">text</p></div>',
			expected: [
				{ type: UNUSED_TAG, severity: "warning", fragment: "Unused tag: <div>" },
				{ type: INVALID_CSS_PROPERTY, severity: "error", fragment: "Invalid color value: 'red'" },
			],
		},
	])("$label", ({ html, expected = [], forbidden = [] }) => {
		const result = validateHtml(html);

		expect(result.hasErrors).toBe(expected.some(e => e.severity === "error"));
		expect(result.hasWarnings).toBe(expected.some(e => e.severity === "warning"));

		for (const { type, severity, fragment } of expected) {
			expect(result.hasIssueOfType(type)).toBe(true);
			if (fragment !== undefined) {
				const list = severity === "error" ? result.errors : result.warnings;
				expect(hasIssue(list, type, fragment)).toBe(true);
			}
		}

		for (const type of forbidden) {
			expect(result.hasIssueOfType(type)).toBe(false);
		}
	});
});
