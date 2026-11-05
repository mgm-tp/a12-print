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
import { act, fireEvent, screen, waitFor } from "@testing-library/react";

import {
	ElementType,
	MeasureUnit,
	PageOrientation,
	PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
} from "@com.mgmtp.a12.print/print-model-api/model";
import type {
	PartialAnyPrintModelElement,
	PartialSection,
	PartialWatermark,
	PartialText,
} from "@com.mgmtp.a12.print/print-model-api/model";
import {
	TransactionLog,
	type TransactionLogStoreEntryMap,
} from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import {
	ConfirmationDialogActions,
	ConfirmationDialogType,
	initialStateLogStore,
	LastActionType,
} from "../../../redux/index.js";
import type { FragmentUsageState } from "../../../redux/fragment-usage/state.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";
import type { PrintEngineState } from "../../../../a12internal/api/PrintEngineState.js";
import {
	createTransactionLogState,
	renderWithProviders,
	initialStateLogStoreMock,
	mockPrintModelContentGeneral,
} from "../../../../../../test/typescript/test-utils/index.js";
import { HiddenHeightContextWrapper } from "../../hidden-height-context-wrapper/index.js";

import { FragmentTree } from "../FragmentTree.js";

const mockSection: PartialSection = {
	id: "sectionId1",
	title: "Test Section",
	pageOrientation: PageOrientation.Portrait,
	elementReferences: [],
	headerHeight: { id: "mockHeaderHeightId1", value: 20, unit: MeasureUnit.Millimeter },
};

const mockWatermark: PartialWatermark = {
	id: "watermarkId1",
	title: "Test Watermark",
	pageOrientation: PageOrientation.Portrait,
	elementReferences: [],
};

const mockFragmentElement: PartialText = {
	id: "fragmentElementId1",
	type: ElementType.Text,
	isFragment: true,
	name: "text_abc12",
};

/** Ids of the segments contributed by `initialStateLogStoreMock`. */
const MOCK_SEGMENT_IDS = ["someSegmentId123", "someSegmentId456"];

