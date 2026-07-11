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

import com.mgmtp.a12.print.model.api.validation.IPrintModelIntegrityMessage;

import javax.swing.text.MutableAttributeSet;
import javax.swing.text.html.HTML;
import javax.swing.text.html.HTMLEditorKit;
import javax.swing.text.html.parser.ParserDelegator;
import java.io.IOException;
import java.io.StringReader;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Stateless HTML validator.
 */
public class HtmlValidator {

	// Matches opening and closing HTML tags. Captures: (1) optional "/", (2) tag name, (3) rest up to ">"
	// Possessive quantifiers (*+) prevent backtracking entirely — no ReDoS risk.
	// Limitation: stops at first ">" — attribute values containing ">" would confuse this pattern.
	// Acceptable for Print Model HTML where such values are not expected.
	private static final Pattern TAG_PATTERN =
		Pattern.compile("<(/?+)\\s*+([a-z][a-z0-9]*+)\\s*+([^>]*+)>", Pattern.CASE_INSENSITIVE);

	/**
	 * Validates the given HTML string and returns all detected issues.
	 * Returns an empty result for null or blank input.
	 */
	public HtmlValidationResult validate(String html) {
		if (html == null || html.isBlank()) {
			return new HtmlValidationResult(List.of());
		}

		var issues = new ArrayList<HtmlValidationIssue>();

		// Well-formedness check: regex-based stack approach, independent of lenient ParserDelegator
		if (!isWellFormed(html)) {
			issues.add(new HtmlValidationIssue(
				HtmlIssueType.MALFORMED,
				IPrintModelIntegrityMessage.SeverityType.ERROR,
				"HTML is malformed (unclosed or mismatched tags)."
			));
		}

		var callback = new ValidationParserCallback(issues);
		try (var reader = new StringReader(html)) {
			new ParserDelegator().parse(reader, callback, true);
		} catch (IOException e) {
			throw new IllegalStateException("Unexpected error while parsing HTML", e);
		}

		return new HtmlValidationResult(issues);
	}

	/**
	 * Checks tag balance using a simple regex-based stack.
	 * Void elements and self-closing tags are skipped.
	 */
	private static boolean isWellFormed(String html) {
		var stack = new ArrayDeque<String>();
		var matcher = TAG_PATTERN.matcher(html);
		while (matcher.find()) {
			String closingSlash = matcher.group(1).trim();
			String tagName = matcher.group(2).trim().toLowerCase();
			boolean isSelfClose = matcher.group(3).stripTrailing().endsWith("/");

			if (HtmlValidationConfig.VOID_ELEMENTS.contains(tagName) || isSelfClose) {
				continue;
			}

			if (closingSlash.isEmpty()) {
				stack.push(tagName);
			} else {
				if (stack.isEmpty() || !stack.peek().equals(tagName)) {
					return false;
				}
				stack.pop();
			}
		}
		return stack.isEmpty();
	}

	private static final class ValidationParserCallback extends HTMLEditorKit.ParserCallback {

		private final List<HtmlValidationIssue> issues;

		ValidationParserCallback(List<HtmlValidationIssue> issues) {
			this.issues = issues;
		}

		@Override
		public void handleStartTag(HTML.Tag tag, MutableAttributeSet attrs, int pos) {
			handleTag(tag, attrs);
		}

		@Override
		public void handleEndTag(HTML.Tag tag, int pos) {
			// No-op: tag balance is checked by isWellFormed(), not here.
		}

		@Override
		public void handleSimpleTag(HTML.Tag tag, MutableAttributeSet attrs, int pos) {
			handleTag(tag, attrs);
		}

