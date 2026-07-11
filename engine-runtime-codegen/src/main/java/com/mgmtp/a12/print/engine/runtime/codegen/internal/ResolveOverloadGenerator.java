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
package com.mgmtp.a12.print.engine.runtime.codegen.internal;


import freemarker.core.PlainTextOutputFormat;
import freemarker.template.Configuration;
import freemarker.template.Template;
import freemarker.template.TemplateExceptionHandler;
import lombok.Builder;
import lombok.Data;

import javax.annotation.processing.*;
import javax.lang.model.SourceVersion;
import javax.lang.model.element.*;
import javax.lang.model.type.DeclaredType;
import javax.lang.model.util.Elements;
import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;


@SupportedAnnotationTypes({
	ResolveOverloadGenerator.PRINT_ENGINE_RUNTIME_DEPENDENCY,
	ResolveOverloadGenerator.PRINT_ENGINE_RUNTIME_STREAM_DEPENDENCY,
})
@SupportedSourceVersion(SourceVersion.RELEASE_21)
public class ResolveOverloadGenerator extends AbstractProcessor {

	public static final String PRINT_ENGINE_RUNTIME_DEPENDENCY = "com.mgmtp.a12.print.engine.runtime.internal.PrintEngineRuntimeDependency";
	public static final String PRINT_ENGINE_RUNTIME_STREAM_DEPENDENCY = "com.mgmtp.a12.print.engine.runtime.internal.PrintEngineRuntimeStreamDependency";
	public static final String VALUE_DEPENDENCY = "com.mgmtp.a12.print.engine.runtime.internal.engine.ValueDependency";

	private final Configuration freemarkerConfig;
	private final Template printEngineRuntime;
	private final Template internalPrintEngineRuntimeFactory;

	public ResolveOverloadGenerator() {
		final Configuration cfg = new Configuration(Configuration.VERSION_2_3_31);
		cfg.setClassForTemplateLoading(ResolveOverloadGenerator.class, "/templates/");
		cfg.setDefaultEncoding("UTF-8");
		cfg.setRecognizeStandardFileExtensions(false);
		cfg.setOutputFormat(PlainTextOutputFormat.INSTANCE);
		cfg.setLocale(Locale.ENGLISH);
		cfg.setNumberFormat("computer");
		cfg.setTemplateExceptionHandler(TemplateExceptionHandler.RETHROW_HANDLER);
		freemarkerConfig = cfg;
		try {
			printEngineRuntime = cfg.getTemplate("InternalPrintEngineRuntimeApi.ftl");
			internalPrintEngineRuntimeFactory = cfg.getTemplate("InternalPrintEngineRuntimeApiFactory.ftl");

		} catch (IOException e) {
			throw new EngineRuntimeCodegenException(e);
		}
	}

	@Override
	public synchronized void init(ProcessingEnvironment processingEnv) {
		this.processingEnv = processingEnv;
	}

