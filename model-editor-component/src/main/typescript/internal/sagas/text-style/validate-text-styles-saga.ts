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
import type { SagaGenerator } from "typed-redux-saga";
import { put, select, takeLatest } from "typed-redux-saga";

import { isFontNotConfigured } from "@com.mgmtp.a12.print/print-fonts/a12internal";

import { ValidationActions } from "../../redux/index.js";
import { PrintEngineSelectors } from "../../store/selectors.js";
import { RESOURCE_KEYS } from "../../../internal/localization/index.js";
import { EditorComponentApiActions } from "../../../a12internal/api/actions-api.js";

export function* validateTextStylesSaga(): SagaGenerator<void> {
	yield* takeLatest(ValidationActions.validateTextStyles.match, handleValidateTextStyles);
}

function* handleValidateTextStyles() {
	const textStyles = yield* select(PrintEngineSelectors.textStyles);
	const fonts = yield* select(PrintEngineSelectors.fonts);

	for (const textStyle of textStyles) {
		if (isFontNotConfigured(fonts, textStyle.font)) {
			yield* put(
				EditorComponentApiActions.addNotification({
					title: {
						key: RESOURCE_KEYS.textStyles.notification.useUnconfiguredFont.title,
						args: {
							textStyle: { type: "plain", value: textStyle.name },
						},
					},
					message: {
						key: RESOURCE_KEYS.textStyles.notification.useUnconfiguredFont.description,
						args: {
							font: { type: "plain", value: textStyle.font },
						},
					},
					severity: "warning",
				})
			);
		}
	}
}
