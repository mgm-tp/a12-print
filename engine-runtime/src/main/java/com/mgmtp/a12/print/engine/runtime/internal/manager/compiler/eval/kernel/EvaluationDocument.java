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

import com.mgmtp.a12.kernel.md.document.api.IDocument;
import com.mgmtp.a12.kernel.md.document.api.IEntityInstance;
import com.mgmtp.a12.kernel.md.document.api.IFieldInstance;
import com.mgmtp.a12.print.engine.api.exception.PrintCompilerException;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.PrintDocument;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.computation.ComputationExpression;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.eval.EvaluationDocumentModelCompiler;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.DocumentModelIndex;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;

import java.util.*;

@RequiredArgsConstructor
public class EvaluationDocument implements IDocument {

	@NonNull
	private final DocumentModelIndex documentModelIndex;
	private final List<PrintDocument> rootGroups = new ArrayList<>();
	private final List<ComputationExpression.Parameters> parameters = new ArrayList<>();

	private static void rewriteFieldInstance(HashSet<IEntityInstance> result, String prefix, IEntityInstance e) {
		if (e instanceof IFieldInstance fieldInstance) {

			final var repetitions = new int[e.getRepetitions().length + 2];
			repetitions[0] = 1;
			repetitions[1] = 1;
			for (var i = 0; i < e.getRepetitions().length; i++) {
				repetitions[i + 2] = e.getRepetitions()[i];
			}
			result.add(new FieldInstance(
				fieldInstance.getValue().orElse(null),
				String.format("/%s/%s%s", EvaluationDocumentModelCompiler.MODEL, prefix, e.getPath()),
				repetitions
			));
		}
	}

	@Override
	public Optional<String> getId() {
		return Optional.of(documentModelIndex + "-1");
	}

	@Override
	public void setId(String id) {
		// Not needed for evaluation documents
	}

	public @NonNull String getDocumentModelId() {
		return documentModelIndex.getDocumentModel().getHeader().getId();
	}

	@Override
	public Set<IEntityInstance> getEntityInstances() {

		final var result = new HashSet<IEntityInstance>();

		for (var doc : parameters) {
			for (final var entry : doc.getValues().entrySet()) {

				if (ComputationExpression.Parameters.isRuntimeParameter(entry.getKey())) {
					continue;
				}

				result.add(new IFieldInstance() {
					@Override
					public Optional<Object> getValue() {
						return Optional.ofNullable(entry.getValue());
					}

					@Override
					public void setValue(Object value) {
						// Not needed
					}

					@Override
					public String getPath() {
						return String.format("/%s/%s", EvaluationDocumentModelCompiler.SyntheticModel.getSaveToEmbedModelName(), entry.getKey());
					}

					@Override
					public int[] getRepetitions() {
						return new int[]{1, 1};
					}
				});
			}
		}

		for (var doc : rootGroups) {
			final var modelId = doc.getDocumentModelId();
			final var reference = documentModelIndex.getDocumentModel().getHeader().getModelReferences().stream()
				.filter(ref -> ref.getAlias().equals(modelId))
				.findFirst()
				.orElseThrow(() -> new PrintCompilerException("Could not find reference for " + modelId));
			final var prefix = reference.getReference();

			for (var e : doc.getEntityInstances()) {
				rewriteFieldInstance(result, prefix, e);
			}
		}
		return result;
	}

	@Override
	public boolean addEntityInstance(IEntityInstance entityInstance) {
		return false;
	}

	@Override
	public boolean removeEntityInstance(IEntityInstance entityInstance) {
		return false;
	}

	public void addDocumentFragment(ComputationExpression.Parameters p) {
		parameters.add(p);
	}

	public void addDocumentFragment(PrintDocument document) {
		rootGroups.add(document);
	}
}
