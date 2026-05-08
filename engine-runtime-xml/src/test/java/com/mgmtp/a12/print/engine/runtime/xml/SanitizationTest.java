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

import static org.junit.jupiter.api.Assertions.assertEquals;

public class SanitizationTest {
	@Test
	public void testSanitization() {
		final String printModel = PrintTestUtil.loadFromResources("/data/sanitization/SanitizationPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/sanitization/SanitizationDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/sanitization/SanitizationDM-1.json");

		final var result = XmlRuntimeTestUtil.print(printModel, "SanitizationDM", documentModel, document);

		XmlRuntimeTestUtil.writeResultFiles(result, "sanitization");

		final var xmlTestUtil = new XPathTestUtil(result.getXmlMarkup());

		assertEquals(2, xmlTestUtil.getNodeCount("//segment"));

		// test first segment content
		final var helloWorldContent = "Hello World";
		final var firstTextContent = "//segment[%d]/elements/text[1]/text";
		assertEquals(helloWorldContent, xmlTestUtil.getStringContent(String.format(firstTextContent, 1)));
		final var secondTextContent = "//segment[%d]/elements/text[2]/text";
		assertEquals(helloWorldContent, xmlTestUtil.getStringContent(String.format(secondTextContent, 1)));
		final var thirdTextContent = "//segment[%d]/elements/expression[1]/text";
		assertEquals("Hello Expression", xmlTestUtil.getStringContent(String.format(thirdTextContent, 1)));

		final var firstTableContent = "//segment[%d]/elements/table[1]/bodyRows/row[1]/cell[1]/field/value";
		assertEquals("Hello Table 1", xmlTestUtil.getStringContent(String.format(firstTableContent, 1)));
		final var secondTableContent = "//segment[%d]/elements/table[1]/bodyRows/row[2]/cell[1]/field/value";
		assertEquals("Hello Table 2", xmlTestUtil.getStringContent(String.format(secondTableContent, 1)));

		final var listingTableContent = "//segment[%d]/elements/listing[1]/bodyRows/row[2]/cell/value";
		assertEquals("Hello Listing", xmlTestUtil.getStringContent(String.format(listingTableContent, 1)));

		final var firstLayoutContent = "//segment[%d]/elements/tableLayout[1]/bodyRows/row[1]/cell[1]/text/entities[1]/field[1]/value";
		assertEquals(helloWorldContent, xmlTestUtil.getStringContent(String.format(firstLayoutContent, 1)));
		final var secondLayoutContent = "//segment[%d]/elements/tableLayout[1]/bodyRows/row[1]/cell[2]/text/entities[1]/calculation[1]/value";
		assertEquals(helloWorldContent, xmlTestUtil.getStringContent(String.format(secondLayoutContent, 1)));

		// test second segment content
		final var helloWorldHtmlContent = "<span>Hello <b>World</b></span>";
		assertEquals(helloWorldHtmlContent, xmlTestUtil.getStringContent(String.format(firstTextContent, 2)));
		assertEquals(helloWorldHtmlContent, xmlTestUtil.getStringContent(String.format(secondTextContent, 2)));
		assertEquals(helloWorldHtmlContent, xmlTestUtil.getStringContent(String.format(thirdTextContent, 2)));

		assertEquals("<span>Hello <i>Table</i> 1</span>", xmlTestUtil.getStringContent(String.format(firstTableContent, 2)));
		assertEquals("<span>Hello <i>Table</i> 2</span>", xmlTestUtil.getStringContent(String.format(secondTableContent, 2)));

		assertEquals("<span>Hello <del>Listing</del></span>", xmlTestUtil.getStringContent(String.format(listingTableContent, 2)));

		assertEquals(helloWorldHtmlContent, xmlTestUtil.getStringContent(String.format(firstLayoutContent, 2)));
		assertEquals(helloWorldHtmlContent, xmlTestUtil.getStringContent(String.format(secondLayoutContent, 2)));
	}
}
