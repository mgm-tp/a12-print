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
import { renderWithProviders } from "../../../../../../test/typescript/test-utils/index.js";

import { BaseBadge, ErrorBadge, WarningBadge } from "../ValidationBadge.js";

describe("ValidationBadge", () => {
	describe("BaseBadge", () => {
		it("should render descriptive badge correctly", () => {
			const { queryByDataType, queryByText } = renderWithProviders(<BaseBadge type="descriptive" count={10} />);

			expect(queryByDataType(/info-badge/i)).toBeInTheDocument();
			expect(queryByText("10")).toBeInTheDocument();
		});

		it("should render compact badge correctly", () => {
			const { queryByDataType, queryByText } = renderWithProviders(<BaseBadge type="compact" count={10} />);

			expect(queryByDataType(/info-badge/i)).toBeInTheDocument();
			expect(queryByText("10")).not.toBeInTheDocument();
		});

		it("should not render badge when count is zero", () => {
			const { queryByDataType, queryByText } = renderWithProviders(<BaseBadge type="descriptive" count={0} />);

			expect(queryByDataType(/info-badge/i)).not.toBeInTheDocument();
			expect(queryByText("0")).not.toBeInTheDocument();
		});
	});

	describe("ErrorBadge", () => {
		it("should render correctly", () => {
			const { queryByDataType, queryByText } = renderWithProviders(<ErrorBadge type="descriptive" count={20} />);

			expect(queryByDataType(/error-badge/i)).toBeInTheDocument();
			expect(queryByText("20")).toBeInTheDocument();
		});
	});

	describe("WarningBadge", () => {
		it("should render correctly", () => {
			const { queryByDataType, queryByText } = renderWithProviders(
				<WarningBadge type="descriptive" count={30} />
			);

			expect(queryByDataType(/warning-badge/i)).toBeInTheDocument();
			expect(queryByText("30")).toBeInTheDocument();
		});
	});
});
