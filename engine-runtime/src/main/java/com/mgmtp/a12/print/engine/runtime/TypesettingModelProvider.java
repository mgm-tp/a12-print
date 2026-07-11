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
// tag::TypesettingModelProviderInterface[]
package com.mgmtp.a12.print.engine.runtime;

// tag::Import[]

import com.mgmtp.a12.print.engine.api.JobDependency;
import com.mgmtp.a12.print.engine.api.JobDependencyProvider;
import com.mgmtp.a12.print.engine.api.a12.TypesettingModelDependencyDescriptor;
import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.internal.TypesettingModelJobDependency;
import com.mgmtp.a12.print.typesetting.internal.model.TypesettingModel;
import lombok.NonNull;

import java.util.function.Function;
// end::Import[]

/**
 * Interface for loading {@link TypesettingModel}s.
 */
public interface TypesettingModelProvider extends JobDependencyProvider {

	static TypesettingModelProvider fromLoader(final @NonNull Function<String, TypesettingModel> loading) {
		return new TypesettingModelProvider() {
			@Override
			public boolean supports(TypesettingModelDependencyDescriptor typesettingModelDependencyDescriptor) {
				return true;
			}

			@Override
			public TypesettingModel loadTypesettingModel(TypesettingModelDependencyDescriptor descriptor) {
				return loading.apply(descriptor.getTypesettingModelId());
			}
		};
	}

	/**
	 * @return true, if the {@link TypesettingModel} referenced by the ID is supported by the provider.
	 */
	boolean supports(TypesettingModelDependencyDescriptor typesettingModelDependencyDescriptor);

	TypesettingModel loadTypesettingModel(TypesettingModelDependencyDescriptor descriptor);

	/**
	 * @return true, if the {@link TypesettingModel} needed by the {@link JobDependency}.
	 */
	default boolean canProvide(JobDependency dependency) {
		if (!(dependency instanceof TypesettingModelJobDependency)) {
			return false;
		}
		var typesettingModelJobDependency = (TypesettingModelJobDependency) dependency;
		var descriptor = typesettingModelJobDependency.getDescriptor();
		return supports(descriptor);
	}

	@Override
	default void provide(JobDependency dependency) throws PrintException {
		var typesettingModelJobDependency = ((TypesettingModelJobDependency) dependency);
		typesettingModelJobDependency.setTypesettingModel(loadTypesettingModel(typesettingModelJobDependency.getDescriptor()));
	}
}
// end::TypesettingModelProviderInterface[]
