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
package com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.visitor;

import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.SyntaxTreeElement;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.SyntaxTreeElementVisitor;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.Variable;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.VisitationState;

import java.util.HashSet;
import java.util.Set;
import java.util.function.BiConsumer;
import java.util.function.BiFunction;
import java.util.function.Function;
import java.util.function.Supplier;


public class VariableSearch<R> implements SyntaxTreeElementVisitor {

	private static final Function<SyntaxTreeElement, Set<Variable>> findUniqueVariables = VariableSearch.create((a, r) -> r.add(a), HashSet::new);
	private final BiFunction<Variable, R, R> map;
	private R foldState;
	public VariableSearch(BiFunction<Variable, R, R> map, R foldState) {
		this.foldState = foldState;
		this.map = map;
	}

	public static Set<Variable> findDistinctVariables(SyntaxTreeElement e) {
		return findUniqueVariables.apply(e);
	}

	public static <T> Function<SyntaxTreeElement, T> create(BiConsumer<Variable, T> consumer, Supplier<T> seed) {
		return s -> new VariableSearch<>(
			(a, r) -> {
				consumer.accept(a, r);
				return r;
			},
			seed.get()
		).collect(s);
	}

	public R collect(SyntaxTreeElement e) {
		visit(e, VisitationState.stateless());
		return foldState;
	}

	@Override
	public void visit(Variable node, VisitationState state) {
		foldState = map.apply(node, foldState);
	}
}
