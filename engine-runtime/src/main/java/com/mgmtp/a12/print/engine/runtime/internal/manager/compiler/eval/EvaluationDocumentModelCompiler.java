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
package com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.eval;

import com.mgmtp.a12.kernel.md.facade.DocumentModelServiceFactory;
import com.mgmtp.a12.kernel.md.facade.DocumentRtServiceFactory;
import com.mgmtp.a12.kernel.md.facade.DocumentServiceFactory;
import com.mgmtp.a12.kernel.md.model.a12internal.*;
import com.mgmtp.a12.kernel.md.model.a12internal.services.DocumentModelService;
import com.mgmtp.a12.kernel.md.model.api.IDocumentModel;
import com.mgmtp.a12.kernel.md.model.internal.wrapper.ElementWrapper;
import com.mgmtp.a12.model.header.HeaderFactory;
import com.mgmtp.a12.model.notification.RankedNotification;
import com.mgmtp.a12.print.engine.api.exception.PrintCompilerException;
import com.mgmtp.a12.print.engine.runtime.internal.engine.constant.Constants;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.RepetitionPrefix;
import com.mgmtp.a12.print.engine.runtime.internal.manager.ComputationEvaluationAdvice;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.PrintModelCompilationContext;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.PrintModelCompilerGraph;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.computation.FunctionalExpression;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.computation.TypedComputationExpression;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.eval.kernel.DocumentDynamicServiceConfig;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.eval.kernel.ModelCodeCache;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.eval.provider.DocumentRtServiceComputeDocumentDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.provider.ComputeDocumentDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.provider.TypedComputationExpressionCache;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.synthetics.SyntheticVariable;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.DocumentModelIndex;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.KernelElementUtils;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.egg.RewriteSyntaxTree;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.*;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.visitor.SyntaxTreeRenderer;
import lombok.Getter;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.io.StringWriter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Slf4j
@Getter
@RequiredArgsConstructor
public class EvaluationDocumentModelCompiler {

	public static final EvaluationDocumentModelReference SyntheticModel = new EvaluationDocumentModelReference("Synthetic", true);

	public static final String MODEL = "Model";
	public static final String RESULTS = "A12_Print_Eval_Results";

	private final ElementIdGenerator elementIdGenerator = new ElementIdGenerator();

	@NonNull
	private final TypedComputationExpressionCache strategyCache;
	@NonNull
	private final PrintModelCompilationContext printModel;

	private final SyntaxTreeRenderer syntaxTreeRenderer = new SyntaxTreeRenderer();
	@NonNull
	private final EvaluationDocumentPrefill documentPrefill = new EvaluationDocumentPrefill();
	@NonNull
	private final PrintModelCompilerGraph compilerGraph;
	@NonNull
	private final DocumentModelService documentModelService = new DocumentModelService();

	private final ConcurrentHashMap<ComputationStatement, ComputationStatement> computationMap = new ConcurrentHashMap<>();

	private static IDocumentModel createIDocumentModel(EvaluationDocumentModelRequirements requirements, DocumentModel documentModel) {
		final var iDocumentModel = new DocumentModelService().convertToExternal(documentModel);

		if (log.isDebugEnabled()) {

			var serializer = new DocumentModelServiceFactory().createDocumentModelSerializer();

			try (var out = new StringWriter()) {
				final var rankedNotifications = new ArrayList<RankedNotification>();
				serializer.serialize(iDocumentModel, out, rankedNotifications::add);
				log.debug("{} generated: {}", requirements.getEvalDocumentModelName(), out);
				for (var notification : rankedNotifications) {
					log.error("{} problem: {}", requirements.getEvalDocumentModelName(), notification);
				}
			} catch (Exception e) {
				throw new PrintCompilerException("unable to debug documentModel due to:", e);
			}
		}
		return iDocumentModel;
	}

