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

import com.google.common.base.Strings;
import com.mgmtp.a12.print.engine.api.exception.impl.PrintCompilerException;
import com.mgmtp.a12.print.engine.api.exception.impl.PrintDomainException;
import com.mgmtp.a12.print.engine.api.exception.StaticImageNotFoundException;
import com.mgmtp.a12.print.engine.api.StaticImageProvider;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.expression.PreCompiledExpression;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.listing.PreCompiledListing;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.expression.interpreter.ExpressionInterpreter;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.expression.parser.ExpressionParser;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.types.A12TypeComparisonMapping;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.ComputationParser;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.egg.EquivalenceGeneralizationGraph;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.ComputationFieldType;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.ComputationFieldTypeExt;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.visitor.SyntaxTreeRenderer;
import com.mgmtp.a12.print.model.api.model.element.base.internal.LogicComponent;
import com.mgmtp.a12.print.model.api.model.element.base.internal.LogicContainer;
import com.mgmtp.a12.print.model.api.model.element.type.calculation.Calculation;
import com.mgmtp.a12.print.model.api.model.element.type.expression.Expression;
import com.mgmtp.a12.print.model.api.model.element.type.image.Image;
import com.mgmtp.a12.print.model.api.model.element.type.image.ImageProperties;
import com.mgmtp.a12.print.model.api.model.element.type.image.ResourceSource;
import com.mgmtp.a12.print.model.api.model.element.type.listing.Listing;
import com.mgmtp.a12.print.model.api.model.element.type.switchCase.Switch;
import com.mgmtp.a12.print.model.api.model.element.type.table.Table;
import com.mgmtp.a12.print.model.api.model.general.Metadata;
import com.mgmtp.a12.print.model.api.model.path.PrintModelPathElement;
import com.mgmtp.a12.print.model.api.model.reference.PlaceableReference;
import com.mgmtp.a12.print.model.api.model.watermark.Watermark;
import com.mgmtp.a12.print.model.api.walker.TraversalCommand;
import com.mgmtp.a12.print.model.api.walker.model.PrintModelPath;
import com.mgmtp.a12.print.model.api.walker.model.PrintModelVisitor;
import lombok.Getter;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.tuple.ImmutablePair;

import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;
import java.util.stream.Stream;


@Slf4j
@RequiredArgsConstructor
public class PrintModelPreCompiler implements PrintModelVisitor {

	@NonNull
	private final PrintModelCompilationContext printModel;
	@NonNull
	private final EquivalenceGeneralizationGraph equivalenceGeneralizationGraph;
	private final ComputationParser computationParser = new ComputationParser();
	private final HashMap<String, PreCompiledListing> preCompiledListings = new HashMap<>();
	private final HashMap<String, PreCompiledExpression> preCompiledExpressions = new HashMap<>();

	@NonNull
	private final A12TypeComparisonMapping a12TypeComparisonMapping;

	private final StaticImageProvider staticImageProvider;
	private final HashMap<String, byte[]> staticImageMap = new HashMap<>();
	private final HashSet<String> missingStaticImageFilenames = new HashSet<>();

	@Getter
	private final HashMap<LogicContainer, LogicContainerCompilation> containers = new HashMap<>();

	public @NonNull PrintModelCompilationContext getPrintModel() {
		return printModel;
	}

	PreCompilationResult build() {
		if (log.isTraceEnabled()) {
			containers.values().forEach(this::traceCompilation);
		}
		return new PreCompilationResult(
			preCompiledListings,
			preCompiledExpressions,
			new LinkedList<>(containers.values()),
			staticImageMap,
			missingStaticImageFilenames
		);
	}

	@Override
	public TraversalCommand visitImage(Image image, PrintModelPath path) {
		if (staticImageProvider == null) {
			return TraversalCommand.CONTINUE;
		}
		var props = image.getImageProperties();
		if (props.getImageSrcType() != ImageProperties.ImageSrcType.STATIC) {
			return TraversalCommand.CONTINUE;
		}
		var attachmentSource = props.getResourceSource();
		if (attachmentSource.isEmpty()) {
			return TraversalCommand.CONTINUE;
		}
		var filename = attachmentSource.map(ResourceSource::getResourceName)
			.filter(rsName -> !Strings.isNullOrEmpty(rsName))
			.orElseThrow(() -> new PrintCompilerException("Static image resource source is missing filename"));

		if (staticImageMap.containsKey(filename)) {
			return TraversalCommand.CONTINUE;
		}
		try {
			staticImageMap.put(filename, staticImageProvider.loadStaticImage(filename));
		} catch (StaticImageNotFoundException e) {
			missingStaticImageFilenames.add(filename);
		} catch (RuntimeException e) {
			throw new PrintCompilerException(
				"Failed to load static image '" + filename + "': " + e.getMessage(), e
			);
		}
		return TraversalCommand.CONTINUE;
	}

