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
package com.mgmtp.a12.print.model.migration.internal;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.mgmtp.a12.print.model.migration.internal.versions.version_2_1_0.steps.InputSourceMigration;
import org.apache.commons.io.IOUtils;
import org.junit.jupiter.api.Test;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.net.URISyntaxException;
import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class InputSourceMigrationTest {
	private static final String FILE = "models/InputSourceMigrationTest.json";
	private static final ObjectMapper mapper = new ObjectMapper();

	@Test
	void testMigrateInputSource() throws URISyntaxException, IOException {
		final var url = InputSourceMigrationTest.class.getResource("/" + FILE);
		assertNotNull(url);

		final var document = IOUtils.toString(new FileInputStream(new File(url.toURI()).getAbsolutePath()), StandardCharsets.UTF_8);

		final var migratedDocument = new InputSourceMigration().executeFileMigration(List.of(), document).getPrintModel();
		final JsonNode printModel = mapper.readTree(migratedDocument);
		final var elementDefinitions = printModel.path("content").withArrayProperty("elementDefinitions");


		for (final var elementDefinition : elementDefinitions) {
			final var type = elementDefinition.get("type");

			if (type.asText().equals("Table")) {
				final JsonNode table = elementDefinition.get("table");

				final JsonNode maxRowCount = table.get("maxRowCount");

				assertInputSource(maxRowCount, "INPUT", 1);

				final var sumLabel = table.get("sumLabel");
				assertInputSource(sumLabel, "INPUT", "Sum");

				final ArrayNode columns = table.withArrayProperty("columns");
				final JsonNode column1 = columns.get(0);

				final JsonNode label = column1.get("label");
				assertInputSource(label, "DEFAULT");

				final JsonNode width = column1.get("width");
				assertInputSource(width, "UNSET");

				final JsonNode column2 = columns.get(1);
				final JsonNode label2 = column2.get("label");
				assertInputSource(label2, "INPUT", "String");

				final JsonNode width2 = column2.get("width");
				assertInputSource(width2, "INPUT", 70, "Percent");
			} else if (type.asText().equals("Listing")) {
				final JsonNode listing = elementDefinition.get("listing");
				final ArrayNode columns = listing.withArrayProperty("columns");
				final JsonNode column1 = columns.get(0);

				final JsonNode label = column1.get("label");
				assertInputSource(label, "INPUT", "Value");

				final JsonNode width = column1.get("width");
				assertInputSource(width, "INPUT", 40, "Percent");

				final JsonNode column2 = columns.get(1);
				final JsonNode label2 = column2.get("label");
				assertInputSource(label2, "DEFAULT");

				final JsonNode width2 = column2.get("width");
				assertInputSource(width2, "UNSET");

			} else if (type.asText().equals("TableLayout")) {
				final JsonNode tableLayout = elementDefinition.get("tableLayout");
				final ArrayNode rowProperties = tableLayout.withArrayProperty("rowProperties");

				final JsonNode rowProperty1 = rowProperties.get(0);
				final JsonNode minHeight1 = rowProperty1.get("minHeight");
				assertInputSource(minHeight1, "DEFAULT");

				final JsonNode rowProperty2 = rowProperties.get(1);
				final JsonNode minHeight2 = rowProperty2.get("minHeight");
				assertInputSource(minHeight2, "INPUT", 15, "Millimeter");

				final ArrayNode columnProperties = tableLayout.withArrayProperty("columnProperties");

				final JsonNode columnProperty1 = columnProperties.get(0);
				final JsonNode rowWidth1 = columnProperty1.get("width");
				assertInputSource(rowWidth1, "UNSET");

				final JsonNode columnProperty2 = columnProperties.get(1);
				final JsonNode rowWidth2 = columnProperty2.get("width");
				assertInputSource(rowWidth2, "INPUT", 30, "Percent");

			} else if (type.asText().equals("BarChart")) {
				final JsonNode barChart =  elementDefinition.get("barChart");
				assertInputSource(barChart.get("title"), "UNSET");
				assertInputSource(barChart.get("labelX"), "UNSET");
				assertInputSource(barChart.get("labelY"), "UNSET");
			} else if (type.asText().equals("LineChart")) {
				final JsonNode barChart = elementDefinition.get("lineChart");
				assertInputSource(barChart.get("title"), "INPUT", "Line Chart");
				assertInputSource(barChart.get("labelX"), "INPUT", "X-Axis");
				assertInputSource(barChart.get("labelY"), "INPUT", "Y-Axis");
			} else if (type.asText().equals("PieChart")) {
				final JsonNode barChart = elementDefinition.get("pieChart");
				assertInputSource(barChart.get("title"), "INPUT", "Pie");
			}
		}
	}

	private void assertInputSource(JsonNode inputField, String source, String value) {
		assertEquals(source, inputField.get("source").asText());
		assertEquals(value, inputField.get("value").asText());
		assertNotNull(inputField.get("path"));
		assertNotNull(inputField.get("id"));
	}

	private void assertInputSource(JsonNode inputField, String source, Number value) {
		assertEquals(source, inputField.get("source").asText());
		assertEquals(value, inputField.get("value").asInt());
		assertNotNull(inputField.get("path"));
		assertNotNull(inputField.get("id"));
	}

	private void assertInputSource(JsonNode inputField, String source, Number value, String unit) {
		assertEquals(source, inputField.get("source").asText());
		assertEquals(value, inputField.get("value").asInt());
		assertEquals(unit, inputField.get("unit").asText());
		assertNotNull(inputField.get("path"));
		assertNotNull(inputField.get("id"));
	}

	private void assertInputSource(JsonNode inputField, String source) {
		assertEquals(source, inputField.get("source").asText());
		assertNotNull(inputField.get("path"));
		assertNotNull(inputField.get("id"));

		if (source.equals("UNSET") || source.equals("DEFAULT")) {
			assertFalse(inputField.has("value"));
		} else {
			assertTrue(inputField.has("value"));
		}
	}
}
