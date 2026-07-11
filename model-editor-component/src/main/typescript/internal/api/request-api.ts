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
import type { Header, Model } from "@com.mgmtp.a12.base/base-model-api";
import type { DeepPartialErrorMap } from "@com.mgmtp.a12.print/print-model-api/errors";
import type { PageOrientation, PrintModel } from "@com.mgmtp.a12.print/print-model-api/model";
import type {
	InteractionLogPersistentEntry,
	LogPersistentEntry,
	PartialTransactionLogPersistentEntry,
	PrintValidator,
} from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import type { TypesettingModel } from "@com.mgmtp.a12.print/print-typesetting/a12internal/api";
import type { EntityInstancePath } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import type { ValidationState } from "../../a12internal/api/ValidationState.js";
import type { PrintMessage } from "../../a12internal/api/PrintMessageReport.js";
import type { StaticImageData, SaveStaticImageResponse } from "../../api/StaticImageProvider.js";

export interface RequestApi {
	loadPrintModel: (printModelId: string) => Promise<LoadPrintModelResponse | undefined>;
	loadReferencedDocumentModels: (ids: string[]) => Promise<Model[]>;
	loadDocumentModelIds: () => Promise<string[]>;
	loadTypesettingModelHeaders: () => Promise<Header[]>;
	loadTypesettingModel: (typesettingModelId: string) => Promise<TypesettingModel | undefined>;
	loadPrintModelIds: () => Promise<string[]>;
	loadDINTemplateSegments: (id: string) => Promise<DINTemplateSegment[]>;
	setPrintModel: (
		printModel: PrintModel,
		overwriteLog: boolean,
		persistentEntries?: LogPersistentEntry[]
	) => Promise<SetPrintModelResponse | undefined>;
	persistTransactionLog: (
		transactionLogPersistentEntries: PartialTransactionLogPersistentEntry[],
		printModelId: string
	) => void;
	persistInteractionLog: (printModelId: string, interactionLogPersistentEntry: InteractionLogPersistentEntry) => void;
	onValidationStateChange: (validationState: ValidationState) => void;
	setPrintModelReferences: (payload: SetPrintModelReferencesPayload) => Promise<UpdatedReferenceModels | undefined>;
	serializePrintModel: (apiObject: PrintModel, relevantPaths?: EntityInstancePath[]) => void;
	deserializePrintModel: (validatorInput: PrintValidator.Input, relevantPaths?: EntityInstancePath[]) => void;
	listStaticImages: () => Promise<string[]>;
	loadStaticImage: (name: string) => Promise<StaticImageData | undefined>;
	uploadStaticImage: (data: StaticImageData) => Promise<SaveStaticImageResponse | undefined>;
	discardAllLogs?: () => void;
}

interface LoadPrintModelResponse {
	printModel?: PrintModel;
	logPersistentEntries?: LogPersistentEntry[];
	errorMap?: DeepPartialErrorMap<PrintModel>;
}

export interface SetPrintModelResponse {
	printModel?: PrintModel;
	errorMap?: DeepPartialErrorMap<PrintModel>;
	precompileMessages?: PrintMessage[];
}

export interface SetPrintModelReferencesPayload {
	readonly incomingPrintModelId: string;
	readonly outgoingPrintModelId: string;
}

export interface UpdatedReferenceModels {
	readonly printModel: PrintModel;
	readonly templatePrintModel: PrintModel;
}

export namespace UpdatedReferenceModels {
	export function isInstance(obj: unknown): obj is UpdatedReferenceModels {
		return obj instanceof Object && "printModel" in obj && "templatePrintModel" in obj;
	}
}

export interface DINTemplateSegment {
	readonly segmentId: string;
	readonly segmentTitle: string;
	readonly pageOrientation: PageOrientation;
}
