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
package com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.element;

import com.mgmtp.a12.print.engine.runtime.internal.PrintEngineRuntimeDependency;
import com.mgmtp.a12.print.engine.runtime.internal.PrintEngineRuntimeStreamDependency;
import com.mgmtp.a12.print.engine.runtime.internal.RuntimeType;
import com.mgmtp.a12.print.engine.runtime.internal.engine.ValueDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.PrintDocumentContext;
import com.mgmtp.a12.print.engine.runtime.modelDocument.ModelDocumentPrintEngine;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.container.BaseReferenceContainer;
import com.mgmtp.a12.print.model.api.model.container.PlaceableReferenceContainer;
import com.mgmtp.a12.print.model.api.model.reference.ElementReference;
import com.mgmtp.a12.print.model.api.model.reference.PlaceableReference;
import com.mgmtp.a12.print.model.document.internal.base.IPrintElement;
import lombok.Data;

import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;


@Data
@PrintEngineRuntimeDependency(type = RuntimeType.MODEL_DOCUMENT)
@PrintEngineRuntimeStreamDependency(type = RuntimeType.MODEL_DOCUMENT)
public class ReferenceModelDocumentDependency implements ValueDependency<AttachmentWrapper<IPrintElement>> {

	public static final Comparator<Object> REFERENCE_COMPARATOR = Comparator
		.comparingInt(r -> ((PlaceableReference) r).getPosition().getY().getValue())
		.thenComparingInt(r -> ((PlaceableReference) r).getPosition().getX().getValue())
		.thenComparingInt(r -> ((PlaceableReference) r).getScreenReadingOrder().getScreenReadingOrderWeight());

	private final PrintModelTreeTrace<? extends ElementReference> reference;
	private final PrintDocumentContext printDocumentContext;
	private final List<ModelDocumentPrintEngine.OverriddenBoundingBoxes> overriddenBoundingBoxes;

	public static Stream<ReferenceModelDocumentDependency> ofContainerReferences(
		final PrintModelTreeTrace<? extends BaseReferenceContainer<? extends ElementReference>> path,
		final PrintDocumentContext document,
		final List<ModelDocumentPrintEngine.OverriddenBoundingBoxes> overriddenBoundingBoxes
	) {
		return path.getTracedElement().getReferences().stream()
			.sorted(path.getTracedElement() instanceof PlaceableReferenceContainer
				? REFERENCE_COMPARATOR
				: (r1, r2) -> 0)
			.map(e -> new ReferenceModelDocumentDependency(path.createDescendent(e), document, overriddenBoundingBoxes));
	}

	public static Stream<ReferenceModelDocumentDependency> ofReferences(
		final Collection<PrintModelTreeTrace<PlaceableReference>> references,
		final PrintDocumentContext document,
		final List<ModelDocumentPrintEngine.OverriddenBoundingBoxes> overriddenBoundingBoxes
	) {
		return references.stream()
			.sorted((r1, r2) -> REFERENCE_COMPARATOR.compare(r1.getTracedElement(), r2.getTracedElement()))
			.map(e -> new ReferenceModelDocumentDependency(e, document, overriddenBoundingBoxes));
	}
}
