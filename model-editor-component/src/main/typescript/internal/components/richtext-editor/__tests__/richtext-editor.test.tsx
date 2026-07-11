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
import { act, fireEvent, waitFor } from "@testing-library/react";

import { renderWithProviders } from "../../../../../../test/typescript/test-utils/index.js";
import {
	createMockTextElement,
	defaultReducers,
	generateTestName,
	getToolbarButton,
	selectTextInEditor,
	setCursorInEditor,
} from "../../../../../../test/typescript/test-utils/richtext-editor-test-utils.js";

import { PrintRichTextEditor } from "../PrintRichTextEditor.js";
import { normalizeForComparison, sanitizeExpectedResult } from "../utils/html-sanitization.js";

import { TEST_CASES } from "./__testdata__/index.js";

// Mock getBoundingClientRect for Range objects (needed for Lexical in JSDOM)
beforeAll(() => {
	Range.prototype.getBoundingClientRect = () => ({
		x: 0,
		y: 0,
		width: 0,
		height: 0,
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
		toJSON: () => ({}),
	});

	Range.prototype.getClientRects = () =>
		({
			length: 0,
			item: () => null,
			[Symbol.iterator]: function* () {},
		}) as DOMRectList;
});

describe("PrintRichTextEditor with renderWithProviders", () => {
	describe.each(TEST_CASES.map((html, i) => [html, i] as const))("Test", (inputHtml, index) => {
		it(generateTestName(inputHtml, index), async () => {
			const mockElement = createMockTextElement(inputHtml);
			let outputHtml = "";
			let outputEntities: ReadonlyArray<{ refId?: string; id: string }> = [];

			const { getByRole } = renderWithProviders(
				<PrintRichTextEditor
					element={mockElement}
					_testOnBlur={(html, entities) => {
						outputHtml = html;
						outputEntities = entities;
					}}
				/>,
				defaultReducers
			);

			await waitFor(() => {
				expect(getByRole("textbox")).toBeInTheDocument();
			});

			fireEvent.blur(getByRole("textbox"));

			expect(normalizeForComparison(outputHtml)).toBe(normalizeForComparison(sanitizeExpectedResult(inputHtml)));

			const entityRefs = [...outputHtml.matchAll(/entity-id="([^"]+)"/g)].map(m => m[1]);
			expect(outputEntities).toHaveLength(entityRefs.length);
			for (let i = 0; i < entityRefs.length; i++) {
				expect(outputEntities[i].refId).toBe(entityRefs[i]);
				expect(outputEntities[i].id).toBeTruthy();
			}
		});
	});
});

