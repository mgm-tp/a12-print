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
package com.mgmtp.a12.print.model.migration.internal.versions.version_2_1_0.steps;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mgmtp.a12.print.model.api.inputSource.InputValueSourceResolver;
import com.mgmtp.a12.print.model.api.model.element.base.inputSource.PossibleInputSource;
import com.mgmtp.a12.print.model.map.PrintMetaModelMap;
import com.mgmtp.a12.print.model.migration.internal.MigrationStep;
import com.mgmtp.a12.print.model.migration.internal.MigrationStepResult;
import com.mgmtp.a12.print.model.migration.internal.exceptions.JSONElementNotFoundException;
import com.mgmtp.a12.print.model.migration.internal.exceptions.UnexpectedElementException;
import com.mgmtp.a12.print.model.migration.internal.utils.Utils;

import java.util.List;

import static com.mgmtp.a12.print.model.migration.internal.versions.version_2_1_0.Constants.KEYS.*;
import static com.mgmtp.a12.print.model.migration.internal.versions.version_2_1_0.Constants.VALUES.ELEMENT_TYPE.*;

public class InputSourceMigration implements MigrationStep {

	private static final ObjectMapper mapper = new ObjectMapper();
	private static final String VALUE_PROPERTY_NAME = "value";

	@Override
	public MigrationStepResult executeFileMigration(List<String> referenceDocuments, String model) {
		try {
			JsonNode printModel = mapper.readTree(model);
			migrateInputFields(printModel);
			return MigrationStepResult
				.builder()
				.printModel(printModel.toString())
				.build();
		} catch (Exception e) {
			throw new RuntimeException(e);
		}
	}

	private void migrateInputFields(JsonNode printModel) throws UnexpectedElementException, JSONElementNotFoundException {
		final var elementDefinitions = getElementDefinitions(printModel);

		Utils.executeOnJSONArray(elementDefinitions, ELEMENT_DEFINITIONS, elementDefinition -> {
			final JsonNode type = Utils.getRequiredDeepElement(elementDefinition, List.of(ELEMENT_TYPE));

			if (type.asText().equals(TABLE)) {
				migrateTable(elementDefinition);
			} else if (type.asText().equals(LISTING)) {
				migrateListing(elementDefinition);
			} else if (type.asText().equals(TABLE_LAYOUT)) {
				migrateTableLayout(elementDefinition);
			} else if (type.asText().equals(BAR_CHART)) {
				migrateBarChart(elementDefinition);
			} else if (type.asText().equals(LINE_CHART)) {
				migrateLineChart(elementDefinition);
			} else if (type.asText().equals(PIE_CHART)) {
				migratePieChart(elementDefinition);
			}
		});
	}


	private void migrateTable(ObjectNode elementDefinition) throws UnexpectedElementException, JSONElementNotFoundException {
		final var tablePath = List.of(TABLE_GROUPS);
		final ObjectNode table = Utils.getRequiredDeepElement(elementDefinition, tablePath);
		migrateInputSource(table, tablePath, TABLE_MAX_ROW_COUNT, null);
		migrateInputSource(table, tablePath, TABLE_SUM_LABEL, null);
		final ArrayNode tableColumns = table.withArrayProperty(TABLE_COLUMNS);

		if (tableColumns != null) {
			final var tableColumnPath = List.of(TABLE_GROUPS, TABLE_COLUMNS);
			Utils.executeOnJSONArray(tableColumns, TABLE_COLUMNS, column -> {
				migrateInputSource(column, tableColumnPath, TABLE_COLUMN_LABEL, null);
				migrateInputSource(column, tableColumnPath, TABLE_COLUMN_WIDTH, MEASURE_UNIT_PERCENT);
			});
		}
	}

	private void migrateListing(ObjectNode elementDefinition) throws UnexpectedElementException, JSONElementNotFoundException {
		final var listingColumnPath = List.of(LISTING_GROUP, LISTING_COLUMNS);
		final ArrayNode listingColumns = Utils.getRequiredDeepElement(elementDefinition, listingColumnPath);

		Utils.executeOnJSONArray(listingColumns, LISTING_COLUMNS, column -> {
			migrateInputSource(column, listingColumnPath, LISTING_COLUMN_LABEL, null);
			migrateInputSource(column, listingColumnPath, LISTING_COLUMN_WIDTH, MEASURE_UNIT_PERCENT);
		});
	}

