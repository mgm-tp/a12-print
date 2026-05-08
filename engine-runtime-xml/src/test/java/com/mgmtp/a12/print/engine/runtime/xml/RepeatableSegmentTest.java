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

public class RepeatableSegmentTest {
	@Test
	public void testRepeatableSegment() {
		final String printModel = PrintTestUtil.loadFromResources("/data/repeatableArea/RepeatableSegmentPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/repeatableArea/RepeatableSegmentDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/repeatableArea/RepeatableSegmentDM-1.json");

		final var result =
			XmlRuntimeTestUtil.print(printModel, "RepeatableSegmentDM", documentModel, document);

		XmlRuntimeTestUtil.writeResultFiles(result, "repeatableSegment");

		final var xmlTestUtil = new XPathTestUtil(result.getXmlMarkup());

		final var segmentCount = xmlTestUtil.getNodeCount("//segment");
		assertEquals(7, segmentCount);

		final var expectedResults = List.of(
			Pair.of("A.1", "5"),
			Pair.of("B.1", "7"),
			Pair.of("C.1", "9"),
			Pair.of("D.1", "63"),
			Pair.of("Z.1", "99.999")
		);

		for (var i = 0; i < segmentCount; i++) {
			if (i == 0 || i == segmentCount - 1) {
				final var baseTablePath = String.format("//segment[%d]/elements/table", i + 1);
				for (var j = 0; j < expectedResults.size(); j++) {
					final var expectedResult = expectedResults.get(j);
					var content = xmlTestUtil.getStringContent(
						String.format("%s/bodyRows/row[%d]/cell[1]/field/value", baseTablePath, j + 1)
					);
					assertTrue(
						i == 0
							? content.contains(expectedResult.getKey())
							: content.equals(expectedResult.getValue())
					);
				}
			} else {
				final var expectedResult = expectedResults.get(i - 1);
				final var firstTextContent = xmlTestUtil.getStringContent(
					String.format("//segment[%d]/elements/text[%d]/text", i + 1, 1)
				);
				assertTrue(firstTextContent.contains(expectedResult.getKey()));
				final var secondTextContent = xmlTestUtil.getStringContent(
					String.format("//segment[%d]/elements/text[%d]/text", i + 1, 2)
				);
				assertEquals(expectedResult.getValue(), secondTextContent);
			}
		}
	}

	@Test
	public void testRepeatableSegmentWithSections() {
		final String printModel = PrintTestUtil.loadFromResources("/data/repeatableArea/RepeatableSegmentWithSectionsPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/repeatableArea/RepeatableSegmentDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/repeatableArea/RepeatableSegmentDM-1.json");

		final var result =
			XmlRuntimeTestUtil.print(printModel, "RepeatableSegmentDM", documentModel, document);

		XmlRuntimeTestUtil.writeResultFiles(result, "repeatableSegmentWithSections");

		final var xmlTestUtil = new XPathTestUtil(result.getXmlMarkup());

		final var segmentCount = xmlTestUtil.getNodeCount("//segment");

		assertEquals(5, segmentCount);

		for (var i = 0; i < segmentCount; i++) {
			final var headerSectionCount = xmlTestUtil.getNodeCount(String.format(
				"//segment[%d]/headerSections/section", i + 1
			));
			if (i == 0) {
				assertEquals(2, headerSectionCount);
				assertEquals(
					"FirstPageSection",
					xmlTestUtil.getStringContent(
						String.format(
							"//segment[%d]/headerSections/section[1]/elements[1]/text/text",
							i + 1
						)
					)
				);
				assertEquals(
					"SecondPageSection",
					xmlTestUtil.getStringContent(
						String.format(
							"//segment[%d]/headerSections/section[2]/elements[1]/text/text",
							i + 1
						)
					)
				);
			} else {
				assertEquals(1, headerSectionCount);
				assertEquals(
					"SecondPageSection" ,
					xmlTestUtil.getStringContent(
						String.format(
							"//segment[%d]/headerSections/section[1]/elements[1]/text/text",
							i + 1
						)
					)
				);
			}
		}
	}
}
