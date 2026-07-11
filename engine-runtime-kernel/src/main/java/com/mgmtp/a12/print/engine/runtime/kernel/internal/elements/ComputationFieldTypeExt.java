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

import com.mgmtp.a12.kernel.md.model.api.fieldtypes.*;
import com.mgmtp.a12.print.engine.api.exception.impl.PrintCompilerException;
import com.mgmtp.a12.print.engine.api.exception.impl.PrintDomainException;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.PredicateClassification;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.kernel.IFieldTypeExt;
import com.mgmtp.a12.print.model.api.model.element.base.ComputationAlternative;
import com.mgmtp.a12.print.model.api.model.element.base.FieldTypeDefinition;
import com.mgmtp.a12.print.model.api.model.element.type.listing.GroupPropertyComputation;
import com.mgmtp.a12.print.model.api.model.element.type.listing.RowPropertyComputation;
import com.mgmtp.a12.print.model.api.model.element.type.listing.column.ColumnPropertyComputation;

import java.util.Collection;
import java.util.Objects;
import java.util.stream.Collectors;

public abstract class ComputationFieldTypeExt {


	public static ComputationFieldType computationFieldTypeFrom(Constant.ConstantType constantType) {
		switch (constantType) {
			case STRING:
				return ComputationFieldType.STRING;
			case FLOAT, INTEGER:
				return ComputationFieldType.NUMBER;
			case BOOLEAN:
				return ComputationFieldType.BOOLEAN;
			default:
		}
		return ComputationFieldType.UNKNOWN;
	}

	public static ComputationFieldType computationFieldTypeFrom(
		FieldTypeDefinition.FieldType fieldType,
		Collection<ComputationAlternative> computationAlternatives
	) {
		if (fieldType != null) {
			switch (fieldType) {
				case BOOLEAN:
					return ComputationFieldType.BOOLEAN;
				case NUMBER:
					return ComputationFieldType.NUMBER;
				case STRING:
					return ComputationFieldType.STRING;
				case TYPE_DEFINITION:
					throw new PrintDomainException(
						"Unable to convert a TypeDefinition into a ComputationFieldType for the calculation \n{}",
						computationAlternatives.stream().map(computationAlternative -> String.format(
							"Precondition: %s, Operation: %s", computationAlternative.getPrecondition().orElse(""), computationAlternative.getOperation()
						)).collect(Collectors.joining("\n"))
					);
			}
		}
		return ComputationFieldType.UNKNOWN;
	}

	public static ComputationFieldType computationFieldTypeFrom(IFieldType ft) {

		final var fieldType = IFieldTypeExt.getEffectiveFieldType(ft);

		if (fieldType instanceof IStringType) {
			return ComputationFieldType.STRING;
		}
		if (fieldType instanceof IBooleanType) {
			return ComputationFieldType.BOOLEAN;
		}
		if (fieldType instanceof IConfirmType) {
			return ComputationFieldType.BOOLEAN;
		}
		if (fieldType instanceof INumberType) {
			return ComputationFieldType.NUMBER;
		}
		if (fieldType instanceof ITimeType) {
			return ComputationFieldType.DATE_TIME;
		}
		if (fieldType instanceof IDateTimeType) {
			return ComputationFieldType.DATE_TIME;
		}
		if (fieldType instanceof IDateType) {
			return ComputationFieldType.DATE;
		}
		if (fieldType instanceof IDateRangeType) {
			return ComputationFieldType.DATE_RANGE;
		}
		if (fieldType instanceof IDateFragmentType) {
			return ComputationFieldType.DATE_FRAGMENT;
		}
		if (fieldType instanceof ICustomFieldType) {
			return ComputationFieldType.CUSTOM;
		}
		if (fieldType instanceof IEnumerationType) {
			return ComputationFieldType.ENUMERATION;
		}

		return ComputationFieldType.UNKNOWN;
	}

	public static ComputationFieldType computationFieldTypeFrom(PredicateClassification.PredicateType type) {

		switch (type) {
			case NUMBER:
				return ComputationFieldType.NUMBER;
			case DATE:
				return ComputationFieldType.DATE;
			case DATE_TIME:
				return ComputationFieldType.DATE_TIME;
			case BOOLEAN:
				return ComputationFieldType.BOOLEAN;
			case STRING:
				return ComputationFieldType.STRING;
			case TIME:
				return ComputationFieldType.TIME;

		}
		return ComputationFieldType.UNKNOWN;
	}

	public static ComputationFieldType computationFieldTypeFrom(ColumnPropertyComputation.PropertyType property) {
		return switch (property) {
			case BOLD, ITALIC, UNDERLINE, IS_HIDDEN, IS_CONTENT_HIDDEN -> ComputationFieldType.BOOLEAN;
			case HORIZONTAL_ALIGNMENT, VERTICAL_ALIGNMENT, FONT, COLOR, BACKGROUND_COLOR, BORDER_STYLE, BORDER_COLOR ->
				ComputationFieldType.STRING;
			case FONT_SIZE, LINE_HEIGHT, BORDER_WIDTH, COLUMN_SPAN, PADDING_TOP, PADDING_BOTTOM, PADDING_LEFT,
			     PADDING_RIGHT -> ComputationFieldType.NUMBER;
			default ->
				throw new PrintCompilerException("ColumnPropertyComputation.PropertyType " + property.name() + "is not supported");
		};
	}

	public static ComputationFieldType computationFieldTypeFrom(RowPropertyComputation.PropertyType property) {
		return switch (property) {
			case BOLD, ITALIC, UNDERLINE, IS_HIDDEN -> ComputationFieldType.BOOLEAN;
			case HORIZONTAL_ALIGNMENT, VERTICAL_ALIGNMENT, FONT, COLOR, BACKGROUND_COLOR, BORDER_STYLE, BORDER_COLOR ->
				ComputationFieldType.STRING;
			case FONT_SIZE, LINE_HEIGHT, BORDER_WIDTH, PADDING_TOP, PADDING_BOTTOM, PADDING_LEFT, PADDING_RIGHT ->
				ComputationFieldType.NUMBER;
		};
	}

	public static ComputationFieldType computationFieldTypeFrom(GroupPropertyComputation.PropertyType property) {
		if (Objects.requireNonNull(property) == GroupPropertyComputation.PropertyType.IS_HIDDEN) {
			return ComputationFieldType.BOOLEAN;
		}
		throw new PrintCompilerException("GroupPropertyComputation.PropertyType " + property.name() + "is not supported");
	}
}
