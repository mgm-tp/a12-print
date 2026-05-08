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
package com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.pdfBoxEngine.componentTrees;

import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalPdfBoxPrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.pdfBoxEngine.ComponentTreeDependency;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.pdfBoxEngine.ComponentTreeReference;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.pdfBoxEngine.ComponentTreeResult;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.container.TopLevelReferenceContainer;
import com.mgmtp.a12.print.model.api.model.element.type.boundingBox.BoundingBox;
import lombok.EqualsAndHashCode;
import lombok.NonNull;
import lombok.Value;

import java.util.List;

import static com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.pdfBoxEngine.componentTrees.DefaultPageBreakInterruptionHandler.resolvePageBreakBehaviorSource;
import static com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.pdfBoxEngine.componentTrees.NestedContainerPageBreakHandler.handlePageBreakPreventContainerRendering;

@Value
@EqualsAndHashCode(callSuper = true)
public class BoundingBoxComponentTree extends ContainerComponentTree {

	@NonNull PrintModelTreeTrace<TopLevelReferenceContainer> parentTopLevelReferenceContainerTrace;
	@NonNull ComponentTreeReference componentTreeReference;
	@NonNull BoundingBox boundingBox;

	public BoundingBoxComponentTree(
		@NonNull String id,
		@NonNull BoundingBox container,
		@NonNull PrintModelTreeTrace<TopLevelReferenceContainer> parentTopLevelReferenceContainerTrace,
		@NonNull List<ComponentTreeReference> componentTreeReferences,
		@NonNull ComponentTreeReference componentTreeReference
	){
		super(id, container, componentTreeReferences);
		this.boundingBox = container;
		this.parentTopLevelReferenceContainerTrace = parentTopLevelReferenceContainerTrace;
		this.componentTreeReference = componentTreeReference;
	}

	@Override
	public ValueFactory<PageBreakInterruptResult<ComponentTreeResult>> produce(ComponentTreeDependency dependency, PrintJob job, PrintEngine<?> engine, InternalPdfBoxPrintEngineRuntime runtime) {
		final var printDocumentContext = dependency.getPrintDocumentContext();
		final var documentHandle = dependency.getContainerDocumentHandle();
		final var positionOffset = dependency.getPositionOffset();

		if (positionOffset == null) {
			throw new PrintException("There needs to be a position offset for bounding boxes");
		}

		final var pageBreakBehavior = resolvePageBreakBehaviorSource(componentTreeReference, runtime);

		final var componentTreeBuilder = ContainerTree.builder()
			.containerTrace(parentTopLevelReferenceContainerTrace.createDescendent(super.getContainer()))
			.containerComponentTreeReference(componentTreeReference)
			.componentTreeReferences(super.getComponentTreeReferences())
			.positionOffset(positionOffset)
			.containerDocumentHandle(documentHandle)
			.printDocumentContext(printDocumentContext)
			.runtime(runtime);

		return () -> handlePageBreakPreventContainerRendering(
			componentTreeBuilder,
			documentHandle,
			positionOffset,
			pageBreakBehavior,
			dependency.shouldInterruptOnPageBreak()
		);
	}
}