describe("PrintRichTextEditor formatting operations", () => {
	it("applies bold, italic, underline, color, and background-color to selected text parts", async () => {
		const inputHtml = `<p><span style="">Hallo Welt</span></p>`;
		const mockElement = createMockTextElement(inputHtml);
		let outputHtml = "";

		const { getByRole, container } = renderWithProviders(
			<PrintRichTextEditor
				element={mockElement}
				_testOnBlur={html => {
					outputHtml = html;
				}}
			/>,
			defaultReducers
		);

		const editor = await waitFor(() => {
			const el = getByRole("textbox");
			expect(el).toBeInTheDocument();
			return el;
		});

		// all styles should be apllied
		await selectText(editor, 6, 10); // Select "Welt" (characters 6-10)
		await clickToolbarButton(container, "Bold");
		await clickToolbarButton(container, "Italic");
		await clickToolbarButton(container, "Underline");
		await selectColorButton(container, "#00ff00", "text");
		await selectColorButton(container, "#0000ff", "bg");
		fireEvent.blur(editor);

		expect(normalizeForComparison(outputHtml)).toBe(
			`<p><span style="">Hallo </span><span style="color: #00ff00;background-color: #0000ff;"><u><em><strong>Welt</strong></em></u></span></p>`
		);

		// bold and bg styles should not be apllied anymore
		await selectText(editor, 6, 10);
		await clickToolbarButton(container, "Bold");
		await clickToolbarButton(container, "Underline");
		await selectColorButton(container, null, "bg");
		fireEvent.blur(editor);

		expect(normalizeForComparison(outputHtml)).toBe(
			`<p><span style="">Hallo </span><span style="color: #00ff00;"><em>Welt</em></span></p>`
		);

		// bold and bg styles should be apllied to an extended text range
		await selectText(editor, 3, 6);
		await clickToolbarButton(container, "Italic");
		await selectColorButton(container, "#00ff00", "text");
		fireEvent.blur(editor);

		expect(normalizeForComparison(outputHtml)).toBe(
			`<p><span style="">Hal</span><span style="color: #00ff00;"><em>lo Welt</em></span></p>`
		);

		await selectText(editor, 0, 6);
		await clickToolbarButton(container, "Bold");
		await clickToolbarButton(container, "Italic");
		await clickToolbarButton(container, "Underline");
		await selectColorButton(container, "#ff0000", "text");
		await selectColorButton(container, "#ff00ff", "bg");
		fireEvent.blur(editor);

		// text should be split in two different formats
		expect(normalizeForComparison(outputHtml)).toBe(
			`<p><span style="color: #ff0000;background-color: #ff00ff;"><u><em><strong>Hallo </strong></em></u></span><span style="color: #00ff00;"><em>Welt</em></span></p>`
		);

		// cross format splits text nodes
		await selectText(editor, 3, 9);
		await clickToolbarButton(container, "Italic");
		fireEvent.blur(editor);

		expect(normalizeForComparison(outputHtml)).toBe(
			`<p><span style="color: #ff0000;background-color: #ff00ff;"><u><em><strong>Hal</strong></em></u></span><span style="color: #ff0000;background-color: #ff00ff;"><u><strong>lo </strong></u></span><span style="color: #00ff00;">Wel</span><span style="color: #00ff00;"><em>t</em></span></p>`
		);

		// cross format merges nodes back
		await selectText(editor, 3, 9);
		await clickToolbarButton(container, "Italic");
		fireEvent.blur(editor);

		expect(normalizeForComparison(outputHtml)).toBe(
			`<p><span style="color: #ff0000;background-color: #ff00ff;"><u><em><strong>Hallo </strong></em></u></span><span style="color: #00ff00;"><em>Welt</em></span></p>`
		);

		// cross style splits text nodes
		await selectText(editor, 3, 9);
		await selectColorButton(container, "#00ffff", "text");
		fireEvent.blur(editor);

		expect(normalizeForComparison(outputHtml)).toBe(
			`<p><span style="color: #ff0000;background-color: #ff00ff;"><u><em><strong>Hal</strong></em></u></span><span style="color: #00ffff;background-color: #ff00ff;"><u><em><strong>lo </strong></em></u></span><span style="color: #00ffff;"><em>Wel</em></span><span style="color: #00ff00;"><em>t</em></span></p>`
		);

		// remove all styles
		await selectText(editor, 0, 10);
		await clickToolbarButton(container, "Bold");
		await clickToolbarButton(container, "Bold");
		await clickToolbarButton(container, "Italic"); // Italic needs to be click only once because the text is already italic
		await clickToolbarButton(container, "Underline");
		await clickToolbarButton(container, "Underline");
		await selectColorButton(container, null, "text");
		await selectColorButton(container, null, "bg");
		fireEvent.blur(editor);

		expect(normalizeForComparison(outputHtml)).toBe(inputHtml);

		// selecting style on cursor without typing doesnt change anything
		await setCursor(editor, 3);
		await clickToolbarButton(container, "Bold");
		await selectColorButton(container, "#ff0000", "text");
		fireEvent.blur(editor);

		expect(normalizeForComparison(outputHtml)).toBe(inputHtml);

		// write with selected format: position cursor at end, select format, then type
		await setCursor(editor, 10); // cursor after "Hallo Welt"
		await clickToolbarButton(container, "Bold");
		await selectColorButton(container, "#ff0000", "text");
		await clickToolbarButton(container, "Italic");
		await insertText(editor, " Welt");

		fireEvent.blur(editor);
		expect(normalizeForComparison(outputHtml)).toBe(
			`<p><span style="">Hallo Welt</span><span style="color: #ff0000;"><em><strong> Welt</strong></em></span></p>`
		);

		// write with unselected format inside of formated text
		await setCursor(editor, 13);
		await selectColorButton(container, null, "text");
		await clickToolbarButton(container, "Bold");
		await insertText(editor, "xy");

		fireEvent.blur(editor);
		expect(normalizeForComparison(outputHtml)).toBe(
			`<p><span style="">Hallo Welt</span><span style="color: #ff0000;"><em><strong> We</strong></em></span><span style=""><em>xy</em></span><span style="color: #ff0000;"><em><strong>lt</strong></em></span></p>`
		);
	}, 10_000);
});

