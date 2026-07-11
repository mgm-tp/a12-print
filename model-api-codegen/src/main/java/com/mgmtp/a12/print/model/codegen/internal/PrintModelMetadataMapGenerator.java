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


import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.node.ObjectNode;
import com.mgmtp.a12.kernel.md.model.api.IDocumentModel;
import com.mgmtp.a12.kernel.md.model.api.IField;
import com.mgmtp.a12.kernel.md.model.api.IGroup;
import com.mgmtp.a12.kernel.md.model.api.services.IDocumentModelSerializer;
import com.mgmtp.a12.kernel.md.model.internal.wrapper.fieldtypes.TypeDefTypeWrapper;
import com.mgmtp.a12.kernel.md.serializer.MDSerializerFactory;
import com.mgmtp.a12.model.header.Annotation;
import org.apache.commons.io.FileUtils;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;

public class PrintModelMetadataMapGenerator {

    private static final PrintModelMetadataMapFileGenerator printModelMetadataMapTypescriptFileGenerator =
            new PrintModelMetadataMapTypescriptFileGenerator();
    private static final PrintModelMetadataMapFileGenerator printModelMetadataMapJavaFileGenerator =
            new PrintModelMetadataMapJavaFileGenerator();

	private static final ObjectMapper mapper = new JsonMapper();

    private static final IDocumentModelSerializer documentModelSerializer = new MDSerializerFactory().createDocumentModelSerializer();

   private static final Map<String, String> DEFAULT_VALUE_TYPE_MAP;

   static {
       DEFAULT_VALUE_TYPE_MAP = new HashMap<>();
       DEFAULT_VALUE_TYPE_MAP.put("headerDefaultInputType", "Column");
       DEFAULT_VALUE_TYPE_MAP.put("minimumTableLayoutRowHeightType", "10");
       DEFAULT_VALUE_TYPE_MAP.put("defaultFalse", "false");
       DEFAULT_VALUE_TYPE_MAP.put("defaultTrue", "true");
       DEFAULT_VALUE_TYPE_MAP.put("alignment", "Left");
       DEFAULT_VALUE_TYPE_MAP.put("defaultColor", "#000000");
       DEFAULT_VALUE_TYPE_MAP.put("defaultBackgroundColor", "#ffffff");
       DEFAULT_VALUE_TYPE_MAP.put("defaultTextStyleId", "default-text-style-id");
       DEFAULT_VALUE_TYPE_MAP.put("pageBreakBehavior", "Allow");
       DEFAULT_VALUE_TYPE_MAP.put("defaultBorderWidth", "1");
   }

	public static final String INHERITED = "inherited";
    public static final String HAS_INHERITED = "hasInherited";
	public static final String INHERIT_CONDITION = "inheritedCondition";
	public static final String REQUIRED = "required";
	public static final String REQUIRED_CONDITION = "requiredCondition";
	public static final String IS_REQUIRED = "isRequired";
    public static final String DEFAULT_VALUE = "defaultValue";
    public static final String PATH = "path";
    public static final String BOOLEAN = "boolean";
	public static final String TRUE = "true";
    public static final String STRING = "string";


    public static void main(String[] args) throws PrintModelMetadataMapGenerationException {
        final var arguments = extractArgs(args);
        final var printMetaModel = loadDocumentModelFromResource(arguments.printMetaModelPath());
        final var metadataMap = new TreeMap<String, FieldMetadata>();
        final var metadataObject = mapper.createObjectNode();
        final var typeObject = mapper.createObjectNode();
		collectMetadata(printMetaModel.getContent().getDocumentModelRoot(), "/", metadataMap, metadataObject, typeObject, mapper.createObjectNode());

        printModelMetadataMapTypescriptFileGenerator.saveMapToFile(metadataMap, metadataObject, typeObject, resultString ->
                saveGeneratedFile(resultString, arguments.typescriptPath())
        );
        printModelMetadataMapJavaFileGenerator.saveMapToFile(metadataMap, metadataObject, typeObject, resultString ->
                saveGeneratedFile(resultString, arguments.javaOutputPath())
        );
    }

    private static Arguments extractArgs(String[] args) throws PrintModelMetadataMapGenerationException {
        if (args.length == 3) {
            return new Arguments(args[0], args[1], args[2]);
        } else {
            throw new PrintModelMetadataMapGenerationException(
                    "Not all args are provided (path to expanded PrintMetaModel, path for java output class, path for typescript output)"
            );
        }
    }

