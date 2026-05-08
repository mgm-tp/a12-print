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
	ArithmeticBranch,
	CompareBranch,
	LogicBranch,
	SyntaxTreeElement,
	SyntaxTreeElementType,
	SyntaxTreeElementVisitor,
	VisitationState,
} from "./index.js";

export class Predicate implements SyntaxTreeElement, LogicBranch, CompareBranch, ArithmeticBranch {
	_arithmeticBranch = true;
	_compareBranch = true;
	_logicBranch = true;

	readonly label: string;
	readonly signature: Predicate.Signature;

	constructor(label: string, signature: Predicate.Signature) {
		this.label = label;
		this.signature = signature;
	}

	elementType(): SyntaxTreeElementType {
		return SyntaxTreeElementType.Predicate;
	}

	accept(visitor: SyntaxTreeElementVisitor, state: VisitationState): void {
		state.scope(this.signature, s => visitor.visit(this.signature, s));
	}
}

export namespace Predicate {
	export enum SignatureType {
		EmptySignature,
		ParameterList,
		InfixParameterList,
		Inclusion,
		Consistence,
	}

	export interface Signature extends SyntaxTreeElement {
		signatureType(): SignatureType;
	}

	export type Parameter = SyntaxTreeElement;

	export class EmptySignature implements Signature {
		static readonly Instance: EmptySignature = new EmptySignature();

		elementType(): SyntaxTreeElementType {
			return SyntaxTreeElementType.PredicateSignature;
		}

		accept(visitor: SyntaxTreeElementVisitor, state: VisitationState): void {
			// accept is disabled for empty signatures
		}

		signatureType(): SignatureType {
			return SignatureType.EmptySignature;
		}
	}

	export class ParameterList implements Signature {
		readonly parameters: Parameter[];

		constructor(parameters: Parameter[]) {
			this.parameters = parameters;
		}

		elementType(): SyntaxTreeElementType {
			return SyntaxTreeElementType.PredicateSignature;
		}

		accept(visitor: SyntaxTreeElementVisitor, state: VisitationState): void {
			for (const branch of this.parameters) {
				state.scope(branch, s => visitor.visit(branch, s));
			}
		}

		signatureType(): SignatureType {
			return SignatureType.ParameterList;
		}
	}

	export class InfixParameterList implements Signature {
		readonly leftParameter: Parameter;
		readonly rightParameter: Parameter;

		constructor(leftParameter: Predicate.Parameter, rightParameter: Predicate.Parameter) {
			this.leftParameter = leftParameter;
			this.rightParameter = rightParameter;
		}

		elementType(): SyntaxTreeElementType {
			return SyntaxTreeElementType.PredicateSignature;
		}

		accept(visitor: SyntaxTreeElementVisitor, state: VisitationState): void {
			state.scope(this.leftParameter, s => visitor.visit(this.leftParameter, s));
			state.scope(this.rightParameter, s => visitor.visit(this.rightParameter, s));
		}

		signatureType(): SignatureType {
			return SignatureType.InfixParameterList;
		}
	}

	export class InclusionSignature implements Signature {
		readonly left: ParameterList;
		readonly right: ParameterList;

		constructor(left: Predicate.ParameterList, right: Predicate.ParameterList) {
			this.left = left;
			this.right = right;
		}

		elementType(): SyntaxTreeElementType {
			return SyntaxTreeElementType.PredicateSignature;
		}

		accept(visitor: SyntaxTreeElementVisitor, state: VisitationState): void {
			state.scope(this.left, s => visitor.visit(this.left, s));
			state.scope(this.right, s => visitor.visit(this.right, s));
		}

		signatureType(): SignatureType {
			return SignatureType.Inclusion;
		}
	}

	export class ConsistenceSignature implements Signature {
		readonly left: ParameterList;
		readonly right: ParameterList;

		constructor(left: Predicate.ParameterList, right: Predicate.ParameterList) {
			this.left = left;
			this.right = right;
		}

		elementType(): SyntaxTreeElementType {
			return SyntaxTreeElementType.PredicateSignature;
		}

		accept(visitor: SyntaxTreeElementVisitor, state: VisitationState): void {
			state.scope(this.left, s => visitor.visit(this.left, s));
			state.scope(this.right, s => visitor.visit(this.right, s));
		}

		signatureType(): Predicate.SignatureType {
			return Predicate.SignatureType.Consistence;
		}
	}
}
