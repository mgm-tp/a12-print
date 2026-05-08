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

import static org.junit.jupiter.api.Assertions.*;

public class WatermarkTest {

	@Test
	public void testWatermark() {
		final String printModel = PrintTestUtil.loadFromResources("/data/watermark/WatermarkPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/watermark/WatermarkDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/watermark/WatermarkDM-1.json");

		final var result  =
			XmlRuntimeTestUtil.print(printModel, "WatermarkDM", documentModel, document);

		XmlRuntimeTestUtil.writeResultFiles(result, "watermarks-1");

		final var completeWatermarkPortraitContent = "WatermarkPortraitContent";
		final var completeWatermarkLandscapeContent = "WatermarkLandscapeContent";

		final var xmlTestUtil = new XPathTestUtil(result.getXmlMarkup());

		assertEquals(2, xmlTestUtil.getNodeCount("//segment"));

		final var firstWatermarkExpression = "//segment[@id='huV1t1kI_z3bQRBfJjlw_']/watermark";
		final var secondWatermarkExpression = "//segment[@id='V8cnpcs3-yBntocVlYpH5']/watermark";

		final var portraitWatermark = xmlTestUtil.getNode(firstWatermarkExpression);
		final var landscapeWatermark = xmlTestUtil.getNode(secondWatermarkExpression);

		assertNotNull(portraitWatermark);
		assertNotNull(landscapeWatermark);

		final var portraitWatermarkElementCount = xmlTestUtil.getNodeCount(String.format("%s/elements/*", firstWatermarkExpression));
		final var landscapeWatermarkElementCount = xmlTestUtil.getNodeCount(String.format("%s/elements/*", secondWatermarkExpression));;

		assertEquals(1, portraitWatermarkElementCount);
		assertEquals(1, landscapeWatermarkElementCount);

		final var portraitWatermarkContent = xmlTestUtil.getStringContent(
			String.format("%s/elements[1]/text/text", firstWatermarkExpression)
		);
		final var landscapeWatermarkContent = xmlTestUtil.getStringContent(
			String.format("%s/elements[1]/text/text", secondWatermarkExpression)
		);

		// in the xml the complete watermarks are present
		assertEquals(completeWatermarkPortraitContent, portraitWatermarkContent);
		assertEquals(completeWatermarkLandscapeContent, landscapeWatermarkContent);
	}

	@Test
	public void testWatermarkDisplay() {
		final String printModel = PrintTestUtil.loadFromResources("/data/watermark/WatermarkPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/watermark/WatermarkDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/watermark/WatermarkDM-2.json");

		final var result  =
			XmlRuntimeTestUtil.print(printModel, "WatermarkDM", documentModel, document);

		XmlRuntimeTestUtil.writeResultFiles(result, "watermarks-2");

		final var xmlTestUtil = new XPathTestUtil(result.getXmlMarkup());
		assertEquals(2, xmlTestUtil.getNodeCount("//segment"));

		// there should be no watermark because the flag is false
		assertEquals(0, xmlTestUtil.getNodeCount("//watermark/*"));
	}
}
