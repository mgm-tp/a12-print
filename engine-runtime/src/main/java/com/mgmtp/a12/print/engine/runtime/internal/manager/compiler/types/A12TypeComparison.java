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

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.NullNode;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Slf4j
public class A12TypeComparison {

	private static final ObjectMapper mapper = new ObjectMapper();

	private final A12TypeComparisonMapping typeComparisonMapping;

	public A12TypeComparison(A12TypeComparisonMapping a12TypeComparisonMapping) {
		typeComparisonMapping = a12TypeComparisonMapping;
	}

	public boolean checkA12FieldTypeDeepEqual(
		JsonNode firstDeclaration,
		JsonNode secondDeclaration
	) {
		final var firstType = firstDeclaration.get("type");
		final var secondType = secondDeclaration.get("type");

		if (firstType == null || secondType == null) {
			throw new A12TypeComparisonException("One of the types has no type identifier");
		}

		final var fieldType = firstType.asText();
		if (!firstType.equals(secondType)) {
			return false;
		}

		if (!typeComparisonMapping.getTypes().containsKey(fieldType)) {
			throw new A12TypeComparisonException(
				String.format("There is no comparison mapping for the field type %s defined", fieldType)
			);
		}

		final var firstPropertiesMap = getPropertiesMap(firstDeclaration, fieldType);
		final var secondPropertiesMap = getPropertiesMap(secondDeclaration, fieldType);

		if (firstPropertiesMap.isEmpty() && secondPropertiesMap.isEmpty()) {
			return true;
		}

		final var typePropertiesMapping = typeComparisonMapping.getTypes().get(fieldType);

		if (checkTypesNotEqual(typePropertiesMapping, firstPropertiesMap, secondPropertiesMap)) return false;

		logUnmappedProperties(firstPropertiesMap);
		logUnmappedProperties(secondPropertiesMap);

		return true;
	}

	private boolean checkTypesNotEqual(
		Map<String, A12TypeComparisonMapping.ComparisonType> typePropertiesMapping,
		Map<String, Object> firstPropertiesMap,
		Map<String, Object> secondPropertiesMap
	) {
		for(Map.Entry<String, A12TypeComparisonMapping.ComparisonType> entry: typePropertiesMapping.entrySet()) {
			final var key = entry.getKey();
			final var comparisonType = entry.getValue();

			if (!comparisonType.equals(A12TypeComparisonMapping.ComparisonType.IGNORE) && (
					(
						(!firstPropertiesMap.containsKey(key) && secondPropertiesMap.containsKey(key)) ||
						(firstPropertiesMap.containsKey(key) && !secondPropertiesMap.containsKey(key))
					) || (
						firstPropertiesMap.containsKey(key) && secondPropertiesMap.containsKey(key) &&
							checkTypeNotEqual(firstPropertiesMap, secondPropertiesMap, key, comparisonType)
					)
				)
			) {
				return true;
			}

			firstPropertiesMap.remove(key);
			secondPropertiesMap.remove(key);
		}
		return false;
	}

	private boolean checkTypeNotEqual(
		Map<String, Object> firstPropertiesMap,
		Map<String, Object> secondPropertiesMap,
		String key,
		A12TypeComparisonMapping.ComparisonType comparisonType
	) {
		final var firstValue = firstPropertiesMap.get(key);
		final var secondValue = secondPropertiesMap.get(key);
		switch (comparisonType) {
			case COMPARE:
				if (!firstValue.toString().equals(secondValue.toString())) {
					return true;
				}
				break;
			case COMPARE_LIST:
				if (
					!(firstValue instanceof List && secondValue instanceof List &&
						listsAreEqual((List<?>) firstValue, (List<?>) secondValue))
				) {
					return true;
				}
				break;
			case COMPARE_MAP:
				if (
					!(firstValue instanceof Map && secondValue instanceof Map &&
						mapsAreEqual((Map<?, ?>) firstValue, (Map<?, ?>)secondValue))
				) {
					return true;
				}
				break;
			default:
				break;
		}
		return false;
	}

	private boolean mapsAreEqual(Map<?, ?> first, Map<?, ?> second) {
		if (first.size() != second.size()) {
			return false;
		}

		return first.entrySet().stream()
			.allMatch(e -> e.getValue().equals(second.get(e.getKey())));
	}

	private boolean listsAreEqual(
		List<?> firstList,
		List<?> secondList
	) {
		ArrayList<?> copy = new ArrayList<>(firstList);
		for (Object object: secondList) {
			if (!copy.remove(object) ) {
				return false;
			}
		}
		return copy.isEmpty();
	}

	private void logUnmappedProperties(
		Map<String, Object> propertiesMap
	) {
		for(String key: propertiesMap.keySet()) {
			log.warn("For the property {} is no mapping defined", key);
		}
	}

	private Map<String, Object> getPropertiesMap(
		JsonNode declaration,
		String type
	) {
		final var typeProperties = declaration.get(type);
		return (typeProperties instanceof NullNode || typeProperties == null)
				? Collections.emptyMap()
				: mapper.convertValue(typeProperties, new TypeReference<>() {});
	}
}
