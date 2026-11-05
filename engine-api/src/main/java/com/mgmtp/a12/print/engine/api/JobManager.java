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
// tag::JobManagerInterface[]
package com.mgmtp.a12.print.engine.api;

// tag::Import[]

import com.mgmtp.a12.model.utils.OnlyForUsage;
import com.mgmtp.a12.print.engine.api.exception.impl.PrintCompilerException;
import com.mgmtp.a12.print.engine.api.message.PrintMessageReport;
import com.mgmtp.a12.print.model.api.model.PrintModel;
// end::Import[]


/**
 * Interface for the creation of new {@link PrintJob}s for a given {@link PrintModelId} and the preparation of {@link PrintModel}s.
 */
@OnlyForUsage
public interface JobManager {

	/**
	 * Prepare needs to be called once when the Print Model was added or changed during the lifetime of the manager.
	 * However, doing so every print is not required and will result in server performance penalties.
	 * Throws a {@link PrintCompilerException} for issues during compilation.
	 *
	 * @param printModel Print Model content to be printed
	 */
	PrintModelId prepare(String printModel) throws PrintCompilerException;

	/**
	 * Prepare needs to be called once when the Print Model was added or changed during the lifetime of the manager.
	 * However, doing so every print is not required and will result in server performance penalties.
	 * <p>
	 * Issues during compilation are captured as {@link com.mgmtp.a12.print.engine.api.message.PrintMessage}s
	 * in the returned {@link PrintMessageReport} rather than being thrown.
	 *
	 * @param printModel Print Model content to be printed
	 * @see #prepare(String)
	 */
	PrintMessageReport<PrintModelId> prepareWithReport(String printModel) throws PrintCompilerException;

	/**
	 * Create a new {@link PrintJob} from the given {@link PrintModelId}.
	 * The Print Model must already have been {@link #prepare(String) prepared}
	 * Throws a {@link PrintCompilerException} for issues during {@link PrintJob} creation
	 *
	 * @param printModelId Print Model ID
	 */
	PrintJob createNewJob(PrintModelId printModelId) throws PrintCompilerException;

	/**
	 * Create a new {@link PrintJob} from the given {@link PrintModelId}.
	 * The Print Model must already have been {@link #prepare(String) prepared}
	 * <p>
	 * Issues during {@link PrintJob} creation are captured as {@link com.mgmtp.a12.print.engine.api.message.PrintMessage}s
	 * in the returned {@link PrintMessageReport} rather than being thrown.
	 *
	 * @param printModelId Print Model ID
	 * @see #createNewJob(PrintModelId)
	 */
	PrintMessageReport<PrintJob> createNewJobWithReport(PrintModelId printModelId) throws PrintCompilerException;

	/**
	 * Waits until the asynchronous compilation started by {@link #prepare(String)} for the given
	 * {@link PrintModelId} has finished.
	 * @param printModelId Print Model ID returned by {@link #prepare(String)}
	 * @throws PrintCompilerException if the compilation failed or the Print Model was never prepared
	 */
	void awaitPreparation(PrintModelId printModelId) throws PrintCompilerException;

	/**
	 * Waits until the asynchronous compilation started by {@link #prepare(String)} for the given
	 * {@link PrintModelId} has finished.
	 * <p>
	 * Issues during compilation are captured as {@link com.mgmtp.a12.print.engine.api.message.PrintMessage}s
	 * in the returned {@link PrintMessageReport} rather than being thrown.
	 *
	 * @param printModelId Print Model ID returned by {@link #prepare(String)}
	 * @see #awaitPreparation(PrintModelId)
	 */
	PrintMessageReport<PrintModelId> awaitPreparationWithReport(PrintModelId printModelId);

	/**
	 * Allows to check if the Print Model with the given {@link PrintModelId} is already prepared
	 * @param printModelId Print Model ID
	 * @return boolean
	 */
	boolean isPrepared(PrintModelId printModelId);

	/**
	 * Drops the prepared (compiled) Print Model with the given {@link PrintModelId} from the cache,
	 * so that it is compiled again the next time it is needed.
	 * <p>
	 * After invalidation {@link #createNewJob(PrintModelId)} fails until the Print Model is
	 * {@link #prepare(String) prepared} again.
	 *
	 * @param printModelId Print Model ID
	 */
	void invalidatePreparedPrintModel(PrintModelId printModelId);
}
// end::JobManagerInterface[]
