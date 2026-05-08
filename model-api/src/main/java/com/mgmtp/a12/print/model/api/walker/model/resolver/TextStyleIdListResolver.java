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
import com.mgmtp.a12.print.model.api.model.segment.ModelSegment;
import com.mgmtp.a12.print.model.api.model.textStyle.TextStyle;
import com.mgmtp.a12.print.model.api.model.textStyle.TextStylesContainer;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

/**
 * Resolves {@link TextStyle} IDs from a given list of {@link TextStyle}s.
 */
public class TextStyleIdListResolver implements TextStyleIdResolver {
	private final List<TextStyle> textStyleList;

	public TextStyleIdListResolver(List<TextStyle> textStyleList) {
		this.textStyleList = textStyleList;
	}

	/**
	 * Creates a new {@link TextStyleIdListResolver} from the {@link PrintModel}s {@link TextStyle} list.
	 */
	public static TextStyleIdListResolver fromModel(PrintModel printModel) {
		return new TextStyleIdListResolver(printModel.getContent().getTextStyles().map(TextStylesContainer::getDefinitions)
			.orElseGet(Collections::emptyList));
	}
	@Override
	public Optional<TextStyle> resolveTextStyleId(String id) {
		return textStyleList.stream()
			.filter(style -> style.getId().equals(id))
			.findFirst();
	}
}
