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
package com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.eval.kernel;

import com.mgmtp.a12.kernel.md.document.apiV2.DocumentPointer;
import com.mgmtp.a12.kernel.md.document.apiV2.PathPart;
import com.mgmtp.a12.kernel.md.document.apiV2.UpdateAction;
import com.mgmtp.a12.kernel.md.document.apiV2.immutable.DocumentV2;
import com.mgmtp.a12.kernel.md.document.apiV2.immutable.FieldInstanceV2;
import com.mgmtp.a12.kernel.md.document.apiV2.immutable.utils.IDocumentV2Visitor;
import com.mgmtp.a12.print.engine.api.exception.impl.PrintDomainException;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.PrintDocumentContext;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.computation.ComputationExpression;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.eval.EvaluationDocumentModelCompiler;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.DocumentModelIndex;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@RequiredArgsConstructor
public class EvaluationDocument {

	@NonNull
	private final DocumentModelIndex documentModelIndex;
	private final List<PrintDocumentContext> rootGroups = new ArrayList<>();
	private final List<ComputationExpression.Parameters> parameters = new ArrayList<>();

	public DocumentV2 getDocumentToCompute() {
		final var updateActions = new ArrayList<UpdateAction>();

		for (var doc : parameters) {
			for (final var entry : doc.getValues().entrySet()) {

				if (ComputationExpression.Parameters.isRuntimeParameter(entry.getKey())) {
					continue;
				}

				final var pathParts = new ArrayList<PathPart>();
				pathParts.add(PathPart.of(EvaluationDocumentModelCompiler.SyntheticModel.getSaveToEmbedModelName(), 1));
				pathParts.add(PathPart.of(entry.getKey(), 1));
				updateActions.add(UpdateAction.putFieldValue(DocumentPointer.of(pathParts), entry.getValue()));
			}
		}

		for (var doc : rootGroups) {
			final var modelId = doc.getDocumentModelId();
			final var reference = documentModelIndex.getDocumentModel().getHeader().getModelReferences().stream()
				.filter(ref -> ref.getAlias().equals(modelId))
				.findFirst()
				.orElseThrow(() -> new PrintDomainException("Could not find reference for the Document Model {}", modelId));
			final var prefix = reference.getReference();

			doc.getDocument().traverse(new IDocumentV2Visitor() {
				@Override
				public void visitField(DocumentPointer pointerRelativeToBase, FieldInstanceV2 field) {
					final var pathParts = new ArrayList<PathPart>();
					pathParts.add(PathPart.of(EvaluationDocumentModelCompiler.MODEL, 1));
					pathParts.add(PathPart.of(prefix, 1));
					DocumentPointer.of(pathParts);

					updateActions.add(UpdateAction.putFieldValue(
						DocumentPointer.of(pathParts).withConcatenated(pointerRelativeToBase),
						field.value()
					));

					IDocumentV2Visitor.super.visitField(pointerRelativeToBase, field);
				}
			});
		}
		final var resultDoc = DocumentV2.empty(getDocumentModelId());

		return resultDoc.withBatchUpdates(updateActions);
	}

	public @NonNull String getDocumentModelId() {
		return documentModelIndex.getDocumentModel().getHeader().getId();
	}

	public void addDocumentFragment(ComputationExpression.Parameters p) {
		parameters.add(p);
	}

	public void addDocumentFragment(PrintDocumentContext printDocumentContext) {
		rootGroups.add(printDocumentContext);
	}
}
