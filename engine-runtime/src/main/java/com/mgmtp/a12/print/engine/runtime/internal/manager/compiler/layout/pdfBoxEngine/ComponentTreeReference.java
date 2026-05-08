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

import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.Position;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.Size;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.element.base.RelativeLayout;
import com.mgmtp.a12.print.model.api.model.element.base.inputSource.InputSource;
import com.mgmtp.a12.print.model.api.model.reference.PlaceableReference;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NonNull;

import java.util.Optional;

@Data
@AllArgsConstructor
public class ComponentTreeReference {
	@NonNull
	private final String id;
	@NonNull
	private final Position position;
	@NonNull
	private final Size size;
	@NonNull
	private final PrintModelTreeTrace<PlaceableReference> referenceTrace;
	@NonNull
	private final InputSource<RelativeLayout.PageBreakBehavior> pageBreakBehavior;

	String[] dependentReferenceIds;
	private Long bottomMargin;
	private Long topMargin;

	public Optional<Long> getBottomMargin() {
		return Optional.ofNullable(bottomMargin);
	}

	public long getPrimitiveBottomMargin() {
		return getBottomMargin().orElse(0L);
	}

	public Optional<Long> getTopMargin() {
		return Optional.ofNullable(topMargin);
	}

	public long getBottom() {
		return getPosition().getY() + getSize().getHeight();
	}
}
