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

import com.mgmtp.a12.print.engine.api.PrintModelId;
import com.mgmtp.a12.print.engine.api.exception.PrintCompilerException;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.expression.PreCompiledExpressionMap;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.listing.PreCompiledListingMap;
import com.mgmtp.a12.print.engine.runtime.internal.manager.ComputationEvaluationAdvice;
import com.mgmtp.a12.print.engine.runtime.internal.manager.PrintModelCompilerRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.eval.EvaluationDocumentModelCompiler;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.MarginLayoutDependencyValueProducerFactory;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.pdfBoxEngine.ComponentTreeDependencyValueProducerFactory;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.provider.TypedComputationExpressionCache;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.egg.EggNode;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.egg.EquivalenceGeneralizationGraph;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.Arithmetic;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.ComputationFieldType;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.SyntaxTreeElementType;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.visitor.SyntaxTreeRenderer;
import com.mgmtp.a12.print.model.api.model.PrintModel;
import com.mgmtp.a12.print.model.api.model.container.DefinitionsContainer;
import com.mgmtp.a12.print.model.api.model.path.PrintModelPathElement;
import com.mgmtp.a12.print.model.api.model.watermark.Watermark;
import com.mgmtp.a12.print.model.api.walker.model.PrintModelPath;
import com.mgmtp.a12.print.model.api.walker.model.PrintModelVisitor;
import com.mgmtp.a12.print.model.api.walker.model.PrintModelWalker;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Future;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Slf4j
@RequiredArgsConstructor
public class PrintModelCompiler {

	public static final String SYNTHETIC_METADATA_DATA_MODEL = "metadata";
	public static final String SYNTHETIC_ANNOTATIONS_DATA_MODEL = "annotations";

	private final Object compilationLock = new Object();
	@NonNull
	private final PrintModelCompilerRuntime printModelCompilerRuntime;
	private Future<Void> compilation = null;

	private static void validateThereAreNoUnknownTypes(List<LogicComponentStatementSyntaxTreeAnalysis> syntaxTreeAnalyses) {
		final var unknownTypes = syntaxTreeAnalyses.stream()
												   .filter(e -> e.getAdvice() != null
													   && !e.getAdvice().evaluationCategory().equals(ComputationEvaluationAdvice.Category.RESOLVE_PROVIDER)
													   && e.getComputationFieldType().equals(ComputationFieldType.UNKNOWN)
												   )
												   .collect(Collectors.toUnmodifiableSet());

		if (!unknownTypes.isEmpty()) {
			var str = unknownTypes.stream().map(LogicComponentStatementSyntaxTreeAnalysis::toString).collect(Collectors.toUnmodifiableSet());
			throw new PrintCompilerException("Unable to classify the following subtrees: ", str);
		}
	}

	public static void visitElementDefinitionsAndPlaceableReferences(
		PrintModel printModel,
		PrintModelVisitor visitor
	) {
		final var basePath = PrintModelPath.create(printModel)
										   .with(printModel.getContent(), 0);
		final var elementDefinitions = printModel.getContent().getElementDefinitions();
		for (int i = 0; i < elementDefinitions.size(); i++) {
			PrintModelWalker.walkElementWithDefaultResolver(
				printModel,
				elementDefinitions.get(i),
				basePath
					.with(new PrintModelPathElement.ObjectProperty("elementDefinitions"), 0)
					.with(new PrintModelPathElement.ObjectProperty("element"), i),
				id -> Optional.empty(),
				visitor
			);
		}

		visitPlaceableReferences(printModel.getContent().getSegments(), basePath, "segments", visitor);

		printModel.getContent().getWatermarks().ifPresent(watermarkContainer ->
			visitPlaceableReferences(watermarkContainer, basePath, "watermarks", visitor));

		printModel.getContent().getSections().ifPresent(sectionContainer ->
			visitPlaceableReferences(sectionContainer, basePath, "sections", visitor));

		visitor.visitMetadata(printModel.getContent().getGeneral().getMetadata(), basePath);
	}

