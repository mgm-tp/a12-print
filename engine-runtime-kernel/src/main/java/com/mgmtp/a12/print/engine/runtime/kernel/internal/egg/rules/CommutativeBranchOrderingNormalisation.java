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
package com.mgmtp.a12.print.engine.runtime.kernel.internal.egg.rules;

import com.mgmtp.a12.print.engine.runtime.kernel.internal.egg.EggNode;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.egg.EggRewriteRuleFactory;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.egg.EggRewriteRuleInstance;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.egg.RewriteSyntaxTree;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.Compare;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.CompareBranch;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.LogicBranch;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.SyntaxTreeElement;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.visitor.TreeHeight;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.visitor.SyntaxTreeRenderer;
import lombok.NonNull;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public class CommutativeBranchOrderingNormalisation implements EggRewriteRuleFactory {
	@Override
	public EggRewriteRuleInstance instantiate(SyntaxTreeElement e) {
		return new Rewrite(e);
	}

	private static class Rewrite implements EggRewriteRuleInstance {

		private final EggRewriteRuleInstance rewriteRule;

		public Rewrite(SyntaxTreeElement e) {
			rewriteRule = RewriteSyntaxTree
				.withRules()
				.logic((o, clone) ->
					builder -> {
						final var branches = new ArrayList<>(List.of(clone.getBranches()));
						branches.sort(getBranchComparator());
						builder.branches(branches.toArray(LogicBranch[]::new));
						return builder.build();
					}
				)
				.compare((o,clone) ->
					o.getOperator().isEqualityOrUnEquality()
					? b -> {
						final var branches = new ArrayList<>(List.of(clone.getBranches()));
						branches.sort(getBranchComparator());
						b.branches(branches.toArray(CompareBranch[]::new));
						return b.build();
					}
					: b -> clone
				)
				.build()
				.instantiate(e);
		}

		private static <T extends SyntaxTreeElement> Comparator<@NonNull T> getBranchComparator() {
			return (a, b) -> {
				var delta = a.elementType().compareTo(b.elementType());
				if (delta != 0) {
					return delta;
				}
				var aHeight = TreeHeight.find(a);
				var bHeight = TreeHeight.find(b);
				if (aHeight != bHeight) {
					return Integer.compare(aHeight, bHeight);
				}
				var render = new SyntaxTreeRenderer();
				return render.render(a).compareTo(render.render((b)));
			};
		}

		@Override
		public SyntaxTreeElement apply() {
			return rewriteRule.apply();
		}
	}
}
