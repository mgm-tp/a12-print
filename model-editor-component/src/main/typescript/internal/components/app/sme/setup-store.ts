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
import { applyMiddleware, createStore, Middleware, Reducer } from "redux";
import { composeWithDevTools } from "@redux-devtools/extension";
import { actionCreatorFactory } from "typescript-fsa";

import { EntityInstancePath } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import { PrintModel } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { Locale } from "@com.mgmtp.a12.utils/utils-localization/lib/main/index.js";
import {
	PrintValidationMode,
	PrintValidator,
} from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/validation/index.js";
import { PrintModelMarshaller } from "@com.mgmtp.a12.print/print-model-api-utils/lib/marshaller/index.js";
import { Model } from "@com.mgmtp.a12.base/base-model-api/lib/main/model/index.js";
import { TypesettingModelMarshaller } from "@com.mgmtp.a12.print/print-typesetting/lib/internal/api/marshaller/model-marshaller.js";
import { LoggerFactory } from "@com.mgmtp.a12.utils/utils-logging";
import { TypesettingModel } from "@com.mgmtp.a12.print/print-typesetting/lib/internal/api/model/typesetting-model.js";

import {
	DINTemplateSegment,
	EditorComponentApiActions,
	RequestApi,
	UpdatedReferenceModels,
} from "../../../api/index.js";
import { PrintEditorComponentReducer, PrintEngineState } from "../../../store/root-reducer.js";
import { PrintEditorComponentSagas } from "../../../sagas/index.js";
import createSagaMiddleware from "../../../redux-saga/index.js";
import { ValidationState } from "../../../redux/index.js";

import { PrintEditorSMEProps } from "./types.js";
import { setSegmentReferences } from "./utils/set-segment-references.js";
import { getModelReferencesMaps } from "./utils/model-references.js";
import { getDinTemplateSegments } from "./utils/get-din-template-segments.js";

const printModelMarshaller = new PrintModelMarshaller();
const typesettinMarshaller = new TypesettingModelMarshaller();

const logger = LoggerFactory.getLogger("PrintModelEditorSME");

export type RequestApiContext = Pick<
	PrintEditorSMEProps,
	| "printModel"
	| "printModels"
	| "logPersistentEntries"
	| "documentModelIds"
	| "loadReferencedDocumentModels"
	| "typesettingModels"
	| "commitPrintModel"
	| "onPrintModelChange"
	| "onValidationStateChange"
	| "discardAllLogs"
	| "setPrintModels"
	| "showNotification"
	| "precompilePrintModel"
>;

function getDeserializeTypesettingModels(models: Model[]): TypesettingModel[] {
	return models
		.map(model => {
			const { report, result } = typesettinMarshaller.deserialize(JSON.stringify(model));
			if (result) {
				return result;
			}
			logger.error(`Cannot deserilize typesetting model ${model.header.id}`, report.errorMap);
			return undefined;
		})
		.filter(Boolean) as TypesettingModel[];
}

