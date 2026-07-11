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
import { $generateHtmlFromNodes } from "@lexical/html";
import { $getRoot, $isElementNode, type LexicalEditor, type LexicalNode } from "lexical";
import { nanoid } from "nanoid";

import type { PartialReference, Reference } from "@com.mgmtp.a12.print/print-model-api/model";

import { $isPrintEntityNode } from "../nodes/print-entity-node.js";

import { mergeAdjacentSpansWithSameFormatting } from "./html-sanitization.js";

function extractEntitiesFromEditor(existingEntities?: ReadonlyArray<PartialReference>): Array<Reference> {
	const entities: Array<Reference> = [];
	const root = $getRoot();
	const children = root.getChildren();

	for (const child of children) {
		extractEntitiesRecursive(child, entities, existingEntities);
	}

	return entities;
}

function extractEntitiesRecursive(
	node: LexicalNode,
	entities: Array<Reference>,
	existingEntities?: ReadonlyArray<PartialReference>
): void {
	if ($isPrintEntityNode(node)) {
		const refId = node.getEntityId();
		// Try to find existing entity with same refId to preserve its id
		const existingEntity = existingEntities?.find(e => e.refId === refId);
		const id = existingEntity?.id ?? nanoid();
		entities.push({ refId, id });
	}

	if ($isElementNode(node)) {
		const children = node.getChildren();
		for (const child of children) {
			extractEntitiesRecursive(child, entities, existingEntities);
		}
	}
}

export function sanitizeExportedHtml(html: string): string {
	const parser = new DOMParser();
	const doc = parser.parseFromString(html, "text/html");

	mergeAdjacentSpansWithSameFormatting(doc);

	return doc.body.innerHTML;
}

export function extractHtmlAndEntities(
	editor: LexicalEditor,
	existingEntities?: ReadonlyArray<PartialReference>
): {
	html: string;
	entities: Array<Reference>;
} {
	let result: {
		html: string;
		entities: Array<Reference>;
	} = { html: "", entities: [] };

	editor.getEditorState().read(() => {
		result = $extractHtmlAndEntities(editor, existingEntities);
	});

	return result;
}

export function $extractHtmlAndEntities(
	editor: LexicalEditor,
	existingEntities?: ReadonlyArray<PartialReference>
): {
	html: string;
	entities: Array<Reference>;
} {
	const rawHtml = $generateHtmlFromNodes(editor, null);
	const resultHtml = sanitizeExportedHtml(rawHtml);
	const resultEntities = extractEntitiesFromEditor(existingEntities);
	return { html: resultHtml, entities: resultEntities };
}