	public TypedComputationExpression getComputedFieldStrategyKey(
		ComputationEvaluationAdvice.KernelComputation kernelComputation
	) {
		final var statement = computationMap.computeIfAbsent(
			ComputationStatement.build(kernelComputation),
			k -> k
		);

		classifyRepetitionContext(statement);

		return new FunctionalExpression(
			kernelComputation.getProviderId(),
			documentPrefill.createAdapter(this, statement),
			kernelComputation.getComputationFieldType()
		);
	}

	private Set<Locale> calculateLocaleSet(EvaluationDocumentModelRequirements requirements) {
		HashSet<Locale> locales = null;
		for (var documentModel : requirements.getModels()) {
			if (documentModel.isSynthetic()) {
				continue;
			}

			final var model = printModel
				.getDocumentModelIndexMap()
				.get(documentModel.getOriginModelName());

			if (locales == null) {
				locales = new HashSet<>(model.getHeader().getLocales());
			} else {
				locales.retainAll(model.getHeader().getLocales());
			}
		}

		if (locales == null) {
			if (Arrays.stream(requirements.getModels()).anyMatch(e -> !e.isSynthetic())) {
				log.error("DocumentModels referenced by {} do not share any locales.", printModel.getId().getModelHeaderId());
			}
			locales = new HashSet<>(printModel.getHeader().getLocales());
		}

		return locales;
	}

	private void classifyRepetitionContext(ComputationStatement statement) {
		final var prefixVariables = statement
			.getVariables()
			.stream()
			.flatMap(variable -> {
				final var documentModelName = variable.getSegments()[0].getLabel();
				final var documentModel = printModel.getDocumentModelIndexMap().get(documentModelName);

				final var realPath = Arrays.copyOfRange(
					variable.getSegments(),
					1,
					variable.getSegments().length
				);

				final var element = documentModel.getByPath(
					SyntaxTreeRenderer.getPath(true, true, realPath)
				).orElseThrow();

				final var path = KernelElementUtils.getPath(element);

				final var repPrefix = RepetitionPrefix.from(path);
				int i = path.size() - 1;
				for (; i >= 0; i--) {
					final var currentRepetitionRange = repPrefix.getRepetitions().get(i);
					final var referenceSegment = realPath[i];
					if (!referenceSegment.isList() && currentRepetitionRange.isRepeatable()) {
						break;
					}
				}
				if (i < 0) {
					return Stream.empty();
				} else {
					final var result = Arrays.copyOfRange(variable.getSegments(), 0, i + 2);
					if (log.isTraceEnabled()) {
						log.trace(
							"Repeatable Context found in Statement, estimated Rule Prefix /{}{} for {}",
							documentModelName,
							SyntaxTreeRenderer.getPath(true, result),
							new SyntaxTreeRenderer().render(statement.getKernelComputation().getSyntaxTreeElement())
						);
					}
					final var prefixVariable = Variable.builder().isAbsolute(true).segments(result).build();
					return Stream.of(prefixVariable);
				}
			})
			.collect(Collectors.toSet());

		if (prefixVariables.size() > 1) {
			log.error("Multiple Repeatable Context found in a statement: {} ", statement.key());
			throw new PrintCompilerException("Ambiguous Repeatable Context Group");
		} else if (!prefixVariables.isEmpty()) {
			statement.setResultPrefix(prefixVariables.iterator().next());
		}
	}

