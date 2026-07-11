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
package com.mgmtp.a12.print.engine.runtime.internal.engine.provider.formatter;

import com.mgmtp.a12.print.engine.api.exception.PrintException;
import lombok.NonNull;

public interface FormattingDetailsVisitor {

	default @NonNull ValueFormatProvider.FormattingDetails visit(ValueFormatProvider.FormattingDetails formattingDetails) {
		if (formattingDetails instanceof NumberTypeFormatter.FormattingDetails) {
			return visit((NumberTypeFormatter.FormattingDetails) formattingDetails);
		} else if (formattingDetails instanceof BooleanTypeFormatter.FormattingDetails) {
			return visit((BooleanTypeFormatter.FormattingDetails) formattingDetails);
		} else if (formattingDetails instanceof ConfirmTypeFormatter.FormattingDetails) {
			return visit((ConfirmTypeFormatter.FormattingDetails) formattingDetails);
		} else if (formattingDetails instanceof DateRangeTypeFormatter.FormattingDetails) {
			return visit((DateRangeTypeFormatter.FormattingDetails) formattingDetails);
		} else if (formattingDetails instanceof DateTimeLikeTypeFormatter.FormattingDetails) {
			return visit((DateTimeLikeTypeFormatter.FormattingDetails) formattingDetails);
		} else if (formattingDetails instanceof JavaStringFormatFormatter.FormattingDetails) {
			return visit((JavaStringFormatFormatter.FormattingDetails) formattingDetails);
		} else if (formattingDetails instanceof EnumerationTypeFormatter.FormattingDetails) {
			return visit((EnumerationTypeFormatter.FormattingDetails) formattingDetails);
		}else {
			return visitNotSupported(formattingDetails);
		}
	}

	default @NonNull ValueFormatProvider.FormattingDetails visit(
		NumberTypeFormatter.FormattingDetails formattingDetails
	) {
		return visitNotImplemented(formattingDetails);
	}

	default @NonNull ValueFormatProvider.FormattingDetails visit(
		BooleanTypeFormatter.FormattingDetails formattingDetails
	) {
		return visitNotImplemented(formattingDetails);
	}

	default @NonNull ValueFormatProvider.FormattingDetails visit(
		ConfirmTypeFormatter.FormattingDetails formattingDetails
	) {
		return visitNotImplemented(formattingDetails);
	}

	default @NonNull ValueFormatProvider.FormattingDetails visit(
		DateRangeTypeFormatter.FormattingDetails formattingDetails
	) {
		return visitNotImplemented(formattingDetails);
	}

	default @NonNull ValueFormatProvider.FormattingDetails visit(
		DateTimeLikeTypeFormatter.FormattingDetails formattingDetails
	) {
		return visitNotImplemented(formattingDetails);
	}

	default @NonNull ValueFormatProvider.FormattingDetails visit(
		JavaStringFormatFormatter.FormattingDetails formattingDetails
	) {
		return visitNotImplemented(formattingDetails);
	}
	default @NonNull ValueFormatProvider.FormattingDetails visit(
		EnumerationTypeFormatter.FormattingDetails formattingDetails
	) {
		return visitNotImplemented(formattingDetails);
	}
	default @NonNull ValueFormatProvider.FormattingDetails visitNotSupported(
		ValueFormatProvider.FormattingDetails formattingDetails
	) {
		throw new PrintException("Not supported formatting Details");
	}

	default @NonNull ValueFormatProvider.FormattingDetails visitNotImplemented(
		ValueFormatProvider.FormattingDetails formattingDetails
	) {
		throw new PrintException("Not implemented formatting Details");
	}
}
