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
import { within } from "@testing-library/react";

import type { ValidationCounter } from "../../../redux/index.js";
import { ValidationReducer } from "../../../redux/index.js";
import { renderWithProviders } from "../../../../../../test/typescript/test-utils/index.js";
import type { ValidationState } from "../../../../a12internal/api/ValidationState.js";

import { BadgeGroup } from "../BadgeGroup.js";

describe("BadgeGroup", () => {
	const validationCounter: ValidationCounter = {
		error: 10,
		warning: 20,
	};

	it("should render descriptive mode correctly", () => {
		const { queryByDataType, queryAllByDataType } = renderWithProviders(
			<BadgeGroup validationCounter={validationCounter} />,
			{
				ValidationState: (
					state: ValidationState = {
						interaction: {
							error: "descriptive",
							warning: "descriptive",
							info: "descriptive",
						},
					},
					action
				) => ValidationReducer(state, action),
			}
		);

		const errorBadge = queryByDataType(/error/i);
		const warningBadge = queryByDataType(/warning/i);

		expect(errorBadge).toBeInTheDocument();
		expect(warningBadge).toBeInTheDocument();

		expect(queryAllByDataType(/error/i)).toHaveLength(1);
		expect(queryAllByDataType(/warning/i)).toHaveLength(1);

		if (!errorBadge || !warningBadge) {
			throw new Error();
		}

		const { getByText: getByTextError } = within(errorBadge);
		expect(getByTextError(validationCounter.error)).toBeInTheDocument();

		const { getByText: getByTextWarning } = within(warningBadge);
		expect(getByTextWarning(validationCounter.warning)).toBeInTheDocument();
	});

	it("should render warning badge in compact mode with hidden view", () => {
		const { queryByDataType, queryByText } = renderWithProviders(
			<BadgeGroup validationCounter={validationCounter} />,
			{
				ValidationState: (
					state: ValidationState = {
						interaction: {
							error: "compact",
							warning: "compact",
							info: "compact",
						},
					},
					action
				) => ValidationReducer(state, action),
			}
		);

		expect(queryByDataType(/error/i)).toBeInTheDocument();
		expect(queryByDataType(/warning/i)).not.toBeInTheDocument();
		expect(queryByText(validationCounter.error)).not.toBeInTheDocument();
		expect(queryByText(validationCounter.warning)).not.toBeInTheDocument();
	});
});