	public ComputeDocumentDependencyValueProducer compileDocumentModels() {

		final var computationByDocumentModels = computationMap.keySet().stream().collect(Collectors.toMap(
			ComputationStatement::getEvaluationDocumentModelRequirements,
			b -> new ArrayList<>(List.of(b)),
			(a, b) -> {
				a.addAll(b);
				return a;
			}
		));

		final var documentModelIndexMap = new HashMap<String, DocumentModelIndex>();

		final var computationProviderCompute = new DocumentRtServiceComputeDocumentDependencyValueProducer(
			documentModelIndexMap,
			new DocumentRtServiceFactory(e -> documentModelIndexMap.get(e).getDocumentModel()),
			new DocumentDynamicServiceConfig(new ModelCodeCache()),
			new DocumentServiceFactory(e -> documentModelIndexMap.get(e).getDocumentModel()).createDocumentFactory(),
			documentPrefill
		);

		for (var entrySet : computationByDocumentModels.entrySet()) {

			final var prefixLocations = new ResultPrefixGroupBuilder(
				entrySet.getValue().stream().flatMap(e -> e.getResultPrefix().stream()).collect(Collectors.toSet()),
				elementIdGenerator
			);

			final var requirements = entrySet.getKey();
			final var statements = entrySet.getValue();

			final var locales = calculateLocaleSet(requirements);
			final var documentModel = generateDocumentModel(requirements, locales);
			final var documentModelRoot = documentModel.getContent().getModelRoot();

			Group synthGroup = null;
			if (Arrays.stream(requirements.getModels()).anyMatch(EvaluationDocumentModelReference::isSynthetic)) {
				synthGroup = Group.builder()
								  .id(elementIdGenerator.getGroupId())
								  .name(SyntheticModel.getSaveToEmbedModelName())
								  .repeatability(1)
								  .build();
				documentModelRoot.addElement(synthGroup);
			}
			Group domainGroup = null;
			if (Arrays.stream(requirements.getModels()).anyMatch(e -> !e.isSynthetic())) {
				domainGroup = Group.builder()
								   .id(elementIdGenerator.getGroupId())
								   .name(MODEL)
								   .repeatability(1)
								   .build();
				documentModelRoot.addElement(domainGroup);
			}

			final var resultGroup = Group.builder()
										 .id(elementIdGenerator.getGroupId())
										 .name(RESULTS)
										 .repeatability(1)
										 .build();

			documentModelRoot.addElement(resultGroup);

			fillRootGroups(
				elementIdGenerator,
				requirements,
				documentModel,
				synthGroup,
				domainGroup,
				prefixLocations
			);

			for (var syntheticVariable : statements
				.stream()
				.flatMap(ComputationStatement::getSyntheticVariables)
				.filter(n -> statements.stream().noneMatch(
					e -> e.key().equals(SyntaxTreeRenderer.getPath(false, n.getVariable().getSegments())))
				).collect(Collectors.toUnmodifiableSet())
			) {
				buildSyntheticGroupsFromComputationFieldType(syntheticVariable, locales, documentModel, synthGroup);
			}

			for (var statement : statements) {
				buildComputationsFromStatements(statement, statements, prefixLocations, locales, resultGroup);
			}

			if (resultGroup.getElements().isEmpty()) {
				resultGroup.getParent().removeElement(resultGroup);
			}

			final var iDocumentModel = createIDocumentModel(requirements, documentModel);
			documentModelIndexMap.put(
				iDocumentModel.getHeader().getId(),
				DocumentModelIndex.buildFrom(iDocumentModel)
			);
			computationProviderCompute.getDocumentRtService().precompileDocumentModel(iDocumentModel);

			log.debug("Generated: EvaluationDataModel {}", iDocumentModel.getHeader().getId());
		}

		return computationProviderCompute;

	}

