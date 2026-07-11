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
package com.mgmtp.a12.print.engine.runtime.kernel.internal;

import com.mgmtp.a12.print.engine.api.exception.impl.PrintCompilerException;
import com.mgmtp.a12.print.engine.api.exception.impl.PrintDomainException;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.*;
import lombok.Data;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.dataformat.yaml.YAMLFactory;

import java.util.*;
import java.util.function.Consumer;

import static com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.ComputationFieldTypeExt.computationFieldTypeFrom;

public class SyntaxTreePredicateClassifier {

	private static final ObjectMapper mapper = new ObjectMapper(new YAMLFactory());
	@NonNull
	private final VariableTypeResolver typeResolver;
	@NonNull
	private final Visitor visitor = new Visitor(this);
	private final Map<SyntaxTreeElement, ElementContext> _elementTypes = new HashMap<>();
	private final PredicateClassification predicateClassification;

	private SyntaxTreePredicateClassifier(@NonNull VariableTypeResolver typeResolver, @NonNull PredicateClassification predicateClassification) {
		this.typeResolver = typeResolver;
		this.predicateClassification = predicateClassification;
	}

	public static SyntaxTreePredicateClassifier load(@NonNull VariableTypeResolver typeResolver) throws PrintCompilerException {
		var classLoader = SyntaxTreePredicateClassifier.class.getClassLoader();
		var inputStream = classLoader.getResourceAsStream("com/mgmtp/a12/print/engine/runtime/kernel/internal/KernelPredicateTypes.yaml");
		try {
			return new SyntaxTreePredicateClassifier(
				typeResolver,
				mapper.readValue(inputStream, PredicateClassification.class)
			);
		} catch (JacksonException e) {
			throw new PrintCompilerException(e);
		}
	}

	public synchronized ComputationFieldType classifyFieldType(SyntaxTreeElement treeElement) {
		var context = _elementTypes.computeIfAbsent(treeElement, ElementContext::new);
		if (context.getResultTypeCandidates().isEmpty()) {
			visitor.visit(treeElement, context);
		}
		return context.getResultTypeCandidates().iterator().next();
	}

	@RequiredArgsConstructor
	private static class Visitor implements SyntaxTreeElementVisitor {

		@NonNull
		private final SyntaxTreePredicateClassifier syntaxTreePredicateClassifier;

		private void addResultTypeCandidate(VisitationState state, @NonNull ComputationFieldType fieldType) {
			((ElementContext) state).addResultTypeCandidate(fieldType);
		}

		@Override
		public void visit(Logic node, VisitationState state) {
			SyntaxTreeElementVisitor.super.visit(node, state);
			addResultTypeCandidate(state, ComputationFieldType.BOOLEAN);
		}

		@Override
		public void visit(Compare node, VisitationState state) {
			SyntaxTreeElementVisitor.super.visit(node, state);
			addResultTypeCandidate(state, ComputationFieldType.BOOLEAN);
		}

		@Override
		public void visit(Constant node, VisitationState state) {
			SyntaxTreeElementVisitor.super.visit(node, state);
			addResultTypeCandidate(state, computationFieldTypeFrom(node.getConstantType()));
		}

		@Override
		public void visit(Variable node, VisitationState state) {
			SyntaxTreeElementVisitor.super.visit(node, state);
			final var computationFieldType = syntaxTreePredicateClassifier.typeResolver.resolveVariableType(syntaxTreePredicateClassifier, node);
			addResultTypeCandidate(state, computationFieldType);
		}

		@Override
		public void visit(Arithmetic node, VisitationState state) {
			SyntaxTreeElementVisitor.super.visit(node, state);
			var context = (ElementContext) state;
			context.getSubtree()
				   .stream()
				   .flatMap(e -> e.getResultTypeCandidates().stream())
				   .sorted()
				   .forEach(c -> addResultTypeCandidate(context, c));
		}

		@Override
		public void visit(Dereference node, VisitationState state) {
			SyntaxTreeElementVisitor.super.visit(node, state);
			addResultTypeCandidate(state, ((ElementContext) state).expectSingleSubtreeType());
		}

		@Override
		public void visit(Predicate node, VisitationState state) {
			SyntaxTreeElementVisitor.super.visit(node, state);
			var predicate = syntaxTreePredicateClassifier.predicateClassification.getPredicates().get(node.getLabel());
			if (predicate == null) {
				throw new PrintDomainException("The predicate '{}' is not supported.", node.getLabel());
			}
			predicate.getType().forEach(type -> addResultTypeCandidate(state, computationFieldTypeFrom(type)));
		}

	}

	@Data
	private class ElementContext implements VisitationState {

		@NonNull
		private final SyntaxTreeElement element;
		@NonNull
		private final List<ElementContext> subtree = new ArrayList<>();

		private Set<ComputationFieldType> resultTypeCandidates = new TreeSet<>();

		public synchronized void addResultTypeCandidate(@NonNull ComputationFieldType computationFieldType) {
			resultTypeCandidates.add(computationFieldType);
		}

		@Override
		public synchronized ElementContext scope(SyntaxTreeElement element, Consumer<VisitationState> scope) {
			var result = _elementTypes.computeIfAbsent(element, ElementContext::new);
			if (result.getResultTypeCandidates().isEmpty()) {
				scope.accept(result);
			}
			subtree.add(result);
			return result;
		}

		public synchronized ComputationFieldType expectSingleSubtreeType() {
			assert getSubtree().size() == 1;
			var element = getSubtree().get(0);
			var candidates = element.getResultTypeCandidates();
			if(candidates.size() > 1){
				candidates.remove(ComputationFieldType.EMPTY);
			}
			assert candidates.size() == 1;
			return candidates.iterator().next();
		}
	}


}
