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

import type { PartialTable } from "@com.mgmtp.a12.print/print-model-api/model";
import { ElementType } from "@com.mgmtp.a12.print/print-model-api/model";
import { PossibleInputSource } from "@com.mgmtp.a12.print/print-model-api/input-source";

import { renderWithProviders } from "../../../../../../../../test/typescript/test-utils/index.js";
import { TEXT_PROPERTIES_PATH } from "../../../../../constant/element-property-path.js";

import { SourceInput } from "../SourceInput.js";

describe("SourceInput", () => {
	const mockElement: PartialTable = {
		id: "test-element-id",
		type: ElementType.Table,
	};

	const property = TEXT_PROPERTIES_PATH.bold;
	const mockOnSourceChange = jest.fn();

	const makeSourceProps = (overrides: object = {}) => ({
		element: mockElement,
		property,
		onSourceChange: mockOnSourceChange,
		determineInheritedSource: () => false,
		...overrides,
	});

	beforeEach(() => {
		mockOnSourceChange.mockClear();
	});

	describe("source toggle display", () => {
		it("shows INPUT and DEFAULT source toggles when no inputSource is set", () => {
			const { getByTitle, queryByTitle } = renderWithProviders(
				<SourceInput label="Label" onChange={jest.fn()} sourceProperties={makeSourceProps()} />
			);

			expect(getByTitle("Enter User Input")).toBeInTheDocument();
			expect(getByTitle("Default Value")).toBeInTheDocument();
			expect(queryByTitle("Value inherited from parent")).not.toBeInTheDocument();
		});

		it("shows INHERITED source toggle when determineInheritedSource returns true", () => {
			const { getByTitle } = renderWithProviders(
				<SourceInput
					label="Label"
					onChange={jest.fn()}
					sourceProperties={makeSourceProps({ determineInheritedSource: () => true })}
				/>
			);

			expect(getByTitle("Value inherited from parent")).toBeInTheDocument();
		});

		it("shows all three source toggles when inputSource is set and INHERITED is enabled", () => {
			const { getByTitle } = renderWithProviders(
				<SourceInput
					label="Label"
					onChange={jest.fn()}
					sourceProperties={makeSourceProps({
						determineInheritedSource: () => true,
						inputSource: { id: "source-id", source: PossibleInputSource.INPUT, path: property },
					})}
				/>
			);

			expect(getByTitle("Enter User Input")).toBeInTheDocument();
			expect(getByTitle("Default Value")).toBeInTheDocument();
			expect(getByTitle("Value inherited from parent")).toBeInTheDocument();
		});
	});

	describe("source type change", () => {
		it("calls onSourceChange with DEFAULT when DEFAULT toggle is clicked while INPUT is active", () => {
			const { getByTitle } = renderWithProviders(
				<SourceInput
					label="Label"
					value="some value"
					onChange={jest.fn()}
					sourceProperties={makeSourceProps({
						inputSource: { id: "source-id", source: PossibleInputSource.INPUT, path: property },
					})}
				/>
			);

			fireEvent.click(getByTitle("Default Value"));

			expect(mockOnSourceChange).toHaveBeenCalledWith(PossibleInputSource.DEFAULT, expect.any(String));
		});

		it("calls onSourceChange with INPUT when INPUT toggle is clicked while DEFAULT is active", () => {
			const { getByTitle } = renderWithProviders(
				<SourceInput
					label="Label"
					onChange={jest.fn()}
					sourceProperties={makeSourceProps({
						inputSource: { id: "source-id", source: PossibleInputSource.DEFAULT, path: property },
					})}
				/>
			);

			fireEvent.click(getByTitle("Enter User Input"));

			expect(mockOnSourceChange).toHaveBeenCalledWith(PossibleInputSource.INPUT, expect.any(String));
		});

		it("calls onSourceChange with INHERITED when INHERITED toggle is clicked", () => {
			const { getByTitle } = renderWithProviders(
				<SourceInput
					label="Label"
					onChange={jest.fn()}
					sourceProperties={makeSourceProps({
						determineInheritedSource: () => true,
						inputSource: { id: "source-id", source: PossibleInputSource.INPUT, path: property },
					})}
				/>
			);

			fireEvent.click(getByTitle("Value inherited from parent"));

			expect(mockOnSourceChange).toHaveBeenCalledWith(PossibleInputSource.INHERITED, expect.any(String));
		});

		it("does not call onSourceChange when clicking the currently active source toggle", () => {
			const { getByTitle } = renderWithProviders(
				<SourceInput
					label="Label"
					value="some value"
					onChange={jest.fn()}
					sourceProperties={makeSourceProps({
						inputSource: { id: "source-id", source: PossibleInputSource.INPUT, path: property },
					})}
				/>
			);

			fireEvent.click(getByTitle("Enter User Input"));

			expect(mockOnSourceChange).not.toHaveBeenCalled();
		});
	});

	describe("text input interaction by source", () => {
		it("text input is editable when source is INPUT", () => {
			const { getByRole } = renderWithProviders(
				<SourceInput
					label="Label"
					id="source-text-input"
					value="editable value"
					onChange={jest.fn()}
					sourceProperties={makeSourceProps({
						inputSource: { id: "source-id", source: PossibleInputSource.INPUT, path: property },
					})}
				/>
			);

			const input = getByRole("textbox");
			expect(input).not.toHaveAttribute("readonly");
		});

		it("text input is read-only when source is DEFAULT", () => {
			const { getByRole } = renderWithProviders(
				<SourceInput
					label="Label"
					id="source-text-input"
					onChange={jest.fn()}
					sourceProperties={makeSourceProps({
						inputSource: { id: "source-id", source: PossibleInputSource.DEFAULT, path: property },
					})}
				/>
			);

			const input = getByRole("textbox");
			expect(input).toHaveAttribute("readonly");
		});

		it("text input is read-only when source is INHERITED", () => {
			const { getByRole } = renderWithProviders(
				<SourceInput
					label="Label"
					id="source-text-input"
					onChange={jest.fn()}
					sourceProperties={makeSourceProps({
						determineInheritedSource: () => true,
						inputSource: { id: "source-id", source: PossibleInputSource.INHERITED, path: property },
					})}
				/>
			);

			const input = getByRole("textbox");
			expect(input).toHaveAttribute("readonly");
		});
	});
});
