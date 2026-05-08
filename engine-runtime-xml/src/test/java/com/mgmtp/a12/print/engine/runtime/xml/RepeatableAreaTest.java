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
package com.mgmtp.a12.print.engine.runtime.xml;

import com.mgmtp.a12.print.engine.runtime.test.internal.PrintTestUtil;
import com.mgmtp.a12.print.engine.runtime.xml.utils.XPathTestUtil;
import com.mgmtp.a12.print.engine.runtime.xml.utils.XmlRuntimeTestUtil;
import org.apache.commons.lang3.tuple.Pair;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class RepeatableAreaTest {
	@Test
	public void testRepeatableArea() {
		final String printModel = PrintTestUtil.loadFromResources("/data/repeatableArea/RepeatableAreaPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/repeatableArea/RepeatableAreaDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/repeatableArea/RepeatableAreaDM-1.json");

		final var result =
			XmlRuntimeTestUtil.print(printModel, "RepeatableAreaDM", documentModel, document);

		XmlRuntimeTestUtil.writeResultFiles(result, "repeatableArea");

		final var xmlTestUtil = new XPathTestUtil(result.getXmlMarkup());

		final var containerElementExpression = "//segment[%d]/elements/area/elements/area[%d]/elements/";
		final var iterationText = containerElementExpression + "text[1]/text";
		final var nodeCount = containerElementExpression + "area[1]/elements/area[@id=\"%s\"]";
		final var iterationString =
			containerElementExpression + "area[1]/elements/area[%d]/elements/text[1]/text";

		// on each segment is a repeatable area
		final var segmentCount = xmlTestUtil.getNodeCount("//segment");
		assertEquals(2, segmentCount);
		for (var i = 1; i <= segmentCount; i++) {
			assertEquals(1, xmlTestUtil.getNodeCount(String.format("//segment[%d]/elements/*", i)));

			final var repetitionCount = xmlTestUtil.getNodeCount(
				String.format("//segment[%d]/elements/area/elements/*", i)
			);
			assertEquals(i == 1 ? 2 : 1, repetitionCount);
			assertEquals(
				2,
				xmlTestUtil.getNodeCount(
					String.format("//segment[%d]/elements/area/elements/area[1]/elements/*", i)
				)
			);

			// check each area repetition
			for (var j = 1; j <= repetitionCount; j++) {
				assertEquals(String.format("Text1 StringField%d", j), xmlTestUtil.getStringContent(String.format(iterationText, i, j)));
				final var nestedRepetitionCount = xmlTestUtil.getNodeCount(String.format(nodeCount, i, j,
					i == 1 ? "mezsmBLnd_UtvrSZ3teJq" : "bym3skzCxcjd6Y3T_2cG6")
				);
				assertEquals(3,  nestedRepetitionCount);

				for (var k = 1; k <= nestedRepetitionCount; k++) {
					assertEquals(
						String.format("Text2 StringField%d-%d", j, k),
						xmlTestUtil.getStringContent(String.format(iterationString, i, j, k))
					);
				}
			}
		}

	}

	@Test
	public void testMigratedRepeatableSegment() {
		final String printModel = PrintTestUtil.loadFromResources("/data/repeatableArea/RepeatableSegmentMigratedPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/repeatableArea/RepeatableSegmentDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/repeatableArea/RepeatableSegmentDM-1.json");

		final var result =
			XmlRuntimeTestUtil.print(printModel, "RepeatableSegmentDM", documentModel, document);

		XmlRuntimeTestUtil.writeResultFiles(result, "migratedRepeatableSegment");

		final var xmlTestUtil = new XPathTestUtil(result.getXmlMarkup());

		assertEquals(1, xmlTestUtil.getNodeCount("//segment"));
		assertEquals(3, xmlTestUtil.getNodeCount("//segment[1]/elements/*"));

		// area tests
		final var rowMap = List.of(
			Pair.of("ROW A.1", 5),
			Pair.of("ROW B.1", 7),
			Pair.of("ROW C.1", 9),
			Pair.of("ROW D.1", 63),
			Pair.of("Summe", 84)
		);

		final var elementsExpression = "//segment[1]/elements/area[%d]/elements/";
		final var bodyRowsExpression = elementsExpression + "table/bodyRows/";

		// check each table + area combination
		for (var j = 1; j < 3; j++) {
			final var areaText = elementsExpression + "area/elements/area[%d]/elements/text[%d]/text";

			final var bodyRowCount = xmlTestUtil.getNodeCount(
				String.format(bodyRowsExpression + "*" ,j)
			);
			assertEquals(5, bodyRowCount);

			for (var i = 1; i <= bodyRowCount; i++) {
				// test table
				final var rowType = xmlTestUtil.getNodeName(
					String.format(bodyRowsExpression + "row[%d]/*[1]", j, i)
				);

				assertTrue(rowType.equals("cell") || rowType.equals("sumCell"));

				final var contentLabel = rowType.equals("cell") ? "expression/text" : "value";
				final var rowContent = rowMap.get(i - 1);

				final var firstCellContent = xmlTestUtil.getStringContent(
					String.format(bodyRowsExpression + "row[%d]/%s[1]/%s", j, i, rowType,
						rowType.equals("cell") ? "expression/text" : "value"
					)
				);
				final var secondCellContent = xmlTestUtil.getNumberContent(
					String.format(bodyRowsExpression + "row[%d]/%s[2]/%s", j, i, rowType,
						rowType.equals("cell") ? "field/value" : "value"
					)
				);

				assertEquals(rowContent.getKey(), firstCellContent);
				assertEquals(rowContent.getValue(), secondCellContent.intValue());

				// test areas
				if (rowType.equals("cell")) {
					assertEquals(firstCellContent, xmlTestUtil.getStringContent(String.format(areaText, j, i, 1)));
					assertEquals(secondCellContent, xmlTestUtil.getNumberContent(String.format(areaText, j, i, 2)));
				}
			}
		}

		// table tests
		final var secondRowMap = List.of(
			Pair.of("ROW A.2", 6),
			Pair.of("ROW B.2", 8),
			Pair.of("ROW C.2", 10),
			Pair.of("ROW D.2", 64),
			Pair.of("Summe", 88)
		);

		final var bodyRowCount = xmlTestUtil.getNodeCount("//segment[1]/elements/table/bodyRows/*");
		assertEquals(5, bodyRowCount);

		for (var i = 1; i <= bodyRowCount; i++) {
			// test table
			final var rowType = xmlTestUtil.getNodeName(
				String.format("//segment[1]/elements/table/bodyRows/row[%d]/*[1]", i)
			);

			assertTrue(rowType.equals("cell") || rowType.equals("sumCell"));

			final var rowContent = secondRowMap.get(i - 1);

			final var firstCellContent = xmlTestUtil.getStringContent(
				String.format("//segment[1]/elements/table/bodyRows/row[%d]/%s[1]/%s", i, rowType,
					rowType.equals("cell") ? "expression/text" : "value"
				)
			);
			final var secondCellContent = xmlTestUtil.getNumberContent(
				String.format("//segment[1]/elements/table/bodyRows/row[%d]/%s[2]/%s", i, rowType,
					rowType.equals("cell") ? "field/value" : "value"
				)
			);

			assertEquals(rowContent.getKey(), firstCellContent);
			assertEquals(rowContent.getValue(), secondCellContent.intValue());
		}
	}

	@Test
	public void testMigratedRepeatableBoundingBox() {
		final String printModel = PrintTestUtil.loadFromResources("/data/repeatableArea/RepeatableBoundingBoxMigratedPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/repeatableArea/RepeatableSegmentDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/repeatableArea/RepeatableSegmentDM-2.json");

		final var result =
			XmlRuntimeTestUtil.print(printModel, "RepeatableSegmentDM", documentModel, document);

		XmlRuntimeTestUtil.writeResultFiles(result, "migratedRepeatableBoundingBox");

		final var xmlTestUtil = new XPathTestUtil(result.getXmlMarkup());

		assertEquals(1, xmlTestUtil.getNodeCount("//segment"));
		assertEquals(1, xmlTestUtil.getNodeCount("//segment[1]/elements/*"));

		final var rowMap = List.of(
			Pair.of("RESULT 1", 5),
			Pair.of("RESULT 2", 7)
		);

		final var baseExpression = "//segment[1]/elements/boundingBox/elements/table/bodyRows";
		final var bodyRowCount = xmlTestUtil.getNodeCount(String.format("%s/*", baseExpression));
		assertEquals(2, bodyRowCount);

		for (var i = 1; i <= bodyRowCount; i++) {
			final var firstCellContent = xmlTestUtil.getStringContent(
				String.format("%s/row[%d]/cell[1]/field/value", baseExpression, i)
			);
			final var secondCellContent = xmlTestUtil.getNumberContent(
				String.format("%s/row[%d]/cell[2]/field/value", baseExpression, i)
			);
			final var rowContent = rowMap.get(i - 1);
			assertEquals(rowContent.getKey(), firstCellContent);
			assertEquals(rowContent.getValue(), secondCellContent.intValue());
		}
	}


	@Test
	public void testMigratedRepeatableListing() {
		final String printModel = PrintTestUtil.loadFromResources("/data/repeatableArea/RepeatableListingMigratedPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/repeatableArea/RepeatableSegmentDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/repeatableArea/RepeatableSegmentDM-1.json");

		final var result =
			XmlRuntimeTestUtil.print(printModel, "RepeatableSegmentDM", documentModel, document);

		XmlRuntimeTestUtil.writeResultFiles(result, "migratedRepeatableListing");

		final var xmlTestUtil = new XPathTestUtil(result.getXmlMarkup());

		assertEquals(1, xmlTestUtil.getNodeCount("//segment"));
		assertEquals(1, xmlTestUtil.getNodeCount("//segment[1]/elements/*"));

		// area tests
		final var rowMap = List.of(
			Pair.of("ROW A.1", 5.0),
			Pair.of("ROW B.1", 7.0),
			Pair.of("ROW C.1", 9.0),
			Pair.of("ROW D.1", 63.0),
			Pair.of("ROW Z.1", 99999.0)
		);

		final var basePath = "//segment[1]/elements/area/elements";
		final var tableBasePath = String.format("%s/table/bodyRows", basePath);
		final var bodyRowCount = xmlTestUtil.getNodeCount(String.format("%s/*", tableBasePath));
		assertEquals(5,bodyRowCount);

		for (var i = 1; i <= bodyRowCount; i++) {
			final var firstCellContent = xmlTestUtil.getStringContent(
				String.format("%s/row[%d]/cell[1]/field/value", tableBasePath, i)
			);
			final var secondCellContent = xmlTestUtil.getNumberContent(
				String.format("%s/row[%d]/cell[2]/field/value", tableBasePath, i)
			);

			final var rowContent = rowMap.get(i - 1);
			assertEquals(rowContent.getKey() , firstCellContent);
			assertEquals(rowContent.getValue(), secondCellContent);

			final var listingBasePath = String.format("%s/area/elements/area[%d]/elements/listing/bodyRows", basePath, i);
			final var repAreaBodyRowCount = xmlTestUtil.getNodeCount(String.format("%s/*", listingBasePath));
			assertEquals(3,repAreaBodyRowCount);

			final var repRowMap = List.of(
				Pair.of("repeatable1", " kleine Katzen"),
				Pair.of("Integer", String.format("%d kleine Katzen", rowContent.getValue().intValue())),
				Pair.of("String Field", String.format("%s kleine Katzen", rowContent.getKey()))
			);
			for (var j = 1; j <= repAreaBodyRowCount; j++) {
				final var cellContentExpression = listingBasePath + "/row[%d]/cell[%d]/value";
				final var firstRepCellContent = xmlTestUtil.getStringContent(String.format(cellContentExpression, j, 1));
				final var secondRepCellContent = xmlTestUtil.getStringContent(String.format(cellContentExpression, j, 2));

				final var repRowContent = repRowMap.get(j - 1);
				assertEquals(repRowContent.getKey(), firstRepCellContent);
				assertEquals(repRowContent.getValue(), secondRepCellContent);
			}
		}
	}
}
