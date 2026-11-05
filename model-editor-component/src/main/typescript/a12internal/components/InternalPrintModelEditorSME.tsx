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
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import type { Store } from "redux";
import { Provider } from "react-redux";

import { DefaultLocalizerContextProvider } from "@com.mgmtp.a12.utils/utils-localization-react";
import type { Locale } from "@com.mgmtp.a12.utils/utils-localization";
import { defaultLocalizerFactory } from "@com.mgmtp.a12.utils/utils-localization";

import { GeneralViewActions } from "../../internal/redux/index.js";
import { useGetPrintComponentMessage } from "../../internal/components/app/hooks/use-get-print-component-message.js";
import type { RequestApiContext } from "../../internal/components/app/sme/setup-store.js";
import { setInitialState, setupStore } from "../../internal/components/app/sme/setup-store.js";
import { PrintModelEditorSMEView } from "../../internal/components/app/sme/PrintModelEditorSMEView.js";
import type { PrintEditorSMEProps } from "../../internal/components/app/sme/types.js";

import type { PrintEngineState } from "../api/PrintEngineState.js";
import type { EditorComponentApiActions } from "../api/index.js";

const DEFAULT_LOCALE: Locale = { language: "en", country: "US" };

interface InternalPrintEditorSMEProps extends PrintEditorSMEProps {
	initialState?: PrintEngineState;
	onSetStore?: (store: Store) => void;
	hasExternalStore?: boolean;
	availableRoles?: string[];
}

export const InternalPrintModelEditorSME = ({
	printModel,
	logPersistentEntries,
	printModels,
	documentModelIds,
	typesettingModels,
	setPrintModels,
	loadReferencedDocumentModels,
	commitPrintModel,
	onPrintModelChange,
	onValidationStateChange,
	onClose,
	onDeploy,
	onPreview,
	showNotification,
	discardAllLogs,
	precompilePrintModel,
	locale = DEFAULT_LOCALE,
	customFonts,
	modelIconPaths,
	isConnectedToServer,
	initialState,
	onSetStore,
	hasExternalStore,
	availableRoles,
	staticImageProvider,
	navigationPath,
	onNavigateToPrintModel,
}: InternalPrintEditorSMEProps) => {
	const defaultLocalizer = useMemo(
		() =>
			defaultLocalizerFactory({
				locale,
			}),
		[locale]
	);

	// Updated via useLayoutEffect so .current is never read or written during render
	const propsRef = useRef({
		printModel,
		printModels,
		documentModelIds,
		typesettingModels,
		logPersistentEntries,
		setPrintModels,
		loadReferencedDocumentModels,
		commitPrintModel,
		onPrintModelChange,
		onValidationStateChange,
		discardAllLogs,
		showNotification,
		precompilePrintModel,
		onNavigateToPrintModel,
	});

	useLayoutEffect(() => {
		propsRef.current = {
			printModel,
			printModels,
			documentModelIds,
			typesettingModels,
			logPersistentEntries,
			setPrintModels,
			loadReferencedDocumentModels,
			commitPrintModel,
			onPrintModelChange,
			onValidationStateChange,
			discardAllLogs,
			showNotification,
			precompilePrintModel,
			onNavigateToPrintModel,
		};
	});

	const requestApiContext = useMemo<RequestApiContext>(
		() => ({
			get printModel() {
				return propsRef.current.printModel;
			},
			set printModel(v) {
				propsRef.current.printModel = v;
			},
			get printModels() {
				return propsRef.current.printModels ?? [];
			},
			get documentModelIds() {
				return propsRef.current.documentModelIds ?? [];
			},
			get typesettingModels() {
				return propsRef.current.typesettingModels ?? [];
			},
			get logPersistentEntries() {
				return propsRef.current.logPersistentEntries;
			},
			get setPrintModels() {
				return propsRef.current.setPrintModels ?? (async () => {});
			},
			get loadReferencedDocumentModels() {
				return propsRef.current.loadReferencedDocumentModels ?? (() => []);
			},
			get commitPrintModel() {
				return propsRef.current.commitPrintModel ?? (async () => {});
			},
			get onPrintModelChange() {
				return propsRef.current.onPrintModelChange ?? (() => {});
			},
			get onValidationStateChange() {
				return propsRef.current.onValidationStateChange ?? (() => {});
			},
			get discardAllLogs() {
				return propsRef.current.discardAllLogs ?? (() => {});
			},
			get showNotification() {
				return propsRef.current.showNotification ?? (() => {});
			},
			get precompilePrintModel() {
				return (
					propsRef.current.precompilePrintModel ??
					(async () => {
						return [];
					})
				);
			},
			get onNavigateToPrintModel() {
				return propsRef.current.onNavigateToPrintModel;
			},
		}),
		// propsRef is a stable ref — intentionally omitted from deps
		[]
	);

	const getPrintComponentMessage = useGetPrintComponentMessage();

	const showSMENotification = useCallback(
		(notification: EditorComponentApiActions.AddNotificationPayload) => {
			let localizedMessage;
			if (notification.message) {
				const { key, args } = notification.message;
				localizedMessage = getPrintComponentMessage(defaultLocalizer, key, args);
			}
			showNotification({
				...notification,
				title: {
					key: `notification.title.${notification.severity}`,
				},
				message: {
					key: "notification.content",
					args: {
						message: { type: "plain", value: localizedMessage },
					},
				},
			});
		},
		[defaultLocalizer, getPrintComponentMessage, showNotification]
	);

	const store = useMemo(() => {
		return setupStore(requestApiContext, showSMENotification, locale, staticImageProvider);
	}, [locale, requestApiContext, staticImageProvider, showSMENotification]);

	useEffect(() => {
		onSetStore?.(store);
	}, [store, onSetStore]);

	useEffect(() => {
		if (hasExternalStore) {
			initialState && store.dispatch(setInitialState(initialState));
		}
	}, [hasExternalStore, initialState, store]);

	useEffect(() => {
		store.dispatch(GeneralViewActions.setAvailableRoles(availableRoles || []));
	}, [availableRoles, store]);

	return (
		<Provider store={store}>
			<DefaultLocalizerContextProvider locale={locale}>
				<PrintModelEditorSMEView
					printModelId={printModel.header.id}
					customFonts={customFonts}
					onClose={onClose}
					onDeploy={onDeploy}
					onPreview={onPreview}
					isConnectedToServer={isConnectedToServer}
					navigationPath={navigationPath}
					modelIconPaths={modelIconPaths}
				/>
			</DefaultLocalizerContextProvider>
		</Provider>
	);
};
