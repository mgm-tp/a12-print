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

import com.mgmtp.a12.print.engine.api.a12.AttachmentDependencyDescriptor;
import com.mgmtp.a12.print.engine.runtime.AttachmentProvider;
import com.mgmtp.a12.print.engine.runtime.internal.engine.constant.Constants;
import com.mgmtp.a12.print.engine.runtime.test.internal.PrintTestUtil;
import com.mgmtp.a12.print.engine.runtime.xml.utils.XPathTestUtil;
import com.mgmtp.a12.print.engine.runtime.xml.utils.XmlRuntimeTestUtil;
import org.apache.commons.lang3.tuple.Pair;
import org.junit.jupiter.api.Test;
import org.junit.platform.commons.util.StringUtils;

import java.io.ByteArrayInputStream;
import java.util.Arrays;
import java.util.List;
import java.util.TimeZone;

import static org.junit.jupiter.api.Assertions.*;


public class PdfGenerationTest {

	@Test
	public void testFieldElement() {
		final String printModel = PrintTestUtil.loadFromResources("/data/field/FieldPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/field/FieldDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/field/FieldDM-1.json");

		final var result =
			XmlRuntimeTestUtil.print(printModel, "FieldDM", TimeZone.getTimeZone("MST"), documentModel, document);
		assertNotNull(result);

		XmlRuntimeTestUtil.writeResultFiles(result, "field");

		testTextBasedXml(
			result.getXmlMarkup(),
			List.of(List.of(
				"Hello World!", "Lorem Ipsum...", "\u2611", "\u2610", "\u2618", "14 03 2023-29 03 2023"
			))
		);
	}

	@Test
	public void testCalculationElement() {
		final String printModel = PrintTestUtil.loadFromResources("/data/computation/CalculationPM" +
			".json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/computation/CalculationDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/computation/CalculationDM-1.json");

		final var result =
			XmlRuntimeTestUtil.print(printModel, "CalculationDM", documentModel, document);
		assertNotNull(result);

		XmlRuntimeTestUtil.writeResultFiles(result, "calculation");

		testTextBasedXml(
			result.getXmlMarkup(),
			List.of(List.of(
				"Hello World!", "2023_12_01to2024/01/31", "18%", "2019-02-06"
			))
		);
	}

	private void testTextBasedXml(
		String xmlMarkup,
		List<List<String>> expectedValueList
	) {
		testTextBasedXml(xmlMarkup, "text", expectedValueList);
	}

	private void testTextBasedXml(
		String xmlMarkup,
		String elementKey,
		List<List<String>> expectedValueList
	) {
		final var xmlTestUtil = new XPathTestUtil(xmlMarkup);

		assertEquals(expectedValueList.size(), xmlTestUtil.getNodeCount("//segment"));

		for (var j = 1; j <= expectedValueList.size(); j++) {
			final var expectedValuesForSegment = expectedValueList.get(j - 1);
			final var elementCount = xmlTestUtil.getNodeCount(
				String.format("//segment[%d]/elements/*", j));
			assertEquals(expectedValuesForSegment.size(), elementCount);

			for(var i = 1; i <= elementCount; i++) {
				final var value = xmlTestUtil.getStringContent(String.format(
					"//segment[%d]/elements/%s[%d]/text", j, elementKey, i
				));
				final var expectedValue = expectedValuesForSegment.get(i -1);

				assertEquals(expectedValue, value);

				if (StringUtils.isBlank(expectedValue)) {
					final var entityType = xmlTestUtil.getStringContent(String.format(
						"//segment[%d]/elements/%s[%d]/entities/*[1]/@type", j, elementKey, i
					));
					assertTrue(entityType.equals("PAGE_NUMBER") || entityType.equals("PAGE_NUMBER_TOTAL"));
				}
			}
		}
	}

