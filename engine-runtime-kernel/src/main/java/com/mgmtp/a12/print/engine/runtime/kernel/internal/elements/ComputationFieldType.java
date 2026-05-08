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
package com.mgmtp.a12.print.engine.runtime.kernel.internal.elements;

import com.mgmtp.a12.kernel.md.model.a12internal.fieldtypes.*;

import java.util.Optional;

/**
 * Ordered List of Computation Field Types.
 * The order determines which Type would "win" if there is Arithmetic containing multiple
 */
public enum ComputationFieldType {
	UNKNOWN,

	STRING,
	NUMBER,

	BOOLEAN,

	DATE,

	DATE_TIME,

	TIME,

	DATE_RANGE,

	DATE_FRAGMENT,

	ENUMERATION,

	CUSTOM,
	EMPTY;

	public boolean isStringLike() {
		switch (this) {
			case STRING, ENUMERATION, CUSTOM, EMPTY:
				return true;
			default:
		}
		return false;
	}

	public Optional<FieldType> getFieldType() {
		return switch (this) {
			case ENUMERATION -> Optional.of(StringType.builder().lineBreaksPermitted(false).build());
			case STRING -> Optional.of(StringType.builder().lineBreaksPermitted(true).build());
			case NUMBER -> Optional.of(new NumberType());
			case BOOLEAN -> Optional.of(new BooleanType());
			case DATE -> Optional.of(new DateType());
			case DATE_TIME -> Optional.of(new DateTimeType());
			case TIME -> Optional.of(new TimeType());
			case DATE_RANGE -> Optional.of(new DateRangeType());
			case DATE_FRAGMENT -> Optional.of(new DateFragmentType());
			default -> Optional.empty();
		};
	}

	public boolean isComparableTo(ComputationFieldType computationFieldType) {
		switch (this) {

			case STRING, ENUMERATION:
				return computationFieldType.isStringLike();
			default:
		}
		return equals(computationFieldType);
	}
}
