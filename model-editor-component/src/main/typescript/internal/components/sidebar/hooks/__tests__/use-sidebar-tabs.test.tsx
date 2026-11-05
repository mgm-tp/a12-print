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
import { configureStore } from "@reduxjs/toolkit";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { StyleSheetManager, ThemeProvider } from "styled-components";

import { getBaseTheme, shouldForwardProp } from "@com.mgmtp.a12.widgets/widgets-core";
import { DefaultLocalizerContextProvider } from "@com.mgmtp.a12.utils/utils-localization-react";
import { SidebarItem } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import {
	NavigationReducer,
	TransactionLogStateReducer,
	ValidationReducer,
	InteractionLogReducer,
	EditorStateReducer,
	RequestApiReducer,
} from "../../../../redux/index.js";
import { defaultContextApi, EditorComponentContext } from "../../../../api/context-api.js";

import { useSidebarTabs } from "../use-sidebar-tabs.js";

const FRAGMENT_HIDDEN_ITEMS: readonly SidebarItem[] = [SidebarItem.SEGMENT, SidebarItem.SECTION, SidebarItem.WATERMARK];

const NON_FRAGMENT_HIDDEN_ITEMS: readonly SidebarItem[] = [SidebarItem.FRAGMENT];

function createWrapper() {
	const store = configureStore({
		reducer: {
			PrintEditorState: EditorStateReducer,
			Navigation: NavigationReducer,
			TransactionLogState: TransactionLogStateReducer,
			InteractionLogState: InteractionLogReducer,
			ValidationState: ValidationReducer,
			RequestApi: RequestApiReducer,
		},
	});

	return ({ children }: { children: ReactNode }) => (
		<StyleSheetManager shouldForwardProp={shouldForwardProp}>
			<DefaultLocalizerContextProvider locale={{ country: "US", language: "en" }}>
				<ThemeProvider theme={getBaseTheme()}>
					<Provider store={store}>
						<EditorComponentContext.Provider value={defaultContextApi}>
							{children}
						</EditorComponentContext.Provider>
					</Provider>
				</ThemeProvider>
			</DefaultLocalizerContextProvider>
		</StyleSheetManager>
	);
}

describe("useSidebarTabs", () => {
	describe("fragment model view", () => {
		it("should hide Segment, Section, and Watermark tabs when fragment model hidden items are passed", () => {
			const wrapper = createWrapper();
			const { result } = renderHook(() => useSidebarTabs(FRAGMENT_HIDDEN_ITEMS), { wrapper });

			const tabValues = result.current.map(tab => tab.value);

			expect(tabValues).not.toContain(SidebarItem.SEGMENT);
			expect(tabValues).not.toContain(SidebarItem.SECTION);
			expect(tabValues).not.toContain(SidebarItem.WATERMARK);
		});

		it("should show the Fragment tab when fragment model hidden items are passed", () => {
			const wrapper = createWrapper();
			const { result } = renderHook(() => useSidebarTabs(FRAGMENT_HIDDEN_ITEMS), { wrapper });

			const tabValues = result.current.map(tab => tab.value);

			expect(tabValues).toContain(SidebarItem.FRAGMENT);
		});

		it("should still show General, Schema, TextStyles, and CommitChanges tabs", () => {
			const wrapper = createWrapper();
			const { result } = renderHook(() => useSidebarTabs(FRAGMENT_HIDDEN_ITEMS), { wrapper });

			const tabValues = result.current.map(tab => tab.value);

			expect(tabValues).toContain(SidebarItem.GENERAL);
			expect(tabValues).toContain(SidebarItem.SCHEMA);
			expect(tabValues).toContain(SidebarItem.TEXT_STYLES);
			expect(tabValues).toContain(SidebarItem.COMMIT_CHANGES);
		});
	});

	describe("non-fragment model view", () => {
		it("should hide the Fragment tab for non-fragment models", () => {
			const wrapper = createWrapper();
			const { result } = renderHook(() => useSidebarTabs(NON_FRAGMENT_HIDDEN_ITEMS), { wrapper });

			const tabValues = result.current.map(tab => tab.value);

			expect(tabValues).not.toContain(SidebarItem.FRAGMENT);
		});

		it("should show Segment, Section, and Watermark tabs for non-fragment models", () => {
			const wrapper = createWrapper();
			const { result } = renderHook(() => useSidebarTabs(NON_FRAGMENT_HIDDEN_ITEMS), { wrapper });

			const tabValues = result.current.map(tab => tab.value);

			expect(tabValues).toContain(SidebarItem.SEGMENT);
			expect(tabValues).toContain(SidebarItem.SECTION);
			expect(tabValues).toContain(SidebarItem.WATERMARK);
		});
	});
});
