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
import DraftJs from "draft-js";
import type * as React from "react";
import { stateToHTML, Options as HTMLExportOptions } from "draft-js-export-html";
import type { InlineCreators, Options } from "draft-js-import-html";
import { nanoid } from "nanoid";
import uniq from "lodash/uniq.js";

import {
	PartialAnyPrintModelElement,
	PartialCalculation,
	PartialField,
	PartialPageNumber,
	PartialPageNumberTotal,
	PrintModelEntity,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { ElementType, Reference } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { DeepPartialRecursive } from "@com.mgmtp.a12.print/print-model-api/lib/utils/type-utils.js";

import { STYLE_SEPARATOR } from "../bundled-deps/draft-js-import-element.js";
import { DecoratorTypes } from "../components/richtext-editor/type.js";

import { rgb2hex } from "./utils.js";

export const TEXT_COLOR = "TEXT_COLOR";
export const BACKGROUND_COLOR = "BACKGROUND_COLOR";
export const TEXT_COLOR_PREFIX = "TEXT_COLOR_VALUE";
export const BACKGROUND_COLOR_PREFIX = "BACKGROUND_COLOR_VALUE";
export const FONT_SIZE_PREFIX = "FONT_SIZE_VALUE";

export const PAGE_NUMBER_TEXT = "PageNumber";
export const PAGE_NUMBER_TOTAL_TEXT = "PageNumberTotal";

export const DEFAULT_FIELD_TEXT = "field-entity";
export const DEFAULT_CALC_TEXT = "calc-entity";

export interface Entity {
	entityKey: string;
	blockKey: string;
	entity: DraftJs.EntityInstance;
	data: Record<string, unknown>;
	start: number;
	end: number;
}

export function getEntities(editorState: DraftJs.EditorState): Entity[] {
	const content = editorState.getCurrentContent();
	const entities: Entity[] = [];
	content.getBlocksAsArray().forEach(block => {
		let currentEntity: Entity;
		block.findEntityRanges(
			character => {
				if (character.getEntity()) {
					const entity = content.getEntity(character.getEntity());
					if (entity.getType() !== undefined) {
						currentEntity = {
							entityKey: character.getEntity(),
							entity: content.getEntity(character.getEntity()),
							blockKey: block.getKey(),
							data: entity.getData(),
							start: 0,
							end: 0,
						};
						return true;
					}
				}
				return false;
			},
			// Only executed if the result above is true
			(start, end) => {
				entities.push({ ...currentEntity, start, end });
			}
		);
	});
	return entities;
}

export function getEntityAt(editorState: DraftJs.EditorState, startOffset: number): Entity | undefined {
	const selectionState = editorState.getSelection();
	const contentState = editorState.getCurrentContent();
	const block = contentState.getBlockForKey(selectionState.getStartKey());
	const entityKey = block.getEntityAt(startOffset);

	if (!entityKey) {
		return;
	}
	const entities = getEntities(editorState);
	return entities.find(e => e.entityKey === entityKey);
}

export function findEntityRangesByType(entityType: DecoratorTypes) {
	return (
		contentBlock: DraftJs.ContentBlock,
		callback: (start: number, end: number) => void,
		contentState: DraftJs.ContentState
	) => {
		contentBlock.findEntityRanges(character => {
			const entityKey = character.getEntity();
			if (entityKey === null) {
				return false;
			}
			return contentState.getEntity(entityKey).getType() === entityType;
		}, callback);
	};
}

export function getStartEntitySelection(editorState: DraftJs.EditorState, selectionState: DraftJs.SelectionState) {
	const contentState = editorState.getCurrentContent();
	const start = selectionState.getStartOffset();
	const startKey = selectionState.getStartKey();
	const startBlock = contentState.getBlockForKey(startKey);
	const startBlockChars = startBlock.getCharacterList().toArray();
	const startChar = startBlockChars[start];
	const startEntityKey = startChar?.getEntity() || null;
	if (startEntityKey !== null) {
		let i;
		for (i = start; i >= 0; i--) {
			const curChar = startBlockChars[i];
			if (curChar.getEntity() !== startEntityKey) {
				break;
			}
		}
		const rangeStart = i + 1;
		if (rangeStart < start) {
			const isBackwards = selectionState.getIsBackward();
			const startLabel = isBackwards ? "focusOffset" : "anchorOffset";
			const newSelection = selectionState.merge({
				[startLabel]: rangeStart,
			});
			return { newSelection, isChange: true };
		}
	}
	return { newSelection: selectionState, isChange: false };
}

export function getEndEntitySelection(editorState: DraftJs.EditorState, selectionState: DraftJs.SelectionState) {
	const contentState = editorState.getCurrentContent();
	const endOffset = selectionState.getEndOffset();
	const end = endOffset > 0 ? endOffset - 1 : endOffset;
	const endKey = selectionState.getEndKey();
	const endBlock = contentState.getBlockForKey(endKey);
	const endBlockChars = endBlock.getCharacterList().toArray();
	const endChar = endBlockChars[end];
	const endEntityKey = endChar?.getEntity() || null;
	if (endEntityKey !== null) {
		let i;
		for (i = end; i < endBlockChars.length; i++) {
			const curChar = endBlockChars[i];
			if (curChar.getEntity() !== endEntityKey) {
				break;
			}
		}
		const rangeEnd = i - 1;
		if (rangeEnd > end) {
			const isBackwards = selectionState.getIsBackward();
			const endLabel = isBackwards ? "anchorOffset" : "focusOffset";
			const newSelection = selectionState.merge({
				[endLabel]: rangeEnd + 1,
			});
			return { newSelection, isChange: true };
		}
	}
	return { newSelection: selectionState, isChange: false };
}

export function removeInlineStylesForSelection(editorState: DraftJs.EditorState, prefix: string) {
	const selectionState = editorState.getSelection();
	const styles = new Set<string>();
	if (selectionState.isCollapsed()) {
		editorState.getCurrentInlineStyle().forEach(style => style?.startsWith(prefix) && styles.add(style));
	} else {
		const contentState = editorState.getCurrentContent();
		let key = selectionState.getStartKey();
		const endKey = selectionState.getEndKey();

		const startBlock = contentState.getBlockForKey(key);
		const blockList: DraftJs.ContentBlock[] = [startBlock];
		while (key !== endKey) {
			key = contentState.getKeyAfter(key);
			if (key) {
				blockList.push(contentState.getBlockForKey(key));
			}
		}
		let startOffset = selectionState.getStartOffset();
		const endOffset = selectionState.getEndOffset();
		blockList.forEach(block => {
			key = block.getKey();
			const blockEndIndex = key === endKey ? endOffset : block.getLength();
			const blockChars = block.getCharacterList();
			for (let i = startOffset; i < blockEndIndex; i++) {
				const draftInlineStyle = blockChars.get(i).getStyle();
				draftInlineStyle.forEach(style => {
					style?.startsWith(prefix) && styles.add(style);
				});
			}
			startOffset = 0;
		});
	}
	return [...styles].reduce((editorState, style) => {
		return DraftJs.RichUtils.toggleInlineStyle(editorState, style);
	}, editorState);
}

export function getReactStylesFromDraftInlineStyles(
	style: DraftJs.DraftInlineStyle,
	currentFontSize?: number
): React.CSSProperties {
	let outputStyles: React.CSSProperties = {
		...getColorReactStyles(style, TEXT_COLOR, TEXT_COLOR_PREFIX, "color"),
		...getColorReactStyles(style, BACKGROUND_COLOR, BACKGROUND_COLOR_PREFIX, "backgroundColor"),
	};
	const fontSize = style.filter(value => value?.startsWith(FONT_SIZE_PREFIX) || false).first();
	if (fontSize) {
		outputStyles = {
			...outputStyles,
			fontSize: fontSize.replace(`${FONT_SIZE_PREFIX}_`, "") + "pt",
		};
	} else if (currentFontSize) {
		outputStyles = {
			...outputStyles,
			fontSize: `${currentFontSize}pt`,
		};
	}

	return outputStyles;
}

function getColorReactStyles(style: DraftJs.DraftInlineStyle, activePrefix: string, valuePrefix: string, key: string) {
	const value = style.filter(value => value?.startsWith(valuePrefix) || false).first();
	const isActive = style.has(activePrefix);
	return isActive && value ? { [key]: value.replace(`${valuePrefix}_`, "") } : {};
}

export function createImportOptions(entityElements: PartialAnyPrintModelElement[]): Options {
	return {
		customInlineFn: (element: Element, inlineCreators: InlineCreators) => {
			const htmlElement = element as HTMLElement;
			const style = createImportStyle(htmlElement, inlineCreators);
			if (style) {
				return style;
			}
			return createImportEntity(htmlElement, inlineCreators, entityElements);
		},
	};
}

function createImportStyle(htmlElement: HTMLElement, inlineCreators: InlineCreators) {
	const styles = htmlElement.style;
	const appliedStyles: string[] = [];
	if (styles.color) {
		const color = rgb2hex(styles.color);
		appliedStyles.push(`${TEXT_COLOR_PREFIX}_${color}`);
		appliedStyles.push(TEXT_COLOR);
	}
	if (styles.backgroundColor) {
		const color = rgb2hex(styles.backgroundColor);
		appliedStyles.push(`${BACKGROUND_COLOR_PREFIX}_${color}`);
		appliedStyles.push(BACKGROUND_COLOR);
	}
	if (styles.fontSize) {
		const fontSize = styles.fontSize.replace("pt", "");
		appliedStyles.push(`${FONT_SIZE_PREFIX}_${fontSize}`);
	}
	return appliedStyles.length > 0 ? inlineCreators.Style(appliedStyles.join(STYLE_SEPARATOR)) : undefined;
}

function createImportEntity(
	htmlElement: HTMLElement,
	inlineCreators: InlineCreators,
	entityElements: PartialAnyPrintModelElement[]
) {
	const entityId = htmlElement.attributes.getNamedItem("entity-id")?.value;
	if (entityId && entityElements.length > 0) {
		const entity = entityElements.find(el => el.id === entityId);
		if (!entity) {
			return undefined;
		}
		if (
			PartialCalculation.isInstance(entity) ||
			PartialField.isInstance(entity) ||
			PartialPageNumber.isInstance(entity) ||
			PartialPageNumberTotal.isInstance(entity)
		) {
			return inlineCreators.Entity(entity.type, { id: entity.id });
		}
		throw Error(`Unsupported entity type inside text entities of type ${entity.type}`);
	}
	return undefined;
}

export function getEditorInlineStyles(editorState: DraftJs.EditorState, prefix: string): string[] {
	const rawContentState = DraftJs.convertToRaw(editorState.getCurrentContent());

	return uniq(
		rawContentState.blocks.reduce((fontSizeStyles: string[], block) => {
			block.inlineStyleRanges.forEach(range => {
				if (range.style.startsWith(prefix)) {
					fontSizeStyles.push(range.style);
				}
			});
			return fontSizeStyles;
		}, [])
	);
}

export function cleanUpInlineStyle(editorState: DraftJs.EditorState, prefix: string): DraftJs.EditorState {
	const rawContentState = DraftJs.convertToRaw(editorState.getCurrentContent());
	const updatedRawContentState = removeInlineStylesFromRawContent(rawContentState, prefix);
	const updatedContentState = DraftJs.convertFromRaw(updatedRawContentState);
	return DraftJs.EditorState.createWithContent(updatedContentState);
}

function removeInlineStylesFromRawContent(
	rawContentState: DraftJs.RawDraftContentState,
	prefix: string
): DraftJs.RawDraftContentState {
	const blocks = rawContentState.blocks.map(block => {
		const inlineStyleRanges = block.inlineStyleRanges.filter(range => {
			return !range.style.startsWith(prefix);
		});

		return {
			...block,
			inlineStyleRanges,
		};
	});

	return {
		...rawContentState,
		blocks,
	};
}

export function exportStateToHtml(
	newEditorState: DraftJs.EditorState,
	entities: readonly (DeepPartialRecursive<Reference> & PrintModelEntity)[] = []
) {
	const newEntities: Reference[] = [];
	const options: HTMLExportOptions = {
		defaultBlockTag: "p",
		inlineStyleFn: exportInlineStyleFn,
		entityStyleFn: entity => exportEntityStyleFn(entity, entities, newEntities),
	};
	const sanitizedHTML = stateToHTML(newEditorState.getCurrentContent(), options).replace(/<br><\/br>/g, "<br />");
	return { html: sanitizedHTML, entities: newEntities };
}

function exportEntityStyleFn(
	entity: DraftJs.EntityInstance,
	entities: readonly (DeepPartialRecursive<Reference> & PrintModelEntity)[],
	newEntities: Reference[]
) {
	const entityType = entity.getType();
	if (
		entityType === ElementType.Field ||
		entityType === ElementType.Calculation ||
		entityType === ElementType.PageNumber ||
		entityType === ElementType.PageNumberTotal
	) {
		const refId: string = entity.getData().id;
		const refEntity = entities.find(entity => entity.refId === refId);
		const id = refEntity?.id || nanoid();
		newEntities.push({ refId, id });
		return {
			element: "span",
			attributes: {
				"entity-id": refId,
				"entity-type": entityType,
			},
		};
	}
	return undefined;
}

function exportInlineStyleFn(styles: DraftJs.DraftInlineStyle) {
	const outputStyles = getReactStylesFromDraftInlineStyles(styles);
	return {
		element: "span",
		style: outputStyles,
	};
}

export function insertDecorator(
	editorState: DraftJs.EditorState,
	type: DecoratorTypes,
	value: PartialAnyPrintModelElement
) {
	let selection = editorState.getSelection();
	const start = selection.getEndOffset();
	if (!selection.isCollapsed()) {
		selection = selection.merge({
			anchorOffset: start,
			focusOffset: start,
		});
	}
	const displayedText = PartialField.isInstance(value)
		? DEFAULT_FIELD_TEXT
		: PartialCalculation.isInstance(value)
			? DEFAULT_CALC_TEXT
			: PartialPageNumber.isInstance(value)
				? PAGE_NUMBER_TEXT
				: PAGE_NUMBER_TOTAL_TEXT;
	const contentState = editorState.getCurrentContent().createEntity(type, "IMMUTABLE", { id: value.id });
	const entityKey = contentState.getLastCreatedEntityKey();

	const newEditPosition = {
		blockKey: selection.getEndKey(),
		start,
		end: start + displayedText.length,
		entityKey,
	};
	const content = DraftJs.Modifier.insertText(
		contentState,
		selection,
		displayedText,
		editorState.getCurrentInlineStyle(),
		entityKey
	);
	const newState = DraftJs.EditorState.push(editorState, content, "insert-characters");
	return { newState, newEditPosition };
}
