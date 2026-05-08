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

public class SectionsTest {
	@Test
	public void testSections() {
		final String printModel = PrintTestUtil.loadFromResources("/data/section/SectionPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/section/SectionDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/section/SectionDM-1.json");

		final var result  =
			XmlRuntimeTestUtil.print(printModel, "SectionDM", documentModel, document);

		XmlRuntimeTestUtil.writeResultFiles(result, "sections");

		final var xmlTestUtil = new XPathTestUtil(result.getXmlMarkup());

		assertEquals(1, xmlTestUtil.getNodeCount("//segment"));

		final var headerSectionsExpression = "//segment[@id=\"ID_0851579f-9c35-4e93-ab39-0165722727b5\"]/headerSections";
		final var footerSectionsExpression = "//segment[@id=\"ID_0851579f-9c35-4e93-ab39-0165722727b5\"]/footerSections";
		assertEquals(2, xmlTestUtil.getNodeCount(String.format("%s/section", headerSectionsExpression)));

		final var headerText = "Lorem Ipsum...";

		assertEquals("FIRST", xmlTestUtil.getStringContent(String.format("%s/section[1]/@type", headerSectionsExpression)));
		assertEquals(headerText, xmlTestUtil.getStringContent(
			String.format("%s/section[1]/elements/text[1]/text", headerSectionsExpression)
		));

		assertEquals("REMAINING", xmlTestUtil.getStringContent(String.format("%s/section[2]/@type", headerSectionsExpression)));
		assertEquals(headerText, xmlTestUtil.getStringContent(
			String.format("%s/section[2]/elements/text[1]/text", headerSectionsExpression)
		));

		assertEquals("FIRST", xmlTestUtil.getStringContent(String.format("%s/section[1]/@type", footerSectionsExpression)));
		assertEquals("Hello World!", xmlTestUtil.getStringContent(
			String.format("%s/section[1]/elements/text[1]/text", footerSectionsExpression)
		));
		assertEquals("\u2618", xmlTestUtil.getStringContent(
			String.format("%s/section[1]/elements/text[2]/text", footerSectionsExpression
		)));

		assertEquals("REMAINING", xmlTestUtil.getStringContent(String.format("%s/section[2]/@type", footerSectionsExpression)));
		assertEquals(0, xmlTestUtil.getNodeCount(String.format("%s/section[2]/elements/*", footerSectionsExpression)));

		// check order of sections & elements
		assertEquals("headerSections", xmlTestUtil.getNodeName("//segment[@id=\"ID_0851579f-9c35-4e93-ab39-0165722727b5\"]/*[1]"));
		assertEquals("elements", xmlTestUtil.getNodeName("//segment[@id=\"ID_0851579f-9c35-4e93-ab39-0165722727b5\"]/*[2]"));
		assertEquals("footerSections", xmlTestUtil.getNodeName("//segment[@id=\"ID_0851579f-9c35-4e93-ab39-0165722727b5\"]/*[3]"));
	}
}
