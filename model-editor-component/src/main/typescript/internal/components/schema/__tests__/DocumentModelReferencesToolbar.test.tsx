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
import { fireEvent } from "@testing-library/react";

import type { ModelReference } from "@com.mgmtp.a12.base/base-model-api";
import { PRINT_MODEL_HEADER_LOG_ID } from "@com.mgmtp.a12.print/print-model-api/model";

import {
	setupTestWithSchema,
	setupIgnoreTestWarning,
	TestWarningIdentifier,
} from "../../../../../../test/typescript/test-utils/index.js";

import { DocumentModelReferencesToolbar } from "../DocumentModelReferencesToolbar.js";

const modelReference: ModelReference = {
	modelType: "document",
	reference: "DomainText",
	alias: "Text",
};

const printHeaderMock = {
	id: PRINT_MODEL_HEADER_LOG_ID,
	modelReferences: [{ id: "jgoq2gjm420h", ...modelReference }],
};

setupIgnoreTestWarning([TestWarningIdentifier.ACT_WARNING]);

describe("DocumentModelReferencesToolbar", () => {
	const setupTest = () =>
		setupTestWithSchema(<DocumentModelReferencesToolbar setNewModelReference={() => ""} />, printHeaderMock);

	it("should render correctly", () => {
		const { getByRole, queryByRole } = setupTest();

		expect(getByRole("combobox")).toHaveValue("");
		expect(getByRole("button", { name: /add/i })).toBeDisabled();
		expect(queryByRole("option", { name: "DomainAddress" })).toBeInTheDocument();
		expect(queryByRole("option", { name: "DomainPerson" })).toBeInTheDocument();

		fireEvent.change(getByRole("combobox"), { target: { value: "DomainAddress" } });

		expect(getByRole("combobox")).toHaveValue("DomainAddress");
		expect(getByRole("button", { name: /add/i })).toBeEnabled();
	});
});
