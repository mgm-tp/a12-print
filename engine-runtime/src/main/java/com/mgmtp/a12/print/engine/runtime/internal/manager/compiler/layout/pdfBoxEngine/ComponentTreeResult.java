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
package com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.pdfBoxEngine;

import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.PreflightedComponent;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Value;
import lombok.experimental.Accessors;

import java.util.ArrayList;
import java.util.List;

@Value
@Builder(toBuilder = true)
@AllArgsConstructor
public class ComponentTreeResult {
	long spread;
	long spreadWithoutMargin;
	long gravitationYPosition;
	long heightOfElementWithoutSections;
	long extraElementSpace;

	List<ComponentTreeResult> repeatableResults;
	List<PreflightedComponent> preflightedComponents;

	@Accessors(fluent = true)
	boolean wasInterrupted;

	public static final ComponentTreeResult EMPTY_RESULT = new ComponentTreeResult(0, 0, 0, 0);

	public ComponentTreeResult(long spread, long spreadWithoutMargin, long gravitationYPosition, long heightOfElementWithoutSections) {
		this(spread, spreadWithoutMargin, gravitationYPosition, heightOfElementWithoutSections, 0L, new ArrayList<>(), new ArrayList<>());
	}

	public ComponentTreeResult(
		long spread,
		long spreadWithoutMargin,
		long gravitationYPosition,
		long heightOfElementWithoutSections,
		long extraElementSpace,
		List<ComponentTreeResult> repeatableResults,
		List<PreflightedComponent> preflightedComponents
	) {
		this.spread = spread;
		this.spreadWithoutMargin = spreadWithoutMargin;
		this.gravitationYPosition = gravitationYPosition;
		this.heightOfElementWithoutSections = heightOfElementWithoutSections;
		this.extraElementSpace = extraElementSpace;
		this.repeatableResults = repeatableResults;
		this.preflightedComponents = preflightedComponents;
		this.wasInterrupted = false;
	}

	public static long getSpread(long yPosition, long evaluatedHeight, long bottomMargin) {
		return yPosition + evaluatedHeight + bottomMargin;
	}

	public static long getSpreadWithoutMargin(long yPosition, long evaluatedHeight) {
		return yPosition + evaluatedHeight;
	}

	public static long getHiddenSpread(long yPosition) {
		// if the element is hidden the spread is the same as the
		// yPosition because the height and the bottom margin are hidden
		return yPosition;
	}

	public static long getHiddenGravitationYPosition(long yPosition, ComponentTreeReference componentTreeReference) {
		// if the element is hidden the y position needs to be reduced with the outer box of the element
		// this is important for the calculations of the Y positions of the elements, which have the current element as dependency
		return yPosition -
			componentTreeReference.getSize().getHeight() -
			componentTreeReference.getPrimitiveBottomMargin() -
			componentTreeReference.getTopMargin().orElse(0L);
	}

	public static long getGravitationYPosition(long yPosition, long evaluatedHeight, long originalHeight) {
		// if the element height is smaller than before the difference needs to be subtracted from the Y position
		return yPosition - Math.max(originalHeight - evaluatedHeight, 0);
	}
}
