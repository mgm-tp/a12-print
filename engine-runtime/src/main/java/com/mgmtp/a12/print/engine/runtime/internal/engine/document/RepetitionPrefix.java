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
package com.mgmtp.a12.print.engine.runtime.internal.engine.document;

import com.mgmtp.a12.kernel.md.model.api.IElement;
import com.mgmtp.a12.kernel.md.model.api.IField;
import com.mgmtp.a12.kernel.md.model.api.IGroup;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.KernelElementUtils;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.Variable;
import lombok.Data;
import lombok.NonNull;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Data
public class RepetitionPrefix {
	private final List<RepetitionRange> repetitions;

	public static RepetitionPrefix from(List<IElement> path) {
		return new RepetitionPrefix(path.stream().map(e -> {
			if (e instanceof IField) {
				return new RepetitionRange(((IField) e).getRequirednessConfig().isPresent() ? 1 : 0, 1, true);
			} else {
				return new RepetitionRange(1, ((IGroup) e).getRepeatability(), true);
			}
		}).collect(Collectors.toList()));
	}

	public static RepetitionPrefix initialFor(Variable variable) {
		return new RepetitionPrefix(
			Arrays.stream(variable.getSegments())
				  .map(e -> RepetitionRange.INITIAL)
				  .collect(Collectors.toList())
		);
	}

	public static RepetitionPrefix from(int[] repetitions) {
		return new RepetitionPrefix(
			Arrays.stream(repetitions)
				  .mapToObj(i -> new RepetitionRange(i, i, true))
				  .collect(Collectors.toList())
		);
	}

	public int length() {
		return repetitions.size();
	}

	public RepetitionPrefix copy() {
		return new RepetitionPrefix(new ArrayList<>(repetitions));
	}

	public RepetitionPrefix growFor(Variable variable) {
		return new RepetitionPrefix(
			IntStream.range(0, variable.getSegments().length)
					 .mapToObj(i -> repetitions.size() > i ? repetitions.get(i) : RepetitionRange.INITIAL)
					 .collect(Collectors.toList())
		);
	}

	public RepetitionRange getCurrentRepetition() {
		return repetitions.get(repetitions.size() - 1);
	}

	public void setLast(@NonNull RepetitionRange range) {
		repetitions.set(repetitions.size() - 1, range);
	}

	public int[] getMinimalRepetitionPath() {
		return repetitions.stream().mapToInt(e -> Math.max(e.getStart(), 1)).toArray();
	}
}
