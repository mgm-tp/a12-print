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
package com.mgmtp.a12.print.engine.runtime.utils;

import com.mgmtp.a12.kernel.md.model.api.IDocumentModel;
import com.mgmtp.a12.print.engine.api.PrintJobConfig;
import com.mgmtp.a12.print.engine.api.PrintModelId;
import com.mgmtp.a12.print.engine.runtime.ExecutorServiceFactory;
import com.mgmtp.a12.print.engine.runtime.PrintJobManager;
import com.mgmtp.a12.print.engine.runtime.internal.manager.PrintModelCompilerRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.PrintModelCompilationContext;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.PrintModelCompiler;
import com.mgmtp.a12.print.engine.runtime.test.internal.PrintTestUtil;
import com.mgmtp.a12.print.model.api.model.PrintModel;

import java.util.concurrent.ExecutorService;


public class PdfRuntimeTestUtil {

	public static ExecutorService getDefaultExecutorService() {
		return ExecutorServiceFactory.getInstance();
	}

	public static PrintJobManager.PrintJobManagerApi getPrintJobManagerApi(String printModelPath, String documentModel, String documentModelId) {
		return new PrintJobManager.PrintJobManagerApi() {
			@Override
			public String loadPrintModel(String id) {
				return PrintTestUtil.loadFromResources(printModelPath); // <1>
			}

			@Override
			public IDocumentModel loadDocumentModel(String id) {
				if (id.equals(documentModelId)) { // <2>
					return PrintTestUtil.loadDocumentModel(documentModel, documentModelId);
				}
				throw new RuntimeException(id);
			}
		};
	}

	public static PrintModelCompilerRuntime getPrintModelCompilerRuntime(PrintJobManager.PrintJobManagerApi managerApi) {
		var executorService = getDefaultExecutorService();
		return new PrintModelCompilerRuntime(executorService, managerApi, PrintJobConfig.DEFAULT);
	}

	public static PrintModelCompilationContext getPrintModelCompilationContext(PrintModel printModel, PrintModelCompilerRuntime printModelCompilerRuntime) {
		return PrintModelCompilationContext
			.builder()
			.id(PrintModelId.fromString(printModel.getHeader().getId()))
			.model(printModel)
			.compiler(
				new PrintModelCompiler(printModelCompilerRuntime)
			)
			.build();
	}
}
