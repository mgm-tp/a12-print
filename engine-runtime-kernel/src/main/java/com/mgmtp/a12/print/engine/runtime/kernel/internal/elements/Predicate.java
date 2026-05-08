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

import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NonNull;

@Data
@Builder(toBuilder = true)
public class Predicate implements SyntaxTreeElement, LogicBranch, CompareBranch, ArithmeticBranch {
	@NonNull
	private final String label;
	@NonNull
	private final Signature signature;

	@Override
	public SyntaxTreeElementType elementType() {
		return SyntaxTreeElementType.PREDICATE;
	}

	@Override
	public void accept(SyntaxTreeElementVisitor visitor, VisitationState state) {
		state.scope(signature, s -> visitor.visit(signature, s));
	}

	public enum SignatureType {
		EMPTY_SIGNATURE,
		PARAMETER_LIST,
		INFIX_PARAMETER_LIST,
		INCLUSION,
		CONSISTENCE
	}

	public interface Signature extends SyntaxTreeElement {
		SignatureType signatureType();

	}

	public interface Parameter extends SyntaxTreeElement {

	}

	@EqualsAndHashCode
	public static class EmptySignature implements Signature {

		public static final EmptySignature Instance = new EmptySignature();

		private EmptySignature(){

		}

		@Override
		public SyntaxTreeElementType elementType() {
			return SyntaxTreeElementType.PREDICATE_SIGNATURE;
		}

		@Override
		public void accept(SyntaxTreeElementVisitor visitor, VisitationState state) {
			// accept is disabled for EmptySignature
		}

		@Override
		public SignatureType signatureType() {
			return SignatureType.EMPTY_SIGNATURE;
		}
	}

	@Data
	@Builder(toBuilder = true)
	public static class ParameterList implements Signature {

		private final Parameter[] parameters;

		@Override
		public SyntaxTreeElementType elementType() {
			return SyntaxTreeElementType.PREDICATE_SIGNATURE;
		}

		@Override
		public void accept(SyntaxTreeElementVisitor visitor, VisitationState state) {
			for (var branch : parameters) {
				state.scope(branch, s -> visitor.visit(branch, s));
			}
		}

		@Override
		public SignatureType signatureType() {
			return SignatureType.PARAMETER_LIST;
		}
	}

	@Data
	@Builder(toBuilder = true)
	public static class InfixParameterList implements Signature {

		private final Parameter leftParameter;
		private final Parameter rightParameter;

		@Override
		public SyntaxTreeElementType elementType() {
			return SyntaxTreeElementType.PREDICATE_SIGNATURE;
		}

		@Override
		public void accept(SyntaxTreeElementVisitor visitor, VisitationState state) {
			state.scope(leftParameter, s -> visitor.visit(leftParameter, s));
			state.scope(rightParameter, s -> visitor.visit(rightParameter, s));
		}

		@Override
		public SignatureType signatureType() {
			return SignatureType.INFIX_PARAMETER_LIST;
		}
	}

	@Data
	@Builder(toBuilder = true)
	public static class InclusionSignature implements Signature {
		private final ParameterList left;
		private final ParameterList right;

		@Override
		public SyntaxTreeElementType elementType() {
			return SyntaxTreeElementType.PREDICATE_SIGNATURE;
		}

		@Override
		public void accept(SyntaxTreeElementVisitor visitor, VisitationState state) {
			state.scope(left, s -> visitor.visit(left, s));
			state.scope(right, s -> visitor.visit(right, s));
		}

		@Override
		public SignatureType signatureType() {
			return SignatureType.INCLUSION;
		}
	}

	@Data
	@Builder(toBuilder = true)
	public static class ConsistenceSignature implements Signature {
		private final ParameterList left;
		private final ParameterList right;

		@Override
		public SyntaxTreeElementType elementType() {
			return SyntaxTreeElementType.PREDICATE_SIGNATURE;
		}

		@Override
		public void accept(SyntaxTreeElementVisitor visitor, VisitationState state) {
			state.scope(left, s -> visitor.visit(left, s));
			state.scope(right, s -> visitor.visit(right, s));
		}

		@Override
		public SignatureType signatureType() {
			return SignatureType.CONSISTENCE;
		}
	}

}