	private static void visitPlaceableReferences(
		DefinitionsContainer definitionsContainer,
		PrintModelPath basePath,
		String pathIndicator,
		PrintModelVisitor visitor
	) {
		final var definitions = definitionsContainer.getDefinitions();
		final var definitionsPath = basePath
			.with(new PrintModelPathElement.ObjectProperty(pathIndicator), 0)
			.with(new PrintModelPathElement.ObjectProperty("definitions"), 0);

		for (int i = 0; i < definitions.size(); i++) {
			final var definition = definitions.get(i);
			final var definitionPath = definitionsPath.with(definition, i);
			final var references = new ArrayList<>(definition.getReferences());

			if (definition instanceof Watermark watermark) {
				visitor.visitWatermark(watermark, definitionPath);
			}

			for (int j = 0; j < references.size(); j++) {
				final var reference = references.get(j);
				visitor.visitPlaceableReference(reference, definitionPath.with(reference, j), j);
			}
		}
	}

	public void await() throws InterruptedException, ExecutionException {
		if (compilation == null) {
			throw new PrintCompilerException("invalid compilation state");
		} else {
			compilation.get();
		}
	}

	public void compileAsync(final PrintModelCompilationContext printModel) {
		if (compilation != null) {
			return;
		}
		synchronized (compilationLock) {
			if (compilation != null) {
				return;
			}
			compilation = printModelCompilerRuntime.getExecutorService().submit(() -> {
				try {
					runCompilation(printModel);
					log.debug("compileAsync runCompilation finished for {}", printModel.getId().getModelHeaderId());
				} catch (PrintCompilerException e) {
					throw e;
				} catch (Exception e) {
					throw new PrintCompilerException("Compilation for " + printModel.getId().getModelHeaderId() + " was interrupted by:", e);
				}
				return null;
			});
		}
	}

	private void runCompilation(final PrintModelCompilationContext context) {

		log.debug("runCompilation started for {}", context.getId().getModelHeaderId());


		final var printModelCompilerGraph = new PrintModelCompilerGraph(context);

		final var preCompiler = new PrintModelPreCompiler(
			context,
			printModelCompilerGraph.getEquivalenceGeneralizationGraph(),
			printModelCompilerRuntime.getA12TypeComparisonMapping()
		);
		visitElementDefinitionsAndPlaceableReferences(
			context,
			preCompiler
		);

		final var preCompilationResult = preCompiler.build();

		context.setPreCompiledListingMap(
			PreCompiledListingMap.builder()
								 .preCompiledListing(preCompilationResult.getPreCompiledListings())
								 .build()
		);
		context.setPreCompiledExpressionMap(
			PreCompiledExpressionMap.builder()
									.preCompiledExpressions(preCompilationResult.getPreCompiledExpressions())
									.build()
		);

		final var computations = preCompilationResult.getCompilations();

		log.debug("preCompiler finished for {}", context.getId().getModelHeaderId());

		log.debug("egg expansion starting for {}", context.getId().getModelHeaderId());
		printModelCompilerGraph.getEquivalenceGeneralizationGraph().run();
		log.debug("egg expansion finished for  {}", context.getId().getModelHeaderId());

		log.debug("compile finished for {}", context.getId().getModelHeaderId());

		if (log.isDebugEnabled()) {
			for (var e : printModelCompilerGraph.getEquivalenceGeneralizationGraph().findLeafNodes()) {
				renderRewrites(context.getId(), e, 0, printModelCompilerGraph);
			}
		}

		final var strategyCache = new TypedComputationExpressionCache();
		final var evaluationDocumentModelCompiler = new EvaluationDocumentModelCompiler(
			strategyCache,
			context,
			printModelCompilerGraph
		);

		final var analyser = new LogicComponentStatementSyntaxTreeAnalyser(
			printModelCompilerGraph.getEquivalenceGeneralizationGraph(),
			printModelCompilerGraph.getClassifier()
		);

		final var syntaxTreeAnalyses
			= getSyntaxTreeAnalyses(printModelCompilerGraph.getEquivalenceGeneralizationGraph(), analyser);

		optimizeAdvices(syntaxTreeAnalyses);
		validateThereAreNoUnknownTypes(syntaxTreeAnalyses);

		if (log.isTraceEnabled()) {
			for (var analysis : syntaxTreeAnalyses) {
				log.trace(
					"{} classified as {}",
					analysis.getAdvice().evaluationCategory(),
					new SyntaxTreeRenderer().render(analysis.getNode().getTree())
				);
			}
		}

		log.debug("syntaxTree Analysis done for {}", context.getId().getModelHeaderId());

		final var computationEvaluationDependencyValueProducerFactory
			= ComputationEvaluationDependencyValueProducerFactory
			.builder()
			.computations(computations)
			.adviceCompiler(ComputationEvaluationAdviceCompiler.builder()
															   .computations(computations)
															   .syntaxTreeAnalyses(syntaxTreeAnalyses)
															   .build())
			.evaluationDocumentModelCompiler(evaluationDocumentModelCompiler)
			.createFactory();

		log.debug("compileComputationEvaluationAdvice done for {}", context.getId().getModelHeaderId());

		classifyStatement(analyser, printModelCompilerGraph, computations);

		log.debug("classifyStatement done for {}", context.getId().getModelHeaderId());

		computationEvaluationDependencyValueProducerFactory.setDependencyValueProducer(context);

		log.debug("setLogicContainerEvaluationDependencyValueProducer done for {}", context.getId().getModelHeaderId());

		context.setComputeDocumentDependencyValueProducer(
			evaluationDocumentModelCompiler.compileDocumentModels()
		);

		log.debug("setComputeDocumentDependencyValueProducer done for {}", context.getId().getModelHeaderId());

		if (context.isPdfBoxPrintProcess()) {
			// prepare component tree layout
			final var componentTreeDependencyValueProducerFactory = ComponentTreeDependencyValueProducerFactory.builder()
				.printModel(context.getModel())
				.printModelCompilerRuntime(printModelCompilerRuntime)
				.build();
			componentTreeDependencyValueProducerFactory.setDependencyValueProducer(context);
		} else {
			// prepare margin layout
			final var marginLayoutDependencyValueProducerFactor = MarginLayoutDependencyValueProducerFactory.builder()
				.printModel(context.getModel())
				.printModelCompilerRuntime(printModelCompilerRuntime)
				.build();
			marginLayoutDependencyValueProducerFactor.setDependencyValueProducer(context);
		}
	}

