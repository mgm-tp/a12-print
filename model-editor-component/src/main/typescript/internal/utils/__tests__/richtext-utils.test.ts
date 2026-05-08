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
import { jest } from "@jest/globals";
import DraftJs from "draft-js";
import { nanoid } from "nanoid";
import { OrderedSet } from "immutable";

import { ElementType, PartialAnyPrintModelElement } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

import { DecoratorTypes } from "../../components/richtext-editor/type.js";

import {
	BACKGROUND_COLOR,
	BACKGROUND_COLOR_PREFIX,
	DEFAULT_CALC_TEXT,
	DEFAULT_FIELD_TEXT,
	FONT_SIZE_PREFIX,
	PAGE_NUMBER_TEXT,
	PAGE_NUMBER_TOTAL_TEXT,
	TEXT_COLOR,
	TEXT_COLOR_PREFIX,
	cleanUpInlineStyle,
	createImportOptions,
	exportStateToHtml,
	findEntityRangesByType,
	getEditorInlineStyles,
	getEndEntitySelection,
	getEntities,
	getEntityAt,
	getReactStylesFromDraftInlineStyles,
	getStartEntitySelection,
	insertDecorator,
	removeInlineStylesForSelection,
} from "../richtext-utils.js";

describe("rich text utils", () => {
	describe("insertDecorator", () => {
		it("should insert a decorator at the correct position and update entity ranges", () => {
			const entities = [
				{ type: ElementType.Field, value: DEFAULT_FIELD_TEXT },
				{ type: ElementType.Calculation, value: DEFAULT_CALC_TEXT },
				{ type: ElementType.PageNumber, value: PAGE_NUMBER_TEXT },
				{ type: ElementType.PageNumberTotal, value: PAGE_NUMBER_TOTAL_TEXT },
			];

			entities.forEach(({ type, value }) => {
				const editorState = DraftJs.EditorState.createWithContent(
					DraftJs.ContentState.createFromText("abcxyz")
				);
				const focusedEditorState = select(editorState, 2, 3); // Select range to cover functionality for auto-collapsing selection
				const raw = DraftJs.convertToRaw(focusedEditorState.getCurrentContent());

				expect(focusedEditorState.getCurrentContent().getPlainText()).toBe("abcxyz");
				expect(raw.blocks[0].entityRanges).toHaveLength(0);
				expect(raw.entityMap).toMatchObject({});

				const { newState, newEditPosition } = insertDecorator(focusedEditorState, type as DecoratorTypes, {
					id: nanoid(),
					type: type,
					[type.toLowerCase()]: {
						id: nanoid(),
					},
				});
				const insertedRaw = DraftJs.convertToRaw(newState.getCurrentContent());

				expect(newState.getCurrentContent().getPlainText()).toBe(`abc${value}xyz`);
				expect(newEditPosition.end).toBe(3 + value.length);
				expect(insertedRaw.blocks[0].entityRanges[0]).toMatchObject({
					offset: 3,
					length: value.length,
					key: 0,
				});
				expect(insertedRaw.entityMap["0"]).toMatchObject({
					type,
				});
			});
		});
	});

	describe("getEntities", () => {
		it("should retrieve all entities with start and end positions", () => {
			const editorState = DraftJs.EditorState.createWithContent(DraftJs.ContentState.createFromText("abcxyz"));
			const { newState: firstState } = insertDecorator(editorState, ElementType.Field, {
				id: nanoid(),
				type: ElementType.Field,
				field: {
					id: nanoid(),
				},
			});
			const firstEntities = getEntities(firstState);

			expect(firstEntities).toHaveLength(1);
			expect(firstEntities[0].start).toBe(0);
			expect(firstEntities[0].end).toBe(DEFAULT_FIELD_TEXT.length);

			const focusedFirstState = select(firstState, 15);
			const { newState: secondState } = insertDecorator(focusedFirstState, ElementType.Calculation, {
				id: nanoid(),
				type: ElementType.Calculation,
				calculation: {
					id: nanoid(),
				},
			});
			const secondEntities = getEntities(secondState);

			expect(secondEntities).toHaveLength(2);
			expect(secondEntities[1].start).toBe(15);
			expect(secondEntities[1].end).toBe(15 + DEFAULT_CALC_TEXT.length);
		});
	});

	describe("getEntityAt", () => {
		const setupTest = (position: number) => {
			const editorState = DraftJs.EditorState.createWithContent(DraftJs.ContentState.createFromText("abcxyz"));
			const focusedEditorState = select(editorState, position);
			const { newState } = insertDecorator(focusedEditorState, ElementType.Field, {
				id: "tested-id",
				type: ElementType.Field,
				field: {
					id: nanoid(),
				},
			});
			return newState;
		};

		it("should return the entity at the given position if present", () => {
			const newState = setupTest(3);
			const entityAt3 = getEntityAt(newState, 3);
			expect(entityAt3).toBeDefined();
			expect(entityAt3?.data.id).toBe("tested-id");
		});

		it("should return nothing at the given position if no entity present", () => {
			const newState = setupTest(3);
			const entityAt1 = getEntityAt(newState, 1);
			expect(entityAt1).toBeUndefined();
		});
	});

	describe("findEntityRangesByType", () => {
		const setupTest = (position: number, entityType: DecoratorTypes) => {
			const editorState = DraftJs.EditorState.createWithContent(DraftJs.ContentState.createFromText("abcxyz"));
			const focusedEditorState = select(editorState, position);
			const { newState } = insertDecorator(focusedEditorState, ElementType.Field, {
				id: nanoid(),
				type: ElementType.Field,
				field: {
					id: nanoid(),
				},
			});
			const blocks = newState.getCurrentContent().getBlocksAsArray();
			let fieldEntityRange: { start: number; end: number } | undefined;

			findEntityRangesByType(entityType)(
				blocks[0],
				(start, end) => {
					fieldEntityRange = { start, end };
				},
				newState.getCurrentContent()
			);
			return { fieldEntityRange };
		};

		it("should retrieve all entities of a specific type with start and end positions", () => {
			const { fieldEntityRange } = setupTest(3, ElementType.Field);
			expect(fieldEntityRange).toBeDefined();
			expect(fieldEntityRange?.start).toBe(3);
			expect(fieldEntityRange?.end).toBe(3 + DEFAULT_FIELD_TEXT.length);
		});

		it("should retrieve nothing if there is no match with the specified type", () => {
			const { fieldEntityRange } = setupTest(3, ElementType.Calculation);
			expect(fieldEntityRange).toBeUndefined();
		});
	});

	describe("getStartEntitySelection", () => {
		const ENTITY_START_POSITION = 3;
		const setupTest = (start: number, end: number) => {
			const editorState = DraftJs.EditorState.createWithContent(DraftJs.ContentState.createFromText("abcxyz"));
			const focusedEditorState = select(editorState, ENTITY_START_POSITION);
			const { newState } = insertDecorator(focusedEditorState, ElementType.Field, {
				id: nanoid(),
				type: ElementType.Field,
				field: {
					id: nanoid(),
				},
			});
			const selectedEditorState = select(newState, start, end);
			return getStartEntitySelection(selectedEditorState, selectedEditorState.getSelection());
		};

		it("should work correctly if selecting before to inside entity", () => {
			const { newSelection, isChange } = setupTest(1, 8);

			expect(isChange).toBeFalsy();
			expect(newSelection.getFocusOffset()).toBe(8);
			expect(newSelection.getAnchorOffset()).toBe(1);
		});

		it("should work correctly if selecting inside entity", () => {
			const { newSelection, isChange } = setupTest(5, 8);

			expect(isChange).toBeTruthy();
			expect(newSelection.getFocusOffset()).toBe(8);
			expect(newSelection.getAnchorOffset()).toBe(ENTITY_START_POSITION);
		});

		it("should work correctly if selecting inside entity to after it", () => {
			const { newSelection, isChange } = setupTest(5, 17);

			expect(isChange).toBeTruthy();
			expect(newSelection.getFocusOffset()).toBe(17);
			expect(newSelection.getAnchorOffset()).toBe(ENTITY_START_POSITION);
		});

		it("should work correctly if selecting inside entity to after it", () => {
			const { newSelection, isChange } = setupTest(17, 5);

			expect(isChange).toBeTruthy();
			expect(newSelection.getFocusOffset()).toBe(ENTITY_START_POSITION);
			expect(newSelection.getAnchorOffset()).toBe(17);
		});

		it("should not change selection if selecting outside entity", () => {
			const { newSelection, isChange } = setupTest(1, 2);

			expect(isChange).toBeFalsy();
			expect(newSelection.getAnchorOffset()).toBe(1);
			expect(newSelection.getFocusOffset()).toBe(2);
		});
	});

	describe("getEndEntitySelection", () => {
		const ENTITY_START_POSITION = 3;
		const setupTest = (start: number, end: number) => {
			const editorState = DraftJs.EditorState.createWithContent(DraftJs.ContentState.createFromText("abcxyz"));
			const focusedEditorState = select(editorState, ENTITY_START_POSITION);
			const { newState } = insertDecorator(focusedEditorState, ElementType.Field, {
				id: nanoid(),
				type: ElementType.Field,
				field: {
					id: nanoid(),
				},
			});
			const selectedEditorState = select(newState, start, end);
			return getEndEntitySelection(selectedEditorState, selectedEditorState.getSelection());
		};

		it("should work correctly if selecting before to inside entity", () => {
			const { newSelection, isChange } = setupTest(1, 8);

			expect(isChange).toBeTruthy();
			expect(newSelection.getAnchorOffset()).toBe(1);
			expect(newSelection.getFocusOffset()).toBe(ENTITY_START_POSITION + DEFAULT_FIELD_TEXT.length);
		});

		it("should work correctly if selecting inside to before entity", () => {
			const { newSelection, isChange } = setupTest(8, 1);

			expect(isChange).toBeTruthy();
			expect(newSelection.getAnchorOffset()).toBe(ENTITY_START_POSITION + DEFAULT_FIELD_TEXT.length);
			expect(newSelection.getFocusOffset()).toBe(1);
		});

		it("should work correctly if selecting inside entity", () => {
			const { newSelection, isChange } = setupTest(5, 8);

			expect(isChange).toBeTruthy();
			expect(newSelection.getAnchorOffset()).toBe(5);
			expect(newSelection.getFocusOffset()).toBe(ENTITY_START_POSITION + DEFAULT_FIELD_TEXT.length);
		});

		it("should not change selection if selecting inside entity to after it", () => {
			const { newSelection, isChange } = setupTest(5, 17);

			expect(isChange).toBeFalsy();
			expect(newSelection.getAnchorOffset()).toBe(5);
			expect(newSelection.getFocusOffset()).toBe(17);
		});

		it("should not change selection if selecting outside entity", () => {
			const { newSelection, isChange } = setupTest(-1, -2);

			expect(isChange).toBeFalsy();
			expect(newSelection.getAnchorOffset()).toBe(-1);
			expect(newSelection.getFocusOffset()).toBe(-2);
		});
	});

	describe("removeInlineStylesForSelection", () => {
		const BOLD_STYLE = "BOLD";
		const ITALIC_STYLE = "ITALIC";
		it("should remove specified inline styles from selection", () => {
			const initialText = "Sample text for testing";
			let editorState = DraftJs.EditorState.createWithContent(DraftJs.ContentState.createFromText(initialText));

			editorState = select(editorState, 7, 11);
			editorState = DraftJs.RichUtils.toggleInlineStyle(editorState, BOLD_STYLE);

			editorState = select(editorState, 0, 6);
			editorState = DraftJs.RichUtils.toggleInlineStyle(editorState, ITALIC_STYLE);

			editorState = removeInlineStylesForSelection(editorState, BOLD_STYLE);

			const currentInlineStyle = editorState.getCurrentInlineStyle();
			expect(currentInlineStyle.has(BOLD_STYLE)).toBeFalsy();
			expect(currentInlineStyle.has(ITALIC_STYLE)).toBeTruthy();

			const currentContent = editorState.getCurrentContent().getPlainText();
			expect(currentContent).toBe(initialText);
		});

		it("should remove specified inline styles from a collapsed selection", () => {
			const initialText = "Sample text for bold and italic";
			let editorState = DraftJs.EditorState.createWithContent(DraftJs.ContentState.createFromText(initialText));

			editorState = select(editorState, 5);
			editorState = DraftJs.RichUtils.toggleInlineStyle(editorState, BOLD_STYLE);
			editorState = DraftJs.RichUtils.toggleInlineStyle(editorState, ITALIC_STYLE);
			editorState = removeInlineStylesForSelection(editorState, BOLD_STYLE);

			const currentInlineStyle = editorState.getCurrentInlineStyle();
			expect(currentInlineStyle.has(BOLD_STYLE)).toBeFalsy();
			expect(currentInlineStyle.has(ITALIC_STYLE)).toBeTruthy();
		});

		it("should remove specified inline styles across multiple blocks", () => {
			const initialText = "First block text\n\nSecond block text";
			let editorState = DraftJs.EditorState.createWithContent(DraftJs.ContentState.createFromText(initialText));

			const selectionState = DraftJs.SelectionState.createEmpty(
				editorState.getCurrentContent().getBlockMap().first().getKey()
			).merge({
				focusKey: editorState.getCurrentContent().getBlockMap().last().getKey(),
				focusOffset: editorState.getCurrentContent().getBlockMap().last().getLength(),
				anchorOffset: 0,
			});
			editorState = DraftJs.EditorState.acceptSelection(editorState, selectionState);

			editorState = DraftJs.RichUtils.toggleInlineStyle(editorState, BOLD_STYLE);
			const currentInlineStyleBefore = editorState.getCurrentInlineStyle();
			expect(currentInlineStyleBefore.has(BOLD_STYLE)).toBeTruthy();

			editorState = removeInlineStylesForSelection(editorState, BOLD_STYLE);
			const currentInlineStyle = editorState.getCurrentInlineStyle();
			expect(currentInlineStyle.has(BOLD_STYLE)).toBeFalsy();

			const contentState = editorState.getCurrentContent();
			const noCharsBold = contentState
				.getBlockMap()
				.flatMap(block => block?.getCharacterList().map(char => char?.getStyle().has(BOLD_STYLE)))
				.every(isBold => !isBold);

			expect(noCharsBold).toBeTruthy();
		});
	});

	describe("getReactStylesFromDraftInlineStyles", () => {
		it("should convert text color style correctly", () => {
			const style = OrderedSet.of(`${TEXT_COLOR_PREFIX}_123456`, TEXT_COLOR);
			const result = getReactStylesFromDraftInlineStyles(style);
			expect(result).toHaveProperty("color", "123456");
		});

		it("should convert background color style correctly", () => {
			const style = OrderedSet.of(`${BACKGROUND_COLOR_PREFIX}_654321`, BACKGROUND_COLOR);
			const result = getReactStylesFromDraftInlineStyles(style);
			expect(result).toHaveProperty("backgroundColor", "654321");
		});

		it("should convert font size style correctly", () => {
			const style = OrderedSet.of(`${FONT_SIZE_PREFIX}_24`);
			const result = getReactStylesFromDraftInlineStyles(style);
			expect(result).toHaveProperty("fontSize", "24pt");
		});

		it("should use provided currentFontSize if no FONT_SIZE_VALUE style is present", () => {
			const style = OrderedSet.of<string>();
			const currentFontSize = 12;
			const result = getReactStylesFromDraftInlineStyles(style, currentFontSize);
			expect(result).toHaveProperty("fontSize", "12pt");
		});

		it("should not use provided currentFontSize if FONT_SIZE_VALUE style is present", () => {
			const style = OrderedSet.of(`${FONT_SIZE_PREFIX}_24`);
			const currentFontSize = 12;
			const result = getReactStylesFromDraftInlineStyles(style, currentFontSize);
			expect(result).toHaveProperty("fontSize", "24pt");
		});

		it("should return an object with no font size if no FONT_SIZE_VALUE style and no currentFontSize are provided", () => {
			const style = OrderedSet.of<string>();
			const result = getReactStylesFromDraftInlineStyles(style);
			expect(result).toStrictEqual({});
		});
	});

	describe("createImportOptions", () => {
		const MOCKED_STYLE_VALUE = "mocked-style-value";
		const MOCKED_ENTITY_VALUE = "mocked-entity-value";
		const mockEntityElements = [
			...Object.values(ElementType).map((type, index) => ({ type, id: `entity-${index}` })),
		] as unknown as PartialAnyPrintModelElement[];

		const inlineCreatorsMock = {
			Style: jest.fn().mockReturnValue(MOCKED_STYLE_VALUE),
			Entity: jest.fn().mockReturnValue(MOCKED_ENTITY_VALUE),
		};

		beforeEach(() => {
			inlineCreatorsMock.Style.mockClear();
			inlineCreatorsMock.Entity.mockClear();
		});

		it("should not call Style creator and Entity Creator", () => {
			const htmlElement = document.createElement("div");
			const options = createImportOptions([]);

			const result = options.customInlineFn?.(htmlElement, inlineCreatorsMock);
			expect(result).toBeUndefined();
			expect(inlineCreatorsMock.Style).not.toHaveBeenCalled();
			expect(inlineCreatorsMock.Entity).not.toHaveBeenCalled();
		});

		it("should call Style creator with correct arguments for color, backgroundColor, and fontSize", () => {
			const htmlElement = document.createElement("div");
			htmlElement.style.color = "rgb(255, 0, 0)";
			htmlElement.style.backgroundColor = "rgb(0, 255, 0)";
			htmlElement.style.fontSize = "16pt";
			const options = createImportOptions([]);

			const result = options.customInlineFn?.(htmlElement, inlineCreatorsMock);
			expect(result).toEqual(MOCKED_STYLE_VALUE);
			expect(inlineCreatorsMock.Style).toHaveBeenCalledWith(expect.stringContaining(TEXT_COLOR_PREFIX));
			expect(inlineCreatorsMock.Style).toHaveBeenCalledWith(expect.stringContaining(BACKGROUND_COLOR_PREFIX));
			expect(inlineCreatorsMock.Style).toHaveBeenCalledWith(expect.stringContaining(TEXT_COLOR));
			expect(inlineCreatorsMock.Style).toHaveBeenCalledWith(expect.stringContaining(BACKGROUND_COLOR));
			expect(inlineCreatorsMock.Style).toHaveBeenCalledWith(expect.stringContaining(FONT_SIZE_PREFIX));
			expect(inlineCreatorsMock.Style).toHaveBeenCalledWith(expect.stringContaining("_#ff0000"));
			expect(inlineCreatorsMock.Style).toHaveBeenCalledWith(expect.stringContaining("_#00ff00"));
			expect(inlineCreatorsMock.Style).toHaveBeenCalledWith(expect.stringContaining("_16"));
		});

		it("should call Entity creator for HTML elements with a matching entity-id attribute and supported entity type", () => {
			mockEntityElements.forEach(({ id, type }) => {
				const options = createImportOptions(mockEntityElements);
				const htmlElement = document.createElement("div");
				htmlElement.setAttribute("entity-id", id);

				if (
					[
						ElementType.Calculation,
						ElementType.Field,
						ElementType.PageNumber,
						ElementType.PageNumberTotal,
					].includes(type)
				) {
					const result = options.customInlineFn?.(htmlElement, inlineCreatorsMock);
					expect(result).toEqual(MOCKED_ENTITY_VALUE);
					expect(inlineCreatorsMock.Entity).toHaveBeenCalledWith(type, expect.objectContaining({ id }));
				} else {
					expect(() => {
						options.customInlineFn?.(htmlElement, inlineCreatorsMock);
					}).toThrow(`Unsupported entity type inside text entities of type ${type}`);
				}
			});
		});

		it("should return undefined for HTML elements with an entity-id that does not match any entity", () => {
			const options = createImportOptions(mockEntityElements);
			const htmlElement = document.createElement("div");
			htmlElement.setAttribute("entity-id", "non-existing-entity");

			const result = options.customInlineFn?.(htmlElement, inlineCreatorsMock);
			expect(result).toBeUndefined();
			expect(inlineCreatorsMock.Entity).not.toHaveBeenCalled();
		});
	});

	describe("getEditorInlineStyles", () => {
		it("should return inline styles with the specified prefix", () => {
			let editorState = DraftJs.EditorState.createWithContent(
				DraftJs.ContentState.createFromText("Some text for testing")
			);

			editorState = select(editorState, 0, 4);
			editorState = DraftJs.RichUtils.toggleInlineStyle(editorState, `${FONT_SIZE_PREFIX}_24`);

			editorState = select(editorState, 5, 9);
			editorState = DraftJs.RichUtils.toggleInlineStyle(editorState, `${FONT_SIZE_PREFIX}_12`);

			editorState = select(editorState, 0, 4);
			editorState = DraftJs.RichUtils.toggleInlineStyle(editorState, `${TEXT_COLOR_PREFIX}_123456`);

			editorState = select(editorState, 0, 4);
			editorState = DraftJs.RichUtils.toggleInlineStyle(editorState, `${BACKGROUND_COLOR_PREFIX}_654321`);

			const fontSizeStyles = getEditorInlineStyles(editorState, FONT_SIZE_PREFIX);
			const textColorStyles = getEditorInlineStyles(editorState, TEXT_COLOR_PREFIX);
			const backgroundColorStyles = getEditorInlineStyles(editorState, BACKGROUND_COLOR_PREFIX);

			expect(fontSizeStyles).toContain(`${FONT_SIZE_PREFIX}_24`);
			expect(fontSizeStyles).toContain(`${FONT_SIZE_PREFIX}_12`);
			expect(fontSizeStyles.length).toBe(2);

			expect(textColorStyles).toContain(`${TEXT_COLOR_PREFIX}_123456`);
			expect(textColorStyles.length).toBe(1);

			expect(backgroundColorStyles).toContain(`${BACKGROUND_COLOR_PREFIX}_654321`);
			expect(backgroundColorStyles.length).toBe(1);
		});
	});

	describe("cleanUpInlineStyle", () => {
		it("should remove inline styles with the specified prefix", () => {
			let editorState = DraftJs.EditorState.createWithContent(
				DraftJs.ContentState.createFromText("Some text for testing")
			);

			editorState = select(editorState, 0, 4);
			editorState = DraftJs.RichUtils.toggleInlineStyle(editorState, `${FONT_SIZE_PREFIX}_24`);

			editorState = select(editorState, 5, 9);
			editorState = DraftJs.RichUtils.toggleInlineStyle(editorState, `${FONT_SIZE_PREFIX}_12`);

			editorState = select(editorState, 0, 4);
			editorState = DraftJs.RichUtils.toggleInlineStyle(editorState, `${TEXT_COLOR_PREFIX}_123456`);

			editorState = select(editorState, 0, 4);
			editorState = DraftJs.RichUtils.toggleInlineStyle(editorState, `${BACKGROUND_COLOR_PREFIX}_654321`);

			editorState = cleanUpInlineStyle(editorState, FONT_SIZE_PREFIX);
			const fontSizeStyles = getEditorInlineStyles(editorState, FONT_SIZE_PREFIX);
			expect(fontSizeStyles).not.toContain(`${FONT_SIZE_PREFIX}_24`);
			expect(fontSizeStyles).not.toContain(`${FONT_SIZE_PREFIX}_12`);
			expect(fontSizeStyles.length).toBe(0);

			editorState = cleanUpInlineStyle(editorState, TEXT_COLOR_PREFIX);
			const textColorStyles = getEditorInlineStyles(editorState, TEXT_COLOR_PREFIX);
			expect(textColorStyles).not.toContain(`${TEXT_COLOR_PREFIX}_123456`);
			expect(textColorStyles.length).toBe(0);

			editorState = cleanUpInlineStyle(editorState, BACKGROUND_COLOR_PREFIX);
			const backgroundColorStyles = getEditorInlineStyles(editorState, BACKGROUND_COLOR_PREFIX);
			expect(backgroundColorStyles).not.toContain(`${BACKGROUND_COLOR_PREFIX}_654321`);
			expect(backgroundColorStyles.length).toBe(0);
		});
	});

	describe("exportStateToHtml", () => {
		it("should correctly export editor state to HTML", () => {
			const initialText = "This is a test.";
			const editorState = DraftJs.EditorState.createWithContent(DraftJs.ContentState.createFromText(initialText));
			const { html, entities } = exportStateToHtml(editorState);

			expect(html).toMatchSnapshot();
			expect(entities).toHaveLength(0);
		});
		it("should correctly export editor state to HTML with styles and entities", () => {
			const initialText = "This is a test.";
			const entityData1 = { id: "123", type: ElementType.Field };
			const entityData2 = { id: "456", type: ElementType.Calculation };

			let editorState = DraftJs.EditorState.createWithContent(DraftJs.ContentState.createFromText(initialText));
			editorState = select(editorState, 0, 4);
			editorState = DraftJs.RichUtils.toggleInlineStyle(editorState, `${FONT_SIZE_PREFIX}_16`);

			editorState = select(editorState, initialText.length - 1);
			editorState = insertDecorator(editorState, ElementType.Field, entityData1).newState;

			editorState = select(editorState, initialText.length - 1);
			editorState = insertDecorator(editorState, ElementType.Calculation, entityData2).newState;

			const { html, entities } = exportStateToHtml(editorState, [entityData1, entityData2]);

			expect(html).toMatchSnapshot();
			expect(entities).toEqual(
				expect.arrayContaining([
					{ refId: "123", id: expect.any(String) },
					{ refId: "456", id: expect.any(String) },
				])
			);
		});
		it("should exclude unsupported entity types", () => {
			const initialText = "Unsupported entity type test.";
			const entityData = { id: "789", type: "UnsupportedType" as DecoratorTypes };
			const entityData2 = { id: "456", type: ElementType.Calculation };
			let editorState = DraftJs.EditorState.createWithContent(DraftJs.ContentState.createFromText(initialText));

			editorState = select(editorState, initialText.length - 1);
			editorState = insertDecorator(editorState, entityData.type, entityData).newState;

			editorState = select(editorState, initialText.length - 1);
			editorState = insertDecorator(editorState, ElementType.Calculation, entityData2).newState;

			const { html, entities } = exportStateToHtml(editorState, [entityData, entityData2]);

			expect(entities).not.toEqual(expect.arrayContaining([{ refId: "789", id: expect.any(String) }]));
			expect(entities).toEqual(expect.arrayContaining([{ refId: "456", id: expect.any(String) }]));
			expect(entities).toHaveLength(1);
			expect(html).toMatchSnapshot();
		});
	});
});

// Helper Functions
function select(editorState: DraftJs.EditorState, from: number, to?: number) {
	const selectionState = editorState.getSelection();
	const anchorOffset = from;
	const focusOffset = typeof to === "number" ? to : from;
	return DraftJs.EditorState.forceSelection(
		editorState,
		selectionState.merge({
			anchorOffset,
			focusOffset,
			isBackward: anchorOffset > focusOffset,
		})
	);
}
