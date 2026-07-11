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
package com.mgmtp.a12.print.model.api.validation.internal.html;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.util.List;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;

class HtmlValidatorTest {

	private final HtmlValidator validator = new HtmlValidator();

	private record ExpectedIssue(HtmlIssueType type, boolean isError, String messageFragment) {}

	@ParameterizedTest(name = "{0}")
	@MethodSource("cases")
	void htmlValidation(String label, String html, List<ExpectedIssue> expected, List<HtmlIssueType> forbidden) {
		var result = validator.validate(html);

		assertEquals(expected.stream().anyMatch(ExpectedIssue::isError), result.hasErrors(), "hasErrors mismatch for: " + label);
		assertEquals(expected.stream().anyMatch(e -> !e.isError()), result.hasWarnings(), "hasWarnings mismatch for: " + label);

		for (var issue : expected) {
			assertTrue(result.hasIssueOfType(issue.type()), "Expected hasIssueOfType(" + issue.type() + ") for: " + label);
			if (issue.messageFragment() != null) {
				var list = issue.isError() ? result.getErrors() : result.getWarnings();
				assertTrue(
					list.stream().anyMatch(i -> i.type() == issue.type() && i.message().contains(issue.messageFragment())),
					"Expected " + (issue.isError() ? "ERROR" : "WARNING") + " of type " + issue.type() + " containing '" + issue.messageFragment() + "' for: " + label
				);
			}
		}

		for (var type : forbidden) {
			assertFalse(result.hasIssueOfType(type), "Expected no issue of type " + type + " for: " + label);
		}
	}

	static Stream<Arguments> cases() {
		return Stream.of(
			// --- Valid inputs: no issues expected ---
			valid("null input", null),
			valid("empty string", ""),
			valid("valid HTML with allowed tags and styles", "<p style=\"color: #FF0000; text-align: center\"><span>text</span></p>"),
			valid("nested allowed tags", "<p><strong><em>text</em></strong></p>"),
			valid("plain text without tags", "plain text without any tags"),
			valid("short hex color (#RGB)", "<p style=\"color: #F00\"></p>"),
			valid("all allowed tags", "<p><span></span><u></u><strong></strong><em></em><br></p>"),
			valid("all allowed attributes on span", "<span style=\"color: #FF0000\" class=\"foo\" entity-id=\"1\" entity-type=\"bar\">text</span>"),
			// --- ERRORs ---
			issue("non-hex color name", "<p style=\"color: red\"></p>",
				error(HtmlIssueType.INVALID_CSS_PROPERTY, "Invalid color value: 'red'")),
			issue("rgb() color function", "<p style=\"color: rgb(255,0,0)\"></p>",
				error(HtmlIssueType.INVALID_CSS_PROPERTY, "Invalid color value: 'rgb(255,0,0)'")),
			issue("background-color with invalid hex chars", "<p style=\"background-color: #GGGGGG\"></p>",
				error(HtmlIssueType.INVALID_CSS_PROPERTY, "Invalid color value: '#GGGGGG'")),
			issue("invalid text-align value", "<p style=\"text-align: start\"></p>",
				error(HtmlIssueType.INVALID_CSS_PROPERTY, "Invalid text-align value: 'start'")),
			issue("unclosed tag", "<p>text",
				error(HtmlIssueType.MALFORMED, null)),
			issue("mismatched tags", "<p><span>text</p>",
				error(HtmlIssueType.MALFORMED, null)),
			// --- WARNINGs ---
			issue("disallowed tag", "<div>text</div>",
				warning(HtmlIssueType.UNUSED_TAG, "Unused tag: <div>")),
			issue("disallowed attribute on span", "<span id=\"x\">text</span>",
				warning(HtmlIssueType.UNUSED_ATTRIBUTE, "Unused attribute: id on <span>")),
			issue("disallowed CSS property", "<span style=\"z-index: 1\">text</span>",
				warning(HtmlIssueType.UNUSED_CSS_PROPERTY, "Unused CSS property: z-index")),
			Arguments.of("CSS url() in style", "<span style=\"background-color: url(http://example.com)\">text</span>",
				List.of(
					warning(HtmlIssueType.UNUSED_CSS_VALUE, "Unused CSS value 'url(' in property: background-color"),
					error(HtmlIssueType.INVALID_CSS_PROPERTY, "Invalid color value: 'url(http://example.com)'")),
				List.of(HtmlIssueType.UNUSED_CSS_PROPERTY)),
			Arguments.of("disallowed tag with style is not checked", "<div style=\"color: red\">text</div>",
				List.of(warning(HtmlIssueType.UNUSED_TAG, "Unused tag: <div>")),
				List.of(HtmlIssueType.INVALID_CSS_PROPERTY)),
			// --- Combined ERROR + WARNING ---
			Arguments.of("disallowed tag + invalid color on allowed child", "<div><p style=\"color: red\">text</p></div>",
				List.of(warning(HtmlIssueType.UNUSED_TAG, "Unused tag: <div>"), error(HtmlIssueType.INVALID_CSS_PROPERTY, "Invalid color value: 'red'")),
				List.of())
		);
	}

	private static Arguments valid(String label, String html) {
		return Arguments.of(label, html, List.of(), List.of());
	}

	private static Arguments issue(String label, String html, ExpectedIssue... expected) {
		return Arguments.of(label, html, List.of(expected), List.of());
	}

	private static ExpectedIssue error(HtmlIssueType type, String messageFragment) {
		return new ExpectedIssue(type, true, messageFragment);
	}

	private static ExpectedIssue warning(HtmlIssueType type, String messageFragment) {
		return new ExpectedIssue(type, false, messageFragment);
	}
}
