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
package com.mgmtp.a12.print.engine.runtime.kernel.internal.egg;

import com.mgmtp.a12.print.engine.runtime.kernel.internal.ComputationParsingException;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.*;
import lombok.*;
import org.apache.commons.lang3.tuple.ImmutablePair;
import org.apache.commons.lang3.tuple.Pair;

import java.util.ArrayList;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.stream.Collectors;

@Builder(toBuilder = true, builderClassName = "Rules", builderMethodName = "withRules", setterPrefix = "")
public class RewriteSyntaxTree implements EggRewriteRuleFactory {


	private final Visitor visitor = new Visitor();
	private Rule<Logic.LogicBuilder, ? super Logic, ? extends SyntaxTreeElement> logic;
	private Rule<Compare.CompareBuilder, ? super Compare, ? extends SyntaxTreeElement> compare;
	private Rule<Arithmetic.ArithmeticBuilder, ? super Arithmetic, ? extends SyntaxTreeElement> arithmetic;
	private Rule<Constant.ConstantBuilder, ? super Constant, ? extends SyntaxTreeElement> constant;
	private Rule<Variable.VariableBuilder, ? super Variable, ? extends SyntaxTreeElement> variable;
	private Rule<Predicate.PredicateBuilder, ? super Predicate, ? extends SyntaxTreeElement> predicate;
	private Rule<Predicate.ParameterList.ParameterListBuilder, ? super Predicate.ParameterList, ? extends SyntaxTreeElement> parameterList;
	private Rule<Predicate.InfixParameterList.InfixParameterListBuilder, ? super Predicate.InfixParameterList, ? extends SyntaxTreeElement> infixParameterList;
	private Rule<Dereference.DereferenceBuilder, ? super Dereference, ? extends SyntaxTreeElement> dereference;

	@Override
	public EggRewriteRuleInstance instantiate(SyntaxTreeElement e) {
		return new RewriteInstance(e);
	}

	@FunctionalInterface
	public interface Rule<B, E extends SyntaxTreeElement, R extends SyntaxTreeElement> {
		Function<B, R> test(E original, E clone);
	}

	@RequiredArgsConstructor
	@Getter
	private static class RewriteScope implements VisitationState {

		@NonNull
		private final SyntaxTreeElement element;
		private final ArrayList<RewriteScope> rewriteScopes = new ArrayList<>();
		private final ArrayList<Pair<SyntaxTreeElement, SyntaxTreeElement>> replacements = new ArrayList<>();

		private SyntaxTreeElement replacement;

		@Override
		public RewriteScope scope(@NonNull SyntaxTreeElement element, Consumer<VisitationState> scope) {
			var s = new RewriteScope(element);
			scope.accept(s);
			rewriteScopes.add(s);
			return s;
		}

		public ArrayList<RewriteScope> getRewriteScopes() {
			return rewriteScopes;
		}

		public void setReplacement(SyntaxTreeElement replacement) {
			this.replacement = replacement;
			replacements.add(ImmutablePair.of(element, replacement));
			this.rewriteScopes.clear();
		}

		public void setClone(SyntaxTreeElement replacement) {
			this.replacement = replacement;
			rewriteScopes
				.stream()
				.flatMap(
					e -> e.replacements.stream()
				)
				.forEach(replacements::add);
			this.rewriteScopes.clear();
		}

		public SyntaxTreeElement get() {
			if (replacement == null) {
				return element;
			} else {
				return replacement;
			}
		}

	}


	private class RewriteInstance implements EggRewriteRuleInstance {

		private final RewriteScope rewriteScope;

		public RewriteInstance(SyntaxTreeElement syntaxTreeElement) {
			this.rewriteScope = new RewriteScope(syntaxTreeElement);
		}

		@Override
		public void annotate(EggNode node) {
			node.getReplacements().addAll(rewriteScope.replacements);
		}

		@Override
		public SyntaxTreeElement apply() {

			visitor.visit(rewriteScope.element, rewriteScope);
			return rewriteScope.get();
		}
	}

	private class Visitor implements SyntaxTreeElementVisitor {

		private <T extends SyntaxTreeElement, B> void build(
			T node,
			RewriteScope scope,
			B builder,
			Rule<B, ? super T, ? extends SyntaxTreeElement> rule,
			Function<B, T> fallback
		) {
			var clone = fallback.apply(builder);
			if (rule != null) {
				var factory = rule.test(node, clone);
				if (factory != null) {
					var replacement = factory.apply(builder);
					if(replacement != node && replacement != clone){
						scope.setReplacement(replacement);
					} else {
						scope.setClone(clone);
					}
				} else {
					scope.setClone(clone);
				}
			} else {
				scope.setClone(clone);
			}
		}

