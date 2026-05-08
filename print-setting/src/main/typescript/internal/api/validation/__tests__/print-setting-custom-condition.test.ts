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

describe("print setting custom condition", () => {
	afterEach(() => {
		PrintCustomConditionRegistry.getInstance().setCustomCondition(
			CustomConditionName.RolesModelNotPresent,
			alwaysFalseCondition
		);
		PrintCustomConditionRegistry.getInstance().setCustomCondition(
			CustomConditionName.RolesModelPresent,
			alwaysFalseCondition
		);
		PrintCustomConditionRegistry.getInstance().setCustomCondition(
			CustomConditionName.RolesNotInRoleModel,
			alwaysFalseCondition
		);
	});

	const baseModel = {
		header: {
			id: "test-model",
			modelType: "print-setting",
			modelVersion: "3.0.0",
			annotations: [] as { name: string; value: string }[],
		},
		content: {
			settings: {},
		},
	};

	it("should trigger mustHaveValidRoleValues", () => {
		const model = structuredClone(baseModel);
		model.header.annotations = [{ name: "roles", value: "123invalidRole" }];

		const { errors, warnings } = testValidation(model);

		expect(errors.length).toBe(1);
		expect(errors[0].parameters?.rulePath).toBe("/header/annotations/mustHaveValidRoleValues");
		expect(warnings.length).toBe(0);
	});

	it("should trigger rolesNotUnique", () => {
		const model = structuredClone(baseModel);
		model.header.annotations = [{ name: "roles", value: "admin,admin" }];

		const { errors, warnings } = testValidation(model);

		expect(errors.length).toBe(1);
		expect(errors[0].parameters?.rulePath).toBe("/header/annotations/rolesNotUnique");
		expect(warnings.length).toBe(0);
	});

	it("should trigger shouldNotHaveEmptyRoles", () => {
		const model = structuredClone(baseModel);
		model.header.annotations = [{ name: "roles", value: "admin," }];

		const { errors, warnings } = testValidation(model);

		expect(errors.length).toBe(1);
		expect(errors[0].parameters?.rulePath).toBe("/header/annotations/shouldNotHaveEmptyRoles");
		expect(warnings.length).toBe(0);
	});

	it("should trigger shouldNotHaveEmptyRoles", () => {
		const model = structuredClone(baseModel);
		model.header.annotations = [{ name: "roles", value: "" }];

		const { errors, warnings } = testValidation(model);

		expect(errors.length).toBe(1);
		expect(errors[0].parameters?.rulePath).toBe("/header/annotations/shouldNotHaveEmptyRoles");
		expect(warnings.length).toBe(0);
	});

	it("should trigger roleIsNotPartOfRolesModel", () => {
		const model = structuredClone(baseModel);
		model.header.annotations = [{ name: "roles", value: "nonexistentRole" }];

		PrintCustomConditionRegistry.getInstance().setCustomCondition(
			CustomConditionName.RolesNotInRoleModel,
			alwaysTrueCondition
		);

		const { errors, warnings } = testValidation(model);

		expect(errors.length).toBe(0);
		expect(warnings.length).toBe(1);
		expect(warnings[0].parameters?.rulePath).toBe("/header/annotations/roleIsNotPartOfRolesModel");
	});

	it("should trigger shouldHaveRolesModelIfSpecifyingRoles", () => {
		const model = structuredClone(baseModel);
		model.header.annotations = [{ name: "roles", value: "admin" }];

		PrintCustomConditionRegistry.getInstance().setCustomCondition(
			CustomConditionName.RolesModelNotPresent,
			alwaysTrueCondition
		);

		const { errors, warnings } = testValidation(model);

		expect(errors.length).toBe(0);
		expect(warnings.length).toBe(1);
		expect(warnings[0].parameters?.rulePath).toBe("/header/annotations/shouldHaveRolesModelIfSpecifyingRoles");
	});

	it("should trigger mustHaveRolesIfRolesModelPresent", () => {
		const model = structuredClone(baseModel);
		model.header.annotations = [];

		PrintCustomConditionRegistry.getInstance().setCustomCondition(
			CustomConditionName.RolesModelPresent,
			alwaysTrueCondition
		);

		const { errors, warnings } = testValidation(model);

		expect(errors.length).toBe(0);
		expect(warnings.length).toBe(1);
		expect(warnings[0].parameters?.rulePath).toBe("/header/mustHaveRolesIfRolesModelPresent");
	});

	it("should not trigger mustHaveRolesIfRolesModelPresent", () => {
		const model = structuredClone(baseModel);
		model.header.annotations = [{ name: "roles", value: "admin" }];

		PrintCustomConditionRegistry.getInstance().setCustomCondition(
			CustomConditionName.RolesModelPresent,
			alwaysTrueCondition
		);

		const { errors, warnings } = testValidation(model);

		expect(errors.length).toBe(0);
		expect(warnings.length).toBe(0);
	});
});
