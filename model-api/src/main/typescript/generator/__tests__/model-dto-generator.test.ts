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
import documentModelJson from "../../../../test/resources/print-models/test-document-model.json" with { type: "json" };

import { generateAPI } from "../model-dto-generator.js";

describe("DTO Generation", () => {
	it("success DTO API Generation", () => {
		const { result, error } = generateAPI(JSON.stringify(documentModelJson), "Test");

		expect(result).toBeDefined();
		expect(error).toBeFalsy();

		expect(result?.enums.size).toBe(1);
		expect(result?.enums.get("Enumeration_Root_Enum_fieldDTO")).toBeDefined();
		expect(result?.interfaces.size).toBe(5);

		expect(Object.keys(result!.exampleValue)).toHaveLength(2);
	});

	it("failed DTO API Generation", () => {
		const { result, error } = generateAPI("INVALID_STRING", "Test");

		expect(result).toBeFalsy();
		expect(error).toBeDefined();
		expect(error).toBe("JSON parse error");
	});
});
