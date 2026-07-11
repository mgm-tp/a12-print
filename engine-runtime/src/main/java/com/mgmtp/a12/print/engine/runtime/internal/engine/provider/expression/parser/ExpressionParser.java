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
package com.mgmtp.a12.print.engine.runtime.internal.engine.provider.expression.parser;

import com.mgmtp.a12.print.engine.api.exception.impl.PrintCompilerException;
import org.apache.commons.io.IOUtils;
import org.openjdk.nashorn.api.scripting.NashornScriptEngineFactory;

import javax.script.Bindings;
import javax.script.ScriptEngine;
import javax.script.ScriptException;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

public class ExpressionParser {

	private final static NashornScriptEngineFactory factory = new NashornScriptEngineFactory();
	private static final ScriptEngine ENGINE = factory.getScriptEngine();

	public ExpressionParser(boolean repeatFilter) {
		try {
			final InputStream is = repeatFilter ?
				this.getClass().getResourceAsStream("/engines/repeatfilter.js") :
				this.getClass().getResourceAsStream("/engines/expressions.js");
			try {
				final String expressionsLib = IOUtils.toString(is, StandardCharsets.UTF_8);
				ENGINE.eval("var exports = { };" + expressionsLib);
			} catch (final IOException | ScriptException e) {
				throw new PrintCompilerException("Error when evaluating JavaScript Expressions Library: " + e);
			}
			is.close();
		} catch (IOException e) {
			throw new PrintCompilerException("Error while loading expression parser: " + e);
		}
	}

	public ExpressionParserResult parse(final String input) {
		final ExpressionParserResult result = new ExpressionParserResult();
		try {
			ENGINE.eval("var input, result, error = undefined");
			ENGINE.put("input", input);
			ENGINE.eval("try {"
				+ "result = exports.parse(input);"
				+ "} catch (e) {"
				+ "error = e.message;"
				+ "}");
			if (ENGINE.get("error") != null) {
				result.setErrorMessage((String) ENGINE.eval("error"));
			} else {
				result.setNode(convertToNode(ENGINE.get("result")));
			}
		} catch (final ScriptException e) {
			result.setErrorMessage(e.getMessage());
		}
		return result;
	}

	private ExpressionNode convertToNode(final Object obj) {

		final ExpressionNode node = new ExpressionNode();
		if (obj instanceof Bindings) {
			final Bindings bindings = (Bindings) obj;
			node.setType(bindings.get("type"));
			node.setName(bindings.get("name"));
			node.setOperation(bindings.get("operation"));
			node.setContent(bindings.get("content"));
			node.setChildren(convertToNodes(bindings.get("children")));
			node.setContext(convertToNode(bindings.get("context")));
		}

		return node;
	}

	private List<ExpressionNode> convertToNodes(final Object children) {
		final List<ExpressionNode> childNodes = new ArrayList<>();

		if (children == null) {
			return childNodes;
		}

		for (final Object element : ((Bindings) children).values()) {
			childNodes.add(convertToNode(element));
		}

		return childNodes;
	}
}
