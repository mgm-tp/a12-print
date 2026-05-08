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
import { ElementType, PartialPlaceableReference } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { PossibleInputSource } from "@com.mgmtp.a12.print/print-model-api/lib/input-source/input-source.js";

import { renderWithProviders, expectToThrow } from "../../../../../../test/typescript/test-utils/index.js";

import { Listing, ListingProps } from "../Listing.js";

describe("Listing", () => {
	const defaultListingProps = {
		styles: {},
		element: { id: "listing-id", type: ElementType.Listing },
		reference: { refId: "listing-id" } as PartialPlaceableReference,
	};
	const setupTest = (listingProps?: Partial<ListingProps>) =>
		renderWithProviders(<Listing {...defaultListingProps} {...listingProps} />);

	it("should throw Error when its type is not listing", () => {
		expectToThrow(
			() =>
				renderWithProviders(
					<Listing
						styles={{}}
						element={{ id: "non-listing-id", type: ElementType.Image }}
						reference={{ refId: "non-listing-id" } as PartialPlaceableReference}
					/>
				),
			new Error(`Expected element of type Listing but got ${ElementType.Image}`)
		);
	});

	it("should render element with localized label when its listing.columns is not defined", () => {
		const { queryByText } = setupTest();

		expect(queryByText("Listing")).toBeInTheDocument();
	});

	it("should render table when its listing.columns is defined", () => {
		const { queryAllByRole, queryByText } = setupTest({
			element: {
				...defaultListingProps.element,
				listing: {
					id: "qnmegoeqjmghoqe",
					columns: [
						{
							id: "j3ogm43oh4h",
							label: {
								id: "h3asd62vsw2",
								value: "column-1",
								source: PossibleInputSource.INPUT,
								path: "/content/elementDefinitions/listing/columns/label/value",
							},
						},
						{
							id: "j3ogm43oh4hasdasd",
							label: {
								id: "h355d62v6w7",
								value: "column-2",
								source: PossibleInputSource.INPUT,
								path: "/content/elementDefinitions/listing/columns/label/value",
							},
						},
					],
				},
			},
		});

		expect(queryAllByRole("row")).toHaveLength(1);
		expect(queryAllByRole("columnheader")).toHaveLength(2);
		expect(queryByText("column-1")).toBeInTheDocument();
		expect(queryByText("column-2")).toBeInTheDocument();
	});
});
