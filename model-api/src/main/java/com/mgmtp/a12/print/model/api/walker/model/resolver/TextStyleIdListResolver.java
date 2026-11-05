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

import com.mgmtp.a12.model.utils.OnlyForUsage;
import com.mgmtp.a12.print.model.api.exceptions.PrintWalkerException;
import com.mgmtp.a12.print.model.api.model.PrintFragmentModel;
import com.mgmtp.a12.print.model.api.model.PrintModel;
import com.mgmtp.a12.print.model.api.model.PrintModelEntity;
import com.mgmtp.a12.print.model.api.model.reference.FragmentReference;
import com.mgmtp.a12.print.model.api.model.textStyle.TextStyle;
import com.mgmtp.a12.print.model.api.model.textStyle.TextStylesContainer;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Resolves {@link TextStyle} IDs from a given list of {@link TextStyle}s.
 */
@OnlyForUsage
public class TextStyleIdListResolver implements TextStyleIdResolver {
	private static final String FRAGMENT_PURPOSE = "print-fragment";

	private final Map<String, TextStyle> textStyleMap;

	/**
	 * @deprecated Use {@link #TextStyleIdListResolver(Map)} instead. This constructor will be removed in the next major release.
	 */
	@Deprecated(since = "4.1.0", forRemoval = true)
	public TextStyleIdListResolver(List<TextStyle> textStyleList) {
		this.textStyleMap = textStyleList.stream()
			.collect(Collectors.toMap(PrintModelEntity::getId, Function.identity()));
	}

	public TextStyleIdListResolver(Map<String, TextStyle> textStyleMap) {
		this.textStyleMap = textStyleMap;
	}

	/**
	 * Creates a new {@link TextStyleIdListResolver} from the {@link PrintModel}s {@link TextStyle} list.
	 * @deprecated Use {@link #fromModel(PrintModel, PrintFragmentModelResolver)} instead. This overload will be removed in the next major release.
	 */
	@Deprecated(since = "4.1.0", forRemoval = true)
	public static TextStyleIdListResolver fromModel(PrintModel printModel) {
		return new TextStyleIdListResolver(getTextStylesOfPrintModel(printModel));
	}

	/**
	 * Creates a new {@link TextStyleIdListResolver} from the {@link PrintModel}s + {@link PrintFragmentModel}s {@link TextStyle} list.
	 */
	public static TextStyleIdListResolver fromModel(PrintModel printModel, PrintFragmentModelResolver printFragmentModelResolver) {
		final var result = new HashMap<>(getTextStylesOfPrintModel(printModel));

		// Fragment styles under their fragment-local id, for elements inside the fragment.
		for (final var modelReference : printModel.getHeader().getModelReferences()) {
			if (!FRAGMENT_PURPOSE.equals(modelReference.getPurpose())) {
				continue;
			}
			final var fragmentModel = printFragmentModelResolver.resolvePrintFragmentModel(modelReference.getReference()).orElseThrow(() ->
				new PrintWalkerException(String.format("The Print Fragment Model %s cannot be resolved", modelReference.getReference()))
			);
			result.putAll(getTextStylesOfPrintModel(fragmentModel.getTracedElement()));
		}

		// Alias id: for each fragment style the print model reuses in its own elements.
		for (final var reference : referencedTextStyles(printModel)) {
			if (!result.containsKey(reference.getRefId())) {
				throw new PrintWalkerException(String.format(
					"The Print Fragment Model TextStyle %s from the Fragment Model %s could not be resolved",
					reference.getRefId(), reference.getModel()
				));
			}
			result.put(reference.getId(), result.get(reference.getRefId()));
		}
		return new TextStyleIdListResolver(result);
	}

	private static List<FragmentReference> referencedTextStyles(PrintModel printModel) {
		return printModel.getContent().getTextStyles().map(TextStylesContainer::getReferences).orElse(List.of());
	}

	private static Map<String, TextStyle> getTextStylesOfPrintModel(PrintModel printModel) {
		final var definitions = new HashMap<String, TextStyle>();
		final var textStyles = printModel.getContent().getTextStyles();
		if (textStyles.isEmpty()) {
			return definitions;
		}
		for (final var textStyle : textStyles.get().getDefinitions()) {
			definitions.put(textStyle.getId(), textStyle);
		}
		return definitions;
	}

	@Override
	public Optional<TextStyle> resolveTextStyleId(String id) {
		return Optional.ofNullable(textStyleMap.get(id));
	}
}
