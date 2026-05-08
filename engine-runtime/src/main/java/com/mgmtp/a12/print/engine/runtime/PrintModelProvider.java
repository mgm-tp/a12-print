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
package com.mgmtp.a12.print.engine.runtime;

import com.mgmtp.a12.print.engine.api.JobDependency;
import com.mgmtp.a12.print.engine.api.JobDependencyProvider;
import com.mgmtp.a12.print.engine.api.PrintModelId;
import com.mgmtp.a12.print.engine.api.a12.PrintModelDependencyDescriptor;
import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.internal.PrintModelJobDependency;
import com.mgmtp.a12.print.model.api.model.PrintModel;
import lombok.NonNull;

import java.util.function.Function;

/**
 * Interface for loading {@link PrintModel}s.
 */
public interface PrintModelProvider extends JobDependencyProvider {
	static PrintModelProvider fromLoader(final @NonNull Function<PrintModelId, PrintModel> loading) {
		return new PrintModelProvider() {
			@Override
			public boolean supports(PrintModelDependencyDescriptor printModelDependencyDescriptor) {
				return true;
			}

			@Override
			public PrintModel loadPrintModel(PrintModelDependencyDescriptor descriptor) {
				return loading.apply(descriptor.getPrintModelId());
			}
		};
	}

	/**
	 * @return true, if the {@link PrintModel} referenced by the ID is supported by the provider.
	 */
	boolean supports(PrintModelDependencyDescriptor printModelDependencyDescriptor);

	PrintModel loadPrintModel(PrintModelDependencyDescriptor descriptor);

	/**
	 * @return true, if the {@link PrintModel} needed by the {@link JobDependency}.
	 */
	default boolean canProvide(JobDependency dependency) {
		if (!(dependency instanceof PrintModelJobDependency)) {
			return false;
		}
		var printModelJobDependency = (PrintModelJobDependency) dependency;
		var descriptor = printModelJobDependency.getDescriptor();
		return supports(descriptor);
	}

	@Override
	default void provide(JobDependency dependency) throws PrintException {
		var printModelJobDependency = ((PrintModelJobDependency) dependency);
		printModelJobDependency.setPrintModel(loadPrintModel(printModelJobDependency.getDescriptor()));
	}

}
