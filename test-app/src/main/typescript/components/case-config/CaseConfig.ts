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
import type { Model } from "@com.mgmtp.a12.base/base-model-api";
import type { PrintEngineState } from "@com.mgmtp.a12.print/print-model-editor-component/a12internal/api";

export interface CaseConfig {
	id: string;
	path: string;
	resource: CaseConfigResource;
}

export interface CaseConfigResource {
	printModel: string;
	documentModels?: string;
	templatePrintModels?: string;
	fragmentPrintModels?: string | string[];
	typesettingModel?: string | string[];
	documents?: string;
	walFile?: string; // If undefined then the same path as defined in `printModel` is used
	store?: string;
	fontMap?: Record<string, string>;
}

export interface ResolvedCaseConfigResource {
	printModel: Model;
	documentModels: Model[];
	templatePrintModels?: Model[];
	fragmentPrintModels?: Model[];
	typesettingModels?: Model[];
	documentNames: string[];
	store?: PrintEngineState;
	fontMap?: Record<string, string>;
}

export namespace CaseConfig {
	export function getWalFilePath(resource: Pick<CaseConfigResource, "printModel" | "walFile">) {
		return resource.walFile ? resource.walFile : resource.printModel.replace(".json", ".wal");
	}
}

const dataContext = require.context("@use-cases", true, /\/case\.config\.json$/);
export const caseConfigs: CaseConfig[] = dataContext.keys().map(path => ({ ...dataContext(path), path }));

const resourceDataContext = require.context("@use-cases", true, /\/case\.config\.resource\.json$/);
export const caseConfigResources: Record<string, ResolvedCaseConfigResource> = Object.fromEntries(
	resourceDataContext.keys().map(resourcePath => {
		const configPath = resourcePath.replace("case.config.resource.json", "case.config.json");
		const rawModule = resourceDataContext(resourcePath) as
			ResolvedCaseConfigResource | { default: ResolvedCaseConfigResource };
		const resolved = "default" in rawModule ? rawModule.default : rawModule;
		return [configPath, resolved];
	})
);
