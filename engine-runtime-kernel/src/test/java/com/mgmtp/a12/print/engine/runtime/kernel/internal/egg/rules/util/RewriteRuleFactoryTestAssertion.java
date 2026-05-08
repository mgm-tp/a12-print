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
package com.mgmtp.a12.print.engine.runtime.kernel.internal.egg.rules.util;

import com.mgmtp.a12.print.engine.runtime.kernel.internal.egg.EggNode;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.egg.EggRewriteRuleFactory;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.egg.EggRewriteRuleInstance;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.SyntaxTreeElement;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.visitor.SyntaxTreeRenderer;
import lombok.Builder;
import lombok.Data;
import lombok.NonNull;
import lombok.Singular;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@Data
@Builder
public class RewriteRuleFactoryTestAssertion {

	@NonNull
	private final Instance instance;

	@NonNull
	private final EggRewriteRuleFactory rule;

	public @NonNull EggRewriteRuleInstance instantiate() {
		final var ruleInstance = rule.instantiate(instance.getInput());
		assertThat(ruleInstance).isNotNull();
		return ruleInstance;
	}

	public EggNode apply(@NonNull EggRewriteRuleInstance ruleInstance) {
		final var result = ruleInstance.apply();
		assertThat(result).isEqualTo(instance.getExpectedOutput());
		final var node = EggNode.factory().id(1).tree(result).build();
		ruleInstance.annotate(node);
		if(ruleInstance.getClass().getSimpleName().contains("Normal")){
			assertThat(node.getReplacements()).isEmpty();
		}
		return node;
	}

	public void run() {
		apply(instantiate());
	}

	@Override
	public String toString() {
		return instance.toString();
	}

	@Data
	@Builder
	public static class Instance {

		@Builder.Default
		private String name = null;
		@NonNull
		private final SyntaxTreeElement input;
		@NonNull
		private final SyntaxTreeElement expectedOutput;

		public @NonNull String getName() {
			if(name != null){
				return name;
			}
			return String.format(
				"%s is rewritten to %s",
				new SyntaxTreeRenderer().render(input),
				new SyntaxTreeRenderer().render(expectedOutput)
			);
		}

		@Override
		public String toString() {
			return getName();
		}
	}

	@Builder
	public static class StreamBuilder {
		@NonNull
		private final EggRewriteRuleFactory rule;
		@Singular
		private final List<Instance> instances;

		public java.util.stream.Stream<RewriteRuleFactoryTestAssertion> build() {

			return instances.stream().map(
				e -> RewriteRuleFactoryTestAssertion
					.builder()
					.rule(rule)
					.instance(e)
					.build()
			);
		}
	}

}
