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
import { renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore as configureMockStore } from "redux-mock-store";
import { ReactNode } from "react";

import { ErrorSeverity, PrintErrorMap } from "@com.mgmtp.a12.print/print-model-api/lib/errors/index.js";

import { PrintLocalizer } from "../../localization/index.js";

import {
	getErrors,
	joinErrorPath,
	useBorderPropertiesErrorMessage,
	useTextPropertiesErrorMessage,
} from "../validation-utils.js";

import { largeErrorMap, errorMap } from "./__testdata__/errorMap.js";

describe("validation utils", () => {
	describe("joinErrorPath", () => {
		it("should return only severity if path is empty", () => {
			const result = joinErrorPath();
			expect(result).toEqual(ErrorSeverity.ERROR);
		});

		it("should concatenate path and severity with a dot", () => {
			const path = "path.to.property";
			const result = joinErrorPath(path, ErrorSeverity.WARNING);
			expect(result).toEqual(`${path}.${ErrorSeverity.WARNING}`);
		});
	});

	describe("getErrors", () => {
		it("should get Errors and Warnings from ErrorMap", () => {
			const { errors, warnings } = getErrors(largeErrorMap as PrintErrorMap);

			expect(warnings.length).toBe(2);
			expect(warnings[0].jsonPath.length).toBe(7);
			expect(warnings[0].errorCode).toBe("Error rule_b1fd7");
			expect(warnings[0].severity).toBe("WARNING");
			expect(warnings[0].errorMessage[0].key).toBe(
				"documentModel.ruleErrorMessage.DomainPrintMetaModel.content.segments.definitions.elementNotOverlap"
			);
			expect(JSON.stringify(warnings)).toMatchSnapshot();

			expect(errors.length).toBe(6);
			expect(errors[0].jsonPath.length).toBe(3);
			expect(errors[0].errorCode).toBe("nachfolgendesBlank");
			expect(errors[0].severity).toBe("ERROR");
			expect(errors[0].errorMessage[0].key).toBe("kernel.formalErrors.FEHLER_NACHFOLGENDES_BLANK_FM_TEXT");
			expect(JSON.stringify(errors)).toMatchSnapshot();
		});
	});

	describe("useTextPropertiesErrorMessage", () => {
		it("should call localizer function with the correct argument", () => {
			const { wrapper, localizerFunctionSpy } = hookTestSetup();
			const { result } = renderHook(() => useTextPropertiesErrorMessage("1kzGG-tOzD8a4taPZJZt6"), { wrapper });

			result.current("alignment");
			expect(localizerFunctionSpy).toHaveBeenCalledWith(
				errorMap.content.elementDefinitions[0].textProperties.alignment["@error"]
			);
		});
		it("should not call localizer function when error is not found", () => {
			const { wrapper, localizerFunctionSpy } = hookTestSetup();
			const { result } = renderHook(() => useTextPropertiesErrorMessage(), { wrapper });

			result.current("alignment");
			expect(localizerFunctionSpy).not.toHaveBeenCalled();
		});
	});

	describe("useBorderPropertiesErrorMessage", () => {
		it("should call localizer function with the correct argument", () => {
			const { wrapper, localizerFunctionSpy } = hookTestSetup();
			const { result } = renderHook(() => useBorderPropertiesErrorMessage("1kzGG-tOzD8a4taPZJZt6"), { wrapper });

			result.current("borderWidth");
			expect(localizerFunctionSpy).toHaveBeenCalledWith(
				errorMap.content.elementDefinitions[0].borderProperties.borderWidth["@error"]
			);
		});
		it("should not call localizer function when error is not found", () => {
			const { wrapper, localizerFunctionSpy } = hookTestSetup();
			const { result } = renderHook(() => useBorderPropertiesErrorMessage(), { wrapper });

			result.current("borderWidth");
			expect(localizerFunctionSpy).not.toHaveBeenCalled();
		});
	});
});

function hookTestSetup() {
	const mockStore = configureMockStore();
	const store = mockStore({
		ValidationState: {
			errorMap,
		},
		PrintEditorState: {},
		DetailData: {},
		Sidebar: {},
		TransactionLogState: {},
		RequestApi: {},
		InteractionLogState: {},
	});

	const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const localizerFunctionSpy = jest.fn() as any;
	jest.spyOn(PrintLocalizer, "useErrorMessageLocalizer").mockImplementation(() => localizerFunctionSpy);

	return { wrapper, localizerFunctionSpy, store };
}
