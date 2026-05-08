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
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useDispatch, useSelector } from "react-redux";
import { useTheme, ThemeProvider } from "styled-components";

import { SidebarItem } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/index.js";
import { getDefaultTextStyleFont } from "@com.mgmtp.a12.print/print-fonts/lib/internal/api/utils/font-utils.js";

import { PrintEngineActions } from "../../store/actions.js";
import { PrintEngineSelectors } from "../../store/selectors.js";
import {
	EditorStateActions,
	FULLSCREEN_TABS,
	initialStateLogStore,
	InteractionLogActions,
	RequestApiActions,
	SidebarActions,
	ValidationActions,
} from "../../redux/index.js";
import { ContextApi, EditorComponentContext } from "../../api/index.js";

import { Sidebar } from "../sidebar/index.js";
import { DragListLayer } from "../drag-and-drop/DragListLayer.js";
import { GlobalToolbar, GlobalToolbarProps } from "../global-toolbar/index.js";
import { HiddenHeightContextWrapper } from "../hidden-height-context-wrapper/index.js";
import { CustomMasterDetailLayout } from "../custom-master-detail-layout/CustomMasterDetailLayout.js";
import { ConfirmationDialog } from "../confirmation-dialog/index.js";

import { StyledApplicationFrame, StyledFrameContainer } from "./PrintModelEditor.styled.js";
import { createPrintModelEditorTheme } from "./themes/customThemes.js";

export interface ModelEditorComponentProps {
	contextApi: ContextApi;
	printModelId: string;
	toolbarProps?: Omit<GlobalToolbarProps, "printModelId">;
	isNewPrintModel?: boolean;
	sidebarFooter?: React.ReactNode;
}

export const PrintModelEditor = ({
	contextApi,
	printModelId,
	toolbarProps,
	isNewPrintModel,
	sidebarFooter,
}: ModelEditorComponentProps) => {
	const dispatch = useDispatch();
	const transactionLogState = useSelector(PrintEngineSelectors.transactionLogState);
	const { selectedItem, isFullscreen, isOpen } = useSelector(PrintEngineSelectors.sidebar);
	const { isUndoDisabled, isRedoDisabled } = useSelector(PrintEngineSelectors.undoRedoButtonState);

	const fonts = React.useMemo(() => contextApi.getFonts(), [contextApi]);
	const isDefaultTransactionLog = React.useMemo(() => {
		return transactionLogState === initialStateLogStore;
	}, [transactionLogState]);

	const subExpandedState = React.useMemo(
		() => (FULLSCREEN_TABS.includes(selectedItem) || isFullscreen ? "maximized" : "minimized"),
		[isFullscreen, selectedItem]
	);
	const onKeyDown = React.useCallback(
		(e: React.KeyboardEvent<HTMLDivElement>) => {
			if (!e.ctrlKey) {
				return;
			}
			if (!isRedoDisabled && (e.key === "y" || (e.shiftKey && e.key === "z"))) {
				e.preventDefault();
				dispatch(InteractionLogActions.redo());
			} else if (!isUndoDisabled && e.key === "z") {
				e.preventDefault();
				dispatch(InteractionLogActions.undo());
			}
		},
		[dispatch, isRedoDisabled, isUndoDisabled]
	);

	React.useEffect(() => {
		dispatch(PrintEngineActions.resetState());
		if (isNewPrintModel === false) {
			dispatch(SidebarActions.setCurrentView({ selectedItem: SidebarItem.SEGMENT }));
		}
		dispatch(RequestApiActions.initializePrintModel(printModelId));
		dispatch(RequestApiActions.loadDINTemplatePrintModels());
		dispatch(RequestApiActions.loadTypesettingModelHeaders());

		// Do not rerun effect when isNewPrintModel prop changes
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [dispatch, printModelId]);

	React.useEffect(() => {
		dispatch(EditorStateActions.setFonts(fonts));
		dispatch(ValidationActions.validateTextStyles());

		const defaultFont = getDefaultTextStyleFont(fonts);
		if (defaultFont) {
			dispatch(EditorStateActions.setDefaultTextStyle({ font: defaultFont.name }));
		}
	}, [dispatch, fonts]);

	const parentTheme = useTheme();

	const PrintModelEditorTheme = createPrintModelEditorTheme(parentTheme);

	return (
		<>
			{!isDefaultTransactionLog && (
				<EditorComponentContext.Provider value={contextApi}>
					<DndProvider backend={HTML5Backend}>
						<HiddenHeightContextWrapper>
							<ThemeProvider theme={PrintModelEditorTheme}>
								<ConfirmationDialog />
								<GlobalToolbar {...toolbarProps} printModelId={printModelId} />
								<StyledFrameContainer tabIndex={-1} onKeyDown={onKeyDown}>
									<DragListLayer />
									<StyledApplicationFrame
										content={<CustomMasterDetailLayout />}
										main={null}
										sub={<Sidebar footer={sidebarFooter} />}
										disableCollapsingSub
										closeSubOnClickOutside
										subExpanded={isOpen}
										subExpandedState={subExpandedState}
										subResizableOptions={{ minWidth: 300 }}
									/>
								</StyledFrameContainer>
							</ThemeProvider>
						</HiddenHeightContextWrapper>
					</DndProvider>
				</EditorComponentContext.Provider>
			)}
		</>
	);
};
