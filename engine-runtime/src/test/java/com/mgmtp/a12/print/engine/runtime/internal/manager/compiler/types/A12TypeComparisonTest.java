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
package com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.types;

import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.BooleanNode;
import tools.jackson.databind.node.ObjectNode;
import tools.jackson.databind.node.StringNode;
import com.mgmtp.a12.print.engine.api.PrintJobConfig;
import com.mgmtp.a12.print.engine.runtime.internal.manager.PrintModelCompilerRuntime;
import org.junit.jupiter.api.Test;


import tools.jackson.core.JacksonException;
import tools.jackson.dataformat.yaml.YAMLMapper;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;


class A12TypeComparisonTest {

	private static final ObjectMapper yamlMapper = YAMLMapper.builder().build();
	private static final ObjectMapper objectMapper = new JsonMapper();
	private final A12TypeComparison a12TypeComparison;

	public A12TypeComparisonTest() {
		var classLoader = PrintModelCompilerRuntime.class.getClassLoader();
		var inputStream = classLoader.getResourceAsStream(
			PrintJobConfig.DEFAULT.getA12TypeComparisonMappingFile()
		);
		try {
			a12TypeComparison = new A12TypeComparison(yamlMapper.readValue(inputStream, A12TypeComparisonMapping.class));
		} catch (JacksonException e) {
			throw new RuntimeException(e);
		}
	}

	@Test
	void checkStringFieldTypeDeepEqual() {
		ObjectNode firstNode = objectMapper.createObjectNode();
		firstNode.set("type", new StringNode("StringType"));
		ObjectNode firstStringTypeNode = objectMapper.createObjectNode();
		firstNode.set("StringType", firstStringTypeNode);

		ObjectNode secondNode = objectMapper.createObjectNode();
		secondNode.set("type", new StringNode("StringType"));

		// Both types are StringTypes with no properties
		assert a12TypeComparison.checkA12FieldTypeDeepEqual(firstNode, secondNode);

		firstStringTypeNode.set("alphabeticalSorting", BooleanNode.getFalse());

		// The first type has property more, which needs to be equal
		assert !a12TypeComparison.checkA12FieldTypeDeepEqual(firstNode, secondNode);

		ObjectNode secondStringTypeNode = objectMapper.createObjectNode();
		secondNode.set("StringType", secondStringTypeNode);
		secondStringTypeNode.set("alphabeticalSorting", BooleanNode.getTrue());

		// Both types have the same properties, but the property value differs
		assert !a12TypeComparison.checkA12FieldTypeDeepEqual(firstNode, secondNode);

		secondStringTypeNode.set("alphabeticalSorting", BooleanNode.getFalse());

		// Both types have the same properties
		assert a12TypeComparison.checkA12FieldTypeDeepEqual(firstNode, secondNode);

		secondStringTypeNode.set("noValueValidation", BooleanNode.getFalse());

		// The second type has a property more, but this is mapped as ignored
		assert a12TypeComparison.checkA12FieldTypeDeepEqual(firstNode, secondNode);
	}

	@Test
	void checkEnumerationTypeDeepEqual() {
		ObjectNode firstNode = getEnumerationTypeNode("Text1");
		ObjectNode secondNode = getEnumerationTypeNode("Text2");

		// The types are different because of a deeper property in a list
		assert !a12TypeComparison.checkA12FieldTypeDeepEqual(firstNode, secondNode);
	}

	private ObjectNode getEnumerationTypeNode(String localText) {
		ObjectNode node = objectMapper.createObjectNode();
		node.set("type", new StringNode("EnumerationType"));

		ObjectNode enumerationTypeNode = objectMapper.createObjectNode();

		ObjectNode value = objectMapper.createObjectNode();
		value.set("value", new StringNode("value1"));

		ArrayNode labels = objectMapper.createArrayNode();
		ObjectNode label = objectMapper.createObjectNode();
		label.set("locale", new StringNode("en"));
		label.set("text", new StringNode(localText));
		labels.add(label);
		value.set("label", labels);

		ArrayNode values = objectMapper.createArrayNode();
		values.add(value);
		enumerationTypeNode.set("values", values);
		node.set("EnumerationType", enumerationTypeNode);

		return node;
	}
}