	private void buildSyntheticGroupsFromComputationFieldType(SyntheticVariable syntheticVariable, Set<Locale> locales, DocumentModel documentModel, Group synthGroup) {
		var computationFieldType = syntheticVariable.getComputationFieldType();
		if (computationFieldType.equals(ComputationFieldType.UNKNOWN)) {
			computationFieldType = compilerGraph.getClassifier().classifyFieldType(syntheticVariable.getVariable());
		}
		final var fieldName = getFieldName(syntheticVariable);
		final var finalComputationFieldType = computationFieldType;
		final var fieldType = computationFieldType
			.getFieldType()
			.orElseThrow(
				() -> new PrintCompilerException(
					String.format("FieldType not set for field %s in evaluation (%s given)",
						fieldName,
						finalComputationFieldType.name()))
			);
		final var syntheticField = Field.builder()
										.id(elementIdGenerator.getFieldId())
										.name(getFieldName(syntheticVariable))
										.fieldType(fieldType);
		final var label = new LocalizedTextMapBuilder();
		for (var locale : locales) {
			label.add(locale, String.format("Prefilled from: %s", syntaxTreeRenderer.render(syntheticVariable.getVariable())));
		}
		syntheticField.label(label.build());
		documentPrefill.getEvalDocumentModelInputs().compute(
			documentModel.getHeader().getId(),
			(k, v) -> {
				final var parameterMap = v != null ? v : new HashMap<String, String>();
				parameterMap.computeIfAbsent(syntaxTreeRenderer.render(syntheticVariable.getVariable()), s -> fieldName);
				return parameterMap;
			}
		);
		assert synthGroup != null;
		synthGroup.addElement(syntheticField.build());
	}

	private void buildComputationsFromStatements(ComputationStatement statement, ArrayList<ComputationStatement> statements, ResultPrefixGroupBuilder prefixLocations, Set<Locale> locales, Group resultGroup) {
		final var fieldName = getFieldName(statement.getKernelComputation().getSyntaxTreeElement());
		final var ruleType = statement.getKernelComputation().getComputationFieldType();
		final var ruleFieldType = ruleType.getFieldType()
										  .orElseThrow(() -> new PrintCompilerException(String.format("FieldType not set for field %s in evaluation (%s given)", fieldName, ruleType.name())));
		final var resultField = Field.builder()
									 .id(elementIdGenerator.getFieldId())
									 .name(fieldName)
									 .fieldType(ruleFieldType)
									 .build();

		final var ruleStatement = syntaxTreeRenderer.render(
			RewriteSyntaxTree
				.withRules()
				.variable(
					(o, c) ->  getVariableBuilderForSyntaxTreeElement(statement, c, statements)
				)
				.build()
				.apply(statement.getKernelComputation().getSyntaxTreeElement())
		);

		final var prefixGroupName = statement.getResultPrefix().map(
			prefix -> String.format("%s/", prefixLocations.getPrefixGroupName(prefix))
		).orElse(Constants.EMPTY_STRING);

		final var computationBuilder
			= Computation.builder()
						 .id(elementIdGenerator.getComputationId())
						 .name("Rule_" + fieldName)
						 .computedField(new DocumentModelObjectReferenceBuilder<Field>()
							 .dmo(resultField)
							 .relativePath(String.format("../%s%s", prefixGroupName, fieldName))
							 .build()
						 );

		final Computation.ComputationAlternative.ComputationAlternativeBuilder builder;
		if (ruleType.equals(ComputationFieldType.BOOLEAN)) {
			builder = Computation.ComputationAlternative
				.builder()
				.operation(Constant.TRUE.getValue());
			if (statement.getResultPrefix().isPresent()) {
				builder.precondition(String.format("GroupFilled(RuleGroup) AND (%s)", ruleStatement));
			} else {
				builder.precondition(ruleStatement);
			}
		} else {
			builder = Computation.ComputationAlternative
				.builder()
				.operation(ruleStatement);
			if (statement.getResultPrefix().isPresent()) {
				builder.precondition("GroupFilled(RuleGroup)");
			}
		}
		computationBuilder.computationAlternatives(List.of(
			builder.build()
		));
		final var errorMessageBuilder = new LocalizedTextMapBuilder();
		for (var locale : locales) {
			errorMessageBuilder.add(locale, String.format("computing the value of %s failed.", statement.getKernelComputation().getProviderId()));
		}

		computationBuilder.errorMessage(errorMessageBuilder.build());

		statement.getResultPrefix().ifPresentOrElse(
			prefix -> prefixLocations.build(
				prefix,
				resultField,
				computationBuilder.build()
			),
			() -> {
				resultGroup.addElement(resultField);
				resultGroup.addElement(computationBuilder.build());
			}
		);
	}

