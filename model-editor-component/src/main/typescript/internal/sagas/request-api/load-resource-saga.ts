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
import { call, getContext, put, type SagaGenerator, select, takeEvery } from "typed-redux-saga";

import { RequestApiActions } from "../../redux/index.js";
import { RequestApiSelectors } from "../../redux/request-api/selectors.js";
import type { RequestApi } from "../../api/request-api.js";
import { EditorComponentApiActions } from "../../../a12internal/api/actions-api.js";
import { RESOURCE_KEYS } from "../../localization/index.js";

export function* loadStaticImageSaga(): SagaGenerator<void> {
	yield* takeEvery(RequestApiActions.loadStaticImage.match, handleLoadResource);
}

function* handleLoadResource(action: ReturnType<typeof RequestApiActions.loadStaticImage>): SagaGenerator<void> {
	const cached = yield* select(state => RequestApiSelectors.resourceByName(state, action.payload));
	if (cached) return;
	const requestApi: RequestApi = yield* getContext("requestApi");
	try {
		const data = yield* call(requestApi.loadStaticImage, action.payload);
		if (data) yield* put(RequestApiActions.setResource(data));
	} catch {
		yield* put(
			EditorComponentApiActions.addNotification({
				title: { key: RESOURCE_KEYS.validation.error.internalError },
				message: { key: RESOURCE_KEYS.validation.error.loadStaticImage },
				severity: "error",
			})
		);
	}
}
