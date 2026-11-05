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
import type { Reducer } from "redux";
import { act, fireEvent } from "@testing-library/react";

import { ElementType } from "@com.mgmtp.a12.print/print-model-api/model";
import { SidebarItem } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import type { TransactionLogStore } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import {
	DIN_TEMPLATE_SEGMENT_ID,
	FRAGMENT_MODEL_ID,
	buildFragmentElement,
	buildPrintModel,
	createNavigationStateWithForm,
	createTransactionLogState,
	defaultPrintEditorState,
	initialStateLogStoreMock,
	logStoreWithDinTemplateSegment,
	logStoreWithIncomingDinTemplateReference,
	mockSegment,
	renderWithProviders,
} from "../../../../../../../test/typescript/test-utils/index.js";
import {
	EditorStateReducer,
	NavigationReducer,
	RequestApiActions,
	type NavigationState,
	type PrintEditorState,
} from "../../../../redux/index.js";
import { TOOLBOX_ELEMENTS } from "../../../../constant/elements.js";
import {
	DEFAULT_ELEMENT_CONTAINER_HEIGHT,
	DEFAULT_ELEMENT_HEIGHT,
	DEFAULT_ELEMENT_WIDTH,
} from "../../../../utils/elements-utils.js";

import { ElementLibrary, getNewElement, getNewElementFragment } from "../ElementLibrary.js";

function renderLibrary({
	isFragmentLibrary = false,
	entityId = mockSegment.id,
	logStore = initialStateLogStoreMock,
	isDinEditable = false,
}: {
	isFragmentLibrary?: boolean;
	entityId?: string;
	logStore?: TransactionLogStore;
	isDinEditable?: boolean;
} = {}) {
	const initialNavigationState = createNavigationStateWithForm(SidebarItem.SEGMENT, entityId, [
		{ type: "ElementLibrary" },
	]);
	const navigationReducer: Reducer = (state: NavigationState = initialNavigationState, action) =>
		NavigationReducer(state, action);
	const editorStateReducer: Reducer = (
		state: PrintEditorState = { ...defaultPrintEditorState, isDinEditable },
		action
	) => EditorStateReducer(state, action);

	return renderWithProviders(<ElementLibrary isFragmentLibrary={isFragmentLibrary} />, {
		Navigation: navigationReducer,
		TransactionLogState: createTransactionLogState(logStore),
		PrintEditorState: editorStateReducer,
	});
}

/** The item labels, with the ligature text of the item icons stripped off. */
const itemNames = (container: HTMLElement) =>
	Array.from(container.querySelectorAll('[data-testid="element-library-item"]'), item => {
		const copy = item.cloneNode(true) as HTMLElement;
		copy.querySelectorAll(".plasma-icon").forEach(icon => icon.remove());
		return copy.textContent;
	});

describe("ElementLibrary - element panel", () => {
	it("offers one draggable item per toolbox element", () => {
		const { container } = renderLibrary();

		expect(container.querySelectorAll('[data-testid="element-library-item"]')).toHaveLength(
			TOOLBOX_ELEMENTS.length
		);
	});

	it("labels the panel 'Elements' so it does not repeat the form headline", () => {
		const { container } = renderLibrary();

		expect(container.querySelector('[data-role="collapsible-panel-title"]')?.textContent).toBe("Elements");
	});

	it("renders the localized element name and icon of each item", () => {
		const { container, getByText } = renderLibrary();

		expect(getByText("Text")).toBeInTheDocument();
		expect(getByText("Bounding Box")).toBeInTheDocument();
		// Every toolbox element carries an icon of its own, next to the panel's chevron.
		expect(container.querySelectorAll('[data-testid="element-library-item"] .plasma-icon')).toHaveLength(
			TOOLBOX_ELEMENTS.length
		);
	});

	it("offers the items in TOOLBOX_ELEMENTS order: content elements first, then layout elements", () => {
		const { container } = renderLibrary();

		expect(itemNames(container)).toEqual([
			"Text",
			"Image",
			"Table",
			"Listing",
			"Expression",
			"Line Chart",
			"Bar Chart",
			"Pie Diagram",
			"Table Layout",
			"Line",
			"Area",
			"Switch",
			"Bounding Box",
		]);
	});

	it("hides the items while the panel is collapsed", () => {
		const { container } = renderLibrary();
		const title = container.querySelector('[data-role="collapsible-panel-title"]');

		fireEvent.click(title!);

		expect(container.querySelectorAll('[data-testid="element-library-item"]')).toHaveLength(0);
	});
});

