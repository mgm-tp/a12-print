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
package com.mgmtp.a12.print.model.api.model;

import com.mgmtp.a12.print.model.api.model.path.PrintModelPathElement;
import com.mgmtp.a12.print.model.api.model.reference.ElementReference;
import com.mgmtp.a12.print.model.api.walker.model.PrintModelPath;
import lombok.Data;
import lombok.NonNull;

import java.util.Optional;
import java.util.function.Function;
import com.mgmtp.a12.model.utils.OnlyForUsage;

/**
 * Combines a given {@link PrintModelEntity} with it's {@link PrintModelPath} and gives additional related utility.
 */
@OnlyForUsage
@Data
public class PrintModelTreeTrace<T> {
	@NonNull
	private final PrintModelPath path;
	@NonNull
	private final T tracedElement;

	/**
	 * @return A new {@link PrintModelTreeTrace} with a path extended by the given {@link PrintModelEntity}.
	 */
	public <E> PrintModelTreeTrace<E> createDescendent(E e) {
		var newPath = path.with((PrintModelPathElement) tracedElement, 0);
		return new PrintModelTreeTrace<>(
			newPath,
			e
		);
	}

	/**
	 * @return An {@link ElementReference} from the path referencing given the id of the current element.
	 */
	public Optional<PrintModelTreeTrace<ElementReference>> findReferenceCallSite(Function<T, String> idSelector) {
		return path.findReferenceCallSite(idSelector.apply(tracedElement));
	}

	/**
	 * @return Trys to cast the current {@link PrintModelEntity} to the given Class, returns Empty if that is not possible.
	 */
	public <K> Optional<PrintModelTreeTrace<K>> tryCastTracedElement(Class<K> e) {
		if(e.isAssignableFrom(tracedElement.getClass())){
			return Optional.of(new PrintModelTreeTrace<K>(path, (K)tracedElement));
		} else {
			return Optional.empty();
		}
	}


}