describe("PrintRichTextEditor entity operations", () => {
	it.each([
		{ entityType: "PageNumber", iconName: "filter_1", displayText: "PageNumber" },
		{ entityType: "PageNumberTotal", iconName: "filter_9_plus", displayText: "PageNumberTotal" },
		{ entityType: "Field", iconName: "input", displayText: "field-entity" },
		{ entityType: "Calculation", iconName: "functions", displayText: "calc-entity" },
	])(
		"should insert a $entityType entity and produces correct HTML output",
		async ({ entityType, iconName, displayText }) => {
			const inputHtml = `<p><span style="">Hallo Welt</span></p>`;
			const mockElement = createMockTextElement(inputHtml);
			let outputHtml = "";
			let outputEntities: ReadonlyArray<{ refId?: string; id: string }> = [];

			const { getByRole, container } = renderWithProviders(
				<PrintRichTextEditor
					element={mockElement}
					_testOnBlur={(html, entities) => {
						outputHtml = html;
						outputEntities = entities;
					}}
				/>,
				defaultReducers
			);

			const editor = await waitFor(() => {
				const el = getByRole("textbox");
				expect(el).toBeInTheDocument();
				return el;
			});

			// Wait for A12 Widgets List.Item's useEffect to set role="button" on toolbar buttons
			// Entity buttons are identified by their material icon name, not localized text
			await waitFor(() => expect(getToolbarButton(container, iconName)).not.toBeNull());

			// Select "Welt" (characters 6–10) and replace with entity
			await selectText(editor, 6, 10);
			await clickToolbarButton(container, iconName);
			fireEvent.blur(editor);

			// verify that extractHtmlAndEntities correctly extracts the entity reference
			expect(outputEntities).toHaveLength(1);
			const entityIdInHtml = new RegExp(/entity-id="([^"]+)"/).exec(outputHtml)?.[1];
			expect(entityIdInHtml).toBeTruthy();
			expect(outputEntities[0].refId).toBe(entityIdInHtml);
			expect(outputEntities[0].id).toBeTruthy();

			expect(normalizeForComparison(outputHtml)).toBe(
				`<p><span style="">Hallo </span><span entity-id="${outputEntities[0].refId}" entity-type="${entityType}"><span style="">${displayText}</span></span></p>`
			);
		}
	);
});

async function clickToolbarButton(container: HTMLElement, type: string) {
	await act(async () => {
		fireEvent.click(getToolbarButton(container, type)!);
	});
}

async function selectText(editor: HTMLElement, start = 0, end = 0) {
	await act(async () => {
		await selectTextInEditor(editor, start, end);
	});
}

async function setCursor(editor: HTMLElement, position: number) {
	await act(async () => {
		// set cursor twice to because of a bug causing the selection of whole text
		await setCursorInEditor(editor, position);
		await setCursorInEditor(editor, position);
	});
}

async function selectColorButton(container: HTMLElement, color: string | null, type: "text" | "bg") {
	await act(async () => {
		if (color === null) {
			fireEvent.click(getToolbarButton(container, type === "text" ? "format_color_text" : "format_color_fill")!);
		} else {
			const colorInputs = container.querySelectorAll('input[type="color"]');
			// The color inputs in ColorButtonWidgets are hidden (width:0, height:0, opacity:0)
			// Default colors are #ff0000 (text) and #ffff00 (bg), so we use DIFFERENT colors
			const colorInput = colorInputs[type === "text" ? 0 : 1] as HTMLInputElement;
			fireEvent.change(colorInput, { target: { value: color } });
		}
		// prevent act update warning
		await new Promise(r => setTimeout(r, 0));
	});
}

async function insertText(editorElement: HTMLElement, text: string) {
	await act(async () => {
		fireEvent.input(editorElement, {
			type: "insertText",
			data: text,
		});
	});
}
