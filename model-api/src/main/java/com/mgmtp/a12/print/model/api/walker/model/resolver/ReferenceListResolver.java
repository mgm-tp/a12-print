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
import com.mgmtp.a12.print.model.api.model.reference.ElementReference;
import com.mgmtp.a12.print.model.api.walker.model.PrintModelPath;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Resolves {@link ElementReference}s from a given list of {@link PrintModelElement}s.
 */
public class ReferenceListResolver implements ReferenceResolver {
	private final List<PrintModelTreeTrace<PrintModelElement>> elementList;

	public ReferenceListResolver(List<PrintModelTreeTrace<PrintModelElement>> elementList) {
		this.elementList = elementList;
	}

	/**
	 * Creates a new {@link ReferenceListResolver} from the {@link PrintModel}s {@link PrintModelElement} list.
	 */
	public static ReferenceListResolver fromModel(PrintModel printModel) {
		var elements = new ArrayList<PrintModelTreeTrace<PrintModelElement>>();
		var path = PrintModelPath
			.create(printModel)
			.with(printModel.getContent(), 0);

		var i = 0;
		for (var elementDefinition : printModel.getContent().getElementDefinitions()) {
			elements.add(
				new PrintModelTreeTrace<>(
					path.with(new PrintModelPathElement.ObjectProperty("elementDefinitions"), i),
					elementDefinition
				)
			);
			i++;
		}

		return new ReferenceListResolver(elements);
	}

	@Override
	public Optional<PrintModelTreeTrace<PrintModelElement>> resolveReference(PrintModelTreeTrace<? extends ElementReference> elementReference) {
		return elementList.stream().filter(
			element ->
				element.getTracedElement().getId().equals(elementReference.getTracedElement().getRefId()) ||
					(element.getTracedElement() instanceof OverrideElement overrideElement && overrideElement.getOverrideProperties().getRefId().equals(
						elementReference.getTracedElement().getRefId()
					))
		).findFirst();
	}
}
