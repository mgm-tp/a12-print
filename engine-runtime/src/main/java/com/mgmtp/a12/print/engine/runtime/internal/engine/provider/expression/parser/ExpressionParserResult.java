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

import java.util.HashSet;
import java.util.Set;

public class ExpressionParserResult {

	private ExpressionNode node;
	private String errorMessage;

	public ExpressionNode getNode() {
		return node;
	}

	public void setNode(final ExpressionNode node) {
		this.node = node;
	}

	public String getErrorMessage() {
		return errorMessage;
	}

	public void setErrorMessage(final String errorMessage) {
		this.errorMessage = errorMessage;
	}

	public boolean hasError() {
		return this.errorMessage != null;
	}

	public Set<String> allFieldNames() {
		return allFieldNames(this.node);
	}

	public Set<String> allGroupNames() {
		return allGroupNames(this.node);
	}

	private Set<String> allFieldNames(final ExpressionNode node) {
		final Set<String> result = new HashSet<>();
		if ("field".equals(node.getType())) {
			result.add(node.getName());
		}
		for (final ExpressionNode expressionNode : node.getChildren()) {
			result.addAll(allFieldNames(expressionNode));
		}
		return result;
	}

	private Set<String> allGroupNames(final ExpressionNode node) {
		final Set<String> result = new HashSet<>();
		if ("group".equals(node.getType())) {
			result.add(node.getName());
		}
		for (final ExpressionNode expressionNode : node.getChildren()) {
			result.addAll(allGroupNames(expressionNode));
		}
		return result;
	}
}
