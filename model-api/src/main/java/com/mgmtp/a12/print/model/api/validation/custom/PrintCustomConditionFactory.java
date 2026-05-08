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
package com.mgmtp.a12.print.model.api.validation.custom;

import java.util.Optional;

import com.mgmtp.a12.print.model.api.validation.custom.conditions.*;
import lombok.NonNull;

import org.apache.commons.lang3.NotImplementedException;

import com.mgmtp.a12.kernel.md.rt.api.ICustomCondition;
import com.mgmtp.a12.kernel.md.rt.api.ICustomConditionFactory;


public class PrintCustomConditionFactory implements ICustomConditionFactory {

	@Override
	public ICustomCondition createCustomCondition(String customConditionName) {
		throw new NotImplementedException();
	}

	@Override
	public Optional<ICustomCondition> createCustomConditionV2(@NonNull String customConditionName) {
		switch (customConditionName) {
			case "print_RolesNotInRoleModel":
			case "print_RolesModelNotPresent":
			case "print_RolesModelPresent":
				return Optional.of(new AlwaysFalseCustomCondition());
			case "print_RolesNotUnique":
				return Optional.of(new IsRolesNotUniqueCustomCondition());
			case "print_RoleNotEmpty":
				return Optional.of(new IsRoleNotEmptyCustomCondition());
			case "print_ElementReferenceOverlapped":
				return Optional.of(new IsElementReferenceOverlapped());
			case "print_OnlyOneIsSortingColumn":
				return Optional.of(new OnlyOneIsSortingColumn());
			default:
				return Optional.empty();
		}
	}
}
