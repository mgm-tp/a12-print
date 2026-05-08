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
import {
	alwaysFalseCondition,
	alwaysTrueCondition,
	CustomConditionName,
	PrintCustomConditionRegistry,
} from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/validation/print-custom-condition/index.js";

import { testValidation } from "../../../../../../test/typescript/test-utils/validation.js";

import {
	invalidModel_RequiredValues,
	invalidModel_MultipleFallback,
	invalidModel_RequiredByFontType,
	invalidModel_UniqueName,
	validModel,
} from "./__testdata__/index.js";

describe("print model setting validator", () => {
	afterEach(() => {
		PrintCustomConditionRegistry.getInstance().setCustomCondition(
			CustomConditionName.RolesNotInRoleModel,
			alwaysFalseCondition
		);
	});

	it("Should return required error message for font name", () => {
		const { errors, warnings } = testValidation(invalidModel_RequiredValues);
		const firstError = errors[0];

		expect(firstError.jsonPath.map(el => el.elementName).join("/")).toBe("content/settings/fonts/name");
		expect(firstError.errorCode).toBe("mandatoryField");
		expect(warnings.length).toBe(0);
	});

	it("Should return unique error message for font name", () => {
		const { errors, warnings } = testValidation(invalidModel_UniqueName);
		const firstError = errors[0];
		const secondError = errors[1];

		expect(firstError.jsonPath.map(el => el.elementName).join("/")).toBe("content/settings/fonts/name");
		expect(firstError?.parameters?.rulePath).toBe("/content/settings/uniqueFontName");

		expect(secondError.jsonPath.map(el => el.elementName).join("/")).toBe("content/settings/fonts/name");
		expect(secondError?.parameters?.rulePath).toBe("/content/settings/uniqueFontName");
		expect(warnings.length).toBe(0);
	});

	it("Should return required error message according to font type", () => {
		const { errors, warnings } = testValidation(invalidModel_RequiredByFontType);
		const firstError = errors[0];
		const secondError = errors[1];

		expect(firstError.jsonPath.map(el => el.elementName).join("/")).toBe("content/settings/fonts/path");
		expect(firstError?.parameters?.rulePath).toBe("/content/settings/fonts/requiredPathIfTypeIsPath");

		expect(secondError.jsonPath.map(el => el.elementName).join("/")).toBe(
			"content/settings/fonts/fontAttachment/content"
		);
		expect(secondError?.parameters?.rulePath).toBe("/content/settings/fonts/requiredAttachmentIfTypeIsAttachment");
		expect(warnings.length).toBe(0);
	});

	it("Should return multiple fallback error message", () => {
		const { errors, warnings } = testValidation(invalidModel_MultipleFallback);
		const firstError = errors[0];

		expect(firstError.jsonPath.map(el => el.elementName).join("/")).toBe("content/settings/fonts/fallback");
		expect(firstError?.parameters?.rulePath).toBe("/content/settings/noMultipleFallback");
		expect(warnings.length).toBe(0);
	});

	it("Should return custom condition warning", () => {
		PrintCustomConditionRegistry.getInstance().setCustomCondition(
			CustomConditionName.RolesNotInRoleModel,
			alwaysTrueCondition
		);
		const { errors, warnings } = testValidation(validModel);
		const firstWarning = warnings[0];

		expect(errors.length).toBe(0);
		expect(warnings.length).toBe(1);
		expect(firstWarning.jsonPath.map(el => el.elementName).join("/")).toBe("header/annotations/value");
		expect(firstWarning?.parameters?.rulePath).toBe("/header/annotations/roleIsNotPartOfRolesModel");
	});

	it("Should return no error messages", () => {
		const { errors, warnings } = testValidation(validModel);

		expect(errors.length).toBe(0);
		expect(warnings.length).toBe(0);
	});
});
