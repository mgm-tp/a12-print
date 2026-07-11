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

import com.mgmtp.a12.kernel.md.model.api.IField;
import com.mgmtp.a12.kernel.md.model.api.IGroup;
import com.mgmtp.a12.print.engine.api.exception.impl.PrintDomainException;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.rewrite.*;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.synthetics.SyntheticVariable;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.synthetics.SyntheticVariableType;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.DocumentModelIndex;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.SyntaxTreePredicateClassifier;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.egg.EggNode;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.egg.EggRuleSet;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.egg.EquivalenceGeneralizationGraph;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.egg.RewriteSyntaxTree;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.egg.rules.*;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.ComputationFieldType;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.Dereference;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.ReferenceSegment;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.Variable;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.visitor.SyntaxTreeRenderer;
import lombok.Data;
import lombok.Getter;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;

import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import static com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.ComputationFieldTypeExt.computationFieldTypeFrom;

@Data
@Slf4j
@Getter
public class PrintModelCompilerGraph {

	@NonNull
	private final EggRuleSet eggRuleSet;

	@NonNull
	private final EquivalenceGeneralizationGraph equivalenceGeneralizationGraph;

	@NonNull
	private final List<DataModelMetaFieldVariableRewrite> metaFieldVariableResolvers;

	@NonNull
	private final SyntaxTreePredicateClassifier classifier;

	public PrintModelCompilerGraph(PrintModelCompilationContext compilationContext) {

		eggRuleSet = new EggRuleSet();
		equivalenceGeneralizationGraph = new EquivalenceGeneralizationGraph(this.eggRuleSet);

		final var documentModelIndexMap = compilationContext.getDocumentModelIndexMap();
		addDataModelAliasRewrites(documentModelIndexMap);
		metaFieldVariableResolvers = addMetaDataAndAnnotations(documentModelIndexMap.values());

		equivalenceGeneralizationGraph.add(Dereference.builder().variable(SyntheticVariable.NotFilled).build());
		classifier = SyntaxTreePredicateClassifier.load(
			(syntaxTreePredicateClassifier, variable) -> {
				if (SyntheticVariable.isSynthetic(variable)) {
					final var syntheticField = SyntheticVariable.from(variable);
					final var computationFieldType = syntheticField.getComputationFieldType();

					if (ComputationFieldType.UNKNOWN.equals(computationFieldType)) {
						final var eggNodeOptional = syntheticField.findNode(this.getEquivalenceGeneralizationGraph());
						return getComputationFieldTypeForEggNode(syntaxTreePredicateClassifier, eggNodeOptional, syntheticField);
					} else {
						return computationFieldType;
					}
				} else {
					return getFieldType(compilationContext, variable, variable.getSegments()[0].getLabel());
				}

			}
		);


		addNormalizations();
		addGeneralizations();

	}

	private ComputationFieldType getComputationFieldTypeForEggNode(SyntaxTreePredicateClassifier syntaxTreePredicateClassifier, Optional<EggNode> eggNodeOptional, SyntheticVariable syntheticField) {
		final var replacement = eggNodeOptional.filter(e -> e.getReplacements().size() == 1)
			.map(r -> r.getReplacements().iterator().next().getKey());
		if (replacement.isPresent()) {
			return syntaxTreePredicateClassifier.classifyFieldType(replacement.get());
		}

		final var indirect = eggNodeOptional.filter(e -> !e.getTree().equals(syntheticField.getVariable()));
		if (indirect.isPresent()) {
			return syntaxTreePredicateClassifier.classifyFieldType(indirect.get().getTree());
		}

		final var outgoingNode = eggNodeOptional.flatMap(equivalenceGeneralizationGraph::findOutgoingNode);
		if (outgoingNode.isPresent()) {
			return syntaxTreePredicateClassifier.classifyFieldType(outgoingNode.get().getTree());
		}

		return ComputationFieldType.UNKNOWN;
	}

	public static ComputationFieldType getFieldType(
		PrintModelCompilationContext model,
		Variable variable,
		String documentModelName
	) {
		var documentModel = model.getDocumentModelIndexMap().get(documentModelName);
		if (documentModel == null) {
			return ComputationFieldType.UNKNOWN;
		}
		final var fieldPath = SyntaxTreeRenderer.getPathWithoutRep(
			true,
			Arrays.stream(variable.getSegments()).skip(1).toArray(ReferenceSegment[]::new)
		);
		final var entity = documentModel
			.getByPath(fieldPath);

		if (entity.filter(e -> e instanceof IGroup).isPresent()) {
			return ComputationFieldType.UNKNOWN;
		}

		return entity
			.filter(e -> e instanceof IField)
			.map(e -> computationFieldTypeFrom(((IField) e).getFieldType()))
			.orElseThrow(() -> {
				throw new PrintDomainException(
					"Reference to field '{}' was unable to be resolved in DocumentModel {}.",
					fieldPath,
					documentModelName
				);
			});
	}

