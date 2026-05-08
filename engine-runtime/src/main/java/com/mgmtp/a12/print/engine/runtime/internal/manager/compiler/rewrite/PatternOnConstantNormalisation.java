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
package com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.rewrite;

import com.mgmtp.a12.print.engine.runtime.kernel.internal.egg.EggRewriteRuleFactory;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.egg.EggRewriteRuleInstance;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.egg.RewriteSyntaxTree;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.Constant;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.Predicate;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.SyntaxTreeElement;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.SyntaxTreeElementType;

import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;
import java.util.regex.Pattern;

public class PatternOnConstantNormalisation implements EggRewriteRuleFactory {

	private static final Map<String, java.util.function.Predicate<String>> patternCache = new HashMap<>();

	@Override
	public EggRewriteRuleInstance instantiate(SyntaxTreeElement e) {
		return RewriteSyntaxTree
			.withRules()
			.predicate((o, clone) -> {
				if (clone.getSignature().signatureType() == Predicate.SignatureType.INFIX_PARAMETER_LIST) {
					var targetValue = false;
					return createPredicateBuilderForPattern(clone, targetValue);
				} else {
					return b -> clone;
				}
			})
			.build()
			.instantiate(e);
	}

	private static Function<Predicate.PredicateBuilder, SyntaxTreeElement> createPredicateBuilderForPattern(Predicate clone, boolean targetValue) {
		switch (clone.getLabel()) {
			case "PatternMatched", "PatternViolated": {
				if ("PatternMatched".equals(clone.getLabel())) {
					targetValue = true;
				}

				final var signature = (Predicate.InfixParameterList) clone.getSignature();
				final var left = signature.getLeftParameter();

				if (left.elementType() != SyntaxTreeElementType.CONSTANT) {
					return b -> clone;
				}

				final var right = signature.getRightParameter();

				if (right.elementType() != SyntaxTreeElementType.CONSTANT) {
					return b -> clone;
				}

				final var constant = (Constant) left;
				final var pattern = (Constant) right;
				synchronized (patternCache) {
					final var regex = patternCache.computeIfAbsent(
						pattern.getValue(),
						v -> Pattern.compile(v).asMatchPredicate()
					);
					if (regex.test(constant.getValue()) == targetValue)  {
						return b -> Constant.TRUE;
					} else {
						return b -> Constant.FALSE;
					}
				}
			}
			default:
				return b -> clone;
		}
	}
}
