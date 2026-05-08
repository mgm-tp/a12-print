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
package com.mgmtp.a12.print.engine.runtime.kernel.internal.kernel;

import com.mgmtp.a12.kernel.md.model.api.fieldtypes.*;

public interface FieldTypeVisitor<T> {

	default T visit(IFieldType fieldType) {

		if (fieldType instanceof IStringType) {
			return visit((IStringType) fieldType);
		} else if (fieldType instanceof IBooleanType) {
			return visit((IBooleanType) fieldType);
		} else if (fieldType instanceof IConfirmType) {
			return visit((IConfirmType) fieldType);
		} else if (fieldType instanceof INumberType) {
			return visit((INumberType) fieldType);
		} else if (fieldType instanceof ITimeType) {
			return visit((ITimeType) fieldType);
		} else if (fieldType instanceof IDateTimeType) {
			return visit((IDateTimeType) fieldType);
		} else if (fieldType instanceof IDateType) {
			return visit((IDateType) fieldType);
		} else if (fieldType instanceof IDateRangeType) {
			return visit((IDateRangeType) fieldType);
		} else if (fieldType instanceof IDateFragmentType) {
			return visit((IDateFragmentType) fieldType);
		} else if (fieldType instanceof ICustomFieldType) {
			return visit((ICustomFieldType) fieldType);
		} else if (fieldType instanceof IEnumerationType) {
			return visit((IEnumerationType) fieldType);
		} else {
			return visitNotSupported(fieldType);
		}

	}

	default T visit(IStringType fieldType) {
		return visitNotImplemented(fieldType);
	}

	default T visit(IBooleanType fieldType) {
		return visitNotImplemented(fieldType);
	}

	default T visit(IConfirmType fieldType) {
		return visitNotImplemented(fieldType);
	}

	default T visit(INumberType fieldType) {
		return visitNotImplemented(fieldType);
	}

	default T visit(ITimeType fieldType) {
		return visitNotImplemented(fieldType);
	}

	default T visit(IDateTimeType fieldType) {
		return visitNotImplemented(fieldType);
	}

	default T visit(IDateType fieldType) {
		return visitNotImplemented(fieldType);
	}

	default T visit(IDateRangeType fieldType) {
		return visitNotImplemented(fieldType);
	}

	default T visit(IDateFragmentType fieldType) {
		return visitNotImplemented(fieldType);
	}

	default T visit(ICustomFieldType fieldType) {
		return visitNotImplemented(fieldType);
	}

	default T visit(IEnumerationType fieldType) {
		return visitNotImplemented(fieldType);
	}

	default T visitNotImplemented(IFieldType fieldType) {
		throw new RuntimeException(String.format("Not implemented FieldType: %s", fieldType.getClass().getName()));
	}

	default T visitNotSupported(IFieldType fieldType) {
		throw new RuntimeException(String.format("Not supported FieldType: %s", fieldType.getClass().getName()));
	}
}