	@Test
	public void testTextElement() {
		final String printModel = PrintTestUtil.loadFromResources("/data/text/TextPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/text/TextDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/text/TextDM-1.json");

		final var result =
			XmlRuntimeTestUtil.print(printModel, "TextDM", documentModel, document);
		assertNotNull(result);

		XmlRuntimeTestUtil.writeResultFiles(result, "text");

		testTextBasedXml(
			result.getXmlMarkup(),
			List.of(
				List.of("TEST", "Test TextFlow: Test String Test String Farbe Hintergrund Gr\u00f6\u00dfe", "Create new page for total page number"),
				List.of("Create new page for total page number")
			)
		);
	}

	@Test
	public void testTextElementWithoutDomainModel() {
		final String printModel = PrintTestUtil.loadFromResources("/data/text/TextWithoutDomainModelPM.json");

		final var result =
			XmlRuntimeTestUtil.print(printModel, Constants.NO_SELECTED_DOCUMENT_ID, null, null);
		assertNotNull(result);

		XmlRuntimeTestUtil.writeResultFiles(result, "without-domain-model");

		testTextBasedXml(result.getXmlMarkup(), List.of(List.of("TEST")));

	}

	@Test
	public void testHorizontalLineElement() {
		final String printModel = PrintTestUtil.loadFromResources("/data/horizontalLine/LinePM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/horizontalLine/LineDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/horizontalLine/LineDM-1.json");

		final var result =
			XmlRuntimeTestUtil.print(printModel, "LineDM", documentModel, document);
		assertNotNull(result);

		XmlRuntimeTestUtil.writeResultFiles(result, "horizontalLine");

		final var xmlTestUtil = new XPathTestUtil(result.getXmlMarkup());

		assertEquals(1, xmlTestUtil.getNodeCount("//segment"));
		assertEquals(1, xmlTestUtil.getNodeCount("//segment/elements/*"));
		assertEquals("HORIZONTAL_LINE", xmlTestUtil.getStringContent("//segment/elements/*[1]/@type"));
	}

	@Test
	public void testImageElement() {
		final String printModel = PrintTestUtil.loadFromResources("/data/image/ImagePM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/image/ImageDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/image/ImageDM-1.json");

		final var result =
			XmlRuntimeTestUtil.print(
				printModel,
				"ImageDM",
				documentModel,
				document,
				new AttachmentProvider() {
					@Override
					public boolean supports(AttachmentDependencyDescriptor attachmentDependencyDescriptor) {
						return attachmentDependencyDescriptor.getAttachmentId().equals("REFERENCED_IMAGE");
					}

					@Override
					public ByteArrayInputStream loadAttachment(AttachmentDependencyDescriptor descriptor) {
						return PrintTestUtil.loadStreamFromResources("/data/image/REFERENCED_IMAGE.jpg");
					}
				}
			);
		assertNotNull(result);

		XmlRuntimeTestUtil.writeResultFiles(result, "image");

		final var xmlTestUtil = new XPathTestUtil(result.getXmlMarkup());


		assertEquals(3, xmlTestUtil.getNodeCount("//segment"));

		final var elementCount = xmlTestUtil.getNodeCount("//segment[1]/elements/*");

		assertEquals(4, elementCount);

		for (var i = 1; i <= elementCount; i++) {
			final var nodeName = xmlTestUtil.getNodeName(String.format("//segment[1]/elements/*[%d]", i));
			assertEquals("image", nodeName);
			assertEquals(
				String.format("Alternative Text %d", i),
				xmlTestUtil.getStringContent(
					String.format("//segment[1]/elements/%s[%d]/alternativeText", nodeName, i)
				)
			);
		}
	}

	@Test
	public void testExpressionElement() {
		final String printModel = PrintTestUtil.loadFromResources("/data/expression/ExpressionPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/expression/ExpressionDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/expression/ExpressionDM-1.json");

		final var result =
			XmlRuntimeTestUtil.print(printModel, "ExpressionDM", documentModel, document);
		assertNotNull(result);

		XmlRuntimeTestUtil.writeResultFiles(result, "expression");

		testTextBasedXml(result.getXmlMarkup(), "expression", List.of(List.of("Hello World! Lorem Ipsum... Case Operator Success")));
	}

