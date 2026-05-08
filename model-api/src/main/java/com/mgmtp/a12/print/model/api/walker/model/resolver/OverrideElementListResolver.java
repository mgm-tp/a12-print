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

import com.mgmtp.a12.print.model.api.model.PrintModel;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.element.ElementType;
import com.mgmtp.a12.print.model.api.model.element.PrintModelElement;
import com.mgmtp.a12.print.model.api.model.element.type.override.OverrideElement;
import com.mgmtp.a12.print.model.api.model.path.PrintModelPathElement;
import com.mgmtp.a12.print.model.api.model.reference.PrintModelReference;
import com.mgmtp.a12.print.model.api.walker.model.PrintModelPath;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Resolves {@link OverrideElement} IDs from a given list of {@link PrintModelElement}s.
 */
public class OverrideElementListResolver implements OverrideElementResolver {
	private final List<PrintModelTreeTrace<OverrideElement>> elementList;

	public OverrideElementListResolver(List<PrintModelTreeTrace<OverrideElement>> referenceList) {
		this.elementList = referenceList;
	}

	/**
	 * Creates a new {@link OverrideElementListResolver} from the {@link PrintModel}s {@link PrintModelElement} list.
	 */
	public static OverrideElementListResolver fromModel(PrintModel printModel) {
		final var elements = new ArrayList<PrintModelTreeTrace<OverrideElement>>();
		final var path = PrintModelPath
			.create(printModel)
			.with(printModel.getContent(), 0);

		var i = 0;
		for (var elementDefinition : printModel.getContent().getElementDefinitions()) {
			if (elementDefinition.getType().equals(ElementType.OVERRIDE)) {
				elements.add(
					new PrintModelTreeTrace<>(
						path.with(new PrintModelPathElement.ObjectProperty("elementDefinitions"), i),
						(OverrideElement) elementDefinition
					)
				);
			}
			i++;
		}

		return new OverrideElementListResolver(elements);
	}

	@Override
	public Optional<PrintModelTreeTrace<OverrideElement>> resolveOverriddenId(String referenceElementId) {
		return elementList.stream().filter(
			element -> element.getTracedElement().getOverrideProperties().getRefId().equals(referenceElementId)
		).findFirst();
	}
}
