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
package com.mgmtp.a12.print.engine.api;

// tag::Import[]

import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.model.api.model.PrintModel;
// end::Import[]


/**
 * Interface for the creation of new {@link PrintJob}s for a given {@link PrintModelId} and the preparation of {@link PrintModel}s.
 */
public interface JobManager {

	/**
	 * Prepare needs to be called once when the printModel was added or changed during the lifetime of the manager.
	 * However, doing so every print is not required and will result in server performance penalties
	 *
	 * @param printModel Print model content to be print
	 */
	PrintModelId prepare(String printModel) throws PrintException;

	/**
	 * Create a new {@link PrintJob} from the given {@link PrintModelId}.
	 * Compiles the print model if it has not already been compiled.
	 *
	 * @param printModelId Print model Id
	 */
	PrintJob createNewJob(PrintModelId printModelId) throws PrintException;

}
