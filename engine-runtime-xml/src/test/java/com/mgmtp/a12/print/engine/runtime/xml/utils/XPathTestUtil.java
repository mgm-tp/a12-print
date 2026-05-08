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
package com.mgmtp.a12.print.engine.runtime.xml.utils;

import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;
import org.xml.sax.SAXException;

import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathExpressionException;
import javax.xml.xpath.XPathFactory;
import java.io.IOException;
import java.io.StringReader;
import java.text.NumberFormat;
import java.text.ParseException;
import java.util.Locale;

public class XPathTestUtil {
	private final XPath xPath;
	private final Document xmlDocument;

	public XPathTestUtil(
		String xmlContent
	) {
		xPath = XPathFactory.newInstance().newXPath();

		try {
			final var builderFactory = DocumentBuilderFactory.newInstance();
			final var builder = builderFactory.newDocumentBuilder();
			xmlDocument = builder.parse(new InputSource(new StringReader(xmlContent)));
		} catch (SAXException | IOException | ParserConfigurationException e) {
			throw new RuntimeException(e);
		}
	}

	public NodeList getNodeList(String expression) {
		try {
			return (NodeList) xPath.compile(expression).evaluate(xmlDocument, XPathConstants.NODESET);
		} catch (XPathExpressionException e) {
			throw new RuntimeException(e);
		}
	}

	public int getNodeCount(String expression) {
		try {
			return ((Double) xPath.compile(
				String.format("count(%s)", expression)
			).evaluate(xmlDocument, XPathConstants.NUMBER)).intValue();
		} catch (XPathExpressionException e) {
			throw new RuntimeException(e);
		}
	}

	public Node getNode(String expression) {
		try {
			return (Node) xPath.compile(expression).evaluate(xmlDocument, XPathConstants.NODE);
		} catch (XPathExpressionException e) {
			throw new RuntimeException(e);
		}
	}

	public String getNodeName(String expression) {
		try {
			return (String) xPath.compile(
				String.format("name(%s)", expression)
			).evaluate(xmlDocument, XPathConstants.STRING);
		} catch (XPathExpressionException e) {
			throw new RuntimeException(e);
		}
	}

	public String getStringContent(String expression) {
		try {
			return (String) xPath.compile(expression).evaluate(xmlDocument, XPathConstants.STRING);
		} catch (XPathExpressionException e) {
			throw new RuntimeException(e);
		}
	}

	public boolean getBooleanContent(String expression) {
		return Boolean.parseBoolean(getStringContent(expression));
	}

	public Double getNumberContent(String expression) {
		final var contentAsString =this.getStringContent(expression);
		NumberFormat format = NumberFormat.getInstance(Locale.GERMAN);
		try {
			return format.parse(contentAsString).doubleValue();
		} catch (ParseException e) {
			throw new RuntimeException(e);
		}
	}
}