	private void optimizeAdvices(List<LogicComponentStatementSyntaxTreeAnalysis> syntaxTreeAnalyses) {

		final var providerIdAnalysis
			= syntaxTreeAnalyses
			.stream()
			.filter(e -> e.getAdvice() != null)
			.collect(
				Collectors.toMap(
					a -> a.getAdvice().getProviderId(),
					a -> a,
					(a, b) -> {
						if (a.getElement().elementType().equals(SyntaxTreeElementType.DEREFERENCE)) {
							return b;
						}
						if (b.getElement().elementType().equals(SyntaxTreeElementType.DEREFERENCE)) {
							return a;
						}
						throw new IllegalStateException();
					}
				)
			);

		for (final var analysis : syntaxTreeAnalyses) {
			final var advice = analysis.getAdvice();
			final var dependencies = advice.getProviderIdDependencies();
			if (dependencies.isEmpty()) {
				continue;
			}
			final var dep = dependencies
				.stream()
				.map(providerIdAnalysis::get).toList();

			var branchTypes = dep.stream().reduce(
				new HashMap<ComputationFieldType, Integer>(),
				(a, b) -> {
					a.compute(b.getComputationFieldType(), (n, m) -> {
						if (m == null || m == 0) {
							return 1;
						} else {
							return m + 1;
						}
					});
					return a;
				},
				(a, b) -> a
			);

			final var isPartiallyUnknownExpression = branchTypes.containsKey(ComputationFieldType.UNKNOWN);
			final var isUniform = branchTypes.size() == 1;

			final var containsKernelSemanticType = Stream.of(
				ComputationFieldType.DATE,
				ComputationFieldType.DATE_FRAGMENT,
				ComputationFieldType.DATE_RANGE,
				ComputationFieldType.DATE_TIME,
				ComputationFieldType.CUSTOM
			).anyMatch(branchTypes::containsKey);

			optimizeAdviceForExpressions(analysis, branchTypes, advice, containsKernelSemanticType, isPartiallyUnknownExpression, isUniform);
		}

	}

