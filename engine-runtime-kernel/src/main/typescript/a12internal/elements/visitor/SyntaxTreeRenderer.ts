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
import type { Variable, VisitationState } from "../../../a12internal/elements/index.js";
import { SyntaxTreeElementVisitor } from "../../../a12internal/elements/index.js";
import type { Consumer, Dereference, IntPredicate, SyntaxTreeElement, Util } from "../../../internal/elements/index.js";
import {
	Arithmetic,
	Compare,
	Constant,
	Logic,
	Predicate,
	ReferenceSegment,
	SyntaxTreeElementType,
} from "../../../internal/elements/index.js";

export class SyntaxTreeRenderer {
	static getPath(isAbsolute: boolean, segments: ReferenceSegment[], withoutRep: boolean = false): string {
		if (segments.length == 0) {
			return "";
		}
		let value = "";
		for (const e of segments) {
			value += "/";
			if (e.isTurningGroup) {
				value += ReferenceSegment.UPWARD_REFERENCE.label;
			}
			value += e.label;
			if (e.isList && !withoutRep) {
				value += "*";
			}
		}
		if (isAbsolute) {
			return value;
		} else {
			return value.substring(1);
		}
	}

	render(element: SyntaxTreeElement): string {
		const visitor = new SyntaxTreeRenderer.Visitor();
		const root = new SyntaxTreeRenderer.ElementSubTreeScope();
		visitor.visit(element, root);
		return root.finalValue;
	}
}

export namespace SyntaxTreeRenderer {
	export class ElementSubTreeScope implements VisitationState {
		private readonly _children: ElementSubTreeScope[] = [];
		private _finalValue?: string;

		get finalValue(): string {
			if (this._finalValue) {
				return this._finalValue;
			}
			this.render((c: string[]) => c.join(""));
			if (typeof this._finalValue === "undefined") {
				throw new Error(`Unable to render element: ${this._finalValue}`);
			}
			return this._finalValue;
		}

		get children(): ElementSubTreeScope[] {
			return this._children;
		}

		render(fn: Util.Function<string[], string>): void {
			if (this._finalValue) {
				return;
			}
			const children = this.children.map(child => child.finalValue);
			this._finalValue = fn(children);
		}

		scope(element: SyntaxTreeElement, scope: Consumer<VisitationState>): ElementSubTreeScope {
			const s = new ElementSubTreeScope();
			scope(s);
			this._children.push(s);
			return s;
		}
	}

	export class Visitor extends SyntaxTreeElementVisitor {
		private renderLogicOperator(operator: Logic.Operator): string {
			switch (operator) {
				case Logic.Operator.And:
					return "AND";
				case Logic.Operator.Or:
					return "OR";
			}
			throw new Error();
		}

		private renderCompareOperator(operator: Compare.Operator): string {
			switch (operator) {
				case Compare.Operator.Equality:
					return "==";
				case Compare.Operator.UnEquality:
					return "!=";
				case Compare.Operator.GreaterThan:
					return ">";
				case Compare.Operator.GreaterThanOrEqual:
					return ">=";
				case Compare.Operator.LessThan:
					return "<";
				case Compare.Operator.LessThanOrEqual:
					return "<=";
			}
			throw new Error();
		}

		private renderArithmeticOperator(operator: Arithmetic.Operator): string {
			switch (operator) {
				case Arithmetic.Operator.Plus:
					return "+";
				case Arithmetic.Operator.Minus:
					return "-";
				case Arithmetic.Operator.Division:
					return "/";
				case Arithmetic.Operator.Multiplication:
					return "*";
			}
			throw new Error();
		}

		private whiteSpacePadded(s: string): string {
			return ` ${s} `;
		}

		visitLogic(node: Logic, state: VisitationState): void {
			super.visitLogic(node, state);
			(state as ElementSubTreeScope).render(c =>
				this.renderWithBraces(this.whiteSpacePadded(this.renderLogicOperator(node.operator)), c, i => {
					const branch = node.branches[i];
					return (
						branch.elementType() === SyntaxTreeElementType.Logic &&
						(branch as Logic).operator !== node.operator
					);
				})
			);
		}

