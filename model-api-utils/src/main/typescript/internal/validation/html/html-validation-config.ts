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
/**
 * Central configuration for HTML validation settings.
 *
 * This module serves as the single source of truth for all HTML validation configuration
 * used by both Java and TypeScript HTML validators.
 *
 * This module is the single source of truth. The Java equivalent is HtmlValidationConfig.java.
 */

/**
 * HTML tags allowed in Print Models.
 */
export const ALLOWED_HTML_TAGS = new Set(["span", "p", "u", "strong", "em", "br"]);

/**
 * Attributes allowed per HTML tag.
 * Used by HTMLCleanUpUtil (HtmlPolicyBuilder configuration).
 */
export const ALLOWED_ATTRIBUTES: Record<string, Set<string>> = {
	span: new Set(["style", "class", "entity-id", "entity-type"]),
	p: new Set(["style", "class"]),
};

/**
 * CSS properties allowed in style attributes.
 */
export const ALLOWED_STYLES = new Set([
	"white-space",
	"display",
	"font-family",
	"font-size",
	"line-height",
	"height",
	"vertical-align",
	"width",
	"border-color",
	"border-style",
	"border-width",
	"overflow",
	"min-height",
	"border",
	"font-weight",
	"font-style",
	"text-decoration",
	"text-align",
	"color",
	"background-color",
	"left",
	"margin",
	"content",
	"table-layout",
	"border-collapse",
	"border-spacing",
	"word-wrap",
	"position",
	"padding",
	"top",
]);

/**
 * CSS value patterns that are not allowed in style attributes.
 * Enforced via OWASP HtmlSanitizer (REJECT_ALL_ATTRIBUTE_POLICY) in HTMLCleanUpUtil.
 */
export const DISALLOWED_CSS_VALUE_PATTERNS = ["url("];

/**
 * Valid values for the text-align CSS property.
 */
export const VALID_TEXT_ALIGN_VALUES = new Set(["left", "right", "center", "justify"]);

/**
 * HTML void elements that never require a closing tag.
 */
export const VOID_ELEMENTS = new Set([
	"br",
	"hr",
	"img",
	"input",
	"area",
	"base",
	"col",
	"embed",
	"link",
	"meta",
	"param",
	"source",
	"track",
	"wbr",
]);

/**
 * HTML tags that are implicitly added by lenient parsers and should be ignored during validation.
 */
export const IGNORED_TAGS = new Set(["html", "head", "body"]);

// CSS property names
export const CSS_PROPERTY_COLOR = "color";
export const CSS_PROPERTY_BACKGROUND_COLOR = "background-color";
export const CSS_PROPERTY_TEXT_ALIGN = "text-align";

// HTML attribute names
export const HTML_ATTR_STYLE = "style";