	public void traceCompilation(LogicContainerCompilation containerCompilation) {

		log.trace("{} was precompiled to:", containerCompilation.getElement().getId());
		var c = new AtomicInteger();
		final var src = containerCompilation.getElement().logicComponents().iterator();
		containerCompilation.getComponents().forEach(component -> {
			final var srcComp = src.next();
			final var st = srcComp.computationStatements().iterator();

			for (var statement : component.getStatements()) {
				log.trace(
					"{}#{}\n\t{}\n\t{}\n\t{}",
					containerCompilation.getElement().getId(),
					c.get(),
					st.next(),
					new SyntaxTreeRenderer().render(statement.getTree().getRoot()),
					new SyntaxTreeRenderer().render(statement.getNode().getTree())
				);
			}
			c.getAndIncrement();
		});
		log.trace("---------------------------");
	}

	LogicComponentCompilation compileLogicComponent(
		LogicComponent element,
		List<ComputationFieldType> operationTypes,
		ComputationVariableReferenceResolveAndRewrite resolver
	) {
		log.debug("compiling logical component {}", element);
		var iterator = operationTypes.iterator();
		return LogicComponentCompilation
			.builder()
			.component(element)
			.statements(element
				.computationStatements()
				.map(e -> ImmutablePair.of(e, iterator.next()))
				.toList()
				.stream()
				.map(e -> {
					var tree = resolver.resolveReferences(
						computationParser.parseTree(e.getKey())
					);
					return LogicComponentStatement
						.builder()
						.tree(tree)
						.fieldType(e.getRight())
						.node(equivalenceGeneralizationGraph.add(tree))
						.build();
				})
				.collect(Collectors.toList())
			)
			.build();
	}

	LogicContainerCompilation compileLogicContainer(LogicContainer element, List<ComputationFieldType> operationTypes, ComputationVariableReferenceResolveAndRewrite resolver) {
		log.debug("compiling logical container {}", element);
		return LogicContainerCompilation
			.builder()
			.element(element)
			.components(
				element.logicComponents().map(e -> compileLogicComponent(e, operationTypes, resolver)).collect(Collectors.toList())
			)
			.build();
	}

	@Override
	public TraversalCommand visitListing(Listing listing, PrintModelPath path) {
		preCompiledListings.computeIfAbsent(
			listing.getId(),
			e -> new ListingElementPreCompiler(
				listing,
				path,
				this,
				a12TypeComparisonMapping,
				modelName -> getPrintModel().getDocumentModelIndexMap().get(modelName)
			).compile()
		);
		return TraversalCommand.CONTINUE;
	}

	@Override
	public TraversalCommand visitPlaceableReference(PlaceableReference reference, PrintModelPath path, int index) {
		var referenceResolver = getReferenceResolver(path);
		containers.computeIfAbsent(
			reference,
			s -> compileLogicContainer(
				s,
				reference.getHideConditions().stream().map(e -> ComputationFieldType.BOOLEAN).collect(Collectors.toList()),
				referenceResolver
			)
		);
		return TraversalCommand.CONTINUE;
	}

	@Override
	public TraversalCommand visitWatermark(Watermark watermark, PrintModelPath path) {
		var referenceResolver = getReferenceResolver(path);
		containers.computeIfAbsent(
			watermark,
			s -> compileLogicContainer(
				s,
				watermark.getConditions().stream().map(e -> ComputationFieldType.BOOLEAN).collect(Collectors.toList()),
				referenceResolver
			)
		);
		return TraversalCommand.CONTINUE;
	}

	@Override
	public TraversalCommand visitMetadata(Metadata metadata, PrintModelPath path) {
		var referenceResolver = getReferenceResolver(path);

		containers.computeIfAbsent(
			metadata.getTitleLogicContainer(),
			s -> compileLogicContainer(
				s,
				metadata.getTitleComputation().stream()
					.flatMap(c -> Stream.of(ComputationFieldType.BOOLEAN, ComputationFieldType.STRING))
					.collect(Collectors.toList()),
				referenceResolver
			)
		);
		containers.computeIfAbsent(
			metadata.getDescriptionLogicContainer(),
			s -> compileLogicContainer(
				s,
				metadata.getDescriptionComputation().stream()
					.flatMap(c -> Stream.of(ComputationFieldType.BOOLEAN, ComputationFieldType.STRING))
					.collect(Collectors.toList()),
				referenceResolver
			)
		);
		containers.computeIfAbsent(
			metadata.getAuthorLogicContainer(),
			s -> compileLogicContainer(
				s,
				metadata.getAuthorComputation().stream()
					.flatMap(c -> Stream.of(ComputationFieldType.BOOLEAN, ComputationFieldType.STRING))
					.collect(Collectors.toList()),
				referenceResolver
			)
		);
		containers.computeIfAbsent(
			metadata.getLanguageLogicContainer(),
			s -> compileLogicContainer(
				s,
				metadata.getLanguageComputation().stream()
					.flatMap(c -> Stream.of(ComputationFieldType.BOOLEAN, ComputationFieldType.STRING))
					.collect(Collectors.toList()),
				referenceResolver
			)
		);
		return TraversalCommand.CONTINUE;
	}

