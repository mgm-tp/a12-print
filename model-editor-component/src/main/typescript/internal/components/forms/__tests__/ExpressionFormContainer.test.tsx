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
import { within } from "@testing-library/react";

import { ElementType, PartialExpression } from "@com.mgmtp.a12.print/print-model-api/model";
import { PossibleInputSource } from "@com.mgmtp.a12.print/print-model-api/input-source";

import {
	renderWithProviders,
	defaultPrintEditorState,
	initialStateLogStoreMock,
	createTransactionLogState,
	mockSegment,
} from "../../../../../../test/typescript/test-utils/index.js";

import { ExpressionFormContainer } from "../ExpressionFormContainer.js";

describe("ExpressionFormContainer", () => {
	const EXPRESSION_ID = "expression-element-id";

	const mockExpressionElement: PartialExpression = {
		id: EXPRESSION_ID,
		type: ElementType.Expression,
		expression: {
			id: "exp-id",
			text: "test expression",
		},
		textProperties: {
			id: "text-props-id",
			textStyleId: {
				id: "text-style-source-id",
				source: PossibleInputSource.INPUT,
				path: "textProperties.textStyleId",
			},
			bold: {
				id: "bold-source-id",
				source: PossibleInputSource.INPUT,
				path: "textProperties.bold",
			},
			italic: {
				id: "italic-source-id",
				source: PossibleInputSource.INPUT,
				path: "textProperties.italic",
			},
			underlined: {
				id: "underlined-source-id",
				source: PossibleInputSource.INPUT,
				path: "textProperties.underlined",
			},
			color: {
				id: "color-source-id",
				source: PossibleInputSource.INPUT,
				path: "textProperties.color",
			},
			backgroundColor: {
				id: "bg-color-source-id",
				source: PossibleInputSource.INPUT,
				path: "textProperties.backgroundColor",
			},
			alignment: {
				id: "alignment-source-id",
				source: PossibleInputSource.INPUT,
				path: "textProperties.alignment",
			},
		},
	};

	const mockTransactionLogStore = {
		...initialStateLogStoreMock,
		printModelElements: {
			[EXPRESSION_ID]: {
				id: EXPRESSION_ID,
				log: [],
				memoizedObject: mockExpressionElement,
			},
		},
	};

	const setupTest = () =>
		renderWithProviders(<ExpressionFormContainer />, {
			PrintEditorState: () => defaultPrintEditorState,
			DetailData: () => ({
				[mockSegment.id]: {
					refId: EXPRESSION_ID,
					formContainers: [],
				},
			}),
			TransactionLogState: createTransactionLogState(mockTransactionLogStore),
		});

	it("should only have INPUT and DEFAULT as possibleInputSources in all source inputs", () => {
		const { container } = setupTest();

		const textPropertyLabels = [
			"Text Styles",
			"Bold",
			"Italic",
			"Underline",
			"Color",
			"Background Color",
			"Alignment",
		];

		textPropertyLabels.forEach(labelText => {
			const labelEl = Array.from(container.querySelectorAll("label")).find(el =>
				el.textContent?.includes(labelText)
			);
			expect(labelEl).toBeDefined();

			const sourceContainer = labelEl!.parentElement!;
			expect(within(sourceContainer).getByTitle("Enter User Input")).toBeInTheDocument();
			expect(within(sourceContainer).getByTitle("Default Value")).toBeInTheDocument();
			expect(within(sourceContainer).queryByTitle("Value inherited from parent")).not.toBeInTheDocument();
		});
	});
});
