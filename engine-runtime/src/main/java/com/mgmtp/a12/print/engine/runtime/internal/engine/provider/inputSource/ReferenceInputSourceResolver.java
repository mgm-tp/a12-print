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
package com.mgmtp.a12.print.engine.runtime.internal.engine.provider.inputSource;

import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.referenceResolver.ReferenceElementDependency;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalCorePrintEngineRuntime;
import com.mgmtp.a12.print.model.api.inputSource.InputValueSourceResolver;
import com.mgmtp.a12.print.model.api.model.PrintModelEntity;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.element.PrintModelElement;
import com.mgmtp.a12.print.model.api.model.internal.dto.reference.ElementReferenceDto;
import com.mgmtp.a12.print.model.api.model.reference.PlaceableReference;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.Optional;


@Builder
@AllArgsConstructor
public class ReferenceInputSourceResolver implements InputValueSourceResolver.ReferenceResolver {
	private final InternalCorePrintEngineRuntime runtime;
	private final PrintModelTreeTrace<PrintModelEntity> printModelTreeTrace;
	@Override
	public Optional<PrintModelTreeTrace<PrintModelEntity>> resolve(String referenceId) {
		if (printModelTreeTrace.getTracedElement() instanceof PrintModelElement) {
			final var reference = ElementReferenceDto.builder().refId(referenceId).build();

			final var elementTrace = runtime.provide(new ReferenceElementDependency(printModelTreeTrace.createDescendent(reference))).get();
			return elementTrace.flatMap(el -> el.tryCastTracedElement(PrintModelEntity.class));
		} else if (printModelTreeTrace.getTracedElement() instanceof PlaceableReference) {
			final var placeableReference = printModelTreeTrace.getPath().findReferenceCallSite(referenceId, false)
				.flatMap(e -> e.tryCastTracedElement(PlaceableReference.class))
				.orElseThrow(() -> new PrintException(
					String.format("The references placeable reference for the ID: %s is not in the path", referenceId)
				));
			return Optional.of(placeableReference.tryCastTracedElement(PrintModelEntity.class).orElseThrow());
		}
		throw new PrintException("Only print models and placeable references are supported for inherited reference resolution");
	}
}