	@Test
	public void testTableElement() {
		final String printModel = PrintTestUtil.loadFromResources("/data/table/TablePM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/table/TableDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/table/TableDM-1.json");

		final var result =
			XmlRuntimeTestUtil.print(printModel, "TableDM", documentModel, document);
		assertNotNull(result);

		XmlRuntimeTestUtil.writeResultFiles(result, "table");

		testTableBasedXml(
			result.getXmlMarkup(),
			"table",
			List.of(
				List.of(
					List.of("ROW A", "5"),
					List.of("ROW B", "7"),
					List.of("ROW C", "9"),
					List.of("ROW D", "63,23"),
					List.of("Summe1", "84,23")
				),
				List.of(
					List.of("ROW A", "5"),
					List.of("Summe2", "5")
				),
				List.of(
					List.of("ROW B", "7"),
					List.of("Summe3", "7")
				),
				List.of(
					List.of("ROW A", "5", "true"),
					List.of("ROW C", "9", "true"),
					List.of("ROW D", "63,23", "true"),
					List.of("Summe4", "77,23", "")
				),
				List.of(
					List.of("ROW C", "9", "Nested C")
				)
			)
		);
	}

	private void testTableBasedXml(
		String xmlContent,
		String elementKey,
		List<List<List<String>>> expectedRowsPerSegment
	) {
		// XML tests
		final var xmlTestUtil = new XPathTestUtil(xmlContent);
		final var segmentCount = xmlTestUtil.getNodeCount("//segment");

		assertEquals(expectedRowsPerSegment.size(), segmentCount);

		for (var i = 1; i <= segmentCount; i++) {
			final var baseTablePath = String.format(
				"//segment[%d]/elements/%s", i, elementKey
			);
			final var expectedRows = expectedRowsPerSegment.get(i - 1);
			for (var j = 1; j <= expectedRows.size(); j++) {
				final var expectedRow = expectedRows.get(j - 1);

				for(var k = 1; k <= expectedRow.size(); k++) {
					final var expectedContent = expectedRow.get(k - 1);
					final var nodeName = xmlTestUtil.getNodeName(String.format("%s/bodyRows/row[%d]/*[%d]", baseTablePath, j, k));

					if (expectedContent != null) {
						final var valueIsRenderedAsHtml = !nodeName.equals("sumCell") && xmlTestUtil.getBooleanContent(
							String.format("%s/bodyRows/row[%d]/%s[%d]/*[1]/@valueIsRenderedAsHtml", baseTablePath, j, nodeName, k)
						);

						if (j == expectedRows.size() && i != segmentCount) {
							assertEquals("sumCell", nodeName);
						} else {
							assertEquals("cell", nodeName);
						}

						final var contentNodeName = nodeName.equals("sumCell")
							? "value"
							: valueIsRenderedAsHtml ? "*[1]/text" : "*[1]/value";
						var content = xmlTestUtil.getStringContent(
							String.format("%s/bodyRows/row[%d]/%s[%d]/%s", baseTablePath, j, nodeName, k, contentNodeName)
						);

						assertEquals(expectedContent, content);
					} else {
						assertEquals(0, xmlTestUtil.getNodeCount(String.format("%s/bodyRows/row[%d]/*[%d]/*", baseTablePath, j, k)));
					}
				}
			}
		}
	}

	@Test
	public void testTableLayoutElement() {
		final String printModel = PrintTestUtil.loadFromResources(
			"/data/tableLayout/TableLayoutPM.json");
		final String documentModel = PrintTestUtil.loadFromResources(
			"/data/tableLayout/TableLayoutDM.json"
		);
		final String document = PrintTestUtil.loadFromResources(
			"/data/tableLayout/TableLayoutDM-1.json"
		);

		final var result =
			XmlRuntimeTestUtil.print(printModel, "TableLayoutDM", documentModel, document);
		assertNotNull(result);

		XmlRuntimeTestUtil.writeResultFiles(result, "tableLayout");

		testTableBasedXml(
			result.getXmlMarkup(),
			"tableLayout",
			List.of(
				List.of(
					Arrays.asList("Test1", "Test2"),
					Arrays.asList("Test TextFlow: Test1 Test3 Farbe Hintergrund Gr\u00f6\u00dfe", null)
				)
			)
		);
	}

