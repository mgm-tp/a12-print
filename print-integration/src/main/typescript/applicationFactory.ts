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
import {
	type A12ApplicationConfig,
	addCustomSagas,
	type ApplicationWithConfiguredFeature,
	type RequireFeatures,
	setConfigured,
} from "@com.mgmtp.a12.client/client-core";

import { PrintFactories } from "./factories.js";

/**
 * @experimental
 */
// we use module augmentation to extend the A12ApplicationConfig type with more options
declare module "@com.mgmtp.a12.client/client-core" {
	interface A12ApplicationConfig {
		readonly print?: {
			readonly showLoadingIndicatorDuringPrint?: boolean;
			readonly validateAndSaveBeforePrint?: boolean;
		};
	}
}

/**
 * @experimental
 */
// this describe the features the PE depends on ("never" means must not exist yet, "true" means must exist)
export type ApplicationWithPrintEngineConfig = RequireFeatures<A12ApplicationConfig, { print?: never }>;

/**
 * @experimental
 */
export const withPrintSagas = <T extends A12ApplicationConfig>(cfg: T) =>
	addCustomSagas(
		...PrintFactories.createSagas(cfg.print?.showLoadingIndicatorDuringPrint, cfg.print?.validateAndSaveBeforePrint)
	)(cfg);

/**
 * @experimental
 */
export const withPrint = <T extends ApplicationWithPrintEngineConfig>(
	cfg: T
): ApplicationWithConfiguredFeature<T, "print"> => setConfigured<T, "print">("print")(withPrintSagas(cfg));
