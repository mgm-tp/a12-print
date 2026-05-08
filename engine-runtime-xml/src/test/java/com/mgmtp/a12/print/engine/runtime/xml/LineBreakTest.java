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
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class LineBreakTest {
	@Test
	public void testLineBreaks() {
		final String printModel = PrintTestUtil.loadFromResources(
			"/data/lineBreak/LineBreakPM.json"
		);
		final String documentModel = PrintTestUtil.loadFromResources(
			"/data/lineBreak/LineBreakDM.json"
		);
		final String document = PrintTestUtil.loadFromResources(
			"/data/lineBreak/LineBreakDM-1.json"
		);

		final var result = XmlRuntimeTestUtil.print(printModel, "LineBreakDM", documentModel, document);

		XmlRuntimeTestUtil.writeResultFiles(result, "lineBreaks");

		final var xmlTestUtil = new XPathTestUtil(result.getXmlMarkup());

		final var segmentCount = xmlTestUtil.getNodeCount("//segment");

		assertEquals(4, segmentCount);

		final var expectedTextValuesPerSegment = List.of(
			List.of(
				"Field: Hello <del>World!</del>",
				"Field: <strong>HTML CONTENT</strong>",
				"Calculation: Hello <del>World!</del>",
				"Calculation-Concat: <strong>Hello <del>World!</del></strong>",
				"Expression",
				"Hello <del>World!</del>"
			),
			List.of(
				"Field-HTML: Hello World!",
				"Field-HTML: HTML CONTENT",
				"Calculation-HTML: Hello World!",
				"Calculation-HTML-Concat: Hello World!"
			),
			List.of(
				"Field: Lorem <del>ipsum</del>.",
				"Field: <strong>HTML CONTENT</strong>",
				"Calculation: Lorem <del>ipsum</del>.",
				"Calculation-Concat: <strong>Lorem <del>ipsum</del>.</strong>",
				"Expression",
				"Lorem <del>ipsum</del>."
			),
			List.of(
				"Field-HTML: Lorem ipsum.",
				"Field-HTML: HTML CONTENT",
				"Calculation-HTML: Lorem ipsum.",
				"Calculation-HTML-Concat: Lorem ipsum."
			)
		);

		final var expectedTableValuePerSegment = List.of(
			"Hello <del>World!</del>",
			"Hello World!",
			"Lorem \n\n <del>ipsum</del>.",
			"Lorem ipsum."
		);

		for (var i = 1; i <= segmentCount; i++) {
			// text based elements
			final var expectedValues = expectedTextValuesPerSegment.get(i - 1);
			final var textBasedElementsCount = xmlTestUtil.getNodeCount(
				String.format("//segment[%d]/elements/*[@valueIsRenderedAsHtml]", i)
			);
			assertEquals(expectedValues.size(), textBasedElementsCount);

			for (var j = 1; j <= textBasedElementsCount; j++) {
				assertEquals(
					expectedValues.get(j - 1),
					xmlTestUtil.getStringContent(
						String.format("//segment[%d]/elements/*[@valueIsRenderedAsHtml][%d]/text", i, j)
					)
				);
			}

			// table based elements
			final var expectedTableValue = expectedTableValuePerSegment.get(i - 1);

			final var valueIsRenderedAsHtml = xmlTestUtil.getBooleanContent(
				String.format("//segment[%d]/elements/table/bodyRows/row/cell/field/@valueIsRenderedAsHtml", i));

			final var contentNodeName = valueIsRenderedAsHtml ? "text" : "value";
			assertEquals(
				expectedTableValue,
				xmlTestUtil.getStringContent(
					String.format("//segment[%d]/elements/table/bodyRows/row/cell/field/%s", i, contentNodeName)
				)
			);
		}
	}
}