	@Test
	public void testChartElement() {
		final String printModel = PrintTestUtil.loadFromResources("/data/chart/ChartPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/chart/ChartDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/chart/ChartDM-1.json");

		final var result =
			XmlRuntimeTestUtil.print(printModel, "ChartDM", documentModel, document);
		assertNotNull(result);

		XmlRuntimeTestUtil.writeResultFiles(result, "chart");

		final var xmlTestUtil = new XPathTestUtil(result.getXmlMarkup());

		assertEquals(1, xmlTestUtil.getNodeCount("//segment"));

		final var elementCount = xmlTestUtil.getNodeCount("//segment/elements/*");

		assertEquals(3, elementCount);

		final var expectedAlternativeTexts = List.of(
			Pair.of("pieChart", "PIE_CHART: PIE_CHART"),
			Pair.of("barChart", "BAR_CHART"),
			Pair.of("lineChart", "LINE_CHART")
		);

		for (var i = 1; i <= elementCount; i++) {
			final var nodeName = xmlTestUtil.getNodeName(String.format("//segment/elements/*[%d]", i));
			final var expectedValues = expectedAlternativeTexts.get(i - 1);
			assertEquals(expectedValues.getKey(), nodeName);
			assertEquals(
				expectedValues.getValue(),
				xmlTestUtil.getStringContent(
					String.format("//segment/elements/%s[1]/alternativeText", nodeName)
				)
			);
		}
	}

	@Test
	public void testBoundingBoxElement() {
		final String printModel = PrintTestUtil.loadFromResources("/data/boundingBox/BoundingBoxPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/boundingBox/BoundingBoxDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/boundingBox/BoundingBoxDM-1.json");

		final var result = XmlRuntimeTestUtil.print(
			printModel,
			"BoundingBoxDM",
			documentModel,
			document
		);
		assertNotNull(result);

		XmlRuntimeTestUtil.writeResultFiles(result, "boundingBox");

		final var xmlTestUtil = new XPathTestUtil(result.getXmlMarkup());



		assertEquals(1, xmlTestUtil.getNodeCount("//segment"));

		final var elementCount = xmlTestUtil.getNodeCount("//segment/elements/*");

		assertEquals(3, elementCount);

		assertEquals(
			"Text0 Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat",
			xmlTestUtil.getStringContent("//segment/elements/text/text")
		);

		assertEquals(2, xmlTestUtil.getNodeCount("//segment/elements/boundingBox[1]/elements/*"));

		assertEquals(1, xmlTestUtil.getNodeCount("//segment/elements/boundingBox[1]/elements/boundingBox/elements/*"));
		assertEquals(
			"Text2 Hello World!",
			xmlTestUtil.getStringContent("//segment/elements/boundingBox[1]/elements/boundingBox/elements/text/text")
		);
		assertEquals(
			"Text1 Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat",
			xmlTestUtil.getStringContent("//segment/elements/boundingBox[1]/elements/text/text")
		);

		assertEquals(
			"OVERLAPPED TEXT",
			xmlTestUtil.getStringContent("//segment/elements/boundingBox[2]/elements/text/text")
		);
	}

