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
import com.mgmtp.a12.print.model.api.model.element.PrintModelElement;
import com.mgmtp.a12.print.model.api.model.element.type.override.OverrideElement;
import com.mgmtp.a12.print.model.api.model.path.PrintModelPathElement;
import com.mgmtp.a12.print.model.api.model.section.ModelSection;
import com.mgmtp.a12.print.model.api.walker.model.PrintModelPath;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.mgmtp.a12.model.utils.OnlyForUsage;

/**
 * Resolves {@link ModelSection} IDs from a given list of {@link ModelSection}s.
 */
@OnlyForUsage
public class SectionIdListResolver implements SectionIdResolver {
	private final List<PrintModelTreeTrace<ModelSection>> sectionList;

	public SectionIdListResolver(List<PrintModelTreeTrace<ModelSection>> sectionList) {
		this.sectionList = sectionList;
	}

	/**
	 * Creates a new {@link SectionIdListResolver} from the {@link PrintModel}s {@link ModelSection} list.
	 */
	public static SectionIdListResolver fromModel(PrintModel printModel) {
		if (printModel.getContent().getSections().isPresent()) {

			var path = PrintModelPath
				.create(printModel)
				.with(printModel.getContent(), 0)
				.with(new PrintModelPathElement.ObjectProperty("sections"),0);
			var sections = new ArrayList<PrintModelTreeTrace<ModelSection>>();
			var i = 0;
			for (var e : printModel.getContent().getSections().get().getDefinitions()) {
				sections.add(new PrintModelTreeTrace<>(
					path.with(new PrintModelPathElement.ObjectProperty("definitions"), i),
					e
				));
				i++;
			}
			return new SectionIdListResolver(sections);
		}
		return new SectionIdListResolver(new ArrayList<>());
	}

	@Override
	public Optional<PrintModelTreeTrace<ModelSection>> resolveSectionId(String id) {
		return sectionList.stream().filter(
			section -> section.getTracedElement().getId().equals(id)
		).findFirst();
	}
}
