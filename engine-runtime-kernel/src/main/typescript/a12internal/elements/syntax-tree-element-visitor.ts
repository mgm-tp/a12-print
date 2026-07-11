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
import type { Arithmetic, Compare, Constant, Dereference, Logic } from "../../internal/elements/index.js";
import { Predicate, type SyntaxTreeElement, SyntaxTreeElementType } from "../../internal/elements/index.js";

import type { Variable, VisitationState } from "./index.js";

export abstract class SyntaxTreeElementVisitor {
	visit(node: SyntaxTreeElement, state: VisitationState): void {
		switch (node.elementType()) {
			case SyntaxTreeElementType.Constant:
				this.visitConstant(node as Constant, state);
				break;
			case SyntaxTreeElementType.Variable:
				this.visitVariable(node as Variable, state);
				break;
			case SyntaxTreeElementType.Arithmetic:
				this.visitArithmetic(node as Arithmetic, state);
				break;
			case SyntaxTreeElementType.Compare:
				this.visitCompare(node as Compare, state);
				break;
			case SyntaxTreeElementType.Logic:
				this.visitLogic(node as Logic, state);
				break;
			case SyntaxTreeElementType.Predicate:
				this.visitPredicate(node as Predicate, state);
				break;
			case SyntaxTreeElementType.Dereference:
				this.visitDereference(node as Dereference, state);
				break;
			case SyntaxTreeElementType.PredicateSignature: {
				const signature = node as Predicate.Signature;
				switch (signature.signatureType()) {
					case Predicate.SignatureType.ParameterList:
						this.visitParameterList(signature as Predicate.ParameterList, state);
						break;
					case Predicate.SignatureType.InfixParameterList:
						this.visitInfixParameterList(signature as Predicate.InfixParameterList, state);
						break;
					case Predicate.SignatureType.Inclusion:
						this.visitInclusionSignature(signature as Predicate.InclusionSignature, state);
						break;
					case Predicate.SignatureType.Consistence:
						this.visitConsistenceSignature(signature as Predicate.ConsistenceSignature, state);
						break;
					case Predicate.SignatureType.EmptySignature:
						this.visitEmptySignature(signature as Predicate.EmptySignature, state);
						break;
				}
				break;
			}
			default:
				throw new Error("invalid syntax tree");
		}
	}

	visitLogic(node: Logic, state: VisitationState): void {
		node.accept(this, state);
	}

	visitCompare(node: Compare, state: VisitationState): void {
		node.accept(this, state);
	}

	visitArithmetic(node: Arithmetic, state: VisitationState): void {
		node.accept(this, state);
	}

	visitConstant(node: Constant, state: VisitationState): void {
		node.accept(this, state);
	}

	visitVariable(node: Variable, state: VisitationState): void {
		node.accept(this, state);
	}

	visitPredicate(node: Predicate, state: VisitationState): void {
		node.accept(this, state);
	}
	visitParameterList(node: Predicate.ParameterList, state: VisitationState): void {
		node.accept(this, state);
	}

	visitInfixParameterList(node: Predicate.InfixParameterList, state: VisitationState): void {
		node.accept(this, state);
	}

	visitInclusionSignature(node: Predicate.InclusionSignature, state: VisitationState): void {
		node.accept(this, state);
	}

	visitConsistenceSignature(node: Predicate.ConsistenceSignature, state: VisitationState): void {
		node.accept(this, state);
	}

	visitEmptySignature(node: Predicate.EmptySignature, state: VisitationState): void {
		node.accept(this, state);
	}

	visitDereference(node: Dereference, state: VisitationState): void {
		node.accept(this, state);
	}
}
