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
package com.mgmtp.a12.print.engine.api.restriction;

// tag::Import[]
import com.mgmtp.a12.print.engine.api.JobRestriction;
import com.mgmtp.a12.print.engine.api.JobRestrictionContext;
import com.mgmtp.a12.print.engine.api.exception.PrintJobRestrictionException;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
// end::Import[]

@Builder
@AllArgsConstructor(access = AccessLevel.PACKAGE)
public class PageRangeRestriction implements JobRestriction {

	private final Integer inclusiveStart;
	private final Integer exclusiveEnd;

	public static PageRangeRestriction of(final int inclusiveStart, final int exclusiveEnd) {
		if(inclusiveStart >= exclusiveEnd) {
			throw new PrintJobRestrictionException("Range may not be empty");
		}
		if(exclusiveEnd < 1) {
			throw new PrintJobRestrictionException("End must be greater than zero");
		}
		return new PageRangeRestriction(inclusiveStart, exclusiveEnd);
	}

	public static PageRangeRestriction skip(final int pageCount) {
		if(pageCount < 1) {
			throw new PrintJobRestrictionException("Page count must be greater than zero");
		}
		return new PageRangeRestriction(pageCount, null);
	}

	public static PageRangeRestriction take(final int pageCount) {
		if(pageCount < 1) {
			throw new PrintJobRestrictionException("Page count must be greater than zero");
		}
		return new PageRangeRestriction(0, pageCount);
	}

	public static PageRangeRestriction page(final int pageIndex) {
		return new PageRangeRestriction(pageIndex, pageIndex + 1);
	}

	@Override
	public void restrict(JobRestrictionContext context) {
		if (context instanceof SinglePageRangeRestrictionContext) {
			((SinglePageRangeRestrictionContext) context).setPageRange(inclusiveStart, exclusiveEnd);
		} else {
			throw new PrintJobRestrictionException("The given context does not implement SinglePageRangeRestrictionContext");
		}
	}
}
