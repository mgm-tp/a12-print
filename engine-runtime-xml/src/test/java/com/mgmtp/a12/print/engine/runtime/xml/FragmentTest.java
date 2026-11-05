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

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Prints a Print Model that uses the Print Fragment Models {@code Fragment} and {@code SimpleFragment} and asserts the
 * resulting XML.
 * <p>
 * The models are the fixtures of the Fragment regression test
 */
class FragmentTest {

	/**
	 * Segment defined by the fragment model, referenced twice by the print model.
	 */
	private static final String FRAGMENT_SEGMENT = "//segment[@id=\"iKncCbMfa_xC4z_kf2iua\"]";

	@Test
	void testFragments() {
		final String printModel = PrintTestUtil.loadFromResources("/data/fragment/FragmentPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/fragment/FragmentDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/fragment/FragmentDM-1.json");

		final var printFragmentModels = Map.of(
			"Fragment", PrintTestUtil.loadFromResources("/data/fragment/Fragment.json"),
			"SimpleFragment", PrintTestUtil.loadFromResources("/data/fragment/SimpleFragment.json")
		);

		final var result = XmlRuntimeTestUtil.print(
			printModel, "PrintFragmentDM", documentModel, document, printFragmentModels
		);

		// also validates the XML against PrintDocument.xsd
		XmlRuntimeTestUtil.writeResultFiles(result, "fragments");

		final var xmlTestUtil = new XPathTestUtil(result.getXmlMarkup());

		assertEquals("FragmentRegressionTest", xmlTestUtil.getStringContent("/document/@title"));
		assertEquals(28, xmlTestUtil.getNodeCount("//segment"));

		// fragment element with a Field and a Calculation entity, resolved against the document
		assertEquals(
			"Field: Coffee Sales Q1 Calculation: Coffee Sales Q1 (calculated)",
			xmlTestUtil.getStringContent(
				"//segment[@id=\"PrtDS002xxxxxxxxxxxxx\"]/elements/text[@id=\"QYrhPbiOUY0dPDav4TAel\"]/text"
			)
		);

		// segments defined by the fragment model, the portrait one referenced twice
		assertEquals(2, xmlTestUtil.getNodeCount(FRAGMENT_SEGMENT));
		assertEquals(1, xmlTestUtil.getNodeCount("//segment[@id=\"he7y0ZWFtUm_DLTUcA6QW\"]"));
		assertEquals("Portrait Fragment Segment", xmlTestUtil.getStringContent(
			String.format("%s/elements/text[@id=\"FrgDT007xxxxxxxxxxxxx\"]/text", FRAGMENT_SEGMENT)
		));

		// elements of both fragment models within one segment
		final var multipleModelsSegment = "//segment[@id=\"MltModSegment0000001\"]";
		assertEquals(
			"Fragment of the first fragment model Fragment, which is bound to the document model PrintFragmentDM.",
			xmlTestUtil.getStringContent(
				String.format("%s/elements/text[@id=\"MltModFragmentA00001\"]/text", multipleModelsSegment)
			)
		);
		assertEquals(
			"Fragment of the second fragment model SimpleFragment, which references no document model at all.",
			xmlTestUtil.getStringContent(
				String.format("%s/elements/text[@id=\"SmpFrgTextFragment01\"]/text", multipleModelsSegment)
			)
		);

		// both fragment elements are referenced twice, once with a hide condition that is met
		assertEquals(8, xmlTestUtil.getNodeCount("//segment[@id=\"HidCondSegment000001\"]/elements/*"));
		assertEquals(1, xmlTestUtil.getNodeCount("//text[@id=\"HidCondTextFragment1\"]"));
		assertEquals(1, xmlTestUtil.getNodeCount("//area[@id=\"HidCondAreaFragmnt1\"]"));

		// fragment element nested in an area of the print model
		final var areaElements =
			"//segment[@id=\"FrgInAreaSegment0001\"]/elements/area[@id=\"FrgInArea00000000001\"]/elements";
		assertEquals(2, xmlTestUtil.getNodeCount(String.format("%s/*", areaElements)));
		assertEquals(
			"Text element of the print model, nested inside the area.",
			xmlTestUtil.getStringContent(String.format("%s/text[@id=\"FrgInAreaText0000001\"]/text", areaElements))
		);
		assertEquals(
			"Text fragment of the fragment model, nested inside an area of the print model.",
			xmlTestUtil.getStringContent(String.format("%s/text[@id=\"FrgInAreaFragment001\"]/text", areaElements))
		);

		// static image resource of the fragment model, embedded into the result
		final var image = "//segment[@id=\"PrtDS014xxxxxxxxxxxxx\"]/elements/image[@id=\"WmVO49p3Kuxwuyx9ITIvw\"]";
		assertEquals("FragmentTest", xmlTestUtil.getStringContent(String.format("%s/alternativeText", image)));
		assertTrue(
			xmlTestUtil.getStringContent(String.format("%s/base64", image)).startsWith("data:image/jpeg;base64,")
		);

		// listing of the fragment model, filled from the document
		final var listing =
			"//segment[@id=\"he7y0ZWFtUm_DLTUcA6QW\"]/elements/listing[@id=\"Zf4iphSgsebjvgSLhhz31\"]";
		assertEquals(20, xmlTestUtil.getNodeCount(String.format("%s/bodyRows/row", listing)));
		assertEquals("1", xmlTestUtil.getStringContent(String.format("%s/bodyRows/row[1]/cell[1]/value", listing)));
		assertEquals("id", xmlTestUtil.getStringContent(String.format("%s/bodyRows/row[1]/cell[2]/value", listing)));
		assertEquals("P-1001", xmlTestUtil.getStringContent(String.format("%s/bodyRows/row[1]/cell[3]/value", listing)));

		// element of the print model that uses a text style of the fragment model
		assertEquals("Really Big Textstyle", xmlTestUtil.getStringContent(
			"//segment[@id=\"PrtDS098xxxxxxxxxxxxx\"]/elements/text[@id=\"8MbJ2eqCUk1gTgO2zzUux\"]/text"
		));

		// header and footer sections of the fragment model, resolved for the FIRST and the REMAINING page
		final var headerSections = "//segment[@id=\"PrtDS002xxxxxxxxxxxxx\"]/headerSections";
		assertEquals(2, xmlTestUtil.getNodeCount(String.format("%s/section", headerSections)));
		assertEquals("FIRST", xmlTestUtil.getStringContent(String.format("%s/section[1]/@type", headerSections)));
		assertEquals("REMAINING", xmlTestUtil.getStringContent(String.format("%s/section[2]/@type", headerSections)));
		assertEquals("Portrait fragment section header", xmlTestUtil.getStringContent(String.format(
			"%s/section[1]/elements/text[@id=\"Yf44gKJcE-EcxxQAbqHmm\"]/text", headerSections
		)));

		// the landscape fragment segment uses the landscape section of the fragment model
		final var landscapeSegment = "//segment[@id=\"he7y0ZWFtUm_DLTUcA6QW\"]";
		assertEquals("Landscape fragment section header", xmlTestUtil.getStringContent(String.format(
			"%s/headerSections/section[@id=\"MKJz6rU6ONzzIkOJt4UU6\"]/elements/text[@id=\"jAG8Eial69btEdUXKXLHH\"]/text",
			landscapeSegment
		)));
		assertEquals("Landscape fragment section footer", xmlTestUtil.getStringContent(String.format(
			"%s/footerSections/section[@id=\"MKJz6rU6ONzzIkOJt4UU6\"]/elements/text[@id=\"n067LG9EWQiKMGN-ddWaq\"]/text",
			landscapeSegment
		)));

		// every segment gets one of the two watermarks that are defined by the fragment model
		assertEquals(28, xmlTestUtil.getNodeCount("//segment/watermark"));
		assertEquals(27, xmlTestUtil.getNodeCount("//segment/watermark[@id=\"okiSAC-mGDJsMUB4n-seT\"]"));
		assertEquals(1, xmlTestUtil.getNodeCount("//segment/watermark[@id=\"hYcJKP2cxsiPJVuptKr2g\"]"));
	}
}
