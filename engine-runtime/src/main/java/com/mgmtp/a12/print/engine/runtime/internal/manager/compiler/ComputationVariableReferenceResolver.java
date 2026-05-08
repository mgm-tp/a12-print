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
package com.mgmtp.a12.print.engine.runtime.internal.manager.compiler;

import com.mgmtp.a12.print.engine.api.exception.PrintCompilerException;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.ComputationSyntaxTree;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.SyntaxTreeElementVisitor;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.Variable;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.VisitationState;
import lombok.Data;
import lombok.NonNull;


@Data
public class ComputationVariableReferenceResolver implements ComputationVariableReferenceResolveAndRewrite {

	@NonNull
	private final PrintModelCompilationContext printModel;
	@NonNull
	private final String basePath;

	public ComputationSyntaxTree resolveReferences(ComputationSyntaxTree root) {
		var visitor = new Visitor();
		visitor.visit(root.getRoot(), VisitationState.stateless());
		return root;
	}

	private class Visitor implements SyntaxTreeElementVisitor {

		@Override
		public void visit(Variable node, VisitationState state) {
			if (node.isAbsolute()) {
				return;
			}

			final var topLevel = node.getSegments()[0];
			final var topLevelLabel = topLevel.getLabel();

			if (PrintModelCompiler.SYNTHETIC_METADATA_DATA_MODEL.equals(topLevelLabel)
				|| PrintModelCompiler.SYNTHETIC_ANNOTATIONS_DATA_MODEL.equals(topLevelLabel)) {
				return;
			}

			final var documentModel = printModel.getDocumentModelIndexMap().get(topLevelLabel);
			if (documentModel != null) {
				return;
			}

			throw new PrintCompilerException("relative Computations are currently not implemented");

		}

	}

}