	private List<DataModelMetaFieldVariableRewrite> addMetaDataAndAnnotations(Collection<DocumentModelIndex> documentModelIndexCollection) {
		final var metaFieldVariableResolvers = documentModelIndexCollection
			.stream()
			.map(documentModel -> new DataModelMetaFieldVariableRewrite(
				documentModel,
				ConstantToDereferenceGeneralisation
					.builder()
					.variableFactory(SyntheticVariable::create)
					.nodeFactory(equivalenceGeneralizationGraph::add)
					.build()
			))
			.collect(Collectors.toList());
		eggRuleSet.getNormalizations().addAll(metaFieldVariableResolvers);

		return metaFieldVariableResolvers;
	}

	private void addDataModelAliasRewrites(ConcurrentHashMap<String, DocumentModelIndex> documentModelIndexCollection) {
		final var dataModelAliasRewrites = documentModelIndexCollection.entrySet()
			.stream()
			.filter(entry -> !entry.getKey().equals(entry.getValue().getHeader().getId()))
			.map(DataModelAliasRewrite::new)
			.toList();
		eggRuleSet.getNormalizations().addAll(dataModelAliasRewrites);
	}

	private void addNormalizations() {
		eggRuleSet.getNormalizations().addAll(List.of(
			new ConstantEqualityShortCircuitNormalisation(),
			new IdentityEqualityCompareShortCircuitNormalisation(),
			new PredicateElisionNormalisation(),
			new LogicBranchShortCircuitNormalisation(),
			new UniqueLogicBranchNormalisation(),
			new CommutativeBranchOrderingNormalisation(),
			new LogicBranchConstantEliminationNormalisation(),
			new PatternOnConstantNormalisation(),
			new ConstantNumberCompareShortCircuitNormalisation(),
			new CommutativeLogicBranchFoldNormalisation(),
			RewriteSyntaxTree
				.withRules()
				.variable((o, c) -> {

					if (!SyntheticVariable.isSynthetic(c)) {
						return b -> c;
					}
					final var synth = SyntheticVariable.from(c);
					if (!synth.getSyntheticVariableType()
							  .equals(SyntheticVariableType.META)) {
						return b -> c;
					}
					equivalenceGeneralizationGraph.addRaw(
						Dereference.builder().variable(c).build()
					);
					return b -> c;
				})
				.build()
		));
	}

	private void addGeneralizations() {
		eggRuleSet.getGeneralization().addAll(List.of(
			AllowStringAndNumberConcatenation
				.builder()
				.equivalenceGeneralizationGraph(equivalenceGeneralizationGraph)
				.syntaxTreePredicateClassifier(classifier)
				.build(),
			StructureToDereferenceGeneralisation
				.builder()
				.variableFactory(SyntheticVariable::create)
				.nodeFactory(equivalenceGeneralizationGraph::add)
				.predicate(p -> true)
				.build(),
			ConstantToDereferenceGeneralisation
				.builder()
				.variableFactory(SyntheticVariable::create)
				.nodeFactory(equivalenceGeneralizationGraph::add)
				.build(),
			LocalDereferenceVariableGeneralisation
				.builder()
				.variableFactory(SyntheticVariable::create)
				.filter(
					e -> !SyntheticVariable.isSynthetic(e.getVariable())
				).nodeFactory(equivalenceGeneralizationGraph::add)
				.build(),
			StructureToDereferenceGeneralisation
				.builder()
				.variableFactory(SyntheticVariable::create)
				.nodeFactory(equivalenceGeneralizationGraph::add)
				.arithmetic(a -> true)
				.build(),
			StructureToDereferenceGeneralisation
				.builder()
				.variableFactory(SyntheticVariable::create)
				.nodeFactory(equivalenceGeneralizationGraph::add)
				.compare(a -> !a.getOperator().isEqualityOrUnEquality())
				.build(),
			StructureToDereferenceGeneralisation
				.builder()
				.variableFactory(SyntheticVariable::create)
				.nodeFactory(equivalenceGeneralizationGraph::add)
				.compare(a -> a.getOperator().isEqualityOrUnEquality())
				.build(),
			StructureToDereferenceGeneralisation
				.builder()
				.variableFactory(SyntheticVariable::create)
				.nodeFactory(equivalenceGeneralizationGraph::add)
				.logic(a -> true)
				.build()
		));
	}


}
