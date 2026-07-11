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

import { getDefaultTextStyleFont } from "@com.mgmtp.a12.print/print-fonts/a12internal";
import type { EntityInstancePath } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import { ProgressIndicator } from "@com.mgmtp.a12.widgets/widgets-core";

import { PrintEngineSelectors } from "../../store/selectors.js";
import {
	EditorStateActions,
	initialStateLogStore,
	InteractionLogActions,
	ValidationActions,
} from "../../redux/index.js";
import { CommitViewSelectors } from "../../redux/commit-view/selectors.js";
import { FULLSCREEN_TABS, NavigationSelectors } from "../../redux/navigation/index.js";
import type { ContextApi } from "../../api/index.js";
import { EditorComponentContext } from "../../api/index.js";
import { PrintEngineActions } from "../../store/actions.js";

import { Sidebar } from "../sidebar/index.js";
import { DragListLayer } from "../drag-and-drop/DragListLayer.js";
import type { GlobalToolbarProps } from "../global-toolbar/index.js";
import { GlobalToolbar } from "../global-toolbar/index.js";
import { HiddenHeightContextWrapper } from "../hidden-height-context-wrapper/index.js";
import { CustomMasterDetailLayout } from "../custom-master-detail-layout/CustomMasterDetailLayout.js";
import { ConfirmationDialog } from "../confirmation-dialog/index.js";

import { StyledApplicationFrame, StyledFrameContainer } from "./PrintModelEditor.styled.js";
import { createPrintModelEditorTheme } from "./themes/customThemes.js";

export interface ModelEditorComponentProps {
	contextApi: ContextApi;
	printModelId: string;
	toolbarProps?: Omit<GlobalToolbarProps, "printModelId">;
	navigationPath?: EntityInstancePath;
	sidebarFooter?: React.ReactNode;
}

export const PrintModelEditor = ({
	contextApi,
	printModelId,
	toolbarProps,
	navigationPath,
	sidebarFooter,
}: ModelEditorComponentProps) => {
	const dispatch = useDispatch();
	const transactionLogState = useSelector(PrintEngineSelectors.transactionLogState);
	const { activeTab, isFullscreen, isOpen } = useSelector(NavigationSelectors.sidebarState);
	const { isUndoDisabled, isRedoDisabled } = useSelector(PrintEngineSelectors.undoRedoButtonState);
	const isCommitting = useSelector(CommitViewSelectors.isCommitting);

	const fonts = React.useMemo(() => contextApi.getFonts(), [contextApi]);
	const isDefaultTransactionLog = React.useMemo(
		() => transactionLogState === initialStateLogStore,
		[transactionLogState]
	);

	const subExpandedState = React.useMemo(
		() => (FULLSCREEN_TABS.includes(activeTab) || isFullscreen ? "maximized" : "minimized"),
		[isFullscreen, activeTab]
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
		dispatch(PrintEngineActions.editorPropsChanged({ printModelId, navigationPath }));
	}, [dispatch, printModelId, navigationPath]);

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
								{isCommitting && <ProgressIndicator />}
							</ThemeProvider>
						</HiddenHeightContextWrapper>
					</DndProvider>
				</EditorComponentContext.Provider>
			)}
		</>
	);
};
