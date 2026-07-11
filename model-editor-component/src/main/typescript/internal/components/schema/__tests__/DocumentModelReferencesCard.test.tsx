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
import { fireEvent, waitFor } from "@testing-library/react";

import type { ModelReferenceEntity } from "@com.mgmtp.a12.print/print-model-api/model";
import { getEntityId, EntityKey } from "@com.mgmtp.a12.print/print-model-api/model";
import { defaultTheme } from "@com.mgmtp.a12.widgets/widgets-core";

import { renderWithProviders } from "../../../../../../test/typescript/test-utils/index.js";

import { DocumentModelReferencesCard } from "../DocumentModelReferencesCard.js";

const modelReference: ModelReferenceEntity = {
	id: getEntityId(EntityKey.ModelReferences, "DomainText"),
	modelType: "document",
	reference: "DomainText",
	alias: "Text",
};

describe("DocumentModelReferencesCard", () => {
	describe("Existing reference", () => {
		const setupTest = () => renderWithProviders(<DocumentModelReferencesCard modelReference={modelReference} />);

		it("should render model reference's values correctly", () => {
			const { queryByDisplayValue, queryByText, queryByLabelText } = setupTest();

			expect(queryByDisplayValue("DomainText")).toBeInTheDocument();
			expect(queryByText("Text")).toBeInTheDocument();
			expect(queryByLabelText(/open setting/i)).toBeInTheDocument();
		});

		it("should render collapsible setting correctly", () => {
			const { queryByText, getByLabelText, queryByLabelText, queryByDisplayValue } = setupTest();

			expect(queryByText("Alias")).not.toBeInTheDocument();
			expect(queryByDisplayValue("Text")).not.toBeInTheDocument();
			expect(queryByLabelText(/save/i)).not.toBeInTheDocument();
			expect(queryByLabelText(/cancel/i)).not.toBeInTheDocument();

			fireEvent.click(getByLabelText(/open setting/i));

			expect(queryByText("Alias")).toBeInTheDocument();
			expect(queryByDisplayValue("Text")).toBeInTheDocument();
			expect(queryByLabelText(/save/i)).toBeInTheDocument();
			expect(queryByLabelText(/cancel/i)).toBeInTheDocument();
		});
	});

	describe("New reference", () => {
		const setupTest = () =>
			renderWithProviders(<DocumentModelReferencesCard modelReference={modelReference} isNewReference />);

		it("should render correctly", () => {
			const { queryByText, queryByLabelText, queryByDisplayValue } = setupTest();

			expect(queryByText("Alias")).toBeInTheDocument();
			expect(queryByDisplayValue("Text")).toBeInTheDocument();
			expect(queryByLabelText(/save/i)).toBeInTheDocument();
			expect(queryByLabelText(/cancel/i)).toBeInTheDocument();
		});

		it("should render highlight border", async () => {
			const { queryByTestId } = setupTest();
			const highlightColor = defaultTheme.colors.interaction.active.color;
			expect(queryByTestId("document-model-reference-card")).toHaveStyle({
				border: `2px solid ${highlightColor}`,
			});

			await waitFor(() =>
				expect(queryByTestId("document-model-reference-card")).not.toHaveStyle({
					border: `2px solid ${highlightColor}`,
				})
			);
		});
	});
});
