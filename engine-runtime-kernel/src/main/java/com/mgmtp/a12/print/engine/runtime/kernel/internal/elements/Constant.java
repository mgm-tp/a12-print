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

import com.mgmtp.a12.print.engine.api.exception.PrintCompilerException;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NonNull;

import java.math.BigDecimal;
import java.util.Objects;

@Data
@Builder(toBuilder = true)
public class Constant implements SyntaxTreeElement, Predicate.Parameter, ArithmeticBranch, LogicBranch, CompareBranch {

	public static final Constant TRUE = Constant.builder().value("True").constantType(ConstantType.BOOLEAN).build();
	public static final Constant FALSE = Constant.builder().value("False").constantType(ConstantType.BOOLEAN).build();

	@NonNull
	private final String value;
	@NonNull
	private final ConstantType constantType;

	@Override
	public SyntaxTreeElementType elementType() {
		return SyntaxTreeElementType.CONSTANT;
	}

	@Override
	public void accept(SyntaxTreeElementVisitor visitor, VisitationState state) {
		// accept is disabled for Constant
	}

	public boolean valueEquals(Constant other) {
		switch (constantType) {
			case STRING, BOOLEAN:
				return Objects.equals(getObjectValue(), other.getObjectValue());
			case INTEGER, FLOAT: {
				if (!other.getConstantType().isNumeric()) {
					return false;
				}
				final var thisVal = new BigDecimal(value);
				final var otherVal = new BigDecimal(other.getValue());
				return thisVal.compareTo(otherVal) == 0;
			}
		}
		throw new PrintCompilerException("invalid Constant");
	}

	@EqualsAndHashCode.Include
	public Object getObjectValue() {
		switch (constantType) {
			case STRING:
				return value;
			case INTEGER, FLOAT:
				return new BigDecimal(value);
			case BOOLEAN: {
				return TRUE.getValue().equalsIgnoreCase(getValue());
			}
		}
		throw new PrintCompilerException("invalid Constant");
	}


	public enum ConstantType {
		STRING,
		INTEGER,
		BOOLEAN,
		FLOAT;

		public boolean isNumeric() {
			return this == INTEGER || this == FLOAT;
		}
	}

}