	private void optimizeAdviceForExpressions(
		LogicComponentStatementSyntaxTreeAnalysis analysis,
		HashMap<ComputationFieldType, Integer> branchTypes,
		ComputationEvaluationAdvice advice,
		boolean containsKernelSemanticType,
		boolean isPartiallyUnknownExpression,
		boolean isUniform
	) {
		if (isPartiallyUnknownExpression
			|| !isUniform
			|| containsKernelSemanticType
		) {

			switch (advice.evaluationCategory()) {
				case LOGIC_EXPRESSION, COMPARE_EXPRESSION: {
					analysis.setAdvice(
						ComputationEvaluationAdvice.KernelComputation
							.builder()
							.providerId(analysis.getProviderId())
							.syntaxTreeElement(analysis.getElement())
							.computationFieldType(
								ComputationFieldType.BOOLEAN
							)
							.build()
					);
					break;
				}
				case ARITHMETIC_EXPRESSION: {
					if (((ComputationEvaluationAdvice.JavaFunctionalExpression) advice).getArithmeticOperator().equals(Arithmetic.Operator.PLUS)
						&& branchTypes.keySet().stream().allMatch(ComputationFieldType::isStringLike)) {
						break;
					}
					analysis.setAdvice(
						ComputationEvaluationAdvice.KernelComputation
							.builder()
							.providerId(analysis.getProviderId())
							.syntaxTreeElement(analysis.getElement())
							.computationFieldType(
								isUniform
									? branchTypes.keySet().iterator().next()
									: branchTypes.entrySet().stream()
								.max(Map.Entry.comparingByValue())
								.map(Map.Entry::getKey)
								.orElse(ComputationFieldType.STRING)
							)
							.build()
					);
					break;
				}
				case CONSTANT, FIELD, KERNEL_COMPUTATION, RESOLVE_PROVIDER:
				default:
			}
		}
	}

	private List<LogicComponentStatementSyntaxTreeAnalysis> getSyntaxTreeAnalyses(EquivalenceGeneralizationGraph equivalenceGeneralizationGraph, LogicComponentStatementSyntaxTreeAnalyser analyser) {
		final var syntaxTreeAnalysisTaskList = new ArrayList<LogicComponentStatementSyntaxTreeAnalysis>();
		final var toVisit = new LinkedList<>(equivalenceGeneralizationGraph.findLeafNodes());

		while (!toVisit.isEmpty()) {
			var next = toVisit.poll();
			if (next == null) {
				continue;
			}
			syntaxTreeAnalysisTaskList.add(analyser.analyse(LogicComponentStatementSyntaxTreeAnalysis.builder().node(next).element(next.getTree()).build()));
			toVisit.addAll(equivalenceGeneralizationGraph.findIncomingNode(next));
		}

		return syntaxTreeAnalysisTaskList.stream().filter(e -> e.getAdvice() != null).collect(Collectors.toList());
	}

	private void classifyStatement(
		LogicComponentStatementSyntaxTreeAnalyser analyser,
		PrintModelCompilerGraph printModelCompilerGraph,
		List<LogicContainerCompilation> computations
	) {

		for (var computation : computations) {
			for (var components : computation.getComponents()) {
				for (var statement : components.getStatements()) {

					final var task = LogicComponentStatementClassificationTask.builder()
																			  .statement(statement)
																			  .analyser(analyser)
																			  .equivalenceGeneralizationGraph(printModelCompilerGraph.getEquivalenceGeneralizationGraph())
																			  .build();

					try {
						task.call();
					} catch (Exception e) {
						throw new PrintCompilerException("classifyStatement", e);
					}

				}
			}
		}

	}

	void renderRewrites(@NonNull PrintModelId id, EggNode a, Integer d, PrintModelCompilerGraph printModelCompilerGraph) {
		log.debug("{}:{}{} ", id.getModelHeaderId(), "\t".repeat(d), new SyntaxTreeRenderer().render(a.getTree()));

		for (EggNode eggNode : printModelCompilerGraph.getEquivalenceGeneralizationGraph().findIncomingNode(a)) {
			renderRewrites(id, eggNode, d + 1, printModelCompilerGraph);
		}
	}


}
