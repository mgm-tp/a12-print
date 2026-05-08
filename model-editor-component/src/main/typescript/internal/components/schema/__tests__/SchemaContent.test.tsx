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
import { fireEvent, screen, within } from "@testing-library/react";

import { ModelReferenceEntity, getEntityId, EntityKey } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

import {
	setupTestWithSchema,
	setupIgnoreTestWarning,
	TestWarningIdentifier,
} from "../../../../../../test/typescript/test-utils/index.js";

import { SchemaContent } from "../SchemaContent.js";

const modelReference1: ModelReferenceEntity = {
	id: getEntityId(EntityKey.ModelReferences, "DomainText"),
	modelType: "document",
	reference: "DomainText",
	alias: "Text",
};

const modelReference2: ModelReferenceEntity = {
	id: getEntityId(EntityKey.ModelReferences, "DomainPerson"),
	modelType: "document",
	reference: "DomainPerson",
	alias: "Person",
};

const modelReferencesMock = [modelReference1, modelReference2];

setupIgnoreTestWarning([TestWarningIdentifier.ACT_WARNING]);

describe("SchemaContent", () => {
	const setupTest = () =>
		setupTestWithSchema(<SchemaContent />, {
			modelReferences: modelReferencesMock,
		});

	it("should render correctly", () => {
		const { container, getByText } = setupTest();

		expect(container).toMatchSnapshot();

		fireEvent.click(getByText("Document Model References"));
		fireEvent.click(getByText("Print Model References"));

		expect(container).toMatchSnapshot();
	});

	describe("Document Model Reference Toolbar", () => {
		it("add new document model reference card", () => {
			const { getByText, queryByDisplayValue, getByRole, getByLabelText } = setupTest();

			fireEvent.click(getByText("Document Model References"));

			expect(queryByDisplayValue("DomainAddress")).not.toBeInTheDocument();

			fireEvent.change(getByRole("combobox"), { target: { value: "DomainAddress" } });
			fireEvent.click(getByLabelText(/add/i));

			expect(queryByDisplayValue("DomainAddress")).toBeInTheDocument();
		});
	});

	describe("Document Model Reference Card", () => {
		it("should update alias", () => {
			const { getByText } = setupTest();

			fireEvent.click(getByText("Document Model References"));

			const documentModelRefs = screen.getAllByTestId("document-model-reference-card");
			const { getByLabelText, queryByText, getByDisplayValue } = within(documentModelRefs[0]);

			fireEvent.click(getByLabelText(/open setting/i));

			expect(queryByText("Person")).toBeInTheDocument();

			fireEvent.change(getByDisplayValue("Person"), { target: { value: "Human" } });
			fireEvent.click(getByLabelText(/save/i));

			expect(queryByText("Person")).not.toBeInTheDocument();
			expect(queryByText("Human")).toBeInTheDocument();
		});
	});
});
