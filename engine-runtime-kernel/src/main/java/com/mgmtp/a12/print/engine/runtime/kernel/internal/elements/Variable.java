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

import com.mgmtp.a12.kernel.md.model.api.IElement;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.ComputationParser;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.KernelElementUtils;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.visitor.SyntaxTreeRenderer;
import lombok.*;

import java.util.Arrays;

@Data
@Builder(toBuilder = true)
@AllArgsConstructor(access = AccessLevel.PROTECTED)
public class Variable implements SyntaxTreeElement, Predicate.Parameter, ArithmeticBranch, LogicBranch, CompareBranch, Comparable<Variable> {

	@NonNull
	private final ReferenceSegment[] segments;
	private final boolean isAbsolute;

	public static int compareSegments(ReferenceSegment[] a, ReferenceSegment[] b) {

		final var min = Math.min(a.length, b.length);

		for (var i = 0; i < min; i++) {
			final var segmentA = a[i];
			final var segmentB = b[i];

			final var cmp = segmentA.getLabel().compareTo(segmentB.getLabel());
			if (cmp != 0) {
				return cmp;
			}
			final var isListCmp = Boolean.compare(segmentA.isList(), segmentB.isList());
			if (isListCmp != 0) {
				return isListCmp;
			}
			final var isTurningGroup = Boolean.compare(segmentA.isTurningGroup(), segmentB.isTurningGroup());
			if (isTurningGroup != 0) {
				return isListCmp;
			}
		}
		return Integer.compare(a.length, b.length);
	}

	public static int compareFull(Variable a, Variable b) {
		final var isAbsCmp = Boolean.compare(a.isAbsolute(), b.isAbsolute());
		if (isAbsCmp != 0) {
			return isAbsCmp;
		}
		return Variable.compareSegments(a.getSegments(), b.getSegments());
	}

	public static Variable absoluteDirectory(IElement element) {
		final var path = KernelElementUtils.getPath(element);

		return Variable.builder()
					   .isAbsolute(true)
					   .segments(
						   path.stream()
							   .map(p -> new ReferenceSegment(p.getName(), false, false))
							   .toArray(ReferenceSegment[]::new)
					   )
					   .build();
	}

	public static Variable join(Variable prefix, Variable postfix) {
		final var segments = Arrays.copyOf(
			prefix.segments,
			prefix.segments.length + postfix.segments.length
		);
		System.arraycopy(postfix.segments, 0, segments, prefix.segments.length, postfix.segments.length);
		return Variable.builder().segments(segments).isAbsolute(prefix.isAbsolute).build();
	}

	public static String abs(String basePath) {
		final var variable = ComputationParser.variable(basePath);
		return SyntaxTreeRenderer.getPath(true, variable.getSegments());
	}

	public boolean isPrefixOf(Variable b) {
		if (!isAbsolute || !b.isAbsolute) {
			throw new IllegalArgumentException("requires absolut paths");
		}

		if(segments.length > b.segments.length){
			return false;
		}

		for (var i = 0; i < segments.length; i++) {
			if (!segments[i].equals(b.segments[i])) {
				return false;
			}
		}

		return true;

	}

	public Variable getParent() {
		return Variable.builder()
					   .isAbsolute(isAbsolute)
					   .segments(Arrays.copyOfRange(
						   segments, 0, Math.max(0, segments.length - 1))
					   )
					   .build();
	}

	@Override
	public SyntaxTreeElementType elementType() {
		return SyntaxTreeElementType.VARIABLE;
	}

	@Override
	public void accept(SyntaxTreeElementVisitor visitor, VisitationState state) {
		// accept is disabled for Variable
	}

	@Override
	public boolean equals(Object o) {
		if (this == o) return true;
		if (!(o instanceof Variable variable)) return false;
		if (isAbsolute != variable.isAbsolute) return false;
		return Arrays.deepEquals(segments, variable.segments);
	}

	@Override
	public int hashCode() {
		int result = Arrays.deepHashCode(segments);
		result = 31 * result + (isAbsolute ? 1 : 0);
		return result;
	}

	@Override
	public int compareTo(Variable o) {
		return Variable.compareFull(this, o);
	}

}
