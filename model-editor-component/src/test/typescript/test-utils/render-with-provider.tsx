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
import { ReactElement, ReactNode, useContext } from "react";
import { applyMiddleware, combineReducers, createStore, Reducer } from "redux";
import { render as rtlRender, queryHelpers } from "@testing-library/react";
import { Provider, useSelector } from "react-redux";
import { StyleSheetManager, ThemeProvider } from "styled-components";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";
import createSagaMiddleware from "redux-saga";
import { all, fork } from "typed-redux-saga";
import { queries } from "@testing-library/react";

import { defaultTheme } from "@com.mgmtp.a12.widgets/widgets-core/lib/theme/default/default-theme.js";
import { shouldForwardProp } from "@com.mgmtp.a12.widgets/widgets-core/lib/common/main/should-forward-prop.js";
import {
	Locale,
	LocalizableArgs,
	localizableFromLocalizationTreeMap,
} from "@com.mgmtp.a12.utils/utils-localization/lib/main/index.js";
import {
	DefaultLocalizerContextProvider,
	LocalizerContext,
} from "@com.mgmtp.a12.utils/utils-localization-react/lib/main/index.js";

import { PrintEngineState } from "../../../main/typescript/internal/store/root-reducer.js";
import { EditorStateReducer } from "../../../main/typescript/internal/redux/editor-state/index.js";
import { DetailDataReducer } from "../../../main/typescript/internal/redux/detail-data/index.js";
import {
	ConfirmationDialogReducer,
	GeneralViewReducer,
	InteractionLogReducer,
	RequestApiReducer,
	SidebarReducer,
	TransactionLogStateReducer,
	ValidationReducer,
	WrapperReducer,
} from "../../../main/typescript/internal/redux/index.js";
import { PrintEditorComponentSagas } from "../../../main/typescript/internal/sagas/index.js";
import { PrintEngineSelectors } from "../../../main/typescript/internal/store/selectors.js";
import { ContextApi, EditorComponentContext, ILocalizer } from "../../../main/typescript/internal/api/index.js";
import { DEFAULT_RESOURCES } from "../../../main/typescript/internal/localization/index.js";

import { DevProps } from "./dev-props.js";
import { mockSagaMap } from "./mockSagaMap.js";

type PrintEngineReducers = Partial<Record<keyof PrintEngineState, Reducer>>;

function* mockRootSaga(args: string[] = ["startInteractionSaga"]) {
	const selectedMockSagas = Object.entries(mockSagaMap).filter(([key]) => args.includes(key));
	const mockSagas = Object.fromEntries(selectedMockSagas);
	const combinedSagas = { ...PrintEditorComponentSagas.sagas, ...mockSagas };
	yield* all(Object.values(combinedSagas).map(saga => fork(saga)));
}

const MockConfirmDialog = () => {
	const confirmDialog = useSelector(PrintEngineSelectors.confirmationDialogState);

	if (!confirmDialog) {
		return null;
	}

	return (
		<div>
			<p>Mock notifications</p>
			{confirmDialog && <div>Confirm to {confirmDialog.type}</div>}
		</div>
	);
};

export const renderWithProviders = (
	ui: ReactElement,
	reducers?: PrintEngineReducers,
	sagaArgs: string[] = ["startInteractionSaga"]
) => {
	function getLocale(): Locale {
		return { country: "US", language: "en" };
	}

	// @ts-expect-error: createSagaMiddleware context typing issue
	const sagaMiddleware = createSagaMiddleware({
		context: { requestApi: DevProps.requestApi, getLocale },
	});

	const store = createStore(
		combineReducers({
			PrintEditorState: EditorStateReducer,
			DetailData: DetailDataReducer,
			Sidebar: SidebarReducer,
			TransactionLogState: TransactionLogStateReducer,
			RequestApi: RequestApiReducer,
			InteractionLogState: InteractionLogReducer,
			ValidationState: ValidationReducer,
			Wrapper: WrapperReducer,
			ConfirmationDialogState: ConfirmationDialogReducer,
			GeneralViewState: GeneralViewReducer,
			...reducers,
		}),
		applyMiddleware(sagaMiddleware)
	);

	sagaMiddleware.run(() => mockRootSaga(sagaArgs));

	const LocaleWrapper = ({ children }: { children: ReactNode }) => {
		const { localizer } = useContext(LocalizerContext);
		const editorComponentContextValue: ContextApi = {
			localizer: ((key: string, args?: LocalizableArgs) =>
				localizer(localizableFromLocalizationTreeMap(key, DEFAULT_RESOURCES, args))) as ILocalizer,
			getFonts: () => ({}),
		};

		return (
			<EditorComponentContext.Provider value={editorComponentContextValue}>
				{children}
			</EditorComponentContext.Provider>
		);
	};

	const Wrapper = ({ children }: { children: ReactNode }) => (
		<StyleSheetManager shouldForwardProp={shouldForwardProp}>
			<DefaultLocalizerContextProvider locale={getLocale()}>
				<ThemeProvider theme={defaultTheme}>
					<DndProvider backend={HTML5Backend}>
						<Provider store={store}>
							<LocaleWrapper>
								{children}
								<MockConfirmDialog />
							</LocaleWrapper>
						</Provider>
					</DndProvider>
				</ThemeProvider>
			</DefaultLocalizerContextProvider>
		</StyleSheetManager>
	);

	const queryByDataType = queryHelpers.queryByAttribute.bind(null, "data-type");
	const queryAllByDataType = queryHelpers.queryAllByAttribute.bind(null, "data-type");

	return rtlRender(ui, {
		wrapper: Wrapper,
		queries: {
			...queries,
			queryByDataType,
			queryAllByDataType,
		},
	});
};