export function setupStore(
	requestApiContext: RequestApiContext,
	showNotification: (notification: EditorComponentApiActions.AddNotificationPayload) => void,
	locale: Locale
) {
	const typesettingModelsInstances = getDeserializeTypesettingModels(requestApiContext.typesettingModels);

	const requestApi: RequestApi = {
		loadPrintModel: (printModelId: string) => {
			const documentModelDataMap = store.getState().DocumentModelData || {};
			const documentModels = documentModelDataMap
				? Object.values(documentModelDataMap).flatMap(dm => dm?.model ?? [])
				: [];

			const printModel =
				printModelId === requestApiContext.printModel.header.id
					? requestApiContext.printModel
					: requestApiContext.printModels?.find(model => model.header.id === printModelId);
			const logPersistentEntries = requestApiContext.logPersistentEntries;

			if (!printModel) {
				return Promise.resolve({ printModel: undefined, logPersistentEntries });
			}
			const deserializedResult = printModelMarshaller.deserialize(
				printModel as unknown as Record<string, unknown>,
				documentModels
			);

			if (deserializedResult.report.noErrorOccurred && deserializedResult.result) {
				return Promise.resolve({
					printModel: deserializedResult.result,
					logPersistentEntries,
				});
			} else {
				const errorMap = deserializedResult.report.errorMap;
				return Promise.resolve({ errorMap });
			}
		},
		loadReferencedDocumentModels: (ids: string[]) => {
			const documentModels = requestApiContext.loadReferencedDocumentModels(ids);
			return Promise.resolve(documentModels);
		},
		loadDocumentModelIds: () => {
			return Promise.resolve(requestApiContext.documentModelIds || []);
		},
		loadTypesettingModelHeaders: () => {
			return Promise.resolve(typesettingModelsInstances.map(model => model.header));
		},
		loadTypesettingModel: (typesettingId: string) => {
			return Promise.resolve(typesettingModelsInstances.find(model => model.header.id === typesettingId));
		},
		setPrintModel: async (printModel, overwriteLog, persistentEntries) => {
			const documentModelDataMap = store.getState().DocumentModelData || {};
			const documentModels = documentModelDataMap
				? Object.values(documentModelDataMap).flatMap(dm => dm?.model ?? [])
				: [];

			const serializedResult = printModelMarshaller.serialize(printModel, documentModels);
			if (!serializedResult.result) {
				return Promise.resolve({ errorMap: serializedResult.report.errorMap });
			}

			const printModelSerialized = JSON.stringify(serializedResult.result);

			const documentModelIds = Object.values(documentModelDataMap)
				.map(dm => dm?.model.header.id ?? [])
				.flat();

			const serializedDocumentModels = requestApiContext.loadReferencedDocumentModels(documentModelIds);

			const { printModels } = requestApiContext;
			const { documentModelMap, printModelMap } = getModelReferencesMaps(
				printModel,
				serializedDocumentModels,
				printModels
			);
			const preCompilePrintModelResponse = await requestApiContext.precompilePrintModel({
				printModel: printModelSerialized,
				documentModelMap,
				printModelMap,
			});
			if (!preCompilePrintModelResponse) {
				return Promise.resolve({ hasPreCompileError: true });
			}

			requestApiContext.commitPrintModel(JSON.parse(printModelSerialized), overwriteLog, persistentEntries);
			return Promise.resolve({ printModel });
		},
		persistTransactionLog: (transactionLogPersistentEntries, printModelId) => {
			requestApiContext.onPrintModelChange &&
				requestApiContext.onPrintModelChange(printModelId, transactionLogPersistentEntries, undefined);
		},
		persistInteractionLog: (printModelId, interactionLogPersistentEntry) => {
			requestApiContext.onPrintModelChange &&
				requestApiContext.onPrintModelChange(printModelId, undefined, interactionLogPersistentEntry);
		},
		onValidationStateChange: (validationState: ValidationState) => {
			requestApiContext.onValidationStateChange && requestApiContext.onValidationStateChange(validationState);
		},
		loadPrintModelIds(): Promise<string[]> {
			return Promise.resolve(requestApiContext.printModels.map(model => model.header.id));
		},
		loadDINTemplateSegments(id: string): Promise<DINTemplateSegment[]> {
			const selectedModel = requestApiContext.printModels.find(model => model.header.id === id);

			if (!selectedModel) {
				return Promise.resolve([]);
			}
			return Promise.resolve(getDinTemplateSegments(selectedModel));
		},
		async setPrintModelReferences({
			incomingPrintModelId,
			outgoingPrintModelId,
		}): Promise<UpdatedReferenceModels | undefined> {
			const incomingPrintModel = requestApiContext.printModels.find(
				model => model.header.id === incomingPrintModelId
			);

			const outgoingPrintModel = requestApiContext.printModels.find(
				model => model.header.id === outgoingPrintModelId
			);

			if (!incomingPrintModel || !outgoingPrintModel) {
				throw new Error("Print models not found");
			}

			const [printModel, templatePrintModel] = setSegmentReferences(outgoingPrintModel, incomingPrintModel);

			requestApiContext.printModel = printModel;

			await requestApiContext.setPrintModels([printModel, templatePrintModel]);

			return Promise.resolve(undefined);
		},
		serializePrintModel(apiObject: PrintModel, relevantPaths?: EntityInstancePath[]) {
			const documentModelDataMap = store.getState().DocumentModelData || {};
			const documentModels = documentModelDataMap
				? Object.values(documentModelDataMap).flatMap(dm => dm?.model ?? [])
				: [];
			const result = printModelMarshaller.serialize(
				apiObject,
				documentModels,
				PrintValidationMode.FULL,
				relevantPaths
			);
			store.dispatch(EditorComponentApiActions.setSerializePrintModelResult(result));
		},
		deserializePrintModel(_validatorInput: PrintValidator.Input, relevantPaths?: EntityInstancePath[]) {
			const documentModelDataMap = store.getState().DocumentModelData || {};
			const documentModels = documentModelDataMap
				? Object.values(documentModelDataMap).flatMap(dm => dm?.model ?? [])
				: [];
			const result = printModelMarshaller.deserialize(
				_validatorInput,
				documentModels,
				PrintValidationMode.FULL,
				relevantPaths
			);
			store.dispatch(EditorComponentApiActions.setDeserializePrintModelResult(result));
		},
		discardAllLogs() {
			requestApiContext.discardAllLogs && requestApiContext.discardAllLogs();
		},
	};

	const sagaMiddleware = createSagaMiddleware({
		context: {
			requestApi,
			getLocale(): Locale {
				return locale;
			},
		},
	});
	const store = createStore(
		customRootReducer,
		composeWithDevTools(applyMiddleware(sagaMiddleware, catchNotificationMiddleware(showNotification)))
	);

	sagaMiddleware.run(PrintEditorComponentSagas.rootSaga);

	return store;
}

const factory = actionCreatorFactory("Print");

export const setInitialState = factory<PrintEngineState>("SET_INITIAL_STATE");

const customRootReducer: Reducer<PrintEngineState> = (state, action) => {
	if (setInitialState.match(action)) {
		return action.payload;
	}
	return PrintEditorComponentReducer.rootReducer(state, action);
};

function catchNotificationMiddleware(
	showNotification: (notification: EditorComponentApiActions.AddNotificationPayload) => void
): Middleware {
	return () => next => action => {
		const result = next(action);
		if (EditorComponentApiActions.addNotification.match(action)) {
			showNotification(action.payload);
		}
		return result;
	};
}
