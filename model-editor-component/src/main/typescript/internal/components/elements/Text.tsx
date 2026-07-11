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
import * as React from "react";
import type { DOMNode, HTMLReactParserOptions } from "html-react-parser";
import parse, { Text as TextNode, Element, domToReact } from "html-react-parser";
import sanitizeHtml from "sanitize-html";
import type { DefaultTheme } from "styled-components";
import { useTheme } from "styled-components";

import { Tooltip } from "@com.mgmtp.a12.widgets/widgets-core";
import { ElementType, PartialText } from "@com.mgmtp.a12.print/print-model-api/model";
import { InputValueSourceResolver } from "@com.mgmtp.a12.print/print-model-api/input-source";

import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";
import type { ILocalizer } from "../../api/index.js";
import { useTypesettingApplier } from "../../hooks/use-typesetting-applier.js";
import { TEXT_PROPERTIES_PATH } from "../../constant/element-property-path.js";

import { EntityColor } from "../richtext-editor/themes/editor-theme.js";

import type { BaseElementProps } from "./base.js";

export type TextProps = BaseElementProps;

export const Text = React.memo(
	function Text({ element, styles }: TextProps) {
		const localizer = PrintLocalizer.useLocalizer();
		const theme = useTheme();

		if (!PartialText.isInstance(element)) {
			throw Error(`Expected element of type Text but got ${element.type}`);
		}
		const applyTypesetting = useTypesettingApplier(
			InputValueSourceResolver.getSourceStringValue(
				element.textProperties?.textStyleId,
				element,
				TEXT_PROPERTIES_PATH.textStyleId
			)
		);

		const html = element.text?.text;

		const getPlaceholder = (entityType: string) => {
			const text = getEntityPlaceholderText(entityType, localizer);
			return applyTypesetting(text);
		};

		const displayText = html
			? getPreprocessedHTML(sanitizeHTML(applyTypesetting(html)), getPlaceholder, theme)
			: localizer(RESOURCE_KEYS.editor.element.Text);

		return (
			<div data-testid="element-text" style={styles}>
				{displayText}
			</div>
		);
	},
	(preProps, nextProps) => {
		return preProps.element === nextProps.element && preProps.styles === nextProps.styles;
	}
);

function getPreprocessedHTML(draftHTML: string, getPlaceholder: (entityType: string) => string, theme: DefaultTheme) {
	const options: HTMLReactParserOptions = {
		replace: node => {
			if (node instanceof Element) {
				const entityType = (node.attribs && node.attribs["entity-type"]) || "";
				if (
					"attribs" in node &&
					node.attribs &&
					node.attribs["entity-id"] &&
					(
						[
							ElementType.Field,
							ElementType.PageNumber,
							ElementType.PageNumberTotal,
							ElementType.Calculation,
						] as string[]
					).includes(entityType) &&
					"children" in node
				) {
					let style: React.CSSProperties = {};
					if (
						node.children &&
						node.children.length === 1 &&
						node.children[0].type === "tag" &&
						node.children[0].attribs &&
						node.children[0].attribs.style
					) {
						style = convertStylesStringToObject(node.children[0].attribs.style);
					}
					style = getColorByEntityType(style, entityType, theme);
					const entityText = domToReact((node.children as DOMNode[]) || [], options);

					findInnerSpanAndSetText(node.children as DOMNode[], getPlaceholder(entityType));

					return (
						<Tooltip
							variant={"hint"}
							style={{
								...style,
								fontSize: "unset",
								display: "inline",
								verticalAlign: "unset",
							}}
							text={entityText}
						>
							{/* This is entity placeholder content */}
							<span>{domToReact((node.children as DOMNode[]) || [], options)}</span>
						</Tooltip>
					);
				} else if ("name" in node && node.name === "p" && "children" in node) {
					return <p style={{ margin: 0 }}>{domToReact((node.children as DOMNode[]) || [], options)}</p>;
				}
			}
			return;
		},
	};
	/*// @ts-expect-error Fix ESM default import issue */
	return parse(draftHTML, options);
}

function getColorByEntityType(
	style: React.CSSProperties,
	entityType: string,
	theme: DefaultTheme
): React.CSSProperties {
	if (entityType === ElementType.Field) {
		return {
			...style,
			color: theme.colors.interaction.primaryInteractionColor,
		};
	}

	if (entityType === ElementType.Calculation) {
		return {
			...style,
			color: EntityColor.Calculation,
		};
	}

	return {
		...style,
		color: EntityColor.PageNumber,
	};
}

function getEntityPlaceholderText(entityType: string, localizer: ILocalizer): string {
	return entityType === ElementType.Field
		? localizer(RESOURCE_KEYS.editor.element.Field)
		: entityType === ElementType.Calculation
			? localizer(RESOURCE_KEYS.editor.element.Calculation)
			: entityType === ElementType.PageNumber
				? localizer(RESOURCE_KEYS.editor.page)
				: localizer(RESOURCE_KEYS.editor.pageTotal);
}

function convertStylesStringToObject(stringStyles: string): React.CSSProperties {
	return stringStyles.split(";").reduce((acc, style) => {
		const colonPosition = style.indexOf(":");

		if (colonPosition === -1) {
			return acc;
		}

		const camelCaseProperty = style
			.substr(0, colonPosition)
			.trim()
			.replace(/^-ms-/, "ms-")
			.replace(/-./g, c => c.substr(1).toUpperCase());
		const value = style.substr(colonPosition + 1).trim();

		return value ? { ...acc, [camelCaseProperty]: value } : acc;
	}, {});
}

function findInnerSpanAndSetText(children: DOMNode[], content: string) {
	for (const child of children) {
		if (child instanceof TextNode) {
			child.data = content;
		} else if (child instanceof Element && child.children && child.children.length > 0) {
			findInnerSpanAndSetText(child.children as DOMNode[], content);
		}
	}
}

function sanitizeHTML(html: string) {
	return sanitizeHtml(html, {
		allowedTags: ["span", "p", "u", "strong", "em", "br"],
		selfClosing: ["br"],
		allowedAttributes: {
			span: ["entity-id", "entity-type", "style"],
		},
		disallowedTagsMode: "discard",
		allowedSchemes: [],
		allowedSchemesByTag: {},
		allowedSchemesAppliedToAttributes: [],
		allowProtocolRelative: false,
		enforceHtmlBoundary: true,
	});
}
