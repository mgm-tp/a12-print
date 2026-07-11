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
import type { ICustomCondition, ICustomConditionFactory } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import {
	alwaysFalseCondition,
	ElementReferenceOverlapped,
	OnlyOneIsSortingColumn,
	RoleNotEmpty,
	RolesNotUnique,
} from "./conditions/index.js";

export enum CustomConditionName {
	RoleNotEmpty = "print_RoleNotEmpty",
	RolesNotUnique = "print_RolesNotUnique",
	RolesNotInRoleModel = "print_RolesNotInRoleModel",
	RolesModelNotPresent = "print_RolesModelNotPresent",
	RolesModelPresent = "print_RolesModelPresent",
	ElementReferenceOverlapped = "print_ElementReferenceOverlapped",
	OnlyOneIsSortingColumn = "print_OnlyOneIsSortingColumn",
}

type CustomConditionMap = Record<CustomConditionName, ICustomCondition>;

export class PrintCustomConditionFactory implements ICustomConditionFactory {
	private static readonly instance = new PrintCustomConditionFactory();

	private readonly overridableConditionMap: Partial<CustomConditionMap> = {
		[CustomConditionName.RolesNotInRoleModel]: alwaysFalseCondition,
		[CustomConditionName.RolesModelNotPresent]: alwaysFalseCondition,
		[CustomConditionName.RolesModelPresent]: alwaysFalseCondition,
	};

	private readonly protectedConditions: Partial<CustomConditionMap> = {
		[CustomConditionName.RoleNotEmpty]: RoleNotEmpty,
		[CustomConditionName.RolesNotUnique]: RolesNotUnique,
		[CustomConditionName.ElementReferenceOverlapped]: ElementReferenceOverlapped,
		[CustomConditionName.OnlyOneIsSortingColumn]: OnlyOneIsSortingColumn,
	};

	private constructor() {}

	createCustomCondition(customConditionName: string): ICustomCondition | null {
		return this.getCustomConditionImplementation(customConditionName as CustomConditionName) ?? null;
	}

	private getCustomConditionImplementation(name: CustomConditionName): ICustomCondition | null {
		const customCondition = this.protectedConditions[name] ?? this.overridableConditionMap[name];
		if (!customCondition) {
			return null;
		}
		return customCondition;
	}

	public static getInstance(): PrintCustomConditionFactory {
		return this.instance;
	}

	public setCustomCondition(name: CustomConditionName, newCondition: ICustomCondition): void {
		if (this.protectedConditions[name]) {
			throw new Error(`Custom condition "${name}" is protected and cannot be overridden.`);
		}

		if (!this.overridableConditionMap[name]) {
			throw new Error(`Custom condition "${name}" does not exist.`);
		}

		this.overridableConditionMap[name] = newCondition;
	}

	public getOverridableConditions(): Readonly<CustomConditionMap> {
		return this.overridableConditionMap as CustomConditionMap;
	}

	public getProtectedConditions(): Readonly<CustomConditionMap> {
		return this.protectedConditions as CustomConditionMap;
	}
}