	@Test
	public void testAreaElement() {
		final String printModel = PrintTestUtil.loadFromResources("/data/area/AreaPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/area/AreaDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/area/AreaDM-1.json");

		final var result = XmlRuntimeTestUtil.print(
			printModel,
			"AreaDM",
			documentModel,
			document
		);
		assertNotNull(result);

		XmlRuntimeTestUtil.writeResultFiles(result, "area");

		final var xmlTestUtil = new XPathTestUtil(result.getXmlMarkup());

		assertEquals(1, xmlTestUtil.getNodeCount("//segment"));

		testSectionXml(xmlTestUtil, "headerSections", "Header");
		testSectionXml(xmlTestUtil, "footerSections", "Footer");

		assertEquals(5, xmlTestUtil.getNodeCount("//segment/elements/*"));

		// test lines
		assertEquals("HORIZONTAL_LINE", xmlTestUtil.getStringContent("//segment/elements/*[1]/@type"));
		assertEquals("HORIZONTAL_LINE", xmlTestUtil.getStringContent("//segment/elements/*[3]/@type"));

		// test first area
		assertEquals(2, xmlTestUtil.getNodeCount("//segment/elements/area[1]/elements/*"));
		assertEquals(
			"Text1 Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy " +
			"eirmod tempor invidunt ut labore et dolore magna aliquyam erat. Lorem ipsum dolor sit " +
			"amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et " +
			"dolore magna aliquyam erat.",
			xmlTestUtil.getStringContent("//segment/elements/area[1]/elements/text/text")
		);
		assertEquals(1, xmlTestUtil.getNodeCount("//segment/elements/area[1]/elements/area/elements/*"));
		assertEquals(
			"Text2 Hello World!",
			xmlTestUtil.getStringContent("//segment/elements/area[1]/elements/area/elements/text/text")
		);

		// test second area
		assertEquals(4, xmlTestUtil.getNodeCount("//segment/elements/area[2]/elements/*"));
		assertEquals("Readable Text", xmlTestUtil.getStringContent("//segment/elements/area[2]/elements/text[1]/text"));
		assertEquals("Multi Line Text", xmlTestUtil.getStringContent("//segment/elements/area[2]/elements/text[2]/text"));
		assertEquals("Moved up across section", xmlTestUtil.getStringContent("//segment/elements/area[2]/elements/text[3]/text"));
		assertEquals("Next Page Text", xmlTestUtil.getStringContent("//segment/elements/area[2]/elements/text[4]/text"));

		// test third area
		assertEquals(2, xmlTestUtil.getNodeCount("//segment/elements/area[3]/elements/*"));
		assertEquals(
			"Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod " +
			"tempor invidunt ut labore et dolore magna aliquyam erat. Lorem ipsum dolor sit amet, " +
			"consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore " +
			"magna aliquyam erat.",
			xmlTestUtil.getStringContent("//segment/elements/area[3]/elements/text/text")
		);
		assertEquals(1, xmlTestUtil.getNodeCount("//segment/elements/area[3]/elements/area/elements/*"));
		assertEquals("Last Nested Element", xmlTestUtil.getStringContent("//segment/elements/area[3]/elements/area/elements/text/text"));
	}

