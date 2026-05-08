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
package com.mgmtp.a12.print.engine.runtime.internal.runtime;

import com.mgmtp.a12.print.engine.api.PrintModelId;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.loader.PrintModelDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.referenceElementResolver.PrintModelReferenceElementDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.referenceResolver.ReferenceElementDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.sectionResolver.SectionDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.segmentResolver.SegmentDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.watermarkResolver.WatermarkDependency;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalCorePrintEngineRuntime;
import com.mgmtp.a12.print.model.api.model.PrintModel;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.container.BaseReferenceContainer;
import com.mgmtp.a12.print.model.api.model.element.PrintModelElement;
import com.mgmtp.a12.print.model.api.model.reference.ElementReference;
import com.mgmtp.a12.print.model.api.walker.model.PrintModelPath;
import com.mgmtp.a12.print.model.api.walker.model.PrintModelVisitor;
import com.mgmtp.a12.print.model.api.walker.model.PrintModelWalker;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.List;
import java.util.Optional;
import java.util.function.Function;

@Builder
@AllArgsConstructor
public class RuntimeWalker<Runtime extends  InternalCorePrintEngineRuntime> {
	private final Runtime runtime;

	public <V extends PrintModelVisitor, R> R walkPrintModel(
		final PrintModel printModel,
		final V visitor,
		final Function<V, R> resultExtractor
	) {
		new PrintModelWalker(
			visitor,
			e -> runtime.provide(new ReferenceElementDependency(e)).get(),
			id -> runtime.provide(new SegmentDependency(id)).get(),
			id -> runtime.provide(new SectionDependency(id)).get(),
			id -> runtime.provide(new WatermarkDependency(id)).get(),
			id -> runtime.provide(new PrintModelReferenceElementDependency(id)).get(),
			id -> Optional.of(providePrintModelResolver(id, runtime))
		).walkPrintModel(printModel);
		return resultExtractor.apply(visitor);
	}

	public <V extends PrintModelVisitor, R> R walkStructure(
		final PrintModelPath head,
		final V visitor,
		final List<String> structure,
		final Function<V, R> resultExtractor
	) {
		new PrintModelWalker(
			visitor,
			e -> runtime.provide(new ReferenceElementDependency(e)).get(),
			id -> runtime.provide(new SegmentDependency(id)).get(),
			id -> runtime.provide(new SectionDependency(id)).get(),
			id -> runtime.provide(new WatermarkDependency(id)).get(),
			id -> runtime.provide(new PrintModelReferenceElementDependency(id)).get(),
			id -> Optional.of(providePrintModelResolver(id, runtime))
		).walkStructure(head, structure);
		return resultExtractor.apply(visitor);
	}

	public <V extends PrintModelVisitor, R> R walkWatermarks(
		final PrintModelPath head,
		final V visitor,
		final List<String> watermarks,
		final Function<V, R> resultExtractor
	) {
		new PrintModelWalker(
			visitor,
			e -> runtime.provide(new ReferenceElementDependency(e)).get(),
			id -> runtime.provide(new SegmentDependency(id)).get(),
			id -> runtime.provide(new SectionDependency(id)).get(),
			id -> runtime.provide(new WatermarkDependency(id)).get(),
			id -> runtime.provide(new PrintModelReferenceElementDependency(id)).get(),
			id -> Optional.of(providePrintModelResolver(id, runtime))
		).walkWatermarks(head, watermarks);
		return resultExtractor.apply(visitor);
	}

	public <V extends PrintModelVisitor, R> R walkSections(
		final PrintModelPath head,
		final V visitor,
		final List<String> sections,
		final Function<V, R> resultExtractor
	) {
		new PrintModelWalker(
			visitor,
			e -> runtime.provide(new ReferenceElementDependency(e)).get(),
			id -> runtime.provide(new SegmentDependency(id)).get(),
			id -> runtime.provide(new SectionDependency(id)).get(),
			id -> runtime.provide(new WatermarkDependency(id)).get(),
			id -> runtime.provide(new PrintModelReferenceElementDependency(id)).get(),
			id -> Optional.of(providePrintModelResolver(id, runtime))
		).walkSections(head, sections);
		return resultExtractor.apply(visitor);
	}

