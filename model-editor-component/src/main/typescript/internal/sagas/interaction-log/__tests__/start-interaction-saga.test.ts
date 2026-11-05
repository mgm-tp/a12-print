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
import { ElementType } from "@com.mgmtp.a12.print/print-model-api/model";
import { GlobalRegion, TextRegion } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import type { InteractionRegion } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import type { AnyFormState } from "../../../redux/index.js";

import { getRegionId } from "../start-interaction-saga.js";

/** Steps the generator past its single `currentForm` select and returns the region id it resolves to. */
function regionIdFor(region: InteractionRegion, currentForm?: AnyFormState) {
	const gen = getRegionId(region);
	gen.next(); // currentForm
	const step = gen.next(currentForm);

	expect(step.done).toBe(true);
	return step.value;
}

describe("getRegionId - form regions", () => {
	it("uses the element id of an element form", () => {
		expect(regionIdFor(GlobalRegion.FORM, { type: ElementType.Text, id: "element-1" })).toBe("element-1");
	});

	it("uses the reference id of a reference form", () => {
		expect(
			regionIdFor(TextRegion.TEXT_FROM_FIELD, {
				type: ElementType.Text,
				referenceId: "reference-1",
			} as unknown as AnyFormState)
		).toBe("reference-1");
	});

	it("resolves to no region id while no form is open", () => {
		expect(regionIdFor(GlobalRegion.FORM)).toBeUndefined();
	});

	// The Element Library carries neither an element id nor a reference id. Before the guard was
	// added it fell through to `currentForm.referenceId` on a form state that has no such property.
	it("resolves to no region id for the element library form", () => {
		expect(regionIdFor(GlobalRegion.FORM, { type: "ElementLibrary" })).toBeUndefined();
	});
});
