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
import {
	Arithmetic,
	Compare,
	Constant,
	Dereference,
	Logic,
	Predicate,
	SyntaxTreeElement,
	SyntaxTreeElementVisitor,
	Variable,
	VisitationState,
} from "../index.js";

export class TreeHeight extends SyntaxTreeElementVisitor {
	private height: number = 0;

	static find(head: SyntaxTreeElement): number {
		const visitor = new TreeHeight();
		visitor.visit(head, VisitationState.stateless());
		return visitor.height;
	}

	visitLogic(node: Logic, state: VisitationState): void {
		this.height += 1;
		super.visitLogic(node, state);
	}

	visitCompare(node: Compare, state: VisitationState): void {
		this.height += 1;
		super.visitCompare(node, state);
	}

	visitArithmetic(node: Arithmetic, state: VisitationState): void {
		this.height += 1;
		super.visitArithmetic(node, state);
	}

	visitConstant(node: Constant, state: VisitationState): void {
		this.height += 1;
		super.visitConstant(node, state);
	}

	visitVariable(node: Variable, state: VisitationState): void {
		this.height += 1;
		super.visitVariable(node, state);
	}

	visitPredicate(node: Predicate, state: VisitationState): void {
		this.height += 1;
		super.visitPredicate(node, state);
	}

	visitConsistenceSignature(node: Predicate.ConsistenceSignature, state: VisitationState): void {
		this.height += 1;
		super.visitConsistenceSignature(node, state);
	}

	visitParameterList(node: Predicate.ParameterList, state: VisitationState): void {
		this.height += 1;
		super.visitParameterList(node, state);
	}

	visitInfixParameterList(node: Predicate.InfixParameterList, state: VisitationState): void {
		this.height += 1;
		super.visitInfixParameterList(node, state);
	}

	visitEmptySignature(node: Predicate.EmptySignature, state: VisitationState): void {
		this.height += 1;
		super.visitEmptySignature(node, state);
	}

	visitInclusionSignature(node: Predicate.InclusionSignature, state: VisitationState): void {
		this.height += 1;
		super.visitInclusionSignature(node, state);
	}

	visitDereference(node: Dereference, state: VisitationState): void {
		this.height += 1;
		super.visitDereference(node, state);
	}
}
