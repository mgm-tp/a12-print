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
import * as React from "react";
import { useDispatch, useSelector } from "react-redux";
import { nanoid } from "nanoid";

import type { PartialBorderProperties } from "@com.mgmtp.a12.print/print-model-api/model";
import { PartialLine } from "@com.mgmtp.a12.print/print-model-api/model";

import { PrintEngineSelectors } from "../../store/selectors.js";
import { TransactionLogStateActions } from "../../redux/index.js";
import { InteractionLogActions } from "../../redux//interaction-log/index.js";
import type { OmitId } from "../../utils/index.js";
import { useBorderPropertiesErrorMessage } from "../../utils/index.js";
import { RESOURCE_KEYS } from "../../localization/index.js";
import { BORDER_PROPERTIES_PATH } from "../../constant/element-property-path.js";

import { BorderPropertiesForm } from "./shared-components/index.js";

export const LineFormContainer = () => {
	const dispatch = useDispatch();
	const element = useSelector(PrintEngineSelectors.currentFormElement);

	if (!element || !PartialLine.isInstance(element)) {
		throw Error("Expected element of type Line");
	}

	const setBorderProperties = React.useCallback(
		(newProps: OmitId<PartialBorderProperties>) => {
			const updatedElement = {
				...element,
				borderProperties: { id: nanoid(), ...element.borderProperties, ...newProps },
			};
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.form.lineFormContainer.changeBorderProperties,
					region: "form",
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
				})
			);
		},
		[dispatch, element]
	);

	return (
		<BorderPropertiesForm
			element={element}
			propertiesPath={BORDER_PROPERTIES_PATH}
			borderProperties={element.borderProperties}
			setBorderProperties={setBorderProperties}
			getErrorMessage={useBorderPropertiesErrorMessage(element.id)}
		/>
	);
};
