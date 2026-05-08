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

public class ElementSortingTest {
	@Test
	public void testScreenReadingOrder() {
		final String printModel = PrintTestUtil.loadFromResources("/data/screenReadingOrderSorting/ScreenReadingOrderPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/screenReadingOrderSorting/ScreenReadingOrderSortingDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/screenReadingOrderSorting/ScreenReadingOrderSortingDM-1.json");

		final var result = XmlRuntimeTestUtil.print(printModel, "ScreenReadingOrderSortingDM", documentModel, document);

		XmlRuntimeTestUtil.writeResultFiles(result, "screenReadingOrder");

		final var xmlTestUtil = new XPathTestUtil(result.getXmlMarkup());

		assertEquals(1, xmlTestUtil.getNodeCount("//segment"));
		assertEquals(3, xmlTestUtil.getNodeCount("//segment/elements/*"));

		assertEquals("firstElement" , xmlTestUtil.getStringContent("//segment/elements/horizontalLine[1]/@id"));
		assertEquals("secondElement" , xmlTestUtil.getStringContent("//segment/elements/horizontalLine[2]/@id"));
		assertEquals("thirdElement" , xmlTestUtil.getStringContent("//segment/elements/horizontalLine[3]/@id"));
	}

	@Test
	public void testPositionSorting() {
		final String printModel = PrintTestUtil.loadFromResources("/data/positionSorting/PositionSortingPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/positionSorting/PositionSortingDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/positionSorting/PositionSortingDM-1.json");

		final var result = XmlRuntimeTestUtil.print(printModel, "PositionSortingDM", documentModel, document);

		XmlRuntimeTestUtil.writeResultFiles(result, "positionSorting");

		final var xmlTestUtil = new XPathTestUtil(result.getXmlMarkup());

		assertEquals(1,  xmlTestUtil.getNodeCount("//segment"));
		assertEquals(4, xmlTestUtil.getNodeCount("//segment/elements/*"));

		assertEquals("longElement1Text", xmlTestUtil.getStringContent("//segment/elements/text[1]/@id"));
		assertEquals("shortElement1Text", xmlTestUtil.getStringContent("//segment/elements/text[2]/@id"));
		assertEquals("shortElement3Text", xmlTestUtil.getStringContent("//segment/elements/text[3]/@id"));
		assertEquals("shortElement2Text", xmlTestUtil.getStringContent("//segment/elements/text[4]/@id"));
	}
}
