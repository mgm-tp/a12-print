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
import type { Header } from "@com.mgmtp.a12.base/base-model-api";
import type { PrintModel } from "@com.mgmtp.a12.print/print-model-api/model";
import type { TypesettingModel } from "@com.mgmtp.a12.print/print-typesetting/a12internal/api";

import type { DINTemplateSegment } from "../../api/request-api.js";
import type { StaticImageData } from "../../../api/StaticImageProvider.js";

import { actionCreatorFactory } from "../actionCreatorFactory/actionCreatorFactory.js";

const factory = actionCreatorFactory("Print/RequestApi");

export namespace RequestApiActions {
	export const loadPrintModel = factory<string>("LOAD_PRINT_MODEL");
	export const loadReferencedPrintModel = factory<string>("LOAD_REFERENCED_PRINT_MODEL");
	export const loadReferencedPrintModels = factory<void>("LOAD_REFERENCED_PRINT_MODELS");
	export const loadDocumentModelIds = factory<void>("LOAD_DOCUMENT_MODEL_IDS");
	export const loadDINTemplatePrintModel = factory<string>("LOAD_DIN_TEMPLATE_PRINT_MODEL");
	export const loadPrintModelIds = factory<void>("LOAD_PRINT_MODEL_IDS");
	export const loadTypesettingModelHeaders = factory<void>("LOAD_TYPE_SETTING_MODEL_HEADERS");
	export const loadTypesettingModel = factory<string>("LOAD_TYPE_SETTING_MODEL");
	export const loadTypesettingModels = factory<void>("LOAD_TYPE_SETTING_MODELS");

	export const setPrintModel = factory<PrintModel>("SET_PRINT_MODEL");
	export const setDocumentModelIds = factory<string[]>("SET_DOCUMENT_MODEL_IDS");
	export const setPrintModelData = factory<{ id: string; printModel: PrintModel }>("SET_PRINT_MODEL_DATA");
	export const setDINTemplatePrintModel = factory<{ id: string; templateSegments: DINTemplateSegment[] }>(
		"SET_DIN_TEMPLATE_PRINT_MODEL"
	);
	export const setPrintModelIds = factory<string[]>("SET_PRINT_MODEL_IDS");
	export const setTypesettingModelHeaders = factory<Header[]>("SET_TYPE_SETTING_MODEL_HEADERS");
	export const setTypesettingModel = factory<TypesettingModel>("SET_TYPE_SETTING_MODEL");
	export const setTypesettingModels = factory<TypesettingModel[]>("SET_TYPE_SETTING_MODELS");

	export const initializePrintModel = factory<string>("INITIALIZE_PRINT_MODEL");

	export const listStaticImages = factory<{ noCache?: boolean }>("LIST_RESOURCES");
	export const loadStaticImage = factory<string>("LOAD_RESOURCE");
	export const selectResource = factory<{ elementId: string; resourceName: string }>("SELECT_RESOURCE");
	export const uploadStaticImage = factory<StaticImageData>("UPLOAD_RESOURCE");
	export const setAvailableResources = factory<string[]>("SET_AVAILABLE_RESOURCE");
	export const setResource = factory<StaticImageData>("SET_RESOURCE");
	export const setLastUploadedResource = factory<string | undefined>("SET_LAST_UPLOADED_RESOURCE");
}