	@Test
	public void testSwitchElement() {
		final String printModel = PrintTestUtil.loadFromResources("/data/switch/SwitchPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/switch/SwitchDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/switch/SwitchDM-1.json");

		final var result = XmlRuntimeTestUtil.print(
			printModel,
			"SwitchDM",
			documentModel,
			document
		);
		assertNotNull(result);

		XmlRuntimeTestUtil.writeResultFiles(result, "switch");

		final var xmlTestUtil = new XPathTestUtil(result.getXmlMarkup());

		assertEquals(2, xmlTestUtil.getNodeCount("//segment"));

		assertEquals(8, xmlTestUtil.getNodeCount("//segment[@id='55rQUxFp0rEeM8Dvvycep']/elements/*"));

		// Switch does not contain Hide conditions and Switch Case Precondition is False
		assertNull(xmlTestUtil.getNode("//segment[@id='55rQUxFp0rEeM8Dvvycep']/elements/switch[@id='FIRST_SWITCH']"));
		assertNull(xmlTestUtil.getNode("//segment[@id='55rQUxFp0rEeM8Dvvycep']/elements/switch[@id='FIRST_SWITCH']/elements/*"));

		// Switch does not contain Hide conditions and Switch Case Precondition is True
		assertEquals(1, xmlTestUtil.getNodeCount("//segment[@id='55rQUxFp0rEeM8Dvvycep']/elements/switch[@id='SECOND_SWITCH']/elements/*"));
		assertEquals("Two", xmlTestUtil.getStringContent("//segment[@id='55rQUxFp0rEeM8Dvvycep']/elements/switch[@id='SECOND_SWITCH']/elements/area[@id='SECOND_AREA']/elements/text[@id='SECOND_AREA_TEXT']/text"));

		// Switch contains Hide conditions True and Switch Case Precondition is True
		assertNull(xmlTestUtil.getNode("//segment[@id='55rQUxFp0rEeM8Dvvycep']/elements/switch[@id='THIRD_SWITCH']"));

		// Switch contains Hide conditions False and Switch Case Precondition is True
		assertEquals(2, xmlTestUtil.getNodeCount("//segment[@id='55rQUxFp0rEeM8Dvvycep']/elements/switch[@id='FOURTH_SWITCH']/elements/area"));
		assertEquals("First Four", xmlTestUtil.getStringContent("//segment[@id='55rQUxFp0rEeM8Dvvycep']/elements/switch[@id='FOURTH_SWITCH']/elements/area[@id='FIRST_FOURTH_AREA']/elements/text[@id='FIRST_FOURTH_AREA_TEXT']/text"));
		assertEquals("Second Four", xmlTestUtil.getStringContent("//segment[@id='55rQUxFp0rEeM8Dvvycep']/elements/switch[@id='FOURTH_SWITCH']/elements/area[@id='SECOND_FOURTH_AREA']/elements/text[@id='SECOND_FOURTH_AREA_TEXT']/text"));

		// Switch contains Hide conditions True and Switch Case Precondition is False
		assertNull(xmlTestUtil.getNode("//segment[@id='55rQUxFp0rEeM8Dvvycep']/elements/switch[@id='FIFTH_SWITCH']"));

		// Switch contains Hide conditions False and Switch Case Precondition is False
		assertNull(xmlTestUtil.getNode("//segment[@id='55rQUxFp0rEeM8Dvvycep']/elements/switch[@id='SIXTH_SWITCH']"));
		assertNull(xmlTestUtil.getNode("//segment[@id='55rQUxFp0rEeM8Dvvycep']/elements/switch[@id='SIXTH_SWITCH']/elements/*"));

		assertEquals(3, xmlTestUtil.getNodeCount("//segment[@id='7JwoMe4aUfnaZEBDdQDTh']/elements/*"));

		assertEquals(1, xmlTestUtil.getNodeCount("//segment[@id='7JwoMe4aUfnaZEBDdQDTh']/elements/switch[@id='SWITCH_1']/elements/area/elements/text"));
		assertEquals("String Field 1", xmlTestUtil.getStringContent("//segment[@id='7JwoMe4aUfnaZEBDdQDTh']/elements/switch[@id='SWITCH_1']/elements/area[@id='SWITCH_1_CASE']/elements/text/entities/field/value"));
		assertEquals("500", xmlTestUtil.getStringContent("//segment[@id='7JwoMe4aUfnaZEBDdQDTh']/elements/switch[@id='SWITCH_1']/elements/area[@id='SWITCH_1_CASE']/elements/text/entities/calculation/value"));

		assertEquals(2, xmlTestUtil.getNodeCount("//segment[@id='7JwoMe4aUfnaZEBDdQDTh']/elements/switch[@id='SWITCH_2']/elements/area/elements/area/elements/area"));
		assertEquals("StringField1", xmlTestUtil.getStringContent("//segment[@id='7JwoMe4aUfnaZEBDdQDTh']/elements/switch[@id='SWITCH_2']/elements/area/elements/area/elements/area[1]/elements/text/entities/field/value"));
		assertEquals("StringField2", xmlTestUtil.getStringContent("//segment[@id='7JwoMe4aUfnaZEBDdQDTh']/elements/switch[@id='SWITCH_2']/elements/area/elements/area/elements/area[2]/elements/text/entities/field/value"));

		assertEquals(1, xmlTestUtil.getNodeCount("//segment[@id='7JwoMe4aUfnaZEBDdQDTh']/elements/switch[@id='SWITCH_3']/elements/area/elements/switch/elements/area"));
		assertEquals("String Field 2", xmlTestUtil.getStringContent("//segment[@id='7JwoMe4aUfnaZEBDdQDTh']/elements/switch[@id='SWITCH_3']/elements/area/elements/switch/elements/area/elements/boundingBox/elements/text/entities/field/value"));
	}

