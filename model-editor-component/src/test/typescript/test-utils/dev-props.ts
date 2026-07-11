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
import { LoggerFactory } from "@com.mgmtp.a12.utils/utils-logging";

import type { RequestApi } from "../../../main/typescript/internal/api/request-api.js";

const log = LoggerFactory.getLogger("MockRequestApi");

export namespace DevProps {
	export const printModelId = "";

	export const requestApi: RequestApi = {
		loadPrintModel: () => {
			log.warn("There is no print model for the requested print model id");
			return Promise.resolve(undefined);
		},
		loadReferencedDocumentModels: () => {
			return Promise.resolve([]);
		},
		loadDocumentModelIds() {
			return Promise.resolve([]);
		},
		loadTypesettingModelHeaders: () => {
			log.warn("loadTypesettingModels not implemented in dev version");
			return Promise.resolve([]);
		},
		loadTypesettingModel: () => {
			log.warn("loadTypesettingModel not implemented in dev version");
			return Promise.resolve(undefined);
		},
		setPrintModel: () => {
			log.warn("setPrintModel is not implemented in dev version");
			return Promise.resolve(undefined);
		},
		persistTransactionLog: () => {
			log.warn("persistTransactionLog not implemented in dev version");
		},
		persistInteractionLog: () => {
			log.warn("persistInteractionLog not implemented in dev version");
		},
		onValidationStateChange: () => {
			log.warn("onValidationStateChange not implemented in dev version");
		},
		loadDINTemplatePrintModels() {
			log.warn("loadDINTemplatePrintModels not implemented in dev version");
			return Promise.resolve([]);
		},
		setPrintModelReferences() {
			throw new Error("Function is not implemented.");
		},
		serializePrintModel() {
			log.error("serializePrintModel function not implemented in dev version");
		},
		deserializePrintModel() {
			log.error("deserializePrintModel function not implemented in dev version");
		},
		listStaticImages: () => {
			return Promise.resolve([]);
		},
		loadStaticImage: () => {
			return Promise.resolve(undefined);
		},
		uploadStaticImage: () => {
			return Promise.resolve(undefined);
		},
	};
}