	@Override
	public TraversalCommand visitSwitch(Switch switchElement, PrintModelPath path) {
		var referenceResolver = getReferenceResolver(path);
		switchElement
				.getSwitchProperties()
				.getCases()
				.forEach(switchCase -> containers.computeIfAbsent(
						switchCase,
						s -> compileLogicContainer(
								s,
								List.of(ComputationFieldType.BOOLEAN),
								referenceResolver
						)
				));
		return TraversalCommand.CONTINUE;
	}

	private ComputationVariableReferenceResolveAndRewrite getReferenceResolver(PrintModelPath path) {
		return new ComputationVariableReferenceResolver(printModel, "/");
	}

	@Override
	public TraversalCommand visitTable(Table table, PrintModelPath path) {
		table.getTableProperties().getFilterExpression().ifPresent(filterExpression -> {

			final var tableExpressionId = table.getId() + "_filter_expression";

			preCompiledExpressions.computeIfAbsent(
				tableExpressionId,
				e -> interpretExpression(
					tableExpressionId,
					filterExpression,
					table.getTableProperties().getModel(),
					table.getTableProperties().getBasePath(),
					path,
					table,
					true
				)
			);
		});

		return TraversalCommand.CONTINUE;
	}

	@Override
	public TraversalCommand visitExpression(Expression expression, PrintModelPath path) {
		preCompiledExpressions.computeIfAbsent(
			expression.getId(),
			e -> interpretExpression(
				expression.getId(),
				expression.getExpressionProperties().getText(),
				expression.getExpressionProperties().getModel(),
				expression.getExpressionProperties().getBasePath(),
				path,
				expression,
				false
			)
		);
		return TraversalCommand.CONTINUE;

	}

	private PreCompiledExpression interpretExpression(
		String expressionId,
		String expression,
		String model,
		String basePath,
		PrintModelPath path,
		PrintModelPathElement parent,
		boolean repeatFilter
	) {
		final var parserResult = new ExpressionParser(repeatFilter).parse(
			expression
		);

		if (parserResult.hasError()) {
			throw new PrintDomainException("During parsing of the expression '{}' an error occurred: {}", expression, parserResult.getErrorMessage());
		}

		final var counter = new AtomicInteger();
		final var result = new ExpressionInterpreter(
			expressionId,
			() -> "Expression@" + expressionId + "@" + counter.getAndIncrement()
		).interpret(
			parserResult.getNode(),
			model,
			basePath,
			printModel
		);

		final var expressionComputation
			= PreCompiledExpression.builder()
								   .interpreter(result)
								   .build();

		expressionComputation.getInterpreter().getIncludedEntities().forEach(
			included -> visitElement(included, path.with(parent, 0))
		);

		return expressionComputation;
	}

	@Override
	public TraversalCommand visitCalculation(Calculation calculation, PrintModelPath path) {
		var referenceResolver = getReferenceResolver(path);
		var computationFieldType = calculation
			.getCalculationProperties()
			.getFieldType()
			.map(fieldTypeDefinition -> {
				var typeDef = fieldTypeDefinition.getTypeDefinition();
				if (typeDef.isPresent()) {
					var iFieldType = printModel.getDocumentModelIndexMap().values().stream().flatMap(documentModelIndex ->
						documentModelIndex.getFieldType(typeDef.get()).stream()
					).findFirst().orElseThrow(() -> new PrintDomainException("Unable to find TypeDefinition " + typeDef.get().getId()));
					return ComputationFieldTypeExt.computationFieldTypeFrom(iFieldType);
				} else {
					return ComputationFieldTypeExt.computationFieldTypeFrom(
						fieldTypeDefinition.getFieldType().orElse(null),
						calculation.getCalculationProperties().getComputationAlternatives()
					);
				}
			})
			.orElseGet(() -> ComputationFieldType.STRING);


		containers.computeIfAbsent(
			calculation.getCalculationProperties(),
			s -> compileLogicContainer(
				s,
				List.of(
					ComputationFieldType.BOOLEAN,
					computationFieldType
				),
				referenceResolver
			)
		);
		return TraversalCommand.CONTINUE;
	}

	@Getter
	@RequiredArgsConstructor
	public static class PreCompilationResult {
		private final Map<String, PreCompiledListing> preCompiledListings;
		private final Map<String, PreCompiledExpression> preCompiledExpressions;
		private final LinkedList<LogicContainerCompilation> compilations;
		private final Map<String, byte[]> staticImageMap;
		private final Set<String> missingStaticImageFilenames;
	}

}
