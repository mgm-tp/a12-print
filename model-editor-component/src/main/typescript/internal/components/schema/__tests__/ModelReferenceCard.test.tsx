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
import type { Reducer } from "redux";
import { fireEvent, waitFor } from "@testing-library/react";

import type { ModelReferenceEntity } from "@com.mgmtp.a12.print/print-model-api/model";
import { getEntityId, EntityKey } from "@com.mgmtp.a12.print/print-model-api/model";
import { defaultTheme } from "@com.mgmtp.a12.widgets/widgets-core";
import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/errors";

import { renderWithProviders } from "../../../../../../test/typescript/test-utils/index.js";
import type { ValidationState } from "../../../../a12internal/api/ValidationState.js";

import { ModelReferenceCard } from "../ModelReferenceCard.js";

const modelReference: ModelReferenceEntity = {
	id: getEntityId(EntityKey.ModelReferences, "DomainText"),
	modelType: "document",
	reference: "DomainText",
	alias: "Text",
};

const DATA_TEST_ID = "model-reference-card";

/** Stands in for whatever setting a reference kind hands in. */
const SETTINGS_CONTENT = "settings of this reference";

const REFERENCE_ERROR_MESSAGE = "The referenced Document Model 'DomainText' does not exist";

const emptyErrorMap = () => ({
	[ErrorSeverity.ERROR]: [],
	[ErrorSeverity.WARNING]: [],
	[ErrorSeverity.INFO]: [],
});

/** The validation state once the validator reported the reference itself as unresolvable. */
const validationWithReferenceError: Reducer = (): ValidationState =>
	({
		interaction: { error: "descriptive", warning: "descriptive", info: "descriptive" },
		errorMap: {
			...emptyErrorMap(),
			header: {
				...emptyErrorMap(),
				modelReferences: [
					{
						...emptyErrorMap(),
						"@id": modelReference.id,
						[ErrorSeverity.ERROR]: [
							{
								errorCode: "print.validation.error",
								severity: "ERROR",
								errorMessage: [
									{
										key: "print.validation.error",
										args: {},
										defaults: { en: REFERENCE_ERROR_MESSAGE, de: REFERENCE_ERROR_MESSAGE },
									},
								],
							},
						],
					},
				],
			},
		},
	}) as unknown as ValidationState;

describe("ModelReferenceCard", () => {
	describe("without an alias or settings", () => {
		const setupTest = () =>
			renderWithProviders(<ModelReferenceCard modelReference={modelReference} dataTestId={DATA_TEST_ID} />);

		it("renders the reference name, and neither an alias nor a settings button", () => {
			const { queryByDisplayValue, queryByText, queryByLabelText } = setupTest();

			expect(queryByDisplayValue("DomainText")).toBeInTheDocument();
			expect(queryByText("Text")).not.toBeInTheDocument();
			expect(queryByLabelText(/open setting/i)).not.toBeInTheDocument();
		});
	});

	describe("with an alias", () => {
		it("splits the row into the reference name and the alias", () => {
			const { queryByDisplayValue, queryByText } = renderWithProviders(
				<ModelReferenceCard modelReference={modelReference} dataTestId={DATA_TEST_ID} alias="Text" />
			);

			expect(queryByDisplayValue("DomainText")).toBeInTheDocument();
			expect(queryByText("Text")).toBeInTheDocument();
		});

		// Keeping the column lines the names up, instead of some of them spanning the whole row.
		it("keeps the alias column for an alias that is not set yet", () => {
			const { container } = renderWithProviders(
				<ModelReferenceCard modelReference={modelReference} dataTestId={DATA_TEST_ID} alias="" />
			);

			expect(container).toMatchSnapshot();
		});
	});

	// The snapshot holds the layout: the message on a full-width line, name and alias side by side below it.
	describe("with an unresolvable reference", () => {
		it("shows the error, spanning the full width of a split row", () => {
			const { container, queryByText } = renderWithProviders(
				<ModelReferenceCard modelReference={modelReference} dataTestId={DATA_TEST_ID} alias="Text" />,
				{ ValidationState: validationWithReferenceError }
			);

			expect(queryByText(REFERENCE_ERROR_MESSAGE)).toBeInTheDocument();
			expect(container).toMatchSnapshot();
		});

		it("shows the error on a row that is not split", () => {
			const { queryByText } = renderWithProviders(
				<ModelReferenceCard modelReference={modelReference} dataTestId={DATA_TEST_ID} />,
				{ ValidationState: validationWithReferenceError }
			);

			expect(queryByText(REFERENCE_ERROR_MESSAGE)).toBeInTheDocument();
		});
	});

	describe("with settings", () => {
		const setupTest = (isNewReference?: boolean) =>
			renderWithProviders(
				<ModelReferenceCard
					modelReference={modelReference}
					dataTestId={DATA_TEST_ID}
					renderSettings={collapse => <button onClick={collapse}>{SETTINGS_CONTENT}</button>}
					isNewReference={isNewReference}
				/>
			);

		it("opens the given settings through the settings button", () => {
			const { queryByText, getByLabelText, queryByLabelText } = setupTest();

			expect(queryByLabelText(/open setting/i)).toBeInTheDocument();
			expect(queryByText(SETTINGS_CONTENT)).not.toBeInTheDocument();

			fireEvent.click(getByLabelText(/open setting/i));

			expect(queryByText(SETTINGS_CONTENT)).toBeInTheDocument();
		});

		it("closes the settings again when they collapse themselves", () => {
			const { getByLabelText, getByText, queryByText } = setupTest();

			fireEvent.click(getByLabelText(/open setting/i));
			fireEvent.click(getByText(SETTINGS_CONTENT));

			expect(queryByText(SETTINGS_CONTENT)).not.toBeInTheDocument();
		});

		it("opens the settings right away for a reference that was just added", () => {
			const { queryByText } = setupTest(true);

			expect(queryByText(SETTINGS_CONTENT)).toBeInTheDocument();
		});

		it("highlights a reference that was just added, until the highlight times out", async () => {
			const { queryByTestId } = setupTest(true);
			const highlightColor = defaultTheme.colors.interaction.active.color;
			expect(queryByTestId(DATA_TEST_ID)).toHaveStyle({
				border: `2px solid ${highlightColor}`,
			});

			await waitFor(() =>
				expect(queryByTestId(DATA_TEST_ID)).not.toHaveStyle({
					border: `2px solid ${highlightColor}`,
				})
			);
		});
	});
});