describe("ElementLibrary - DIN template restrictions", () => {
	it("offers nothing but a message in a locked DIN template segment editor", () => {
		const { container, getByText } = renderLibrary({
			entityId: DIN_TEMPLATE_SEGMENT_ID,
			logStore: logStoreWithDinTemplateSegment,
			isDinEditable: false,
		});

		expect(container.querySelectorAll('[data-testid="element-library-item"]')).toHaveLength(0);
		expect(getByText("No elements can be added here.")).toBeInTheDocument();
	});

	it("offers nothing but a Bounding Box while the model is used as an incoming DIN template", () => {
		const { container, getByText } = renderLibrary({ logStore: logStoreWithIncomingDinTemplateReference });

		expect(itemNames(container)).toEqual(["Bounding Box"]);
		expect(getByText("Bounding Box")).toBeInTheDocument();
	});

	it("offers the full toolbox in a DIN template segment editor once DIN editing is allowed", () => {
		const { container } = renderLibrary({
			entityId: DIN_TEMPLATE_SEGMENT_ID,
			logStore: logStoreWithDinTemplateSegment,
			isDinEditable: true,
		});

		expect(container.querySelectorAll('[data-testid="element-library-item"]')).toHaveLength(
			TOOLBOX_ELEMENTS.length
		);
	});
});

describe("ElementLibrary - fragment panel", () => {
	function renderFragmentLibrary() {
		const rendered = renderLibrary({ isFragmentLibrary: true });

		act(() => {
			rendered.store.dispatch(
				RequestApiActions.setFragmentModel(
					buildPrintModel(
						{
							elementDefinitions: [
								buildFragmentElement("frag-el-1", 40, 20),
								buildFragmentElement("frag-el-2", 10, 5),
							],
						},
						FRAGMENT_MODEL_ID
					)
				)
			);
		});

		return rendered;
	}

	it("labels the panel 'Element Fragment Library'", () => {
		const { container } = renderFragmentLibrary();

		expect(container.querySelector('[data-role="collapsible-panel-title"]')?.textContent).toBe(
			"Element Fragment Library"
		);
	});

	it("offers one item per selectable fragment element, named after the fragment element", () => {
		const { container } = renderFragmentLibrary();

		expect(itemNames(container)).toEqual(expect.arrayContaining(["frag-el-1", "frag-el-2"]));
		expect(container.querySelectorAll('[data-testid="element-library-item"]')).toHaveLength(2);
	});

	it("renders an empty fragment panel while no fragment elements are loaded", () => {
		const { container } = renderLibrary({ isFragmentLibrary: true });

		expect(container.querySelectorAll('[data-testid="element-library-item"]')).toHaveLength(0);
	});

	it("offers the fragments in the same order as the toolbox elements above them", () => {
		const rendered = renderLibrary({ isFragmentLibrary: true });

		act(() => {
			rendered.store.dispatch(
				RequestApiActions.setFragmentModel(
					buildPrintModel(
						{
							elementDefinitions: [
								buildFragmentElement("a-bounding-box", 40, 20, ElementType.BoundingBox),
								buildFragmentElement("b-table", 40, 20, ElementType.Table),
								buildFragmentElement("c-text", 40, 20, ElementType.Text),
							],
						},
						FRAGMENT_MODEL_ID
					)
				)
			);
		});

		expect(itemNames(rendered.container)).toEqual(["c-text", "b-table", "a-bounding-box"]);
	});
});

describe("getNewElement", () => {
	it.each([ElementType.BoundingBox, ElementType.Area])("gives %s the container default for both dimensions", type => {
		const item = getNewElement(type);

		expect(item.dimensions?.minWidth?.value).toBe(DEFAULT_ELEMENT_CONTAINER_HEIGHT);
		expect(item.dimensions?.minHeight?.value).toBe(DEFAULT_ELEMENT_CONTAINER_HEIGHT);
	});

	it("gives every other element the default element width and height", () => {
		const item = getNewElement(ElementType.Text);

		expect(item.dimensions?.minWidth?.value).toBe(DEFAULT_ELEMENT_WIDTH);
		expect(item.dimensions?.minHeight?.value).toBe(DEFAULT_ELEMENT_HEIGHT);
	});

	it("places the new element at the origin and carries its type", () => {
		const item = getNewElement(ElementType.Line);

		expect(item.newType).toBe(ElementType.Line);
		expect(item.position?.x?.value).toBe(0);
		expect(item.position?.y?.value).toBe(0);
	});

	it("generates a fresh id per call so two drags never collide", () => {
		expect(getNewElement(ElementType.Text).id).not.toBe(getNewElement(ElementType.Text).id);
	});
});

describe("getNewElementFragment", () => {
	const fragmentElement = buildFragmentElement("frag-el-1", 40, 20);

	it("references the fragment element in its own model", () => {
		const item = getNewElementFragment(fragmentElement, FRAGMENT_MODEL_ID);

		expect(item.refId).toBe("frag-el-1");
		expect(item.model).toBe(FRAGMENT_MODEL_ID);
		expect(item.newType).toBe(ElementType.Text);
	});

	it("takes its dimensions from the fragment element instead of the toolbox defaults", () => {
		const item = getNewElementFragment(fragmentElement, FRAGMENT_MODEL_ID);

		expect(item.dimensions?.minWidth?.value).toBe(40);
		expect(item.dimensions?.minHeight?.value).toBe(20);
		expect(item.fragmentDimensions).toEqual(fragmentElement.fragmentDimensions);
	});
});
