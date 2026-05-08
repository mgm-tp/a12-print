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
import lombok.NonNull;

import java.util.HashSet;
import java.util.Set;

public class ComputedEvaluationDocument extends DelegateDocument {

	@NonNull
	private final String documentModelId;
	private final Set<IEntityInstance> instances = new HashSet<>();

	public ComputedEvaluationDocument(@NonNull IDocument delegate, @NonNull String documentModelId) {
		super(delegate);
		this.documentModelId = documentModelId;
	}

	@Override
	public @NonNull String getDocumentModelId() {
		return documentModelId;
	}

	@Override
	public boolean addEntityInstance(IEntityInstance entityInstance) {
		return instances.add(entityInstance);
	}

	@Override
	public Set<IEntityInstance> getEntityInstances() {
		if (instances.size() == 0) {
			return super.getEntityInstances();
		}
		var set = new HashSet<IEntityInstance>();
		set.addAll(instances);
		set.addAll(super.getEntityInstances());
		return set;
	}


	public ComputedDocument getResult() {
		return new ComputedDocument(documentModelId, instances);
	}

}
