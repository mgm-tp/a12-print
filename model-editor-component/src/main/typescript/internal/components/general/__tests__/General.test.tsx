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
import { Reducer } from "redux";
import { fireEvent } from "@testing-library/react";

import {
	TransactionLog,
	TransactionLogStore,
} from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/transaction-log.js";
import {
	Language,
	PrintModelHeader,
	getEntityId,
	EntityKey,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/print-model.js";
import {
	PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
	PRINT_MODEL_HEADER_LOG_ID,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/constant.js";

import { PRINT_MODEL_VERSION } from "../../../constant/model.js";
import { initialStateLogStore, TransactionLogStateReducer } from "../../../redux/transaction-log-state/reducer.js";
import { TransactionLogStateActions } from "../../../redux/transaction-log-state/actions.js";
import { renderWithProviders } from "../../../../../../test/typescript/test-utils/index.js";

import { General, ModelNameRegExp } from "../index.js";

describe("General", () => {
	const generalMock: TransactionLogStateActions.UpdatePrintContentGeneralPayload = {
		id: PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
		details: { id: "ifnqjignqeg", author: "author", language: Language.DE },
		metadata: {
			id: "ifnqjignqeg",
			authorComputation: [{ id: "authComp123", operation: "author" }],
			languageComputation: [{ id: "langComp123", operation: "DE" }],
			titleComputation: [{ id: "titleComp123", operation: "model-name" }],
			descriptionComputation: [{ id: "titleComp123", operation: "Description" }],
		},
		title: "title",
		segmentDefaults: { id: "engqioehgnmeqolg2", fontSize: 12, model: "DomainPerson" },
		structure: [],
	};

	const annotationMock = {
		id: getEntityId(EntityKey.Annotations, "annotation-name"),
		name: "annotation-name",
		value: "annotation-value",
	};

	const printHeaderMock: PrintModelHeader = {
		id: "model-name",
		modelType: "print",
		modelVersion: PRINT_MODEL_VERSION,
		description: "Description",
		annotations: [annotationMock],
	};

	const initialStateMock: TransactionLogStore = {
		[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: TransactionLog.createStoreEntryPrintModelContentGeneral(
			initialStateLogStore[PRINT_MODEL_CONTENT_GENERAL_LOG_ID],
			generalMock,
			"0j310tj31t"
		).storeEntry,
		[PRINT_MODEL_HEADER_LOG_ID]: TransactionLog.createStoreEntryPrintModelHeader(
			initialStateLogStore[PRINT_MODEL_HEADER_LOG_ID],
			printHeaderMock,
			"3jm1t0o3jg0134gj42"
		).storeEntry,
		segments: { id: "ogfmeq1ogme2qg", map: {}, references: {} },
		printModelElements: {},
	};
	const TransactionLogStateReducerMock: Reducer = (state: TransactionLogStore = initialStateMock, action) =>
		TransactionLogStateReducer(state, action);

	const setupTest = () =>
		renderWithProviders(<General />, {
			TransactionLogState: TransactionLogStateReducerMock,
		});

	it("should renders correctly", () => {
		const { container } = setupTest();

		expect(container).toMatchSnapshot();
	});

	it("should update model description", () => {
		const { getByDisplayValue, queryByDisplayValue } = setupTest();

		expect(queryByDisplayValue("Description")).toBeInTheDocument();

		fireEvent.change(getByDisplayValue("Description"), { target: { value: "Updated value" } });

		expect(queryByDisplayValue("Description")).not.toBeInTheDocument();
		expect(queryByDisplayValue("Updated value")).toBeInTheDocument();
	});

	it("should update annotation", () => {
		const { getAllByRole, queryByDisplayValue, getByDisplayValue, getByLabelText, queryByText } = setupTest();
		const dataRow = getAllByRole("row")[2];

		fireEvent.click(dataRow);

		expect(queryByDisplayValue("annotation-value")).toBeInTheDocument();

		const annotationValueInput = getByDisplayValue("annotation-value");

		fireEvent.change(annotationValueInput, { target: { value: "new-value" } });
		fireEvent.blur(annotationValueInput);

		expect(queryByDisplayValue("annotation-value")).not.toBeInTheDocument();
		expect(queryByDisplayValue("new-value")).toBeInTheDocument();

		fireEvent.click(getByLabelText(/save/i));

		expect(queryByDisplayValue("new-value")).not.toBeInTheDocument();
		expect(queryByText("new-value")).toBeInTheDocument();
	});

	describe("ModelNameRegExp", () => {
		it("should match the expected model name", () => {
			expect(ModelNameRegExp.test("foo.bar-baz")).toBe(true);
			expect(ModelNameRegExp.test("foo.bar.baz")).toBe(true);
			expect(ModelNameRegExp.test("_foo_bar-baz")).toBe(true);
		});

		it("should not match the invalid model name", () => {
			expect(ModelNameRegExp.test("")).toBe(false);
			expect(ModelNameRegExp.test("xmlfoo")).toBe(false);
			expect(ModelNameRegExp.test("foo@baz")).toBe(false);
			expect(ModelNameRegExp.test("-foo_baz")).toBe(false);
		});
	});
});