		@Override
		public void visit(Logic node, VisitationState state) {
			node.accept(this, state);

			var scope = ((RewriteScope) state);
			var builder = node.toBuilder();
			builder.branches(
				scope.getRewriteScopes().stream()
					 .map(e -> (LogicBranch) e.get()).toArray(LogicBranch[]::new)
			);
			build(node, scope, builder, logic, Logic.LogicBuilder::build);
		}

		@Override
		public void visit(Compare node, VisitationState state) {
			node.accept(this, state);

			var scope = ((RewriteScope) state);
			var builder = node.toBuilder();
			builder.branches(
				scope.getRewriteScopes().stream()
					 .map(e -> (CompareBranch) e.get()).toArray(CompareBranch[]::new)
			);
			build(node, scope, builder, compare, Compare.CompareBuilder::build);
		}

		@Override
		public void visit(Arithmetic node, VisitationState state) {
			node.accept(this, state);

			var scope = ((RewriteScope) state);
			var builder = node.toBuilder();
			builder.branches(
				scope.getRewriteScopes().stream()
					 .map(e -> (ArithmeticBranch) e.get()).toArray(ArithmeticBranch[]::new)
			);
			build(node, scope, builder, arithmetic, Arithmetic.ArithmeticBuilder::build);
		}

		@Override
		public void visit(Predicate node, VisitationState state) {
			node.accept(this, state);

			var scope = ((RewriteScope) state);
			var builder = node.toBuilder();
			builder.signature(
				(Predicate.Signature) scope.getRewriteScopes().get(0).get()
			);
			build(node, scope, builder, predicate, Predicate.PredicateBuilder::build);
		}

		@Override
		public void visit(Predicate.ParameterList node, VisitationState state) {
			node.accept(this, state);
			var scope = ((RewriteScope) state);
			var builder = node.toBuilder();
			builder.parameters(
				scope.getRewriteScopes().stream()
					 .map(e -> (Predicate.Parameter) e.get()).toArray(Predicate.Parameter[]::new)
			);
			build(node, scope, builder, parameterList, Predicate.ParameterList.ParameterListBuilder::build);
		}

		@Override
		public void visit(Predicate.InfixParameterList node, VisitationState state) {
			node.accept(this, state);
			var scope = ((RewriteScope) state);
			var builder = node.toBuilder();
			Predicate.Parameter[] parameters = scope.getRewriteScopes().stream()
				.map(e -> (Predicate.Parameter) e.get()).toArray(Predicate.Parameter[]::new);
			builder.leftParameter(parameters[0]);
			builder.rightParameter(parameters[1]);
			build(node, scope, builder, infixParameterList, Predicate.InfixParameterList.InfixParameterListBuilder::build);
		}

		@Override
		public void visit(Predicate.EmptySignature node, VisitationState state) {
			node.accept(this, state);
			var scope = ((RewriteScope) state);
			assert node == Predicate.EmptySignature.Instance;
			scope.setClone(node);
		}

		@Override
		public void visit(Predicate.ConsistenceSignature node, VisitationState state) {
			node.accept(this, state);
			var scope = ((RewriteScope) state);
			var builder = node.toBuilder();
			builder.left(
				(Predicate.ParameterList) scope.getRewriteScopes().get(0).get()
			);
			builder.right(
				(Predicate.ParameterList) scope.getRewriteScopes().get(1).get()
			);
			scope.setReplacement(builder.build());
		}

		@Override
		public void visit(Predicate.InclusionSignature node, VisitationState state) {
			node.accept(this, state);
			var scope = ((RewriteScope) state);
			var builder = node.toBuilder();
			builder.left(
				(Predicate.ParameterList) scope.getRewriteScopes().get(0).get()
			);
			builder.right(
				(Predicate.ParameterList) scope.getRewriteScopes().get(1).get()
			);
			scope.setReplacement(builder.build());
		}

		@Override
		public void visit(Dereference node, VisitationState state) {
			node.accept(this, state);

			var scope = ((RewriteScope) state);
			var builder = node.toBuilder();
			builder.variable(
				(Variable) scope.getRewriteScopes().get(0).get()
			);
			build(node, scope, builder, dereference, Dereference.DereferenceBuilder::build);
		}

		@Override
		public void visit(Constant node, VisitationState state) {
			node.accept(this, state);

			var scope = ((RewriteScope) state);
			var builder = node.toBuilder();
			build(node, scope, builder, constant, Constant.ConstantBuilder::build);
		}

		@Override
		public void visit(Variable node, VisitationState state) {
			node.accept(this, state);

			var scope = ((RewriteScope) state);
			var builder = node.toBuilder();
			build(node, scope, builder, variable, Variable.VariableBuilder::build);
		}
	}


}
