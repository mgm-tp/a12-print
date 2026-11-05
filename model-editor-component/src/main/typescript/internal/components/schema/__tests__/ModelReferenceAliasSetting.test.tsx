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
import { jest } from "@jest/globals";
import { fireEvent } from "@testing-library/react";

import type { ModelReferenceEntity } from "@com.mgmtp.a12.print/print-model-api/model";
import { getEntityId, EntityKey } from "@com.mgmtp.a12.print/print-model-api/model";

import { renderWithProviders } from "../../../../../../test/typescript/test-utils/index.js";

import { ModelReferenceAliasSetting } from "../ModelReferenceAliasSetting.js";

const modelReference: ModelReferenceEntity = {
	id: getEntityId(EntityKey.ModelReferences, "DomainText"),
	modelType: "document",
	reference: "DomainText",
	alias: "Text",
};

describe("ModelReferenceAliasSetting", () => {
	const setupTest = () => {
		const onCollapse = jest.fn();
		return {
			onCollapse,
			...renderWithProviders(
				<ModelReferenceAliasSetting modelReference={modelReference} onCollapse={onCollapse} />
			),
		};
	};

	it("renders the current alias, ready to be edited", () => {
		const { queryByText, queryByDisplayValue, queryByLabelText } = setupTest();

		expect(queryByText("Alias")).toBeInTheDocument();
		expect(queryByDisplayValue("Text")).toBeInTheDocument();
		expect(queryByLabelText(/save/i)).toBeInTheDocument();
		expect(queryByLabelText(/cancel/i)).toBeInTheDocument();
	});

	it("collapses when the edited alias is saved", () => {
		const { onCollapse, getByDisplayValue, getByLabelText } = setupTest();

		fireEvent.change(getByDisplayValue("Text"), { target: { value: "Human" } });
		fireEvent.click(getByLabelText(/save/i));

		expect(onCollapse).toHaveBeenCalled();
	});

	it("collapses when the edit is cancelled", () => {
		const { onCollapse, getByLabelText } = setupTest();

		fireEvent.click(getByLabelText(/cancel/i));

		expect(onCollapse).toHaveBeenCalled();
	});
});
