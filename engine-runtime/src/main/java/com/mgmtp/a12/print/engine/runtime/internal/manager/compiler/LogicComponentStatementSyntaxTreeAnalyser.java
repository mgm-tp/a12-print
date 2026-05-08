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
package com.mgmtp.a12.print.engine.runtime.internal.manager.compiler;

import com.mgmtp.a12.print.engine.api.exception.PrintCompilerException;
import com.mgmtp.a12.print.engine.runtime.internal.manager.ComputationEvaluationAdvice;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.synthetics.SyntheticVariable;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.synthetics.SyntheticVariableType;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.SyntaxTreePredicateClassifier;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.egg.EggNode;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.egg.EquivalenceGeneralizationGraph;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.*;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.visitor.SyntaxTreeRenderer;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.visitor.VariableSearch;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Optional;
import java.util.stream.Collectors;

@RequiredArgsConstructor
class LogicComponentStatementSyntaxTreeAnalyser {

	@NonNull
	private final EquivalenceGeneralizationGraph equivalenceGeneralizationGraph;

	@NonNull
	private final SyntaxTreePredicateClassifier classifier;

	private final HashMap<EggNode, LogicComponentStatementSyntaxTreeAnalysis> cache = new HashMap<>();

	public LogicComponentStatementSyntaxTreeAnalysis recursiveComputeIfAbsent(EggNode node) {
		return cache.computeIfAbsent(
			node,
			key ->  analyse(LogicComponentStatementSyntaxTreeAnalysis.builder().node(key).element(key.getTree()).build())
		);
	}

	private Optional<SyntheticVariable> syntheticField(Variable variable) {
		if (SyntheticVariable.isSynthetic(variable)) {
			return Optional.of(SyntheticVariable.from(variable));
		} else {
			return Optional.empty();
		}
	}

	private Optional<String> syntheticFieldPath(Variable variable) {
		return syntheticField(variable).map(SyntheticVariable::getProviderId);
	}

	Optional<String> setProviderId(LogicComponentStatementSyntaxTreeAnalysis analysis) {

		final var outgoingNode = equivalenceGeneralizationGraph.findOutgoingNode(analysis.getNode());

		final var deReference = outgoingNode.filter(e -> e.getTree().elementType().equals(SyntaxTreeElementType.DEREFERENCE));

		final var synth = deReference.flatMap(e -> syntheticFieldPath(((Dereference) e.getTree()).getVariable()));

		synth.ifPresentOrElse(
			analysis::setProviderId,
			() -> {}
		);

		return synth;
	}

	public LogicComponentStatementSyntaxTreeAnalysis analyse(LogicComponentStatementSyntaxTreeAnalysis build) {
		new Visitor().visit(build.getElement(), build);
		return build;
	}

	private class Visitor implements SyntaxTreeElementVisitor {

		@Override
		public void visit(Variable node, VisitationState state) {
			var analysis = (LogicComponentStatementSyntaxTreeAnalysis) state;
			final var computationFieldType = classifier.classifyFieldType(node);
			analysis.setComputationFieldType(computationFieldType);
		}

		@Override
		public void visit(Predicate node, VisitationState state) {
			var analysis = (LogicComponentStatementSyntaxTreeAnalysis) state;
			final var computationFieldType = classifier.classifyFieldType(node);
			setProviderId(analysis).ifPresent(providerId -> {

				if (tryClassifyAsFieldFillingAssertionConstantOrMetaConstant(node, analysis)) {
					return;
				}

				analysis.setAdvice(
					ComputationEvaluationAdvice.KernelComputation
						.builder()
						.providerId(providerId)
						.syntaxTreeElement(analysis.getElement())
						.computationFieldType(computationFieldType)
						.build()
				);
			});

			analysis.setComputationFieldType(computationFieldType);

		}

