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
import type { SagaGenerator, EffectReturnType } from "typed-redux-saga";
import { getContext, all, call, select, takeLatest, put } from "typed-redux-saga";

import { LoggerFactory } from "@com.mgmtp.a12.utils/utils-logging";
import type { TypesettingModel } from "@com.mgmtp.a12.print/print-typesetting/a12internal/api";

import type { RequestApi } from "../../api/index.js";
import { RequestApiActions } from "../../redux/index.js";
import { PrintEngineSelectors } from "../../store/selectors.js";
import { RESOURCE_KEYS } from "../../../internal/localization/index.js";
import { EditorComponentApiActions } from "../../../a12internal/api/actions-api.js";

const log = LoggerFactory.getLogger("LoadTypesettingModelsSaga");

export function* loadTypesettingModelsSaga(): SagaGenerator<void> {
	yield* takeLatest(RequestApiActions.loadTypesettingModels.match, handleLoadTypesettingModelsSaga);
}
function* handleLoadTypesettingModelsSaga(): SagaGenerator<void> {
	const textStyles = yield* select(PrintEngineSelectors.textStyles);

	const typesettingNames = [
		...new Set(textStyles.map(textStyle => textStyle.typesettingModelName).filter(Boolean) as string[]),
	];

	if (!typesettingNames.length) {
		return;
	}

	const requestApi: RequestApi = yield* getContext("requestApi");

	const efftecs = typesettingNames.map(id => call(requestApi.loadTypesettingModel, id));

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const models = yield* all(efftecs) as SagaGenerator<EffectReturnType<any>[], any>;

	const unloadedModels: string[] = [];
	models.forEach((model, idx) => {
		if (!model) {
			unloadedModels.push(typesettingNames[idx]);
		}
	});

	if (unloadedModels.length) {
		log.error(`The typesetting models ${unloadedModels.join(", ")} could not be loaded`);
		yield* put(
			EditorComponentApiActions.addNotification({
				title: { key: RESOURCE_KEYS.textStyles.notification.cannotLoadTypesetting.title },
				message: {
					key: RESOURCE_KEYS.textStyles.notification.cannotLoadTypesetting.description,
					args: {
						typesetting: { type: "plain", value: unloadedModels.join(", ") },
					},
				},
				severity: "warning",
			})
		);
		return;
	}

	yield* put(RequestApiActions.setTypesettingModels(models.filter(Boolean) as TypesettingModel[]));
}