	private Function<Variable.VariableBuilder, SyntaxTreeElement> getVariableBuilderForSyntaxTreeElement(ComputationStatement statement, Variable c, ArrayList<ComputationStatement> statements) {
		if (SyntheticVariable.isSynthetic(c)) {
			return getVariableBuilderForSyntheticVariable(c, statements);
		} else {
			return statement.getResultPrefix().<Function<Variable.VariableBuilder, SyntaxTreeElement>>map(variable -> b -> {
				final var list = new LinkedList<>(List.of(c.getSegments()));
				for (var prefixReferenceSegment : variable.getSegments()) {
					final var segment = list.getFirst();
					if (segment.getLabel().equals(prefixReferenceSegment.getLabel())) {
						list.removeFirst();
					} else {
						break;
					}
				}
				return b.isAbsolute(false).segments(list.toArray(ReferenceSegment[]::new)).build();
			}).orElseGet(() -> b -> {
				final var list = new ArrayList<>(List.of(c.getSegments()));
				final var firstSegment = list.getFirst();

				statement.getDocumentModels().stream().filter(
					ref -> ref.getOriginModelName().equals(firstSegment.getLabel())
				).findFirst().ifPresent(evaluationDocumentModelReference ->
					list.set(0, ReferenceSegment.builder()
						.label(evaluationDocumentModelReference.getSaveToEmbedModelName())
						.isList(firstSegment.isList())
						.isTurningGroup(firstSegment.isTurningGroup())
						.build()
					)
				);

				list.addFirst(ReferenceSegment.builder().label(EvaluationDocumentModelCompiler.MODEL).build());
				return b.isAbsolute(true).segments(list.toArray(ReferenceSegment[]::new)).build();
			});
		}
	}

	private Function<Variable.VariableBuilder, SyntaxTreeElement> getVariableBuilderForSyntheticVariable(Variable c, ArrayList<ComputationStatement> statements) {
		if (statements.stream().anyMatch(e -> e.key().equals(SyntaxTreeRenderer.getPath(false, c.getSegments())))) {
			final var syntheticVariable = SyntheticVariable.from(c);
			final var name = getFieldName(syntheticVariable);
			return b -> b.isAbsolute(false).segments(
				new ReferenceSegment[]{
					ReferenceSegment.builder().label(name).build()
				}
			).build();
		} else {
			final var syntheticVariable = SyntheticVariable.from(c);
			final var name = getFieldName(syntheticVariable);
			return b -> b.isAbsolute(true).segments(
				new ReferenceSegment[]{
					ReferenceSegment.builder().label(SyntheticModel.getSaveToEmbedModelName()).build(),
					ReferenceSegment.builder().label(name).build()
				}
			).build();
		}
	}

	public String getFieldName(SyntheticVariable syntheticVariable) {
		return String.format(
			"Node_%s",
			Optional
				.ofNullable(syntheticVariable.getNodeId())
				.orElseGet(
					() -> syntheticVariable.findNode(getCompilerGraph().getEquivalenceGeneralizationGraph())
										   .orElseThrow(
											   () -> new PrintCompilerException("Synthetic Variable should always have a EggNode: " + syntheticVariable)
										   ).getId()
				)
		);
	}

	public String getFieldName(SyntaxTreeElement element) {
		return String.format(
			"Node_%s",
			compilerGraph.getEquivalenceGeneralizationGraph()
						 .get(
							 element.elementType().equals(SyntaxTreeElementType.VARIABLE)
								 ? Dereference.builder().variable((Variable) element).build()
								 : element
						 )
						 .orElseThrow(() -> new PrintCompilerException("should always have a EggNode")).getId()
		);
	}

