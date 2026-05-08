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

import com.mgmtp.a12.print.engine.runtime.kernel.internal.DocumentModelIndex;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.egg.EggRewriteRuleFactory;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.egg.EggRewriteRuleInstance;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.egg.RewriteSyntaxTree;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.*;
import lombok.Getter;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;

import java.util.Map;

@Getter
@RequiredArgsConstructor
public class DataModelAliasRewrite implements EggRewriteRuleFactory {

	@NonNull
	private final Map.Entry<String, DocumentModelIndex> aliasModelEntry;

	@Override
	public EggRewriteRuleInstance instantiate(final SyntaxTreeElement e) {
		return RewriteSyntaxTree
			.withRules()
			.variable((o, clone) -> {
				if (o.isAbsolute() ||
					o.getSegments().length < 1 ||
					!o.getSegments()[0].getLabel().equals(aliasModelEntry.getKey())
				) {
					return b -> clone;
				}

				return b -> rewriteAlias(
					b,
					clone,
					aliasModelEntry.getValue().getDocumentModel().getHeader().getId()
				);
			})
			.build()
			.instantiate(e);
	}

	private Variable rewriteAlias(
		Variable.VariableBuilder b,
		Variable clone,
		String documentModelId
	) {
		return b
			.segments(changeFirstSegmentLabel(clone.getSegments(), documentModelId))
			.build();
	}

	private ReferenceSegment[] changeFirstSegmentLabel(ReferenceSegment[] segments, String documentModelId) {
		final var resultSegments = new ReferenceSegment[segments.length];
		for (var i = 0; i < segments.length; i++) {
			final var clonedSegment = segments[i];
			resultSegments[i] = i == 0
				? ReferenceSegment.builder()
						.label(documentModelId)
						.isList(clonedSegment.isList())
						.isTurningGroup(clonedSegment.isTurningGroup())
						.build()
				: clonedSegment;
		}
		return resultSegments;
	}
}
