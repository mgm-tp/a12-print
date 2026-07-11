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
import { useDispatch, useSelector } from "react-redux";
import { useCallback, useMemo } from "react";
import type { Store } from "@reduxjs/toolkit";

import type {
	InteractionLogPersistentEntry,
	LogPersistentEntry,
	PartialTransactionLogPersistentEntry,
} from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import type { Model } from "@com.mgmtp.a12.base/base-model-api";
import { InternalPrintModelEditorSME } from "@com.mgmtp.a12.print/print-model-editor-component/a12internal/components";
import type {
	EditorComponentApiActions,
	PrintEngineState,
} from "@com.mgmtp.a12.print/print-model-editor-component/a12internal/api";
import type { FontResourceMap } from "@com.mgmtp.a12.print/print-fonts";

import { EditorActions, EditorSelector } from "../../../store/editor";
import { NotificationActions } from "../../../store/notification";
import { PreviewActions } from "../../../store/preview";

import { createTestAppStaticImageProvider } from "./staticImageProviderTestApp";

interface PrintEditorProps {
	printModel: Model;
	documentModels?: Model[];
	typesettingModels?: Model[];
	templatePrintModels?: Model[];
	logPersistentEntries: LogPersistentEntry[];
	store?: PrintEngineState;
	customFonts: FontResourceMap;
}

const devProps: Record<string, string[]> = {
	roles: ["admin", "guest"],
};

const precompilePrintModel = () => Promise.resolve([]);
const onDeploy = () => undefined;

export function PrintModelEditorSMEWrapper({
	printModel,
	templatePrintModels = [],
	documentModels = [],
	typesettingModels = [],
	logPersistentEntries,
	store,
	customFonts,
}: Readonly<PrintEditorProps>) {
	const dispatch = useDispatch();
	const caseConfig = useSelector(EditorSelector.selectCaseConfig);
	const caseId = caseConfig?.id;

	const onClose = useCallback(() => {
		dispatch(EditorActions.clearEditorState());
	}, [dispatch]);

	const hasExternalStore = useSelector(EditorSelector.selectHasExternalStore);

	const onPreview = useCallback(() => {
		if (caseId) {
			dispatch(PreviewActions.openPreview({ caseId }));
		}
	}, [dispatch, caseId]);

	const onChange = useCallback(
		(
			printModelId: string,
			transactionLogs?: PartialTransactionLogPersistentEntry[],
			interactionLog?: InteractionLogPersistentEntry
		) => {
			dispatch(EditorActions.persistLogs({ printModelId, transactionLogs, interactionLog }));
		},
		[dispatch]
	);

	const commitPrintModel = useCallback(
		(committedPrintModel: Model, overwriteLog: boolean, persistentEntries?: LogPersistentEntry[]) => {
			dispatch(
				EditorActions.commitPrintModel({ printModel: committedPrintModel, overwriteLog, persistentEntries })
			);
		},
		[dispatch]
	);

	const discardAllLogs = useCallback(() => {
		dispatch(EditorActions.discardChanges());
	}, [dispatch]);

	const showNotification = useCallback(
		(notification: EditorComponentApiActions.AddNotificationPayload) => {
			dispatch(
				NotificationActions.add({
					title: getNotificationTitle(notification.title?.key),
					message: String(notification.message?.args?.message.value),
					duration: notification.duration,
					severity: notification.severity,
				})
			);
		},
		[dispatch]
	);

	const setPrintModelReferences = useCallback(
		(printModels: Model[]) => {
			return new Promise<void>(resolve => {
				// Workaround: This make the printModels selector get new data and provide for PrintModelEditorSME before the editor fetch new data
				const resolveAfterTick = () => nextTick(resolve);

				dispatch(
					EditorActions.setPrintModelReferences({
						printModels,
						resolve: resolveAfterTick,
					})
				);
			});
		},
		[dispatch]
	);

	const printState = useCallback((store: Store) => {
		if (process.env.TEST) {
			store.subscribe(() => {
				window.store = store.getState();
			});
		}
	}, []);

	const printModels = useMemo(() => {
		return [...templatePrintModels, printModel];
	}, [templatePrintModels, printModel]);

	const staticImageProvider = useMemo(() => createTestAppStaticImageProvider(caseId ?? ""), [caseId]);

	const loadReferencedDocumentModels = useCallback(
		(ids: string[]) => {
			return documentModels.filter(dm => ids.includes(dm.header.id));
		},
		[documentModels]
	);

	return (
		<InternalPrintModelEditorSME
			printModel={printModel}
			printModels={printModels}
			documentModelIds={documentModels.map(dm => dm.header.id)}
			loadReferencedDocumentModels={loadReferencedDocumentModels}
			typesettingModels={typesettingModels}
			setPrintModels={setPrintModelReferences}
			commitPrintModel={commitPrintModel}
			onPreview={onPreview}
			onClose={onClose}
			onDeploy={onDeploy}
			customFonts={customFonts}
			precompilePrintModel={precompilePrintModel}
			discardAllLogs={discardAllLogs}
			logPersistentEntries={logPersistentEntries}
			showNotification={showNotification}
			onPrintModelChange={onChange}
			onValidationStateChange={() => {}}
			modelIconPath="images/Model-Print.svg"
			isConnectedToServer={false}
			onSetStore={printState}
			initialState={store}
			hasExternalStore={hasExternalStore}
			availableRoles={devProps.roles}
			staticImageProvider={staticImageProvider}
		/>
	);
}

function nextTick(fn: () => void) {
	setTimeout(fn);
}

function getNotificationTitle(key?: string) {
	if (!key) {
		return "";
	}
	const variant = key.split(".").pop();

	return variant?.toUpperCase();
}
