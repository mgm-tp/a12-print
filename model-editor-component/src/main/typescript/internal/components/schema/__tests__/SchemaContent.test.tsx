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
import React from "react";
import { act, fireEvent, screen, within } from "@testing-library/react";

import { SidebarItem } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import type { ModelReferenceEntity } from "@com.mgmtp.a12.print/print-model-api/model";
import { getEntityId, EntityKey } from "@com.mgmtp.a12.print/print-model-api/model";

import {
	setupTestWithSchema,
	setupIgnoreTestWarning,
	TestWarningIdentifier,
} from "../../../../../../test/typescript/test-utils/index.js";
import { EditorComponentContext } from "../../../api/index.js";
import { NavigationActions } from "../../../redux/navigation/actions.js";

import { SchemaContent } from "../SchemaContent.js";

const FragmentContextWrapper = ({ children }: { children: React.ReactNode }) => {
	const outerContext = React.useContext(EditorComponentContext);
	const prop = React.useMemo(() => ({ ...outerContext, isFragmentModel: true }), [outerContext]);
	return <EditorComponentContext.Provider value={prop}>{children}</EditorComponentContext.Provider>;
};

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

	describe("navigation to a Model Reference", () => {
		it("expands the section of the Model Reference", () => {
			const { store, queryAllByTestId } = setupTest();

			expect(queryAllByTestId("document-model-reference-card")).toHaveLength(0);

			act(() => {
				store.dispatch(NavigationActions.jumpTo({ [SidebarItem.SCHEMA]: { expandedSections: ["document"] } }));
			});

			expect(queryAllByTestId("document-model-reference-card")).toHaveLength(2);
		});

		it("keeps the sections open that were already expanded", () => {
			const { store, getByText } = setupTest();

			fireEvent.click(getByText("Print Model References"));
			act(() => {
				store.dispatch(NavigationActions.jumpTo({ [SidebarItem.SCHEMA]: { expandedSections: ["document"] } }));
			});

			expect(store.getState().Navigation[SidebarItem.SCHEMA].expandedSections).toEqual(["print", "document"]);
		});

		it("collapses an expanded section on click", () => {
			const { store, getByText, queryAllByTestId } = setupTest();

			act(() => {
				store.dispatch(NavigationActions.jumpTo({ [SidebarItem.SCHEMA]: { expandedSections: ["document"] } }));
			});
			fireEvent.click(getByText("Document Model References"));

			expect(queryAllByTestId("document-model-reference-card")).toHaveLength(0);
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

	describe("fragment model view", () => {
		const setupFragmentTest = (modelReferences: ModelReferenceEntity[] = modelReferencesMock) =>
			setupTestWithSchema(
				<FragmentContextWrapper>
					<SchemaContent />
				</FragmentContextWrapper>,
				{
					modelReferences,
				}
			);

		it("should hide the Document Model selection once a Document Model is referenced", () => {
			const { getByText, queryByRole } = setupFragmentTest([modelReference1]);

			fireEvent.click(getByText("Document Model References"));

			expect(queryByRole("combobox")).not.toBeInTheDocument();
			expect(screen.getAllByTestId("document-model-reference-card")).toHaveLength(1);
		});

		it("should offer the Document Model selection while no Document Model is referenced", () => {
			const { getByText, getByRole, getByLabelText, queryByDisplayValue, queryByRole } = setupFragmentTest([]);

			fireEvent.click(getByText("Document Model References"));
			fireEvent.change(getByRole("combobox"), { target: { value: "DomainAddress" } });
			fireEvent.click(getByLabelText(/add/i));

			expect(queryByDisplayValue("DomainAddress")).toBeInTheDocument();
			expect(queryByRole("combobox")).not.toBeInTheDocument();
		});

		it("should not render Print Model References when isFragmentModel is true", () => {
			const { queryByText } = setupFragmentTest();

			expect(queryByText("Print Model References")).not.toBeInTheDocument();
		});

		it("should still render Document Model References when isFragmentModel is true", () => {
			const { getByText } = setupFragmentTest();

			expect(getByText("Document Model References")).toBeInTheDocument();
		});
	});

	describe("mutually exclusive Fragment and DIN references", () => {
		const fragmentReference: ModelReferenceEntity = {
			id: getEntityId(EntityKey.ModelReferences, "FragmentPrintModel"),
			modelType: "print",
			purpose: "print-fragment",
			reference: "FragmentPrintModel",
		};

		const dinTemplateReference: ModelReferenceEntity = {
			id: getEntityId(EntityKey.ModelReferences, "DINTemplatePrintModel"),
			modelType: "print",
			purpose: "DINTemplate",
			reference: "DINTemplatePrintModel",
		};

		const setupTestWithReferences = (references: ModelReferenceEntity[]) =>
			setupTestWithSchema(<SchemaContent />, {
				modelReferences: [...modelReferencesMock, ...references],
			});

		it("should disable Print Model References when Fragment Models are referenced", () => {
			const { getByText, getByRole, getByLabelText } = setupTestWithReferences([fragmentReference]);

			fireEvent.click(getByText("Print Model References"));

			expect(getByText(/therefore a DINTemplate cannot be referenced/)).toBeInTheDocument();
			expect(getByRole("combobox")).toBeDisabled();
			expect(getByLabelText(/add/i)).toBeDisabled();
		});

		it("should disable Fragment Model References when a DIN Template is referenced", () => {
			const { getByText, getByRole, getByLabelText } = setupTestWithReferences([dinTemplateReference]);

			fireEvent.click(getByText("Fragment Model References"));

			expect(getByText(/therefore Fragment Models cannot be referenced/)).toBeInTheDocument();
			expect(getByRole("combobox")).toBeDisabled();
			expect(getByLabelText(/add/i)).toBeDisabled();
		});

		it("should keep both panels enabled when neither reference type is used", () => {
			const { getByText, queryByText, getByRole } = setupTestWithReferences([]);

			fireEvent.click(getByText("Fragment Model References"));

			expect(queryByText(/therefore Fragment Models cannot be referenced/)).not.toBeInTheDocument();
			expect(getByRole("combobox")).not.toBeDisabled();

			fireEvent.click(getByText("Print Model References"));

			expect(queryByText(/therefore a DINTemplate cannot be referenced/)).not.toBeInTheDocument();
		});
	});
});