const setupTestWithFragmentElements = (
	elements: PartialAnyPrintModelElement[] = [mockFragmentElement],
	fragmentUsageState?: FragmentUsageState
) => {
	const contentGeneral = {
		...mockPrintModelContentGeneral,
		sections: [mockSection.id],
		watermarks: [mockWatermark.id],
	};

	const printModelElements: TransactionLogStoreEntryMap<PartialAnyPrintModelElement> = {};
	for (const element of elements) {
		printModelElements[element.id] = TransactionLog.createStoreEntryPrintModelElement(
			initialStateLogStore.printModelElements,
			element,
			"test-interaction"
		).storeEntry;
	}

	return renderWithProviders(
		<HiddenHeightContextWrapper>
			<FragmentTree />
		</HiddenHeightContextWrapper>,
		{
			TransactionLogState: createTransactionLogState({
				...initialStateLogStoreMock,
				[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: TransactionLog.createStoreEntryPrintModelContentGeneral(
					initialStateLogStore[PRINT_MODEL_CONTENT_GENERAL_LOG_ID],
					contentGeneral,
					"test-interaction"
				).storeEntry,
				sections: {
					id: "sectionsMapId",
					map: {
						[mockSection.id]: TransactionLog.createStoreEntrySection(
							undefined,
							mockSection,
							"test-interaction"
						).storeEntry,
					},
				},
				watermarks: {
					id: "watermarksMapId",
					map: {
						[mockWatermark.id]: TransactionLog.createStoreEntryWatermark(
							undefined,
							mockWatermark,
							"test-interaction"
						).storeEntry,
					},
				},
				printModelElements,
			}),
			...(fragmentUsageState && { FragmentUsageState: () => fragmentUsageState }),
		},
		["startInteractionSaga"]
	);
};

type RenderedFragmentTree = ReturnType<typeof setupTestWithFragmentElements>;

/** Renders the tree with sections, watermarks and segments, but without any fragment elements. */
const setupTest = () => setupTestWithFragmentElements([]);

const getPrintEngineState = (store: RenderedFragmentTree["store"]) => store.getState() as unknown as PrintEngineState;

/** Fragment elements are the last nodes in the tree, so their menu is the last one rendered. */
const openFragmentElementMenu = ({ getAllByLabelText }: RenderedFragmentTree) => {
	const elementMenuButton = getAllByLabelText(/open menu/i).at(-1);
	if (!elementMenuButton) {
		throw new Error("Can't find last button of the Pop Up menu");
	}
	fireEvent.click(elementMenuButton);
};

const PAGE_ORIENTATION_CASES = [
	{
		fragmentType: "section",
		toggleIndex: 0,
		addButtonTitle: "Add Section Fragment",
		newNodeLabel: /^Section_/,
		getNewFragmentOrientation: (state: PrintEngineState) =>
			PrintEngineSelectors.sections(state).find(section => section.id !== mockSection.id)?.pageOrientation,
	},
	{
		fragmentType: "watermark",
		toggleIndex: 1,
		addButtonTitle: "Add Watermark Fragment",
		newNodeLabel: /^Watermark_/,
		getNewFragmentOrientation: (state: PrintEngineState) =>
			PrintEngineSelectors.watermarks(state).find(watermark => watermark.id !== mockWatermark.id)
				?.pageOrientation,
	},
	{
		fragmentType: "segment",
		toggleIndex: 2,
		addButtonTitle: "Add Segment Fragment",
		newNodeLabel: /^Segment_/,
		getNewFragmentOrientation: (state: PrintEngineState) =>
			PrintEngineSelectors.segments(state).find(segment => !MOCK_SEGMENT_IDS.includes(segment.id))?.defaultSegment
				?.pageOrientation,
	},
];

describe("FragmentTree — Page Orientation Toggle (Step 3f)", () => {
	it("should render page orientation toggles for section, watermark and segment type nodes", () => {
		const { queryAllByTestId } = setupTest();

		expect(queryAllByTestId("toggle-Portrait")).toHaveLength(PAGE_ORIENTATION_CASES.length);
		expect(queryAllByTestId("toggle-Landscape")).toHaveLength(PAGE_ORIENTATION_CASES.length);
	});

	it.each(PAGE_ORIENTATION_CASES)(
		"should toggle $fragmentType page orientation to landscape and add a $fragmentType with landscape",
		async ({ toggleIndex, addButtonTitle, newNodeLabel, getNewFragmentOrientation }) => {
			const { getAllByTestId, getAllByTitle, queryByText, store } = setupTest();

			const portraitToggle = getAllByTestId("toggle-Portrait")[toggleIndex];
			const landscapeToggle = getAllByTestId("toggle-Landscape")[toggleIndex];

			expect(portraitToggle).toHaveAttribute("aria-pressed", "true");
			expect(landscapeToggle).toHaveAttribute("aria-pressed", "false");

			fireEvent.click(landscapeToggle);

			expect(landscapeToggle).toHaveAttribute("aria-pressed", "true");
			expect(portraitToggle).toHaveAttribute("aria-pressed", "false");

			fireEvent.click(getAllByTitle(addButtonTitle)[0]);

			await waitFor(() => {
				expect(queryByText(newNodeLabel)).toBeInTheDocument();
			});

			expect(getNewFragmentOrientation(getPrintEngineState(store))).toBe(PageOrientation.Landscape);
		}
	);
});

describe("FragmentTree — Settings Nodes", () => {
	it("should expand settings inline when clicking the settings toggle on a section node", async () => {
		const { getAllByTitle, getByPlaceholderText } = setupTest();

		const openSettingButtons = getAllByTitle("Open Setting");
		expect(openSettingButtons.length).toBeGreaterThanOrEqual(1);

		fireEvent.click(openSettingButtons[0]);

		await waitFor(() => {
			expect(getByPlaceholderText("Section title")).toBeInTheDocument();
		});
	});

	it("should collapse settings when clicking the settings toggle again", async () => {
		const { getAllByTitle, getByPlaceholderText, queryByPlaceholderText } = setupTest();

		const openSettingButtons = getAllByTitle("Open Setting");
		fireEvent.click(openSettingButtons[0]);

		await waitFor(() => {
			expect(getByPlaceholderText("Section title")).toBeInTheDocument();
		});

		const closeSettingButton = getAllByTitle("Close Setting")[0];
		fireEvent.click(closeSettingButton);

		await waitFor(() => {
			expect(queryByPlaceholderText("Section title")).not.toBeInTheDocument();
		});
	});

	it("should expand settings inline when clicking the settings toggle on a watermark node", async () => {
		const { getAllByTitle, getByPlaceholderText } = setupTest();

		const openSettingButtons = getAllByTitle("Open Setting");
		expect(openSettingButtons.length).toBeGreaterThanOrEqual(2);

		fireEvent.click(openSettingButtons[1]);

		await waitFor(() => {
			expect(getByPlaceholderText("Watermark title")).toBeInTheDocument();
		});
	});
});

describe("FragmentTree — Tree Structure", () => {
	it("should render section, watermark, and fragment element nodes in the tree", () => {
		const { queryByText } = setupTestWithFragmentElements();

		// Sections and watermarks display their title as-is, fragment elements their name — not a numbered fallback
		expect(queryByText("Test Section")).toBeInTheDocument();
		expect(queryByText("Test Watermark")).toBeInTheDocument();
		expect(queryByText("text_abc12")).toBeInTheDocument();
	});

	it("should list fragment elements in the same order as the Element Library toolbox", () => {
		const elementIds = ["boundingBoxElement", "tableElement", "textElement"];
		const { container } = setupTestWithFragmentElements([
			{ id: "boundingBoxElement", type: ElementType.BoundingBox, isFragment: true, name: "a_box" },
			{ id: "tableElement", type: ElementType.Table, isFragment: true, name: "b_table" },
			{ id: "textElement", type: ElementType.Text, isFragment: true, name: "c_text" },
		] as PartialAnyPrintModelElement[]);

		const renderedOrder = Array.from(container.querySelectorAll('[id^="tree-node-name-"]'))
			.map(node => node.id.replace("tree-node-name-", ""))
			.filter(id => elementIds.includes(id));

		expect(renderedOrder).toEqual(["textElement", "tableElement", "boundingBoxElement"]);
	});
});

describe("FragmentTree — Adding Fragment Elements", () => {
	/** Clicks the add button `count` times, waiting for each element to land in the store, and returns them. */
	const addFragmentElements = async (count: number) => {
		const { getByTitle, store } = setupTestWithFragmentElements([]);

		const addButton = getByTitle("Add Element Fragment");
		for (let expectedCount = 1; expectedCount <= count; expectedCount++) {
			fireEvent.click(addButton);

			await waitFor(() => {
				expect(PrintEngineSelectors.fragmentElements(getPrintEngineState(store))).toHaveLength(expectedCount);
			});
		}

		return PrintEngineSelectors.fragmentElements(getPrintEngineState(store));
	};

	it("should add a new fragment element when clicking the add button", async () => {
		const fragmentElements = await addFragmentElements(1);

		expect(fragmentElements).toHaveLength(1);
	});

	it("should generate a non-empty name for a new fragment element", async () => {
		const [fragmentElement] = await addFragmentElements(1);

		// Name follows the pattern {type}_{hash}
		expect(fragmentElement.name).toMatch(/^Text_.+/);
	});

	it("should add two separate fragment elements of the same type", async () => {
		const fragmentElements = await addFragmentElements(2);

		expect(fragmentElements[0].id).not.toBe(fragmentElements[1].id);
	});
});

describe("FragmentTree — Cloning", () => {
	it("should clone a section via SideBarItemActionButtons", () => {
		const { getAllByLabelText, queryAllByText } = setupTestWithFragmentElements();

		expect(queryAllByText("Test Section")).toHaveLength(1);

		fireEvent.click(getAllByLabelText(/open menu/i)[0]);
		fireEvent.click(screen.getByText("Duplicate"));

		expect(queryAllByText("Test Section")).toHaveLength(2);
	});

	it.skip("should clone a fragment element with isFragment: true and a fresh ID", () => {
		const rendered = setupTestWithFragmentElements();

		openFragmentElementMenu(rendered);
		fireEvent.click(screen.getByText("Duplicate"));

		const fragmentElements = PrintEngineSelectors.fragmentElements(getPrintEngineState(rendered.store));
		expect(fragmentElements).toHaveLength(2);
		expect(fragmentElements[0].id).not.toBe(fragmentElements[1].id);
		expect(fragmentElements[1].isFragment).toBe(true);
	});
});

describe("FragmentTree — Deleting", () => {
	/** The confirmation dialog isn't rendered here, so the saga parks on its take until the answer is dispatched. */
	const clickDeleteOnFragmentElement = (rendered: RenderedFragmentTree) => {
		openFragmentElementMenu(rendered);

		fireEvent.click(screen.getByText("Delete"));

		expect(getPrintEngineState(rendered.store).ConfirmationDialogState?.type).toBe(ConfirmationDialogType.DELETE);
	};

	it("should delete a fragment element via SideBarItemActionButtons once the deletion is confirmed", async () => {
		const rendered = setupTestWithFragmentElements();
		const { queryByText, store } = rendered;

		expect(queryByText("text_abc12")).toBeInTheDocument();

		clickDeleteOnFragmentElement(rendered);
		act(() => {
			store.dispatch(ConfirmationDialogActions.confirm());
		});

		await waitFor(() => {
			expect(PrintEngineSelectors.fragmentElements(getPrintEngineState(store))).toHaveLength(0);
		});
		expect(queryByText("text_abc12")).not.toBeInTheDocument();
	});

	it("should keep the fragment element when the deletion is canceled", async () => {
		const rendered = setupTestWithFragmentElements();
		const { queryByText, store } = rendered;

		clickDeleteOnFragmentElement(rendered);
		act(() => {
			store.dispatch(ConfirmationDialogActions.cancel());
		});

		await waitFor(() => {
			expect(getPrintEngineState(store).ConfirmationDialogState?.lastAction).toBe(LastActionType.cancel);
		});
		expect(PrintEngineSelectors.fragmentElements(getPrintEngineState(store))).toHaveLength(1);
		expect(queryByText("text_abc12")).toBeInTheDocument();
	});

	it("should not offer deletion for a fragment element that is still in use", () => {
		const rendered = setupTestWithFragmentElements([mockFragmentElement], {
			status: "loaded",
			usageByEntityId: {
				[mockFragmentElement.id]: [{ printModelId: "pm-1", referenceEntityType: "element" }],
			},
		});

		openFragmentElementMenu(rendered);

		expect(screen.getByText("Delete").closest("button")).toBeDisabled();
	});
});

describe("FragmentTree — Search", () => {
	const getSearchField = () => screen.getByRole("textbox");

	const search = (searchString: string) => {
		fireEvent.change(getSearchField(), { target: { value: searchString } });
	};

	const expectFragmentTypeGroupsToBeVisible = () => {
		expect(screen.getByText("Sections")).toBeInTheDocument();
		expect(screen.getByText("Watermarks")).toBeInTheDocument();
		expect(screen.getByText("Segments")).toBeInTheDocument();
		expect(screen.getByText("Elements")).toBeInTheDocument();
	};

	it("should render a search field above the tree", () => {
		setupTestWithFragmentElements();

		expect(getSearchField()).toBeInTheDocument();
	});

	it("should give the search field an accessible name", () => {
		setupTestWithFragmentElements();

		expect(screen.getByRole("textbox", { name: "Fragment Search" })).toBeInTheDocument();
	});

	it("should show all fragments while the search field is empty", () => {
		const { queryByText } = setupTestWithFragmentElements();

		expect(queryByText("Test Section")).toBeInTheDocument();
		expect(queryByText("Test Watermark")).toBeInTheDocument();
		expect(queryByText("text_abc12")).toBeInTheDocument();
	});

	it("should hide fragments that do not match the search string", () => {
		const { queryByText } = setupTestWithFragmentElements();

		search("Test Section");

		expect(queryByText("Test Section")).toBeInTheDocument();
		expect(queryByText("Test Watermark")).not.toBeInTheDocument();
		expect(queryByText("text_abc12")).not.toBeInTheDocument();
	});

	it("should keep the fragment type groups visible while filtering", () => {
		setupTestWithFragmentElements();

		search("Test Section");

		expectFragmentTypeGroupsToBeVisible();
	});

	it("should keep the fragment type groups visible when nothing matches", () => {
		const { queryByText } = setupTestWithFragmentElements();

		search("no-such-fragment");

		expectFragmentTypeGroupsToBeVisible();
		expect(queryByText("Test Section")).not.toBeInTheDocument();
		expect(queryByText("Test Watermark")).not.toBeInTheDocument();
		expect(queryByText("text_abc12")).not.toBeInTheDocument();
	});

	it("should match a partial fragment title", () => {
		const { queryByText } = setupTestWithFragmentElements();

		search("Waterm");

		expect(queryByText("Test Watermark")).toBeInTheDocument();
		expect(queryByText("Test Section")).not.toBeInTheDocument();
	});

	it("should match case-insensitively", () => {
		const { queryByText } = setupTestWithFragmentElements();

		search("tEsT sEcTiOn");

		expect(queryByText("Test Section")).toBeInTheDocument();
		expect(queryByText("Test Watermark")).not.toBeInTheDocument();
	});

	it("should match a fragment element by its name", () => {
		const { queryByText } = setupTestWithFragmentElements();

		search("abc12");

		expect(queryByText("text_abc12")).toBeInTheDocument();
		expect(queryByText("Test Section")).not.toBeInTheDocument();
		expect(queryByText("Test Watermark")).not.toBeInTheDocument();
	});

	it("should show all fragments again once the search string is cleared", () => {
		const { queryByText } = setupTestWithFragmentElements();

		search("Test Section");
		search("");

		expect(queryByText("Test Section")).toBeInTheDocument();
		expect(queryByText("Test Watermark")).toBeInTheDocument();
		expect(queryByText("text_abc12")).toBeInTheDocument();
	});
});