	private void fillRootGroups(
		ElementIdGenerator elementIdGenerator,
		EvaluationDocumentModelRequirements requirements,
		DocumentModel documentModel,
		Group synthGroup,
		Group domainGroup,
		DocumentModelCloning listener
	) {

		for (final var modelReference : Arrays.stream(requirements.getModels()).filter(e -> !e.isSynthetic()).toList()) {

			final var group = Group.builder()
								   .id(elementIdGenerator.getGroupId())
								   .name(modelReference.getSaveToEmbedModelName())
								   .repeatability(1)
								   .build();

			if (modelReference.isSynthetic()) {
				assert synthGroup != null;
				synthGroup.addElement(group);
			} else {
				assert domainGroup != null;
				domainGroup.addElement(group);

				final var model = printModel.getDocumentModelIndexMap().get(modelReference.getOriginModelName());

				final var rootGroup = (Group) ((ElementWrapper) model.getContent().getDocumentModelRoot()).getElement();

				listener.beforeModel(modelReference.getOriginModelName());
				rootGroup.getElements().forEach(e -> deepStructuralCopy(e, listener).ifPresent(group::addElement));
				listener.afterModel(modelReference.getOriginModelName());

				final var typeDefs = new ArrayList<>(documentModel.getContent().getTypeDefinitions());

				final var internDocumentModel = documentModelService.convertFromExternal(model.getDocumentModel());

				typeDefs.addAll(
					internDocumentModel
						.getContent()
						.getTypeDefinitions()
				);

				documentModel.getContent().setTypeDefinitions(typeDefs);

			}
		}
	}

	private Optional<Element> deepStructuralCopy(Element element, DocumentModelCloning listener) {
		if (element instanceof Field field) {
			final var clone = deepStructuralCopy(field);
			listener.afterField(clone);
			return Optional.of(clone);
		}
		if (element instanceof Group group) {
			return Optional.of(deepStructuralCopy(group, listener));
		}
		return Optional.empty();
	}

	private Field deepStructuralCopy(Field element) {
		return Field.builder()
					.name(element.getName())
					.id(element.getId())
					.annotations(element.getAnnotations())
					.requirednessConfig(element.getRequirednessConfig().orElse(null))
					.isTransient(element.isTransient())
					.isGlobal(element.isGlobal())
					.variantFilter(element.getVariantFilter().orElse(null))
					.fieldType(element.getFieldType())
					.label(element.getLabel())
					.additionalInfo(element.getAdditionalInfo().orElse(null))
					.label(element.getLabel())
					.build();
	}

	private Group deepStructuralCopy(Group element, DocumentModelCloning listener) {
		final var result = Group.builder()
								.name(element.getName())
								.id(element.getId())
								.annotations(element.getAnnotations())
								.repeatability(element.getRepeatability())
								.indexField(element.getIndexField().orElse(null))
								.sortFields(element.getSortFields())
								.usageType(element.getUsageType().orElse(null))
								.label(element.getLabel())
								.build();

		listener.beforeGroup(element, result);
		element.getElements().forEach(e ->
			deepStructuralCopy(e, listener).ifPresent(result::addElement)
		);
		listener.afterGroup(result);
		return result;
	}

	private DocumentModel generateDocumentModel(EvaluationDocumentModelRequirements entryKey, Set<Locale> locales) {
		return DocumentModel
			.builder()
			.header(
				new HeaderFactory.Builder()
					.withId(entryKey.getEvalDocumentModelName())
					.withModelType(Constants.DOCUMENT_MODEL_TYPE)
					.withModelVersion(printModel.getDocumentModelIndexMap().values().stream().map(e -> e.getHeader().getModelVersion()).findAny().orElse(DocumentModelContent.VERSION))
					.withLocales(new ArrayList<>(locales))
					.withModelReferences(entryKey.getModels())
					.build()
			).content(
				DocumentModelContent.builder()
									.modelConfig(DocumentModelConfig.builder().build())
									.modelInfo(DocumentModelInfo.builder().name(entryKey.getEvalDocumentModelName()).build())
									.typeDefinitions(List.of())
									.build()
			)
			.build();
	}

