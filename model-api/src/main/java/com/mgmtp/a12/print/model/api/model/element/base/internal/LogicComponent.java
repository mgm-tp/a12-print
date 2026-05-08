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
package com.mgmtp.a12.print.model.api.model.element.base.internal;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.mgmtp.a12.print.model.api.model.PrintModelEntity;

import java.util.stream.Stream;

/**
 * The interface Logic component.
 * For usage only in the PrintEngineRuntime.
 * <p>
 * Iterates over all Computation Statements in the Component.
 */
public interface LogicComponent extends PrintModelEntity {
	/**
	 * Computation statements stream.
	 *
	 * @return the stream
	 */
	Stream<String> computationStatements();

	/**
	 * Computation statement semantic evaluation semantic.
	 *
	 * @return the evaluation semantic
	 */
	EvaluationSemantic computationStatementSemantic();

	/**
	 * Describes the Semantics for the Evaluation of this Component.
	 */
	enum EvaluationSemantic {

		/**
		 * return the first none empty evaluation result or false if none
		 */
        @JsonProperty("BooleanOr") BOOLEAN_OR,
		/**
		 * evaluate the first statement, if it is not empty and evaluated to Boolean True the result of the last statement is returned.
		 */
		@JsonProperty("IfNotEmptyAndTrueThenLast") IF_NOT_EMPTY_AND_TRUE_THEN_LAST,
	}

}
