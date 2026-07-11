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
import type { PartialPlaceableReference } from "@com.mgmtp.a12.print/print-model-api/model";
import { ElementType } from "@com.mgmtp.a12.print/print-model-api/model";

import { renderWithProviders, expectToThrow } from "../../../../../../test/typescript/test-utils/index.js";

import { Line } from "../Line.js";

describe("Line", () => {
	const styles = { borderStyle: "solid", borderColor: "#000000", borderWidth: "1px" };

	it("should throw Error when its type is not line", () => {
		expectToThrow(
			() =>
				renderWithProviders(
					<Line
						element={{ id: "line-id", type: ElementType.Text }}
						styles={styles}
						reference={{ refId: "line-id" } as PartialPlaceableReference}
					/>
				),
			new Error(`Expected element of type Line but got ${ElementType.Text}`)
		);
	});

	it("should render tag with defined styles", () => {
		const { queryByTestId, getByTestId } = renderWithProviders(
			<Line
				element={{ id: "line-id", type: ElementType.Line }}
				styles={styles}
				reference={{ refId: "line-id" } as PartialPlaceableReference}
			/>
		);

		expect(queryByTestId("element-line")).toBeInTheDocument();
		expect(getByTestId("element-line")).toHaveStyle(styles);
	});
});
