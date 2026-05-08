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
package com.mgmtp.a12.print.engine.runtime.internal.engine.provider.restriction;

import com.mgmtp.a12.print.engine.api.JobRestrictionContext;
import com.mgmtp.a12.print.engine.api.exception.PrintJobRestrictionException;
import com.mgmtp.a12.print.engine.api.restriction.SinglePageRangeRestrictionContext;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.Objects;
import java.util.Optional;

@NoArgsConstructor
@EqualsAndHashCode
public class PdfJobRestrictionContext implements JobRestrictionContext, SinglePageRangeRestrictionContext {

	private Integer inclusivePageRangeStart;
	private Integer exclusivePageRangeEnd;

	@Override
	public void setPageRange(int start, Integer end) {

		if (inclusivePageRangeStart != null && inclusivePageRangeStart > start) {
			throw new PrintJobRestrictionException("Conflict in Page Range Restriction: Inclusive range start is already set to a larger value.");
		}

		if (exclusivePageRangeEnd != null && (end == null || end > exclusivePageRangeEnd)) {
			throw new PrintJobRestrictionException("Conflict in Page Range Restriction: Inclusive range end is already set to a smaller value.");
		}

		inclusivePageRangeStart = start;
		exclusivePageRangeEnd = end;

		if (exclusivePageRangeEnd != null && inclusivePageRangeStart >= exclusivePageRangeEnd) {
			throw new IllegalArgumentException("inclusivePageRangeStart is greater than or equal to exclusivePageRangeEnd");
		}

	}

	public int getInclusivePageRangeStart() {
		return Objects.requireNonNullElse(inclusivePageRangeStart, 0);
	}

	public Optional<Integer> getExclusivePageRangeEnd() {
		return Optional.ofNullable(exclusivePageRangeEnd);
	}

	public Optional<Integer> getInclusivePageRangeEnd() {
		return getExclusivePageRangeEnd().map(e -> e - 1);
	}
}
