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
package com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.pdfBoxEngine;

import com.mgmtp.a12.print.engine.runtime.internal.PrintEngineRuntimeDependency;
import com.mgmtp.a12.print.engine.runtime.internal.PrintEngineRuntimeStreamDependency;
import com.mgmtp.a12.print.engine.runtime.internal.RuntimeType;
import com.mgmtp.a12.print.engine.runtime.internal.engine.ValueDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.PrintDocumentContext;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.pdfBoxEngine.componentTrees.PageBreakInterruptResult;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.documentHandle.ContainerDocumentHandle;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.Position;
import lombok.Data;
import lombok.NonNull;
import lombok.experimental.Accessors;

@Data
@PrintEngineRuntimeDependency(type = RuntimeType.PDF_BOX)
@PrintEngineRuntimeStreamDependency(type = RuntimeType.PDF_BOX)
public class ComponentTreeManagerDependency implements ValueDependency<PageBreakInterruptResult<ComponentTreeResult>> {
	@NonNull
	private final String id;
	@NonNull
	private final ContainerDocumentHandle containerDocumentHandle;
	private final PrintDocumentContext printDocumentContext;
	private final Position positionOffset;
	@Accessors(fluent = true)
	private final boolean shouldInterruptOnPageBreak;

	public ComponentTreeManagerDependency(
		@NonNull String id,
		@NonNull ContainerDocumentHandle containerDocumentHandle,
		PrintDocumentContext printDocumentContext,
		Position positionOffset,
		boolean shouldInterruptOnPageBreak
	) {
		this.id = id;
		this.containerDocumentHandle = containerDocumentHandle;
		this.printDocumentContext = printDocumentContext;
		this.positionOffset = positionOffset;
		this.shouldInterruptOnPageBreak = shouldInterruptOnPageBreak;
	}

	public ComponentTreeManagerDependency(
		@NonNull String id,
		@NonNull ContainerDocumentHandle containerDocumentHandle,
		PrintDocumentContext printDocumentContext,
		boolean shouldInterruptOnPageBreak
	) {
		this.id = id;
		this.containerDocumentHandle = containerDocumentHandle;
		this.printDocumentContext = printDocumentContext;
		this.positionOffset = null;
		this.shouldInterruptOnPageBreak = shouldInterruptOnPageBreak;
	}
}
