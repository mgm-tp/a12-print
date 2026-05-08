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
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.*;
import lombok.Builder;
import lombok.Data;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.tuple.ImmutablePair;

import java.util.function.Function;
import java.util.function.Predicate;

@Data
@Builder
@RequiredArgsConstructor
public class StructureToDereferenceGeneralisation implements EggRewriteRuleFactory {

	private final Predicate<Logic> logic;
	private final Predicate<Compare> compare;
	private final Predicate<Arithmetic> arithmetic;
	private final Predicate<com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.Predicate> predicate;
	@NonNull
	private final Function<EggNode, Variable> variableFactory;
	@NonNull
	private final Function<SyntaxTreeElement, EggNode> nodeFactory;

	@Override
	public EggRewriteRuleInstance instantiate(SyntaxTreeElement e) {
		return new StructureToDereferenceGeneralisation.Rewrite(e);
	}

	private class Rewrite implements EggRewriteRuleInstance {

		private final EggRewriteRuleInstance rewriteRule;

		public Rewrite(SyntaxTreeElement e) {
			var builder = RewriteSyntaxTree.withRules();
			if (compare != null) {
				builder.compare(createBuilderFromPredicate(compare));
			}
			if (predicate != null) {
				builder.predicate(createBuilderFromPredicate(predicate));
			}
			if (arithmetic != null) {
				builder.arithmetic(createBuilderFromPredicate(arithmetic));
			}
			if (logic != null) {
				builder.logic(createBuilderFromPredicate(logic));
			}
			rewriteRule = builder.build().instantiate(e);
		}

		private <B, T extends SyntaxTreeElement> RewriteSyntaxTree.Rule<B, ? super T, ? extends SyntaxTreeElement>
		createBuilderFromPredicate(Predicate<T> predicate) {
			return (o, c) -> predicate.test(c) ? b -> replaceWithVariable(c) : b -> c;
		}

		private SyntaxTreeElement replaceWithVariable(SyntaxTreeElement c) {
			var node = nodeFactory.apply(c);
			var variable = variableFactory.apply(node);
			node.getReplacements().add(ImmutablePair.of(node.getTree(), variable));
			return Dereference.builder().variable(variable).build();
		}

		@Override
		public SyntaxTreeElement apply() {
			return rewriteRule.apply();
		}

		@Override
		public void annotate(EggNode node) {
			rewriteRule.annotate(node);
		}
	}

}