	private void migrateTableLayout(ObjectNode elementDefinition) throws UnexpectedElementException {
		final var tableLayoutRowPropertyPath = List.of(TABLE_LAYOUT_GROUPS, TABLE_LAYOUT_ROW_PROPERTIES);

		final ArrayNode rowProperties = Utils.getDeepElement(elementDefinition, tableLayoutRowPropertyPath);
		if (rowProperties != null) {
			Utils.executeOnJSONArray(rowProperties, TABLE_LAYOUT_ROW_PROPERTIES, row -> {
				migrateInputSource(row, tableLayoutRowPropertyPath, TABLE_LAYOUT_MIN_HEIGHT, MEASURE_UNIT_MILLIMETER);
			});
		}

		final var tableLayoutColumnsPropertyPath = List.of(TABLE_LAYOUT_GROUPS, TABLE_LAYOUT_COLUMN_PROPERTIES);
		final ArrayNode columnProperties = Utils.getDeepElement(elementDefinition, tableLayoutColumnsPropertyPath);
		if (columnProperties != null) {
			Utils.executeOnJSONArray(columnProperties, TABLE_LAYOUT_COLUMN_PROPERTIES, column -> {
				migrateInputSource(column, tableLayoutColumnsPropertyPath, TABLE_LAYOUT_WIDTH, MEASURE_UNIT_PERCENT);

			});
		}

	}

	private void migrateBarChart(ObjectNode elementDefinition) throws JSONElementNotFoundException {
		final var barChartPath = List.of(BAR_CHART_GROUPS);
		final ObjectNode barChart = Utils.getRequiredDeepElement(elementDefinition, barChartPath);
		migrateInputSource(barChart, barChartPath, CHART_TITLE, null);
		migrateInputSource(barChart, barChartPath, CHART_LABEL_X, null);
		migrateInputSource(barChart, barChartPath, CHART_LABEL_Y, null);
	}

	private void migrateLineChart(ObjectNode elementDefinition) throws JSONElementNotFoundException {
		final var lineChartPath = List.of(LINE_CHART_GROUPS);
		final ObjectNode lineChart = Utils.getRequiredDeepElement(elementDefinition, lineChartPath);
		migrateInputSource(lineChart, lineChartPath, CHART_TITLE, null);
		migrateInputSource(lineChart, lineChartPath, CHART_LABEL_X, null);
		migrateInputSource(lineChart, lineChartPath, CHART_LABEL_Y, null);
	}

	private void migratePieChart(ObjectNode elementDefinition) throws JSONElementNotFoundException {
		final var pieChartPath = List.of(PIE_CHART_GROUPS);
		final ObjectNode lineChart = Utils.getRequiredDeepElement(elementDefinition, List.of(PIE_CHART_GROUPS));
		migrateInputSource(lineChart, pieChartPath, CHART_TITLE, null);

	}


	private void migrateInputSource(ObjectNode parent, List<String> parentPaths, String property, String unit) throws JSONElementNotFoundException {
		final var propertyValue = Utils.getDeepElement(parent, List.of(property));
		final String path = getMetadataPath(parentPaths, property);
		final var metadata = InputValueSourceResolver.getMetadata(path);

		final PossibleInputSource source = getInputSource(metadata, propertyValue);
		final ObjectNode inputField = mapper.createObjectNode();
		inputField.put("id", Utils.generateElementId());
		inputField.put("path", path);
		inputField.put("source", source.name());
		if (propertyValue != null) {
			if (propertyValue instanceof ObjectNode objectNode) {
				final var value = Utils.getRequiredDeepElement(objectNode, List.of(VALUE_PROPERTY_NAME));
				inputField.set(VALUE_PROPERTY_NAME, mapper.valueToTree(value));
			} else {
				inputField.set(VALUE_PROPERTY_NAME, mapper.valueToTree(propertyValue));
			}
		}
		if (unit != null) {
			inputField.put("unit", unit);
		}
		parent.set(property, inputField);
	}

	private String getMetadataPath(List<String> parentPaths, String property) {
		return String.format("/%s/%s/%s/%s/%s/", CONTENT, ELEMENT_DEFINITIONS, String.join("/", parentPaths), property, INPUT_SOURCE_VALUE);
	}


	private PossibleInputSource getInputSource(PrintMetaModelMap.InputSourceMetadata metadata, Object value) {
		if (value != null) {
			return PossibleInputSource.INPUT;
		}
		return metadata.defaultValue() == null ? PossibleInputSource.UNSET : PossibleInputSource.DEFAULT;
	}


	private ArrayNode getElementDefinitions(JsonNode printModel) throws JSONElementNotFoundException {
		return Utils.getRequiredDeepElement(
			printModel,
			List.of(CONTENT, ELEMENT_DEFINITIONS)
		);
	}
}