	private static PrintModelTreeTrace<PrintModel> providePrintModelResolver(
		String id,
		InternalCorePrintEngineRuntime runtime
	) {
		return runtime.provide(new PrintModelDependency(PrintModelId.fromString(id)))
			.map(printModel -> new PrintModelTreeTrace<>(PrintModelPath.create(printModel), printModel))
			.get();
	};

	public <V extends PrintModelVisitor, R> R walkElement(
		final V visitor,
		final PrintModelTreeTrace<? extends PrintModelElement> trace,
		final Function<V, R> resultExtractor
	) {
		return PrintModelWalker.walkElement(
			visitor,
			e -> runtime.provide(new ReferenceElementDependency(e)).get(),
			id -> runtime.provide(new SegmentDependency(id)).get(),
			id -> runtime.provide(new SectionDependency(id)).get(),
			id -> runtime.provide(new WatermarkDependency(id)).get(),
			id -> runtime.provide(new PrintModelReferenceElementDependency(id)).get(),
			id -> Optional.of(providePrintModelResolver(id, runtime)),
			trace.getPath(),
			trace.getTracedElement(),
			resultExtractor
		);
	}

	public <V extends PrintModelVisitor, R> R walkContainer(
		final V visitor,
		final PrintModelTreeTrace<? extends BaseReferenceContainer<? extends ElementReference>> trace,
		final Function<V, R> resultExtractor
	) {
		return PrintModelWalker.walkContainer(
			visitor,
			e -> runtime.provide(new ReferenceElementDependency(e)).get(),
			id -> runtime.provide(new SegmentDependency(id)).get(),
			id -> runtime.provide(new SectionDependency(id)).get(),
			id -> runtime.provide(new WatermarkDependency(id)).get(),
			id -> runtime.provide(new PrintModelReferenceElementDependency(id)).get(),
			id -> Optional.of(providePrintModelResolver(id, runtime)),
			trace.getPath(),
			trace.getTracedElement(),
			resultExtractor
		);
	}

	public <V extends PrintModelVisitor, R> R walkReference(
		final V visitor,
		final PrintModelTreeTrace<? extends ElementReference> trace,
		final Function<V, R> resultExtractor
	) {

		return PrintModelWalker.walkReference(
			visitor,
			e -> runtime.provide(new ReferenceElementDependency(e)).get(),
			id -> runtime.provide(new SegmentDependency(id)).get(),
			id -> runtime.provide(new SectionDependency(id)).get(),
			id -> runtime.provide(new WatermarkDependency(id)).get(),
			id -> runtime.provide(new PrintModelReferenceElementDependency(id)).get(),
			id -> Optional.of(providePrintModelResolver(id, runtime)),
			trace.getPath(),
			trace.getTracedElement(),
			resultExtractor
		);
	}

	public <V extends PrintModelVisitor, R> R walkReferenceContainer(
		final PrintModelPath head,
		final V visitor,
		final BaseReferenceContainer<? extends ElementReference> container,
		final Function<V, R> resultExtractor
	) {
		return PrintModelWalker.walkReferenceContainer(
			visitor,
			e -> runtime.provide(new ReferenceElementDependency(e)).get(),
			id -> runtime.provide(new SegmentDependency(id)).get(),
			id -> runtime.provide(new SectionDependency(id)).get(),
			id -> runtime.provide(new WatermarkDependency(id)).get(),
			id -> runtime.provide(new PrintModelReferenceElementDependency(id)).get(),
			id -> Optional.of(providePrintModelResolver(id, runtime)),
			head,
			container,
			resultExtractor
		);
	}


}
