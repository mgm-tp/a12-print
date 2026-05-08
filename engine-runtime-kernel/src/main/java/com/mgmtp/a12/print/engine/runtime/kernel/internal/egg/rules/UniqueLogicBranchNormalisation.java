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
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.LogicBranch;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.SyntaxTreeElement;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;

public class UniqueLogicBranchNormalisation implements EggRewriteRuleFactory {

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
						final var newBranches = new LinkedHashSet<>(List.of(clone.getBranches()));
						if(newBranches.size() == clone.getBranches().length){
							return clone;
						}
						if (newBranches.size() > 1) {
							builder.branches(newBranches.toArray(LogicBranch[]::new));
							return builder.build();
						} else {
							return newBranches.iterator().next();
						}
					}
				)
				.build()
				.instantiate(e);
		}

		@Override
		public SyntaxTreeElement apply() {
			return rewriteRule.apply();
		}
	}

}
