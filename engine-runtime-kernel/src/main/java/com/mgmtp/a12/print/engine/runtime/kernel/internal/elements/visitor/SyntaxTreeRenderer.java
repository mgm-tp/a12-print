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

import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.*;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.function.IntPredicate;
import java.util.stream.Collectors;

public class SyntaxTreeRenderer {
	public static String getPath(boolean isAbsolute, boolean withoutRep, ReferenceSegment... segments) {
		if (segments.length == 0) {
			return "";
		}
		var value = new StringBuilder();
		for (var e : segments) {
			value.append("/");
			if (e.isTurningGroup()) {
				value.append(ReferenceSegment.UPWARD_REFERENCE.getLabel());
			}
			value.append(e.getLabel());
			if (e.isList() && !withoutRep) {
				value.append("*");
			}
		}
		if (isAbsolute) {
			return value.toString();
		} else {
			return value.substring(1);
		}
	}

	public static String getPath(boolean isAbsolute, ReferenceSegment... segments) {
		return getPath(isAbsolute, false, segments);
	}

	public static String getPathWithoutRep(boolean isAbsolute, ReferenceSegment... segments) {
		return getPath(isAbsolute, true, segments);
	}

	public String render(SyntaxTreeElement element) {
		var visitor = new Visitor();
		var root = new ElementSubTreeScope();
		visitor.visit(element, root);
		return root.getFinalValue();
	}

	private static class ElementSubTreeScope implements VisitationState {
		private final ArrayList<ElementSubTreeScope> children = new ArrayList<>();
		private String finalValue = null;

		public ArrayList<ElementSubTreeScope> getChildren() {
			return children;
		}

		public void render(Function<List<String>, String> fn) {
			if (finalValue != null) {
				return;
			}
			var children = getChildren().stream().map(ElementSubTreeScope::getFinalValue).collect(Collectors.toList());
			finalValue = fn.apply(children);
			children.clear();
		}

		private String getFinalValue() {
			if (finalValue != null) {
				return finalValue;
			}
			render(c -> String.join("", c));
			return finalValue;
		}

		@Override
		public ElementSubTreeScope scope(SyntaxTreeElement element, Consumer<VisitationState> scope) {
			var s = new ElementSubTreeScope();
			scope.accept(s);
			children.add(s);
			return s;
		}
	}

	private class Visitor implements SyntaxTreeElementVisitor {

		private String render(Logic.Operator operator) {
			switch (operator) {
				case AND:
					return "AND";
				case OR:
					return "OR";
			}
			throw new RuntimeException();
		}

		private String render(Compare.Operator operator) {
			switch (operator) {

				case EQUALITY:
					return "==";
				case UN_EQUALITY:
					return "!=";
				case GREATER_THAN:
					return ">";
				case GREATER_THAN_OR_EQUAL:
					return ">=";
				case LESS_THAN:
					return "<";
				case LESS_THAN_OR_EQUAL:
					return "<=";
			}
			throw new RuntimeException();
		}

		private String render(Arithmetic.Operator operator) {
			switch (operator) {
				case PLUS:
					return "+";
				case MINUS:
					return "-";
				case DIVISION:
					return "/";
				case MULTIPLICATION:
					return "*";
			}
			throw new RuntimeException();
		}

		private String whiteSpacePadded(String s) {
			return String.format(" %s ", s);
		}

		@Override
		public void visit(Logic node, VisitationState state) {
			SyntaxTreeElementVisitor.super.visit(node, state);
			((ElementSubTreeScope) state).render(
				c -> renderWithBraces(
					whiteSpacePadded(render(node.getOperator())),
					c,
					i -> {
						final var branch = node.getBranches()[i];
						return branch.elementType().equals(SyntaxTreeElementType.LOGIC)
							&& !((Logic) branch).getOperator().equals(node.getOperator());
					}
				)
			);
		}

		@Override
		public void visit(Compare node, VisitationState state) {
			SyntaxTreeElementVisitor.super.visit(node, state);
			((ElementSubTreeScope) state).render(
				c -> String.join(whiteSpacePadded(render(node.getOperator())), c)
			);
		}