	private void testSectionXml(
		XPathTestUtil xmlTestUtil,
		String sectionsKey,
		String expectedContent
	) {
		final var sectionCount = xmlTestUtil.getNodeCount(
			String.format("//segment/%s/*", sectionsKey)
		);
		assertEquals(2, sectionCount);

		for (var i = 1; i <= sectionCount; i++) {
			assertEquals(
				String.format("%s %d %s %d", expectedContent, i, expectedContent, i),
				xmlTestUtil.getStringContent(
					String.format("//segment/%s/section[%d]/elements/text/text", sectionsKey, i)
				)
			);
		}
	}

	@Test
	public void testListingElement() {
		final String printModel = PrintTestUtil.loadFromResources("/data/listing/ListingPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/listing/ListingDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/listing/ListingDM-1.json");

		final var result = XmlRuntimeTestUtil.print(
			printModel,
			"ListingDM",
			documentModel,
			document,
			new AttachmentProvider() {
				@Override
				public boolean supports(AttachmentDependencyDescriptor attachmentDependencyDescriptor) {
					return attachmentDependencyDescriptor.getAttachmentId().equals("REFERENCED_ATTACHMENT");
				}

				@Override
				public ByteArrayInputStream loadAttachment(AttachmentDependencyDescriptor descriptor) {
					return PrintTestUtil.loadStreamFromResources("/data/listing/REFERENCED_ATTACHMENT.pdf");
				}
			}
		);
		assertNotNull(result);

		XmlRuntimeTestUtil.writeResultFiles(result, "listing");

		final var xmlTestUtil = new XPathTestUtil(result.getXmlMarkup());

		assertEquals(1, xmlTestUtil.getNodeCount("//segment"));
		assertEquals(1, xmlTestUtil.getNodeCount("//segment/elements/*"));

		final var rowCount = xmlTestUtil.getNodeCount("//segment/elements/listing/bodyRows/*");

		assertEquals(46, rowCount);

		final var expectedRows = List.of(
			Arrays.asList(null, "/general/", null, null, null),
			Arrays.asList(null, "Name", "Mustermann", " --- ", " --- "),
			Arrays.asList(null, "Anrede", "Herr", " --- ", "Annotation foo : Value1; value : mister"),
			Arrays.asList(null, "Geburtsdatum", "2023-06-14", " --- ", " --- "),
			Arrays.asList(null, "Geburtszeit", "02:00:00", " --- ", " --- "),
			Arrays.asList(null, "Nummer 1", "50", " --- ", " --- "),
			Arrays.asList(null, "Nummer 2", "15", " --- ", " --- "),
			Arrays.asList(null, "test", "15.2636", " --- ", " --- "),
			Arrays.asList(null, "/general/phone/", null, null, null),
			Arrays.asList(null, "Telefonnummer", "0123456789", " --- ", " --- "),
			Arrays.asList(null, "Bereich", "Private", " --- ", "Annotation bar: Value2; name : Mustermann"),
			Arrays.asList(null, "/general/phone/attachment/", null, null, null),
			Arrays.asList(null, "/general/phone/", null, null, null),
			Arrays.asList(null, "Telefonnummer", "00987654321", " --- ", " --- "),
			Arrays.asList(null, "Betrag", "40,00", "\u2611", " --- "),
			Arrays.asList(null, "Bereich", "Mobile", " --- ", "Annotation bar: Value2; name : Mustermann"),
			Arrays.asList(null, "/general/phone/attachment/", null, null, null),
			Arrays.asList(null, "", "dinTemplate.pdf", " --- ", " --- "),
			Arrays.asList(null, "", "dinTemplate.pdf", " --- ", " --- "),
			Arrays.asList(null, "", "Link", " --- ", " --- "),
			Arrays.asList(null, "", "26737", " --- ", " --- "),
			Arrays.asList(null, "", "application/pdf", " --- ", " --- "),
			Arrays.asList(null, "", "PDF LINK", " --- ", " --- "),
			Arrays.asList(null, "/general/phone/", null, null, null),
			Arrays.asList(null, "Telefonnummer", "1122789654", " --- ", " --- "),
			Arrays.asList(null, "Betrag", "30,00", "\u2610", " --- "),
			Arrays.asList(null, "Bereich", "Work", " --- ", "Annotation bar: Value2; name : Mustermann"),
			Arrays.asList(null, "/general/phone/attachment/", null, null, null),
			Arrays.asList(null, "", "Screenshot.png", " --- ", " --- "),
			Arrays.asList(null, "", "Screenshot.png", " --- ", " --- "),
			Arrays.asList(null, "", "Link", " --- ", " --- "),
			Arrays.asList(null, "", "REFERENCED_ATTACHMENT", " --- ", " --- "),
			Arrays.asList(null, "", "22800", " --- ", " --- "),
			Arrays.asList(null, "", "image/png", " --- ", " --- "),
			Arrays.asList(null, "", "IMAGE LINK", " --- ", " --- "),
			Arrays.asList(null, "/general/phone/", null, null, null),
			Arrays.asList(null, "Telefonnummer", "8348345895", " --- ", " --- "),
			Arrays.asList(null, "Betrag", "80,00", "\u2611", " --- "),
			Arrays.asList(null, "Bereich", "Private", " --- ", "Annotation bar: Value2; name : Mustermann"),
			Arrays.asList(null, "/general/phone/attachment/", null, null, null),
			Arrays.asList(null, "", "referenceAttachment.pdf", " --- ", " --- "),
			Arrays.asList(null, "", "referenceAttachment.pdf", " --- ", " --- "),
			Arrays.asList(null, "", "Link", " --- ", " --- "),
			Arrays.asList(null, "", "13264", " --- ", " --- "),
			Arrays.asList(null, "", "application/pdf", " --- ", " --- "),
			Arrays.asList(null, "", "REFERENCE LINK", " --- ", " --- ")
		);

		for (var i = 1; i <= rowCount; i++) {
			final var expectedRow = expectedRows.get(i -1);

			for (var j = 1; j <= expectedRow.size(); j++) {
				final var expectedValue = expectedRow.get(j - 1);

				if (expectedValue == null) {
					assertEquals(0, xmlTestUtil.getNodeCount(String.format("//segment/elements/listing/bodyRows/row[%d]/cell[%d]/*", i, j)));
				} else {
					final var valueIsRenderedAsHtml = xmlTestUtil.getBooleanContent(
						String.format("//segment/elements/listing/bodyRows/row[%d]/*[%d]/@valueIsRenderedAsHtml", i, j));

					final var contentNodeName = valueIsRenderedAsHtml ? "text" : "value";
					var content = xmlTestUtil.getStringContent(
						String.format("//segment/elements/listing/bodyRows/row[%d]/*[%d]/%s", i, j, contentNodeName)
					);
					assertEquals(expectedValue, content);
				}
			}
		}

		// test attachments
		assertEquals(3, xmlTestUtil.getNodeCount("//attachments/*"));
		assertEquals("PDF", xmlTestUtil.getStringContent("//attachments/pdfAttachment[1]/@type"));
		assertEquals("PDF", xmlTestUtil.getStringContent("//attachments/pdfAttachment[2]/@type"));
		assertEquals("IMAGE", xmlTestUtil.getStringContent("//attachments/imageAttachment[1]/@type"));
	}

}
