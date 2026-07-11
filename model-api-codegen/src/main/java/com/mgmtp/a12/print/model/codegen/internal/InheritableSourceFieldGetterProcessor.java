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
package com.mgmtp.a12.print.model.codegen.internal;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

import javax.annotation.processing.AbstractProcessor;
import javax.annotation.processing.RoundEnvironment;
import javax.annotation.processing.SupportedAnnotationTypes;
import javax.annotation.processing.SupportedSourceVersion;
import javax.lang.model.SourceVersion;
import javax.lang.model.element.AnnotationMirror;
import javax.lang.model.element.AnnotationValue;
import javax.lang.model.element.Element;
import javax.lang.model.element.ExecutableElement;
import javax.lang.model.element.TypeElement;
import javax.lang.model.element.VariableElement;
import javax.lang.model.type.DeclaredType;
import javax.lang.model.type.TypeKind;
import javax.lang.model.type.TypeMirror;

import freemarker.core.PlainTextOutputFormat;
import freemarker.template.Configuration;
import freemarker.template.Template;
import freemarker.template.TemplateExceptionHandler;

@SupportedAnnotationTypes({
    InheritableSourceFieldGetterProcessor.FIELD_GETTER_ENABLE,
    InheritableSourceFieldGetterProcessor.FIELD_GETTER
})
@SupportedSourceVersion(SourceVersion.RELEASE_21)
public class InheritableSourceFieldGetterProcessor extends AbstractProcessor {

    public static final String FIELD_GETTER_ENABLE = "com.mgmtp.a12.print.model.api.model.EnableGetterByFieldNameForInheritableSource";
    public static final String FIELD_GETTER = "com.mgmtp.a12.print.model.api.model.RegisterGetterByFieldName";

    private final Template fieldGetterRegistryTemplate;
    private boolean fileGenerated = false;

    public InheritableSourceFieldGetterProcessor() {
        Configuration cfg = new Configuration(Configuration.VERSION_2_3_31);
        cfg.setClassForTemplateLoading(InheritableSourceFieldGetterProcessor.class, "/templates/");
        cfg.setDefaultEncoding("UTF-8");
        cfg.setRecognizeStandardFileExtensions(false);
        cfg.setOutputFormat(PlainTextOutputFormat.INSTANCE);
        cfg.setLocale(Locale.ENGLISH);
        cfg.setNumberFormat("computer");
        cfg.setTemplateExceptionHandler(TemplateExceptionHandler.RETHROW_HANDLER);

        try {
            fieldGetterRegistryTemplate = cfg.getTemplate("InheritableSourceFieldGetterRegistry.ftl");
        } catch (IOException e) {
            throw new IllegalStateException("Failed to load InheritableSourceFieldGetterRegistry.ftl template", e);
        }
    }

    @Override
    public boolean process(Set<? extends TypeElement> annotations, RoundEnvironment roundEnv) {
        if (fileGenerated || annotations.isEmpty()) {
            return false;
        }

        for (TypeElement annotation : annotations) {
            if (annotation.getQualifiedName().toString().equals(FIELD_GETTER_ENABLE)) {

                List<ClassModel> classModels = buildClassModels(roundEnv, annotation);

                Map<String, Object> model = new HashMap<>();
                model.put("classes", classModels);

                buildCompiledClass(model);
            }
        }

        return true;
    }

    private List<ClassModel> buildClassModels(RoundEnvironment roundEnv, TypeElement annotation) {
        List<ClassModel> classModels = new ArrayList<>();
        for (Element element : roundEnv.getElementsAnnotatedWith(annotation)) {
            TypeElement classElement = (TypeElement) element;
            TypeElement currentElement = classElement;

            List<FieldModel> fields = new ArrayList<>();

            while (currentElement != null) {
                for (Element enclosed : currentElement.getEnclosedElements()) {
                    for (AnnotationMirror annotationMirror : enclosed.getAnnotationMirrors()) {
                        if (annotationMirror.getAnnotationType().toString().equals(FIELD_GETTER)) {
                            VariableElement field = (VariableElement) enclosed;
                            String fieldName = field.getSimpleName().toString();
                            String getter = buildGetterFunctionName(field, annotationMirror);

                            fields.add(new FieldModel(fieldName, getter));
                        }
                    }
                }
                TypeMirror superclass = currentElement.getSuperclass();
                if (superclass.getKind().isPrimitive() || superclass.toString().equals("none")) {
                    break;
                }
                currentElement = (TypeElement) ((DeclaredType) superclass).asElement();
            }

            classModels.add(new ClassModel(Objects.requireNonNull(classElement).getQualifiedName().toString(), fields));
        }
        return classModels;
    }

    private static String buildGetterFunctionName(VariableElement field, AnnotationMirror annotationMirror) {
        for (Map.Entry<? extends ExecutableElement, ? extends AnnotationValue> entry : annotationMirror.getElementValues().entrySet()) {
            if (entry.getKey().getSimpleName().toString().equals("customGetterName")) {
                Object value = entry.getValue().getValue();
                if (value instanceof String customGetter && !customGetter.isEmpty()) {
                    return customGetter;
                }
            }
        }

        String fieldName = field.getSimpleName().toString();
        boolean isBooleanField = field.asType().getKind().equals(TypeKind.BOOLEAN);
        if (isBooleanField) {
            return "is" + Character.toUpperCase(fieldName.charAt(0)) + fieldName.substring(1);
        }
        return "get" + Character.toUpperCase(fieldName.charAt(0)) + fieldName.substring(1);
    }

    private void buildCompiledClass(Map<String, Object> model) {
        try (var writer = processingEnv.getFiler()
            .createSourceFile("com.mgmtp.a12.print.engine.model.api.model.generated.InheritableSourceFieldGetterRegistry")
            .openWriter()) {
            fieldGetterRegistryTemplate.process(model, writer);
            fileGenerated = true;
        } catch (Exception ex) {
            throw new IllegalStateException("Error generating InheritableSourceFieldGetterRegistry source file", ex);
        }
    }

    public static class FieldModel {
        private final String name;
        private final String getter;

        public FieldModel(String name, String getter) {
            this.name = name;
            this.getter = getter;
        }

        public String getName() {
            return name;
        }

        public String getGetter() {
            return getter;
        }
    }

    public static class ClassModel {
        private final String name;
        private final List<FieldModel> fields;

        public ClassModel(String name, List<FieldModel> fields) {
            this.name = name;
            this.fields = fields;
        }

        public String getName() {
            return name;
        }

        public List<FieldModel> getFields() {
            return fields;
        }
    }

}