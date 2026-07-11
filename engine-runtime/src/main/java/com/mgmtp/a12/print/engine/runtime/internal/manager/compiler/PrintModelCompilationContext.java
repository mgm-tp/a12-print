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


import com.mgmtp.a12.kernel.md.model.api.services.IDocumentModelResolver;
import com.mgmtp.a12.kernel.md.model.api.services.IDocumentModelSearchService;
import com.mgmtp.a12.model.header.ModelReference;
import com.mgmtp.a12.print.engine.api.PrintModelId;
import com.mgmtp.a12.print.engine.api.exception.impl.PrintCompilerException;
import com.mgmtp.a12.print.engine.api.exception.impl.PrintDomainException;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.expression.PreCompiledExpressionMap;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.listing.PreCompiledListingMap;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.ComponentTreeDependencySelectorProducer;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.ComponentTreeManager;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.provider.ComputationExpressionDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.provider.ComputeDocumentDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.provider.LogicContainerEvaluationDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.DocumentModelIndex;
import com.mgmtp.a12.print.model.api.model.PrintModel;
import com.mgmtp.a12.print.model.api.model.internal.dto.PrintModelDto;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NonNull;
import lombok.experimental.Delegate;
import lombok.extern.slf4j.Slf4j;

import java.util.HashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutionException;

@Data
@Slf4j
@Builder
public class PrintModelCompilationContext implements PrintModel, IDocumentModelResolver {

	@NonNull
	private final PrintModelId id;
	@NonNull
	private final PrintModelCompiler compiler;
	private final ConcurrentHashMap<String, DocumentModelIndex> documentModelIndexMap = new ConcurrentHashMap<>();
	@Delegate(types = {PrintModel.class})
	private PrintModel model;

	@EqualsAndHashCode.Exclude
	private final HashSet<Locale> commonDocumentLocales = new HashSet<>();

	@EqualsAndHashCode.Exclude
	private LogicContainerEvaluationDependencyValueProducer logicContainerEvaluationDependencyValueProducer;
	@EqualsAndHashCode.Exclude
	private ComputationExpressionDependencyValueProducer computationExpressionDependencyValueProducer;

	@EqualsAndHashCode.Exclude
	private ComputeDocumentDependencyValueProducer computeDocumentDependencyValueProducer;

	@EqualsAndHashCode.Exclude
	private PreCompiledListingMap preCompiledListingMap;

	@EqualsAndHashCode.Exclude
	private PreCompiledExpressionMap preCompiledExpressionMap;
	@EqualsAndHashCode.Exclude
	private ComponentTreeManager componentTreeManager;
	@EqualsAndHashCode.Exclude
	private ComponentTreeDependencySelectorProducer componentTreeDependencySelectorProducer;

	@EqualsAndHashCode.Exclude
	private final Map<String, byte[]> staticImageMap = new ConcurrentHashMap<>();

	public ConcurrentHashMap<String, DocumentModelIndex> getDocumentModelIndexMap() {
		return documentModelIndexMap;
	}

	public void provideDocumentModelReference(ModelReference r, DocumentModelIndex index) {
		documentModelIndexMap.computeIfAbsent(r.getReference(), k -> index);
		if (r.getAlias() != null && !r.getAlias().isBlank() && !r.getAlias().isEmpty()) {
			documentModelIndexMap.computeIfAbsent(r.getAlias(), k -> index);
		}
	}

	public void publicCommonLocales(DocumentModelIndex index) {
		if (index.getHeader().getLocales() == null) {
			return;
		}
		if (commonDocumentLocales.isEmpty()) {
			commonDocumentLocales.addAll(index.getHeader().getLocales());
		} else {
			commonDocumentLocales.retainAll(index.getHeader().getLocales());
		}
	}

	public void setModel(@NonNull PrintModelDto model) {
		this.model = model;
	}

	public void asyncCompile() {
		compiler.compileAsync(this);
	}

	public PrintModelCompilationContext awaitCompilation() {
		log.debug("awaiting ComputationCompiler completion for: {}", getId());
		try {
			compiler.await();
			return this;
		} catch (ExecutionException e) {
			if (e.getCause() instanceof PrintDomainException pde) {
				throw pde;
			}
			throw new PrintCompilerException("Compilation of " + getId().getModelHeaderId() + " failed", e.getCause());
		} catch (InterruptedException e) {
			throw new PrintCompilerException("Compilation of " + getId().getModelHeaderId() + " was interrupted", e);
		} finally {
			log.debug("awaitCompilation completed for: {}", getId().getModelHeaderId());
		}
	}

	@Override
	public DocumentModelIndex getDocumentModelById(String id) {
		return documentModelIndexMap.get(id);
	}

	@Override
	public Optional<IDocumentModelSearchService> getDocumentModelSearchService(String documentModelId) {
		throw new PrintCompilerException("The DocumentModelSearchService should never be requested");
	}

}