		private boolean tryClassifyAsFieldFillingAssertionConstantOrMetaConstant(Predicate node, LogicComponentStatementSyntaxTreeAnalysis analysis) {
			switch (node.getLabel()) {
				case "FieldFilled":
				case "FieldNotFilled": {
					final var checkIfValueIsNull = node.getLabel().equals("FieldNotFilled");
					analysis.setComputationFieldType(classifier.classifyFieldType(node));
					final var variables = VariableSearch.findDistinctVariables(node);
					for (var variable : variables) {
						if (!SyntheticVariable.isSynthetic(variable)) {
							return false;
						}
						final var synth = SyntheticVariable.from(variable);
						switch (synth.getSyntheticVariableType()) {
							case CONSTANT: {
								analysis.setAdvice(
									ComputationEvaluationAdvice
										.NullCheck
										.builder()
										.checkIfValueIsNull(checkIfValueIsNull)
										.providerId(analysis.getProviderId())
										.targetProviderId(synth.getProviderId())
										.build()
								);
								return true;
							}
							case META: {
								if (!synth.getMetaField().equals(SyntheticVariable.MetaField.CONSTANT)) {
									return false;
								}
								analysis.setAdvice(
									ComputationEvaluationAdvice
										.NullCheck
										.builder()
										.checkIfValueIsNull(checkIfValueIsNull)
										.providerId(analysis.getProviderId())
										.targetProviderId(synth.getProviderId())
										.build()
								);
								return true;
							}
							default:
								return false;
						}
					}
					break;
				}
				default:
			}
			return false;
		}

		@Override
		public void visit(Constant node, VisitationState state) {
			final var analysis = (LogicComponentStatementSyntaxTreeAnalysis) state;
			final var computationFieldType = classifier.classifyFieldType(node);
			setProviderId(analysis).ifPresent(providerId -> {
				analysis.setAdvice(
					new ComputationEvaluationAdvice.ConstantValue(
						providerId,
						node,
						computationFieldType
					)
				);
			});
			analysis.setComputationFieldType(computationFieldType);
		}


		@Override
		public void visit(Dereference node, VisitationState state) {
			var analysis = (LogicComponentStatementSyntaxTreeAnalysis) state;
			syntheticField(node.getVariable()).ifPresentOrElse(
				syntheticVariable -> {
					final var providerId = SyntaxTreeRenderer.getPath(false, syntheticVariable.getVariable().getSegments());

					if (SyntheticVariableType.NOT_FILLED_FIELD.equals(syntheticVariable.getSyntheticVariableType())) {
						analysis.setProviderId(providerId);
						analysis.setComputationFieldType(ComputationFieldType.EMPTY);
						analysis.setAdvice(ComputationEvaluationAdvice.NoValue.Instance);
					} else if (SyntheticVariableType.META.equals(syntheticVariable.getSyntheticVariableType())) {

						analysis.setProviderId(providerId);
						analysis.setComputationFieldType(syntheticVariable.getComputationFieldType());

						if (SyntheticVariable.MetaField.CONSTANT.equals(syntheticVariable.getMetaField())) {
							analysis.setAdvice(
								new ComputationEvaluationAdvice.MetaConstantValue(
									providerId,
									syntheticVariable
								)
							);
						} else {
							analysis.setAdvice(
								new ComputationEvaluationAdvice.MetaFieldValue(
									providerId,
									syntheticVariable
								)
							);
						}


					} else {

						analysis.setAdvice(
							new ComputationEvaluationAdvice.ResolveComputationEvaluationProvider(
								analysis.getNode(),
								providerId,
								ComputationFieldType.UNKNOWN
							)
						);
					}
				},
				() -> {
					final var computationFieldType = classifier.classifyFieldType(node);

					if (computationFieldType.equals(ComputationFieldType.UNKNOWN)) {
						throw new PrintCompilerException("invalid state, node cannot be classified: " + new SyntaxTreeRenderer().render(node));
					}

					setProviderId(analysis);
					analysis.setAdvice(
						new ComputationEvaluationAdvice.FieldValue(
							analysis.getProviderId(),
							node.getVariable(),
							computationFieldType
						)
					);
					analysis.setComputationFieldType(computationFieldType);
				}
			);
		}

