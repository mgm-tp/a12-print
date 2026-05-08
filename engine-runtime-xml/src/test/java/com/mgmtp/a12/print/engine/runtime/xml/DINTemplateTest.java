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

public class DINTemplateTest {
	@Test
	public void testDINTemplate() {
		final var printModel = PrintTestUtil.loadFromResources(
			"/data/dinTemplates/DINTemplateReferencePM.json"
		);
		final var documentModel = PrintTestUtil.loadFromResources(
			"/data/dinTemplates/DINTemplateDM.json"
		);
		final var document = PrintTestUtil.loadFromResources(
			"/data/dinTemplates/DINTemplateDM-1.json"
		);

		final var result = XmlRuntimeTestUtil.print(
			printModel,
            "DINTemplateDM",
			documentModel,
			document
        );

		XmlRuntimeTestUtil.writeResultFiles(result, "dinTemplate");

		final var xmlTestUtil = new XPathTestUtil(result.getXmlMarkup());

		assertEquals(1, xmlTestUtil.getNodeCount("//segment"));
		assertEquals(2, xmlTestUtil.getNodeCount("//segment/elements/*"));

		// bounding box 1
		assertEquals(2, xmlTestUtil.getNodeCount("//segment/elements/boundingBox[1]/elements/*"));
		assertEquals(
			"Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt " +
			"ut labore et dolore magna aliquyam erat, sed diam voluptua.",
			xmlTestUtil.getStringContent("//segment/elements/boundingBox[1]/elements/text/text")
		);

		assertEquals(2, xmlTestUtil.getNodeCount("//segment/elements/boundingBox[1]/elements/boundingBox/elements/*"));
		assertEquals(
			"RESULT 2",
			xmlTestUtil.getStringContent("//segment/elements/boundingBox[1]/elements/boundingBox/elements/text/text")
		);

		assertEquals(1, xmlTestUtil.getNodeCount("//segment/elements/boundingBox[1]/elements/boundingBox/elements/boundingBox/elements/*"));
		assertEquals(
			"RESULT 3" ,
			xmlTestUtil.getStringContent("//segment/elements/boundingBox[1]/elements/boundingBox/elements/boundingBox/elements/text/text")
		);

		// bounding box 2
		assertEquals(1, xmlTestUtil.getNodeCount("//segment/elements/boundingBox[2]/elements/*"));
		assertEquals(
			"RESULT 1",
			xmlTestUtil.getStringContent("//segment/elements/boundingBox[2]/elements/text/text")
		);
	}
}