		@Override
		public void visit(Arithmetic node, VisitationState state) {
			SyntaxTreeElementVisitor.super.visit(node, state);
			((ElementSubTreeScope) state).render(
				c -> renderWithBraces(
					whiteSpacePadded(render(node.getOperator())),
					c,
					i -> {
						final var branch = node.getBranches()[i];
						return branch.elementType().equals(SyntaxTreeElementType.ARITHMETIC)
							&& !((Arithmetic) branch).getOperator().equals(node.getOperator());
					}
				)
			);
		}

		private String renderWithBraces(String operator, List<String> c, IntPredicate branchFilter) {
			final var sb = new StringBuilder();
			for (var i = 0; i < c.size(); i++) {
				if(i != 0 ){
					sb.append(operator);
				}
				if (branchFilter.test(i)) {
					sb.append("(");
					sb.append(c.get(i));
					sb.append(")");
				} else {
					sb.append(c.get(i));
				}
			}
			return sb.toString();
		}

		@Override
		public void visit(Constant node, VisitationState state) {
			((ElementSubTreeScope) state).render(c -> {
				switch (node.getConstantType()) {
					case STRING:
						return String.format("\"%s\"", node.getValue());
					case INTEGER, BOOLEAN, FLOAT:
					default:
				}
				return node.getValue();
			});
		}

		@Override
		public void visit(Variable node, VisitationState state) {
			((ElementSubTreeScope) state).render(c -> getPath(node.isAbsolute(), node.getSegments()));
		}

		@Override
		public void visit(Predicate node, VisitationState state) {
			SyntaxTreeElementVisitor.super.visit(node, state);

			switch (node.getSignature().signatureType()) {
				case EMPTY_SIGNATURE:
					((ElementSubTreeScope) state).render(c -> node.getLabel());
					break;
				case INFIX_PARAMETER_LIST:
					List<String> parameters = ((ElementSubTreeScope) state)
						.getChildren().get(0)
						.getChildren().stream().map(ElementSubTreeScope::getFinalValue)
						.collect(Collectors.toList());
					((ElementSubTreeScope) state).render(c ->
						parameters.get(0) +
							whiteSpacePadded(node.getLabel()) +
							parameters.get(1)
					);
					break;
				default:
					((ElementSubTreeScope) state).render(c -> node.getLabel() +
						"(" +
						String.join(" ", c) +
						")");
			}
		}

		public void renderParameterList(ElementSubTreeScope state) {
			state.render(c -> String.join(",", c));
		}

		public void renderInclusionSignature(ElementSubTreeScope state) {
			var children = state.getChildren();
			renderParameterList(children.get(0));
			renderParameterList(children.get(1));
			state.render(c -> String.join(whiteSpacePadded("IN"), c));
		}

		public void renderConsistenceSignature(ElementSubTreeScope state) {
			var children = state.getChildren();
			renderParameterList(children.get(0));
			renderParameterList(children.get(1));
			state.render(c -> String.join(whiteSpacePadded("TO"), c));
		}

		@Override
		public void visit(Predicate.ParameterList node, VisitationState state) {
			SyntaxTreeElementVisitor.super.visit(node, state);
			renderParameterList((ElementSubTreeScope) state);
		}

		@Override
		public void visit(Predicate.EmptySignature node, VisitationState state) {
			SyntaxTreeElementVisitor.super.visit(node, state);
		}

		@Override
		public void visit(Predicate.InfixParameterList node, VisitationState state) {
			SyntaxTreeElementVisitor.super.visit(node, state);
			((ElementSubTreeScope) state).render(c -> "");
		}

		@Override
		public void visit(Predicate.InclusionSignature node, VisitationState state) {
			SyntaxTreeElementVisitor.super.visit(node, state);
			renderInclusionSignature((ElementSubTreeScope) state);
		}

		@Override
		public void visit(Predicate.ConsistenceSignature node, VisitationState state) {
			SyntaxTreeElementVisitor.super.visit(node, state);
			renderConsistenceSignature((ElementSubTreeScope) state);
		}

		@Override
		public void visit(Dereference node, VisitationState state) {
			SyntaxTreeElementVisitor.super.visit(node, state);
			((ElementSubTreeScope) state).render(c ->
				"[" + String.join(" ", c) + "]");
		}

	}

}
