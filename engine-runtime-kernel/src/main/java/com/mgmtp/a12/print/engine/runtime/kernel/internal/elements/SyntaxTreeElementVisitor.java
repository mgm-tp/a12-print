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
package com.mgmtp.a12.print.engine.runtime.kernel.internal.elements;

import com.mgmtp.a12.print.engine.runtime.kernel.internal.ComputationParsingException;

public interface SyntaxTreeElementVisitor {

	default void visit(SyntaxTreeElement node, VisitationState state) {
		switch (node.elementType()) {
			case CONSTANT:
				visit((Constant) node, state);
				break;
			case VARIABLE:
				visit((Variable) node, state);
				break;
			case ARITHMETIC:
				visit((Arithmetic) node, state);
				break;
			case COMPARE:
				visit((Compare) node, state);
				break;
			case LOGIC:
				visit((Logic) node, state);
				break;
			case PREDICATE:
				visit((Predicate) node, state);
				break;
			case DEREFERENCE:
				visit((Dereference) node, state);
				break;
			case PREDICATE_SIGNATURE: {
				var signature = (Predicate.Signature) node;
				switch (signature.signatureType()) {
					case PARAMETER_LIST:
						visit((Predicate.ParameterList) signature, state);
						break;
					case INFIX_PARAMETER_LIST:
						visit((Predicate.InfixParameterList) signature, state);
						break;
					case INCLUSION:
						visit((Predicate.InclusionSignature) signature, state);
						break;
					case CONSISTENCE:
						visit((Predicate.ConsistenceSignature) signature, state);
						break;
					case EMPTY_SIGNATURE:
						visit((Predicate.EmptySignature) signature, state);
						break;
				}
				break;
			}
			default:
				throw new ComputationParsingException("invalid syntax tree");
		}
	}

	default void visit(Logic node, VisitationState state) {
		node.accept(this, state);
	}

	default void visit(Compare node, VisitationState state) {
		node.accept(this, state);
	}

	default void visit(Arithmetic node, VisitationState state) {
		node.accept(this, state);
	}

	default void visit(Constant node, VisitationState state) {
		node.accept(this, state);
	}

	default void visit(Variable node, VisitationState state) {
		node.accept(this, state);
	}

	default void visit(Predicate node, VisitationState state) {
		node.accept(this, state);
	}
	default void visit(Predicate.ParameterList node, VisitationState state) {
		node.accept(this, state);
	}

	default void visit(Predicate.InfixParameterList node, VisitationState state) {
		node.accept(this, state);
	}

	default void visit(Predicate.InclusionSignature node, VisitationState state) {
		node.accept(this, state);
	}

	default void visit(Predicate.ConsistenceSignature node, VisitationState state) {
		node.accept(this, state);
	}

	default void visit(Predicate.EmptySignature node, VisitationState state) {
		node.accept(this, state);
	}

	default void visit(Dereference node, VisitationState state) {
		node.accept(this, state);
	}


}