	@Override
	public boolean process(Set<? extends TypeElement> annotations, RoundEnvironment roundEnv) {
		try {
			var dependencies = new HashMap<RuntimeType, ArrayList<Element>>();
			var streamDependencies = new HashMap<RuntimeType, ArrayList<Element>>();

			for (var annotation : annotations) {
				var annotationName = annotation.asType().toString();

				roundEnv.getElementsAnnotatedWith(annotation).forEach(element -> {
					getAnnotationMirror(element, annotationName).flatMap(this::getAnnotationValue).ifPresent(type -> {
						final var runtimeType = RuntimeType.valueOf(type.toString());
						switch (annotationName) {
							case PRINT_ENGINE_RUNTIME_DEPENDENCY ->
								addElementToDependencies(element, runtimeType, dependencies);
							case PRINT_ENGINE_RUNTIME_STREAM_DEPENDENCY ->
								addElementToDependencies(element, runtimeType, streamDependencies);
							default -> {}
						}
					});
				});
			}

			for (final var runtimeType: RuntimeType.values()) {
				var engine = PrintEngineCodeGenModel.builder()
					.runtimeResultType(runtimeType.getIdentifier())
					.runtimeDependencies(getDependencies(
						dependencies.getOrDefault(runtimeType, new ArrayList<>()),
						"provider"
					))
					.streamDependencies(getDependencies(
						streamDependencies.getOrDefault(runtimeType, new ArrayList<>()),
						"streamProvider"
					))
					.build();

				if (engine.getRuntimeDependencies().isEmpty() && engine.getStreamDependencies().isEmpty()) {
					return false;
				}

				final Map<String, Object> runtimeApiInput = new HashMap<>();
				runtimeApiInput.put("engine", engine);

				try (var writer = processingEnv.getFiler().createSourceFile(
					String.format("Internal%sPrintEngineRuntimeApi", runtimeType.getIdentifier())
				).openWriter()) {
					printEngineRuntime.process(runtimeApiInput, writer);
				}

				try (var writer = processingEnv.getFiler().createSourceFile(
					String.format("Internal%sPrintEngineRuntimeApiFactory", runtimeType.getIdentifier())
				).openWriter()) {
					internalPrintEngineRuntimeFactory.process(runtimeApiInput, writer);
				}
			}
		} catch (Exception e) {
			throw new EngineRuntimeCodegenException(e);
		}

		return true;
	}

	private void addElementToDependencies(
		final Element element,
		final RuntimeType runtimeType,
		final Map<RuntimeType, ArrayList<Element>> dependencies
	) {
		final var elementList = new ArrayList<Element>() {{add(element);}};
		if (dependencies.containsKey(runtimeType)) {
			dependencies.get(runtimeType).addAll(elementList);
		} else {
			dependencies.put(runtimeType, elementList);
		}
	}

	private Optional<? extends AnnotationMirror> getAnnotationMirror(
		final Element element,
		final String annotationClassName
	) {
		return element.getAnnotationMirrors().stream()
			.filter(m -> m.getAnnotationType().toString().equals(annotationClassName))
			.findFirst();
	}

	private Optional<? extends AnnotationValue> getAnnotationValue(final AnnotationMirror annotationMirror ) {
		final Elements elementUtils = this.processingEnv.getElementUtils();
		final Map<? extends ExecutableElement, ? extends AnnotationValue> elementValues = elementUtils.getElementValuesWithDefaults(annotationMirror);

		return elementValues.keySet().stream()
			.filter(k -> k.getSimpleName().toString().equals("type"))
			.map(elementValues::get)
			.findAny();
	}

	private List<Dependency> getDependencies(List<Element> elements, String prefix) {

		return elements.stream().map(dependency ->
						   processingEnv.getTypeUtils().directSupertypes(dependency.asType())
										.stream().filter(s -> s.toString().startsWith(VALUE_DEPENDENCY)).findAny().flatMap(iniface -> {
											if (iniface instanceof DeclaredType) {
												var valueDependency = (DeclaredType) iniface;
												return Optional.of(Dependency.builder()
																			 .value(valueDependency.getTypeArguments().get(0).toString())
																			 .dependency(dependency.toString())
																			 .simpleName(dependency.getSimpleName().toString())
																			 .provider(prefix + "For" + dependency.getSimpleName())
																			 .build());
											} else {
												return Optional.empty();
											}
										})
					   ).filter(Optional::isPresent)
					   .map(Optional::get)
					   .collect(Collectors.toList());
	}

	@Data
	@Builder
	public static class PrintEngineCodeGenModel {
		private final String runtimeResultType;
		private final List<Dependency> runtimeDependencies;
		private final List<Dependency> streamDependencies;
	}

	@Data
	@Builder
	public static class Dependency {

		private final String value;
		private final String dependency;
		private final String simpleName;
		private final String provider;
	}
}