		private void handleTag(HTML.Tag tag, MutableAttributeSet attrs) {
			if (HtmlValidationConfig.IGNORED_TAGS.contains(tag.toString())) {
				return;
			}
			String tagName = tag.toString();
			boolean isAllowedTag = HtmlValidationConfig.ALLOWED_HTML_TAGS.contains(tagName);
			if (!isAllowedTag) {
				addIssue(HtmlIssueType.UNUSED_TAG, IPrintModelIntegrityMessage.SeverityType.WARNING,
					"Unused tag: <" + tagName + ">");
			}
			checkAttributes(tagName, attrs, isAllowedTag);
		}

		private void checkAttributes(String tagName, MutableAttributeSet attrs, boolean isAllowedTag) {
			Set<String> allowedAttrs = HtmlValidationConfig.ALLOWED_ATTRIBUTES.getOrDefault(tagName, Set.of());
			var names = attrs.getAttributeNames();
			while (names.hasMoreElements()) {
				var name = names.nextElement();
				String attrName = name.toString();
				// Skip internal parser attributes (start with underscore, e.g. "_implied_")
				if (attrName.startsWith("_")) {
					continue;
				}
				Object value = attrs.getAttribute(name);
				String attrValue = value != null ? value.toString() : "";

				if (HtmlValidationConfig.HTML_ATTR_STYLE.equals(attrName) && isAllowedTag) {
					checkStyle(attrValue);
				} else if (isAllowedTag && !allowedAttrs.contains(attrName)) {
					addIssue(HtmlIssueType.UNUSED_ATTRIBUTE, IPrintModelIntegrityMessage.SeverityType.WARNING,
						"Unused attribute: " + attrName + " on <" + tagName + ">");
				}
			}
		}

		private void checkStyle(String styleValue) {
			for (String part : styleValue.split(";")) {
				String[] kv = part.split(":", 2);
				if (kv.length != 2) {
					continue;
				}
				String property = kv[0].trim();
				String value = kv[1].trim();
				if (property.isEmpty() || value.isEmpty()) {
					continue;
				}

				checkCssValuePattern(property, value);
				checkCssPropertyAllowed(property);
				checkCssPropertyValue(property, value);
			}
		}

		private void checkCssValuePattern(String property, String value) {
			String valueLower = value.toLowerCase();
			HtmlValidationConfig.DISALLOWED_CSS_VALUE_PATTERNS.stream()
				.filter(valueLower::contains)
				.findFirst()
				.ifPresent(matched -> addIssue(HtmlIssueType.UNUSED_CSS_VALUE,
					IPrintModelIntegrityMessage.SeverityType.WARNING,
					"Unused CSS value '" + matched + "' in property: " + property));
		}

		private void checkCssPropertyAllowed(String property) {
			if (!HtmlValidationConfig.ALLOWED_STYLES.contains(property)) {
				addIssue(HtmlIssueType.UNUSED_CSS_PROPERTY, IPrintModelIntegrityMessage.SeverityType.WARNING,
					"Unused CSS property: " + property);
			}
		}

		private void checkCssPropertyValue(String property, String value) {
			if (CssConstants.COLOR.equals(property) || CssConstants.BACKGROUND_COLOR.equals(property)) {
				if (!HexColorValidator.isValid(value)) {
					addIssue(HtmlIssueType.INVALID_CSS_PROPERTY, IPrintModelIntegrityMessage.SeverityType.ERROR,
						"Invalid color value: '" + value + "'. Only hex colors (#RGB or #RRGGBB) are supported.");
				}
			} else if (CssConstants.TEXT_ALIGN.equals(property) && !HtmlValidationConfig.VALID_TEXT_ALIGN_VALUES.contains(value)) {
				addIssue(HtmlIssueType.INVALID_CSS_PROPERTY, IPrintModelIntegrityMessage.SeverityType.ERROR,
					"Invalid text-align value: '" + value + "'. Allowed values: left, right, center, justify.");
			}
		}

		private void addIssue(HtmlIssueType type, IPrintModelIntegrityMessage.SeverityType severity, String message) {
			issues.add(new HtmlValidationIssue(type, severity, message));
		}
	}
}
