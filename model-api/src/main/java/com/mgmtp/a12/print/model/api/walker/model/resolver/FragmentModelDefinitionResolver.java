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
import com.mgmtp.a12.print.model.api.model.container.DefinitionsContainer;
import com.mgmtp.a12.print.model.api.model.path.PrintModelPathElement;
import com.mgmtp.a12.print.model.api.model.reference.FragmentReference;
import com.mgmtp.a12.print.model.api.walker.model.PrintModelPath;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

class FragmentModelDefinitionResolver {

	private FragmentModelDefinitionResolver() {}

	static <T> Map<String, PrintModelTreeTrace<T>> resolveWithFragmentModels(
		Map<String, PrintModelTreeTrace<T>> ownItems,
		List<FragmentReference> references,
		Function<PrintModel, Map<String, PrintModelTreeTrace<T>>> extractFromModel,
		PrintFragmentModelResolver fragmentModelResolver,
		String elementTypeName
	) {
		final var result = new HashMap<>(ownItems);
		final var itemsPerFragmentModel = new HashMap<String, Map<String, PrintModelTreeTrace<T>>>();
		for (final var reference : references) {
			final var currentFragmentModelName = reference.getModel();
			final Map<String, PrintModelTreeTrace<T>> fragmentItems;
			if (itemsPerFragmentModel.containsKey(currentFragmentModelName)) {
				fragmentItems = itemsPerFragmentModel.get(currentFragmentModelName);
			} else {
				final var fragmentModel = fragmentModelResolver.resolvePrintFragmentModel(currentFragmentModelName).orElseThrow(() ->
					new PrintWalkerException(String.format("The Print Fragment Model %s cannot be resolved", currentFragmentModelName))
				);
				fragmentItems = extractFromModel.apply(fragmentModel.getTracedElement());
				itemsPerFragmentModel.put(currentFragmentModelName, fragmentItems);
			}
			if (!fragmentItems.containsKey(reference.getRefId())) {
				throw new PrintWalkerException(String.format(
					"The Print Fragment Model %s %s from the Fragment Model %s could not be resolved",
					elementTypeName, reference.getRefId(), currentFragmentModelName
				));
			}
			result.put(reference.getId(), fragmentItems.get(reference.getRefId()));
		}
		return result;
	}

	static <T> Map<String, PrintModelTreeTrace<T>> loadDefinitions(
		PrintModel printModel,
		String pathKey,
		DefinitionsContainer definitionsContainer
	) {
		var path = PrintModelPath
			.create(printModel)
			.with(printModel.getContent(), 0)
			.with(new PrintModelPathElement.ObjectProperty(pathKey),0);
		var definitions = new HashMap<String, PrintModelTreeTrace<T>>();
		var i = 0;
		for (var e : definitionsContainer.getDefinitions()) {
			definitions.put(e.getId(), new PrintModelTreeTrace<>(
				path.with(new PrintModelPathElement.ObjectProperty("definitions"), i),
				(T) e
			));
			i++;
		}
		return definitions;
	}
}
