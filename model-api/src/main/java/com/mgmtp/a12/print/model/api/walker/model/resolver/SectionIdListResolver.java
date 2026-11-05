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
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.path.PrintModelPathElement;
import com.mgmtp.a12.print.model.api.model.section.ModelSection;
import com.mgmtp.a12.print.model.api.walker.model.PrintModelPath;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Resolves {@link ModelSection} IDs from a given list of {@link ModelSection}s.
 */
@OnlyForUsage
public class SectionIdListResolver implements SectionIdResolver {
	private final Map<String, SectionWithUsage> sectionMap;

	/**
	 * @deprecated Use {@link #SectionIdListResolver(Map)} instead. This constructor will be removed in the next major release.
	 */
	@Deprecated(since = "4.1.0", forRemoval = true)
	public SectionIdListResolver(List<PrintModelTreeTrace<ModelSection>> sectionList) {
		this.sectionMap = sectionList.stream()
			.collect(Collectors.toMap(sec -> sec.getTracedElement().getId(), SectionWithUsage::ofSection));
	}

	public SectionIdListResolver(Map<String, SectionWithUsage> sectionMap) {
		this.sectionMap = sectionMap;
	}

	/**
	 * Creates a new {@link SectionIdListResolver} from the {@link PrintModel}s {@link ModelSection} list.
	 * @deprecated Use {@link #fromModel(PrintModel, PrintFragmentModelResolver)} instead. This overload will be removed in the next major release.
	 */
	@Deprecated(since = "4.1.0", forRemoval = true)
	public static SectionIdListResolver fromModel(PrintModel printModel) {
		return new SectionIdListResolver(getSectionsOfPrintModel(printModel));
	}

	/**
	 * Creates a new {@link SectionIdListResolver} from the {@link PrintModel}s + {@link PrintFragmentModel}s {@link ModelSection} list.
	 */
	public static SectionIdListResolver fromModel(PrintModel printModel, PrintFragmentModelResolver printFragmentModelResolver) {
		final var result = new HashMap<>(getSectionsOfPrintModel(printModel));

		if (printModel.getContent().getSections().isEmpty()) {
			return new SectionIdListResolver(result);
		}

		final var itemsPerFragmentModel = new HashMap<String, Map<String, SectionWithUsage>>();
		for (final var reference : printModel.getContent().getSections().get().getReferences()) {
			final var currentFragmentModelName = reference.getModel();
			final Map<String, SectionWithUsage> fragmentItems;
			if (itemsPerFragmentModel.containsKey(currentFragmentModelName)) {
				fragmentItems = itemsPerFragmentModel.get(currentFragmentModelName);
			} else {
				final var fragmentModel = printFragmentModelResolver.resolvePrintFragmentModel(currentFragmentModelName).orElseThrow(() ->
					new PrintWalkerException(String.format("The Print Fragment Model %s cannot be resolved", currentFragmentModelName))
				);
				fragmentItems = getSectionsOfPrintModel(fragmentModel.getTracedElement());
				itemsPerFragmentModel.put(currentFragmentModelName, fragmentItems);
			}
			if (!fragmentItems.containsKey(reference.getRefId())) {
				throw new PrintWalkerException(String.format(
					"The Print Fragment Model Section %s from the Fragment Model %s could not be resolved",
					reference.getRefId(), currentFragmentModelName
				));
			}
			final var currentSection = fragmentItems.get(reference.getRefId());
			result.put(reference.getId(), new SectionWithUsage(currentSection.getSection(), reference.getSectionUsage()));
		}
		return new SectionIdListResolver(result);
	}

	private static Map<String, SectionWithUsage> getSectionsOfPrintModel(PrintModel printModel) {
		final var sectionsWithUsage = new HashMap<String, SectionWithUsage>();

		if (printModel.getContent().getSections().isEmpty()) {
			return sectionsWithUsage;
		}

		var path = PrintModelPath
			.create(printModel)
			.with(printModel.getContent(), 0)
			.with(new PrintModelPathElement.ObjectProperty("sections"),0);
		var i = 0;
		for (var e : printModel.getContent().getSections().get().getDefinitions()) {
			sectionsWithUsage.put(e.getId(), SectionWithUsage.ofSection(new PrintModelTreeTrace<>(
				path.with(new PrintModelPathElement.ObjectProperty("definitions"), i),
				e
			)));
			i++;
		}
		return sectionsWithUsage;
	}

	@Override
	public Optional<PrintModelTreeTrace<ModelSection>> resolveSectionId(String id) {
		final var section = sectionMap.get(id);
		return section == null ? Optional.empty() : Optional.of(section.getSection());
	}

	@Override
	public Optional<SectionWithUsage> resolveSectionIdWithUsage(String id) {
		return Optional.ofNullable(sectionMap.get(id));
	}
}