	public String getFieldPath(ComputationStatement statement) {
		final var fieldName = getFieldName(statement.getKernelComputation().getSyntaxTreeElement());
		final var resultField = Variable
			.builder()
			.segments(new ReferenceSegment[]{
				ReferenceSegment.builder().label(RESULTS).build(),
				ReferenceSegment.builder().label(fieldName).build()
			})
			.build();
		return statement.getResultPrefix().map(
			v -> {
				final var r = Variable.join(
					Variable.builder()
							.segments(new ReferenceSegment[]{
								ReferenceSegment.builder().label(MODEL).build()
							})
							.build(),
					Variable.join(v, resultField)
				);
				return SyntaxTreeRenderer.getPath(
					true,
					r.getSegments()
				);
			}
		).orElseGet(
			() -> SyntaxTreeRenderer.getPath(
				true,
				resultField.getSegments()
			)
		);


	}

	interface DocumentModelCloning {
		void beforeModel(String modelId);

		void afterModel(String modelId);

		void beforeGroup(Group source, Group clone);

		void afterGroup(Group clone);

		void afterField(Field clone);

	}

	private static class ResultPrefixGroupBuilder implements DocumentModelCloning {

		private final Map<Variable, Optional<Group>> prefixGroups = new TreeMap<>(Variable::compareTo);

		private final LinkedList<ReferenceSegment> path = new LinkedList<>();

		private final ElementIdGenerator elementIdGenerator;

		public ResultPrefixGroupBuilder(@NonNull Set<Variable> prefixVariables, ElementIdGenerator elementIdGenerator) {
			this.elementIdGenerator = elementIdGenerator;
			for (var prefix : prefixVariables) {
				prefixGroups.put(prefix, Optional.empty());
			}
		}

		@Override
		public void beforeModel(String modelId) {
			path.add(ReferenceSegment.builder().label(modelId).build());
		}

		@Override
		public void afterModel(String modelId) {
			path.removeLast();
			assert path.isEmpty();
		}

		@Override
		public void beforeGroup(Group source, Group clone) {
			path.add(ReferenceSegment.builder().label(clone.getName()).build());
		}

		@Override
		public void afterGroup(Group clone) {
			prefixGroups.computeIfPresent(
				Variable.builder()
						.isAbsolute(true)
						.segments(path.toArray(ReferenceSegment[]::new))
						.build(),
				(k, v) -> {
					assert v.isEmpty();
					final var names = clone.getElements()
										   .stream()
										   .map(Element::getName)
										   .collect(Collectors.toSet());

					if (names.contains(RESULTS)) {
						throw new PrintCompilerException(
							"Unable to create "
								+ RESULTS
								+ " Group in "
								+ SyntaxTreeRenderer.getPath(true, k.getSegments())
								+ " due to an already present group that uses this reserved name."
						);
					} else {
						final var resultGroup = Group.builder()
													 .id(elementIdGenerator.getGroupId())
													 .name(RESULTS)
													 .repeatability(1)
													 .build();
						clone.addElement(resultGroup);
						return Optional.of(resultGroup);
					}
				}
			);
			path.removeLast();
		}

		@Override
		public void afterField(Field clone) {
			// Not needed for ResultPrefixGroupBuilder
		}

		private Group getPrefixGroup(Variable prefix) {
			return prefixGroups.get(prefix).orElseThrow(() -> new PrintCompilerException("invalid State"));
		}

		public void build(Variable prefix, Field resultField, Computation rule) {
			final var group = getPrefixGroup(prefix);
			group.addElement(resultField);
			group.getParent().addElement(rule);
		}

		public String getPrefixGroupName(Variable prefix) {
			return getPrefixGroup(prefix).getName();
		}
	}

}