		visitCompare(node: Compare, state: VisitationState): void {
			super.visitCompare(node, state);
			(state as ElementSubTreeScope).render(c =>
				c.join(this.whiteSpacePadded(this.renderCompareOperator(node.operator)))
			);
		}

		visitArithmetic(node: Arithmetic, state: VisitationState): void {
			super.visitArithmetic(node, state);
			(state as ElementSubTreeScope).render(c =>
				this.renderWithBraces(this.whiteSpacePadded(this.renderArithmeticOperator(node.operator)), c, i => {
					const branch = node.branches[i];
					return (
						branch.elementType() === SyntaxTreeElementType.Arithmetic &&
						(branch as Arithmetic).operator !== node.operator
					);
				})
			);
		}

		private renderWithBraces(operator: string, c: string[], branchFilter: IntPredicate): string {
			let s = "";
			for (let i = 0; i < c.length; i++) {
				if (i != 0) {
					s += operator;
				}
				if (branchFilter(i)) {
					s += "(";
					s += c[i];
					s += ")";
				} else {
					s += c[i];
				}
			}
			return s.toString();
		}

		visitConstant(node: Constant, state: VisitationState): void {
			super.visitConstant(node, state);
			(state as ElementSubTreeScope).render(c => {
				switch (node.constantType) {
					case Constant.ConstantType.String:
						return `"${node.value}"`;
					case Constant.ConstantType.Integer:
					case Constant.ConstantType.Boolean:
					case Constant.ConstantType.Float:
					default:
				}
				return node.value;
			});
		}

		visitVariable(node: Variable, state: VisitationState): void {
			super.visitVariable(node, state);
			(state as ElementSubTreeScope).render(c => SyntaxTreeRenderer.getPath(node.isAbsolute, node.segments));
		}

		visitPredicate(node: Predicate, state: VisitationState): void {
			super.visitPredicate(node, state);

			switch (node.signature.signatureType()) {
				case Predicate.SignatureType.EmptySignature:
					(state as ElementSubTreeScope).render(c => node.label);
					break;
				case Predicate.SignatureType.InfixParameterList: {
					const parameters: string[] = (state as ElementSubTreeScope).children[0].children.map(
						child => child.finalValue
					);
					(state as ElementSubTreeScope).render(
						c => parameters[0] + this.whiteSpacePadded(node.label) + parameters[1]
					);
					break;
				}
				default:
					(state as ElementSubTreeScope).render(c => node.label + "(" + c.join(" ") + ")");
			}
		}

		renderParameterList(state: ElementSubTreeScope): void {
			state.render(c => c.join(","));
		}

		renderInclusionSignature(state: ElementSubTreeScope): void {
			const children = state.children;
			this.renderParameterList(children[0]);
			this.renderParameterList(children[1]);
			state.render(c => c.join(this.whiteSpacePadded("IN")));
		}

		renderConsistenceSignature(state: ElementSubTreeScope): void {
			const children = state.children;
			this.renderParameterList(children[0]);
			this.renderParameterList(children[1]);
			state.render(c => c.join(this.whiteSpacePadded("TO")));
		}

		visitParameterList(node: Predicate.ParameterList, state: VisitationState): void {
			super.visitParameterList(node, state);
			this.renderParameterList(state as ElementSubTreeScope);
		}

		visitEmptySignature(node: Predicate.EmptySignature, state: VisitationState): void {
			super.visitEmptySignature(node, state);
		}

		visitInfixParameterList(node: Predicate.InfixParameterList, state: VisitationState): void {
			super.visitInfixParameterList(node, state);
			(state as ElementSubTreeScope).render(c => "");
		}

		visitInclusionSignature(node: Predicate.InclusionSignature, state: VisitationState): void {
			super.visitInclusionSignature(node, state);
			this.renderInclusionSignature(state as ElementSubTreeScope);
		}

		visitConsistenceSignature(node: Predicate.ConsistenceSignature, state: VisitationState): void {
			super.visitConsistenceSignature(node, state);
			this.renderConsistenceSignature(state as ElementSubTreeScope);
		}

		visitDereference(node: Dereference, state: VisitationState): void {
			super.visitDereference(node, state);
			(state as ElementSubTreeScope).render(c => "[" + c.join(" ") + "]");
		}
	}
}
