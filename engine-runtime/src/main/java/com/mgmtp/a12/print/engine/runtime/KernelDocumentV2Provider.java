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
// tag::KernelDocumentV2ProviderInterface[]
package com.mgmtp.a12.print.engine.runtime;

// tag::Import[]

import com.mgmtp.a12.kernel.md.document.apiV2.immutable.DocumentV2;
import com.mgmtp.a12.print.engine.api.JobDependency;
import com.mgmtp.a12.print.engine.api.JobDependencyProvider;
import com.mgmtp.a12.print.engine.api.a12.DocumentDependencyDescriptor;
import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.internal.KernelDocumentJobDependency;
import lombok.NonNull;
// end::Import[]

/**
 * Interface for loading A12 kernel {@link DocumentV2}s.
 */
public interface KernelDocumentV2Provider extends JobDependencyProvider {

	static KernelDocumentV2Provider fromDocument(final @NonNull DocumentV2 document) {

		return new KernelDocumentV2Provider() {
			@Override
			public boolean supports(DocumentDependencyDescriptor documentDependencyDescriptor) {
				return documentDependencyDescriptor.getModelReference().getReference().equals(document.getDocumentModelId());
			}

			@Override
			public DocumentV2 loadDocument(DocumentDependencyDescriptor descriptor) {
				return document;
			}
		};
	}

	/**
	 * @return true, if the {@link com.mgmtp.a12.model.header.ModelReference} is supported by the provider.
	 */
	boolean supports(DocumentDependencyDescriptor documentDependencyDescriptor);

	/**
	 * @return The supported document
	 */
	DocumentV2 loadDocument(DocumentDependencyDescriptor descriptor);

	/**
	 * @return true, if the {@link com.mgmtp.a12.model.header.ModelReference} needed by the {@link JobDependency} is supported.
	 */
	default boolean canProvide(JobDependency dependency) {
		if (!(dependency instanceof KernelDocumentJobDependency kernelDocumentDataDependency)) {
			return false;
		}
		var descriptor = kernelDocumentDataDependency.getDescriptor();
		return supports(descriptor);
	}

	@Override
	default void provide(JobDependency dependency) throws PrintException {
		var kernelDocumentDataDependency = ((KernelDocumentJobDependency) dependency);
		final var documentV2 = loadDocument(kernelDocumentDataDependency.getDescriptor());
		kernelDocumentDataDependency.setDocument(documentV2);
	}
}
// end::KernelDocumentV2ProviderInterface[]
