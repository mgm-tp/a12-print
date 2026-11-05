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
package com.mgmtp.a12.print.model.api.walker.model.resolver;

import com.mgmtp.a12.print.model.api.exceptions.PrintWalkerException;
import com.mgmtp.a12.print.model.api.model.PrintModel;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.element.PrintModelElement;
import com.mgmtp.a12.print.model.api.model.reference.ElementReference;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Supplier;

import com.mgmtp.a12.model.utils.OnlyForUsage;
import com.mgmtp.a12.print.model.api.model.reference.PlaceableReference;

/**
 * Resolves {@link ElementReference}s in multiple {@link PrintModel}s.
 */
@OnlyForUsage
public class ReferenceMultiModelResolver implements ReferenceResolver {
	// concurrent, because a single instance is shared by the parallel value producers of a Print Job
	private final Map<String, ReferenceResolver> elementListByPrintModelId = new ConcurrentHashMap<>();
	private final PrintFragmentModelResolver printFragmentModelResolver;

	/**
	 * @deprecated Use {@link #ReferenceMultiModelResolver(PrintFragmentModelResolver, PrintModel...)} instead. This constructor will be removed in the next major release.
	 */
	@Deprecated(since = "4.1.0", forRemoval = true)
	public ReferenceMultiModelResolver(PrintModel... printModels) {
		this.printFragmentModelResolver = null;
		for (PrintModel printModel : printModels) {
			this.elementListByPrintModelId.put(printModel.getHeader().getId(), ReferenceListResolver.fromModel(printModel));
		}
	}

	public ReferenceMultiModelResolver(PrintFragmentModelResolver printFragmentModelResolver, PrintModel... printModels) {
		this.printFragmentModelResolver = printFragmentModelResolver;
		for (PrintModel printModel : printModels) {
			this.elementListByPrintModelId.put(printModel.getHeader().getId(), ReferenceListResolver.fromModel(printModel));
		}
	}

	/**
	 * @deprecated Use {@link #fromModel(PrintModel, PrintFragmentModelResolver)} instead. This overload will be removed in the next major release.
	 */
	@Deprecated(since = "4.1.0", forRemoval = true)
	public static ReferenceMultiModelResolver fromModel(PrintModel printModel) {
		return new ReferenceMultiModelResolver(printModel);
	}

	public static ReferenceMultiModelResolver fromModel(
		PrintModel printModel,
		PrintFragmentModelResolver printFragmentModelResolver
	) {
		return new ReferenceMultiModelResolver(printFragmentModelResolver, printModel);
	}

	@Override
	public Optional<PrintModelTreeTrace<PrintModelElement>> resolveReference(PrintModelTreeTrace<? extends ElementReference> elementReference) {
		if (elementReference.getTracedElement() instanceof PlaceableReference placeableReference && placeableReference.getModel().isPresent()) {
			final var printFragmentModelId = placeableReference.getModel().get();
			return resolveReference(
				elementReference,
				printFragmentModelId,
				() -> Optional.ofNullable(printFragmentModelResolver)
					.orElseThrow(() -> new PrintWalkerException(String.format(
						"The Print Fragment Model %s cannot be resolved because the Resolver is not defined",
						printFragmentModelId)))
					.resolvePrintFragmentModel(printFragmentModelId)
					.orElseThrow(() -> new PrintWalkerException(String.format(
						"The Print Fragment Model %s cannot be resolved",
						printFragmentModelId)))
					.getTracedElement()
			);
		}

		return elementReference.getPath().findPrintModel().flatMap(printModelTrace -> {
			PrintModel printModel = printModelTrace.getTracedElement();
			String printModelId = printModel.getHeader().getId();
			return resolveReference(
				elementReference,
				printModelId,
				() -> printModel
			);
		});
	}

	private Optional<PrintModelTreeTrace<PrintModelElement>> resolveReference(
		PrintModelTreeTrace<? extends ElementReference> elementReference,
		String printModelId,
		Supplier<PrintModel> printModelLoader
	) {
		return elementListByPrintModelId
			.computeIfAbsent(printModelId, id -> ReferenceListResolver.fromModel(printModelLoader.get()))
			.resolveReference(elementReference);
	}
}