    private static void saveGeneratedFile(String resultString, String outputPath) throws PrintModelMetadataMapGenerationException {
        try {
            FileUtils.writeStringToFile(new File(outputPath), resultString, StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new PrintModelMetadataMapGenerationException("The result could not be saved", e);
        }
    }

    private static IDocumentModel loadDocumentModelFromResource(String path) throws PrintModelMetadataMapGenerationException {
        try {
            final var content = Files.readString(Path.of(path), StandardCharsets.UTF_8);
            return documentModelSerializer.deserialize(new StringReader(content));
        } catch (final IOException e) {
            throw new PrintModelMetadataMapGenerationException("The PrintMetaModel could not be loaded", e);
        }
    }

	private static String resolveDefaultValue(IField field, ObjectNode groupMetadata) {
		if (!(field.getFieldType() instanceof TypeDefTypeWrapper typeDefTypeWrapper)) {
			return null;
		}

		var typeDefinition = typeDefTypeWrapper.getTypeDefinition();
		if (typeDefinition.isEmpty()) {
			return null;
		}

		final var typeDefinitionName = typeDefinition.get().getName();
		String defaultValue = DEFAULT_VALUE_TYPE_MAP.get(typeDefinitionName);

		if (defaultValue != null) {
			return defaultValue;
		}

		Optional<JsonNode> typeDefValue = groupMetadata.optional(typeDefinitionName);
		return typeDefValue.flatMap(JsonNode::asStringOpt).orElse(null);
	}

	private static void processField(
		IField field,
		String path,
		Map<String, FieldMetadata> metadataMap,
		ObjectNode groupObject,
		ObjectNode groupTypeObject,
		ObjectNode groupMetadata
	) {
		String defaultValue = resolveDefaultValue(field, groupMetadata);

		final var isRequired = field.getRequirednessConfig().isPresent() ||
			field.getAnnotations().stream().anyMatch(a -> a.getName().equals(REQUIRED) && a.getValue().equals(TRUE));
		final var inheritedAnno = field.getAnnotations().stream().filter(a -> a.getName().equals(INHERITED)).findFirst();
		final var inheritedConditionAnno = field.getAnnotations().stream().filter(a -> a.getName().equals(INHERIT_CONDITION)).findFirst();
		final var requiredConditionAnno = field.getAnnotations().stream().filter(a -> a.getName().equals(REQUIRED_CONDITION)).findFirst();

		boolean inherited = inheritedAnno
			.map(anno -> TRUE.equals(anno.getValue()) ||
				(anno.getValue().equals("context") && groupMetadata.path(INHERITED).asStringOpt().orElse("").equals(TRUE)))
			.orElse(false);

		String inheritedCondition = null;
		final var fieldObject = mapper.createObjectNode();

		if (inherited) {
			inheritedCondition = inheritedConditionAnno
				.map(Annotation::getValue)
				.orElse(groupMetadata.path(INHERIT_CONDITION).asStringOpt().orElse(""));
		}

		String requiredCondition = requiredConditionAnno
			.map(Annotation::getValue)
			.orElse(groupMetadata.path(REQUIRED_CONDITION).asStringOpt().orElse(""));
		final var elPath = getPath(path, field.getName());
		metadataMap.put(elPath, new FieldMetadata(defaultValue, isRequired, inherited, inheritedCondition, requiredCondition));


		putOptional(fieldObject, HAS_INHERITED, inherited);
		putOptional(fieldObject, INHERIT_CONDITION, inheritedCondition);
		putOptional(fieldObject, REQUIRED_CONDITION, requiredCondition);
		fieldObject.put(IS_REQUIRED, isRequired);
		putOptional(fieldObject, DEFAULT_VALUE, defaultValue);
		fieldObject.put(PATH, elPath);
		groupObject.replace(field.getName(), fieldObject);

		final var fieldTypeObject = mapper.createObjectNode();
		fieldTypeObject.put(IS_REQUIRED, BOOLEAN);
		fieldTypeObject.put(DEFAULT_VALUE, STRING);
		fieldTypeObject.put(PATH, STRING);
		fieldTypeObject.put(HAS_INHERITED, BOOLEAN);
		fieldTypeObject.put(INHERIT_CONDITION, STRING);
		fieldTypeObject.put(REQUIRED_CONDITION, STRING);
		groupTypeObject.replace(field.getName(), fieldTypeObject);
	}

	private static void processInnerGroup(
		IGroup innerGroup,
		String path,
		Map<String, FieldMetadata> metadataMap,
		ObjectNode groupObject,
		ObjectNode groupTypeObject,
		ObjectNode groupMetadata
	) {
		innerGroup.getAnnotations().forEach(annotation -> groupMetadata.put(annotation.getName(), annotation.getValue()));
		collectMetadata(innerGroup, path, metadataMap, groupObject, groupTypeObject, groupMetadata);
	}


    private static void collectMetadata(
            IGroup group,
            String path,
            Map<String, FieldMetadata> metadataMap,
            ObjectNode metadataObject,
            ObjectNode typeObject,
			ObjectNode parentGroupMetadata
    ) {
        final var groupObject = mapper.createObjectNode();
        final var groupTypeObject = mapper.createObjectNode();
		try {
			final var groupMetadata = (ObjectNode) mapper.readTree(mapper.writeValueAsString(parentGroupMetadata));

			group.getElements().forEach(el -> {
				if (el instanceof IGroup innerGroup) {

					processInnerGroup(innerGroup, getPath(path, el.getName()), metadataMap, groupObject, groupTypeObject, groupMetadata);

					return;
				}

				if (el instanceof IField field) {
					processField(field, path, metadataMap, groupObject, groupTypeObject, groupMetadata);
				}
			});
			metadataObject.set(group.getName(), groupObject);
			typeObject.set(group.getName(), groupTypeObject);
		} catch (JacksonException e) {
			throw new IllegalStateException(e);
		}

    }


    private static String getPath(String path, String name) {
        return String.format("%s%s/", path, name);
    }

    public record FieldMetadata(String defaultValue, boolean isRequired, boolean hasInherited, String inheritedCondition, String requiredCondition) {
    }

    private record Arguments(String printMetaModelPath, String javaOutputPath, String typescriptPath) {
    }

	private static void putOptional(ObjectNode objectNode, String key, Object value) {
		if (value == null) {
			objectNode.remove(key);
		} else {
			objectNode.replace(key, mapper.valueToTree(value));
		}
	}
}
