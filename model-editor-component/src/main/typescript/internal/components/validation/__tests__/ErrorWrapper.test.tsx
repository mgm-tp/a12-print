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
import { PrintError } from "@com.mgmtp.a12.print/print-model-api/lib/errors/index.js";

import { renderWithProviders } from "../../../../../../test/typescript/test-utils/index.js";

import { ErrorWrapper } from "../ErrorWrapper.js";

describe("ErrorWrapper", () => {
	const TextComponent = () => <div>Text component</div>;
	const createErrors = (severity: "ERROR" | "WARNING" | "INFO" = "ERROR", length = 1): PrintError[] => {
		return Array(length).fill({
			origin: "VALIDATOR",
			jsonPath: [],
			severity: "ERROR",
			errorCode: String(severity),
			parameters: {
				messageKey: severity,
			},
			errorMessage: [
				{
					key: "print.test.error",
					args: {},
					defaults: {
						en: severity,
						de: severity,
					},
				},
			],
		} as PrintError);
	};

	describe("When the errorMessage or warningMessage are not provided", () => {
		it("should render a child component without any error or warning", () => {
			const { queryByText } = renderWithProviders(
				<ErrorWrapper>
					<TextComponent />
				</ErrorWrapper>
			);

			expect(queryByText("Text component")).toBeInTheDocument();
			expect(queryByText("ERROR")).not.toBeInTheDocument();
			expect(queryByText("WARNING")).not.toBeInTheDocument();
		});
	});

	describe("When the errorMessage is provided", () => {
		it("should render a child component with an error", () => {
			const { queryByText } = renderWithProviders(
				<ErrorWrapper errors={createErrors("ERROR")}>
					<TextComponent />
				</ErrorWrapper>
			);

			expect(queryByText("Text component")).toBeInTheDocument();
			expect(queryByText("ERROR")).toBeInTheDocument();
		});
	});

	describe("When the warning is provided", () => {
		it("should render a child component with a warning", () => {
			const { queryByText } = renderWithProviders(
				<ErrorWrapper errors={createErrors("WARNING")}>
					<TextComponent />
				</ErrorWrapper>
			);

			expect(queryByText("ERROR")).not.toBeInTheDocument();
			expect(queryByText("WARNING")).toBeInTheDocument();
		});
	});

	describe("When errorMessage and warningMessage are provided", () => {
		it("should render a child component with error and warning message", () => {
			const { queryByText } = renderWithProviders(
				<ErrorWrapper warnings={createErrors("WARNING")} errors={createErrors("ERROR")}>
					<TextComponent />
				</ErrorWrapper>
			);

			expect(queryByText("ERROR")).toBeInTheDocument();
			expect(queryByText("WARNING")).toBeInTheDocument();
		});
	});

	describe("When multiple errors are provided", () => {
		it("Should render a child component with list of errors", () => {
			const { queryAllByText } = renderWithProviders(
				<ErrorWrapper errors={createErrors("ERROR", 3)}>
					<TextComponent />
				</ErrorWrapper>
			);
			expect(queryAllByText("ERROR")).toHaveLength(3);
		});
	});
});