		@Override
		public void visit(Compare node, VisitationState state) {
			var analysis = (LogicComponentStatementSyntaxTreeAnalysis) state;
			final var computationFieldType = classifier.classifyFieldType(node);
			if (Arrays.stream(node.getBranches()).allMatch(
				e -> e.elementType().equals(SyntaxTreeElementType.DEREFERENCE)
			)) {
				setProviderId(analysis).ifPresent(providerId -> {
					analysis.setAdvice(
						ComputationEvaluationAdvice.JavaFunctionalExpression
							.builder()
							.category(ComputationEvaluationAdvice.Category.COMPARE_EXPRESSION)
							.computationFieldType(computationFieldType)
							.compareOperator(node.getOperator())
							.providerId(providerId)
							.branchProviderIds(
								Arrays.stream(node.getBranches())
									  .map(e -> syntheticFieldPath(((Dereference) e).getVariable()).get())
									  .collect(Collectors.toList()))
							.build()
					);
				});
			}

			analysis.setComputationFieldType(computationFieldType);
		}

		@Override
		public void visit(Logic node, VisitationState state) {
			var analysis = (LogicComponentStatementSyntaxTreeAnalysis) state;
			final var computationFieldType = classifier.classifyFieldType(node);
			if (Arrays.stream(node.getBranches()).allMatch(e -> e.elementType().equals(SyntaxTreeElementType.DEREFERENCE))) {
				setProviderId(analysis).ifPresent(providerId -> {
					analysis.setAdvice(
						ComputationEvaluationAdvice.JavaFunctionalExpression
							.builder()
							.category(ComputationEvaluationAdvice.Category.LOGIC_EXPRESSION)
							.computationFieldType(computationFieldType)
							.logicOperator(node.getOperator())
							.providerId(providerId)
							.branchProviderIds(Arrays.stream(node.getBranches()).map(e -> syntheticFieldPath(((Dereference) e).getVariable()).get()).collect(Collectors.toList()))
							.build()
					);
				});
			}
			analysis.setComputationFieldType(computationFieldType);
		}

		@Override
		public void visit(Arithmetic node, VisitationState state) {
			var analysis = (LogicComponentStatementSyntaxTreeAnalysis) state;
			final var computationFieldType = classifier.classifyFieldType(node);

			if (Arrays.stream(node.getBranches()).allMatch(e -> e.elementType().equals(SyntaxTreeElementType.DEREFERENCE))) {
				if (computationFieldType.isStringLike() && node.getOperator().equals(Arithmetic.Operator.PLUS)) {
					setProviderId(analysis).ifPresent(providerId -> {
						analysis.setAdvice(
							ComputationEvaluationAdvice.JavaFunctionalExpression
								.builder()
								.category(ComputationEvaluationAdvice.Category.ARITHMETIC_EXPRESSION)
								.computationFieldType(ComputationFieldType.STRING)
								.arithmeticOperator(Arithmetic.Operator.PLUS)
								.providerId(providerId)
								.branchProviderIds(Arrays.stream(node.getBranches()).map(e -> syntheticFieldPath(((Dereference) e).getVariable()).get()).collect(Collectors.toList()))
								.build()
						);
					});
				} else {

					setProviderId(analysis).ifPresent(providerId -> {
						analysis.setAdvice(
							ComputationEvaluationAdvice.KernelComputation
								.builder()
								.providerId(providerId)
								.syntaxTreeElement(analysis.getElement())
								.computationFieldType(
									computationFieldType
								)
								.build()
						);
					});
				}
			}


			analysis.setComputationFieldType(computationFieldType);
		}

	}

}
