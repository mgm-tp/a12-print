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
import { fireEvent, screen } from "@testing-library/react";

import { EntityKey, getEntityId } from "@com.mgmtp.a12.print/print-model-api/model";

import { renderWithProviders } from "../../../../../../../test/typescript/test-utils/index.js";
import type { AnnotationData } from "../../annotations/annotation.js";

import { RolesTable } from "../RolesTable.js";

const makeAnnotation = (name: string, value: string): AnnotationData => ({
	id: getEntityId(EntityKey.Annotations, name),
	name,
	value,
});

describe("RolesTable", () => {
	it("renders the add button", () => {
		const onChange = jest.fn();
		renderWithProviders(<RolesTable annotations={[]} onChange={onChange} />);

		expect(screen.getByRole("button", { name: /add/i })).toBeInTheDocument();
	});

	it("shows placeholder message when no roles are present", () => {
		const onChange = jest.fn();
		renderWithProviders(<RolesTable annotations={[]} onChange={onChange} />);

		expect(screen.getByRole("button", { name: /add/i })).toBeInTheDocument();
	});

	it("renders existing roles from annotations", () => {
		const onChange = jest.fn();
		const annotations = [makeAnnotation("roles", "admin,editor")];
		renderWithProviders(<RolesTable annotations={annotations} onChange={onChange} />);

		expect(screen.getByDisplayValue("admin")).toBeInTheDocument();
		expect(screen.getByDisplayValue("editor")).toBeInTheDocument();
	});

	it("adds a new empty role when add button is clicked", () => {
		const onChange = jest.fn();
		renderWithProviders(<RolesTable annotations={[]} onChange={onChange} />);

		fireEvent.click(screen.getByRole("button", { name: /add/i }));

		expect(onChange).toHaveBeenCalled();
	});

	it("renders available roles as autocomplete options", () => {
		const onChange = jest.fn();
		const annotations = [makeAnnotation("roles", "admin")];
		renderWithProviders(
			<RolesTable annotations={annotations} onChange={onChange} availableRoles={["admin", "editor", "viewer"]} />
		);

		expect(screen.getByDisplayValue("admin")).toBeInTheDocument();
	});

	it("renders a delete button for each role row", () => {
		const onChange = jest.fn();
		const annotations = [makeAnnotation("roles", "admin,editor")];
		renderWithProviders(<RolesTable annotations={annotations} onChange={onChange} />);

		const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
		expect(deleteButtons.length).toBe(2);
	});

	it("renders without errors when annotations do not contain roles entry", () => {
		const onChange = jest.fn();
		const annotations = [makeAnnotation("title", "My Model")];
		renderWithProviders(<RolesTable annotations={annotations} onChange={onChange} />);

		expect(screen.getByRole("button", { name: /add/i })).toBeInTheDocument();
	});
});
