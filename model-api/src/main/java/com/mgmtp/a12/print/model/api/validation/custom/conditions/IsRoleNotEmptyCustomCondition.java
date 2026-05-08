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
package com.mgmtp.a12.print.model.api.validation.custom.conditions;

import com.mgmtp.a12.kernel.md.document.api.IDocument;
import com.mgmtp.a12.kernel.md.document.api.IEntityInstance;
import com.mgmtp.a12.kernel.md.document.api.IFieldInstance;
import com.mgmtp.a12.kernel.md.rt.api.ICustomCondition;

import java.util.*;
import java.util.stream.*;

public class IsRoleNotEmptyCustomCondition implements ICustomCondition {

	@Override
    public boolean check(
        IDocument document,
        Set<IEntityInstance> relevantEntityInstances,
        Set<IEntityInstance> formallyIncorrectEntityInstances,
        IEntityInstance errorEntityInstance
    )	{
		if (relevantEntityInstances != null && !relevantEntityInstances.isEmpty()) {
			return false;
		}

		if (formallyIncorrectEntityInstances != null && !formallyIncorrectEntityInstances.isEmpty()) {
			return false;
		}

        List<String> roles = document.getEntityInstances().stream()
			.filter(e -> e.getPath().equals(errorEntityInstance.getPath()))
			.filter(e -> e instanceof IFieldInstance)
            .map(e -> (IFieldInstance) e)
			.map(IFieldInstance::getValue)
			.map(f -> f.map(Object::toString).orElse(""))
			.flatMap(s -> Arrays.stream(s.split(",")))
            .collect(Collectors.toList());

		return roles.stream().anyMatch(role -> role.equals(""));
    }
}
