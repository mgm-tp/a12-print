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
import { applyMiddleware, createStore, type Middleware, type Reducer } from "redux";
import { composeWithDevTools } from "@redux-devtools/extension";

import type { DocumentModel, EntityInstancePath } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import type { PrintModel } from "@com.mgmtp.a12.print/print-model-api/model";
import type { Locale } from "@com.mgmtp.a12.utils/utils-localization";
import type { PrintValidator } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import { DocumentModelUtils } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import { PrintModelMarshaller } from "@com.mgmtp.a12.print/print-model-api-utils/marshaller";
import type { Model } from "@com.mgmtp.a12.base/base-model-api";
import type { TypesettingModel } from "@com.mgmtp.a12.print/print-typesetting/a12internal/api";
import { TypesettingModelMarshaller } from "@com.mgmtp.a12.print/print-typesetting/a12internal/api";
import { LoggerFactory } from "@com.mgmtp.a12.utils/utils-logging";

import type { DINTemplateSegment, RequestApi, UpdatedReferenceModels } from "../../../api/index.js";
import { PrintEditorComponentReducer } from "../../../store/root-reducer.js";
import { PrintEditorComponentSagas } from "../../../sagas/index.js";
import createSagaMiddleware from "../../../redux-saga/index.js";
import type { PrintEngineState } from "../../../../a12internal/api/PrintEngineState.js";
import type { ValidationState } from "../../../../a12internal/api/ValidationState.js";
import { EditorComponentApiActions } from "../../../../a12internal/api/actions-api.js";
import { actionCreatorFactory } from "../../../redux/actionCreatorFactory/actionCreatorFactory.js";
import { PrintMessageSeverity } from "../../../../a12internal/api/PrintMessageReport.js";
import type {
	StaticImageData,
	StaticImageProvider,
	SaveStaticImageResponse,
} from "../../../../api/StaticImageProvider.js";
import { resolveImagesDataOfPrintModel } from "../../../../a12internal/components/utils/static-image.js";
import { RequestApiSelectors } from "../../../redux/request-api/selectors.js";
import { DocumentModelDataActions } from "../../../redux/document-model-data/actions.js";

import type { PrintEditorSMEProps } from "./types.js";
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
	locale: Locale,
	staticImageProvider: StaticImageProvider
) {
	const typesettingModelsInstances = getDeserializeTypesettingModels(requestApiContext.typesettingModels);

	const requestApi: RequestApi = {
		loadPrintModel: (printModelId: string) => {
			const printModel =
				printModelId === requestApiContext.printModel.header.id
					? requestApiContext.printModel
					: requestApiContext.printModels?.find(model => model.header.id === printModelId);
			const logPersistentEntries = requestApiContext.logPersistentEntries;

			if (!printModel) {
				return Promise.resolve({ printModel: undefined, logPersistentEntries });
			}

			const requiredDocumentModelIds =
				printModel.header.modelReferences
					?.filter(ref => ref.reference && ref.modelType === "document")
					.map(ref => ref.reference) ?? [];

			const rawDocumentModels = requestApiContext.loadReferencedDocumentModels(requiredDocumentModelIds);
			const documentModels = DocumentModelUtils.getDeserializedDocumentModels(rawDocumentModels);
			store.dispatch(
				DocumentModelDataActions.setDocumentModelData(
					documentModels.map(dm => ({
						id: dm.header.id,
						documentModelData: DocumentModelUtils.getDocumentModelData(dm, locale),
					}))
				)
			);

			const deserializedResult = printModelMarshaller.deserialize(
				printModel as unknown as Record<string, unknown>,
				{ html: false, references: { documentModels } }
			);

			return Promise.resolve({
				printModel: deserializedResult.result,
				logPersistentEntries,
				errorMap: deserializedResult.report.noErrorOccurred ? undefined : deserializedResult.report.errorMap,
			});
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
			const documentModels = getDocumentModelsFromStore(store.getState());
			const serializedResult = printModelMarshaller.serialize(printModel, {
				html: false,
				references: { documentModels },
			});
			if (!serializedResult.result) {
				return { errorMap: serializedResult.report.errorMap };
			}

			const documentModelIds = documentModels.map(dm => dm.header.id);
			const serializedDocumentModels = requestApiContext.loadReferencedDocumentModels(documentModelIds);

			const { printModels } = requestApiContext;
			const { documentModelMap, printModelMap } = getModelReferencesMaps(
				printModel,
				serializedDocumentModels,
				printModels
			);
			const images = await resolveImagesDataOfPrintModel(
				printModel,
				staticImageProvider,
				RequestApiSelectors.resources(store.getState())
			);

			const precompileMessages = await requestApiContext.precompilePrintModel({
				printModel: JSON.stringify(serializedResult.result),
				documentModelMap,
				printModelMap,
				images,
			});
			if (
				!precompileMessages ||
				precompileMessages.some(message => message.severity === PrintMessageSeverity.ERROR)
			) {
				return { precompileMessages };
			}

			requestApiContext.commitPrintModel(serializedResult.result, overwriteLog, persistentEntries);
			return { printModel, precompileMessages };
		},
		persistTransactionLog: (transactionLogPersistentEntries, printModelId) => {
			requestApiContext.onPrintModelChange?.(printModelId, transactionLogPersistentEntries, undefined);
		},
		persistInteractionLog: (printModelId, interactionLogPersistentEntry) => {
			requestApiContext.onPrintModelChange?.(printModelId, undefined, interactionLogPersistentEntry);
		},
		onValidationStateChange: (validationState: ValidationState) => {
			requestApiContext.onValidationStateChange?.(validationState);
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

			return undefined;
		},
		serializePrintModel(apiObject: PrintModel, relevantPaths?: EntityInstancePath[]) {
			const documentModels = getDocumentModelsFromStore(store.getState());
			const result = printModelMarshaller.serialize(apiObject, {
				html: false,
				references: { documentModels },
				partial: { relevantPaths },
			});
			store.dispatch(EditorComponentApiActions.setSerializePrintModelResult(result));
		},
		deserializePrintModel(_validatorInput: PrintValidator.Input, relevantPaths?: EntityInstancePath[]) {
			const documentModels = getDocumentModelsFromStore(store.getState());
			const result = printModelMarshaller.deserialize(_validatorInput, {
				html: false,
				references: { documentModels },
				partial: { relevantPaths },
			});
			store.dispatch(EditorComponentApiActions.setDeserializePrintModelResult(result));
		},
		discardAllLogs() {
			requestApiContext.discardAllLogs?.();
		},
		listStaticImages: function (): Promise<string[]> {
			return staticImageProvider.listStaticImages();
		},
		loadStaticImage: function (name: string): Promise<StaticImageData | undefined> {
			return staticImageProvider.loadStaticImage(name);
		},
		uploadStaticImage: function (resource: StaticImageData): Promise<SaveStaticImageResponse | undefined> {
			return staticImageProvider.uploadStaticImage(resource);
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

function getDocumentModelsFromStore(state: PrintEngineState): DocumentModel[] {
	return Object.values(state.DocumentModelData || {}).flatMap(dm => dm?.model ?? []);
}
