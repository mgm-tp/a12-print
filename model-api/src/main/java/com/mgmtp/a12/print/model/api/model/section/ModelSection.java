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
package com.mgmtp.a12.print.model.api.model.section;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.mgmtp.a12.model.utils.OnlyForUsage;
import com.mgmtp.a12.print.model.api.model.container.TopLevelReferenceContainer;
import com.mgmtp.a12.print.model.api.model.element.base.Measure;

@OnlyForUsage
public interface ModelSection extends TopLevelReferenceContainer {
	String getTitle();
	SectionUsage getSectionUsage();
	Measure getHeaderHeight();
	Measure getFooterHeight();

	/**
	 * @return the Y position of the footer
	 */
	default int getActualFooterHeight() {
		return this.getPageOrientation().getPageHeight() - this.getFooterHeight().getValue();
	}

	/**
	 * Where a {@link ModelSection} is used.
	 * {@link SectionUsage#FIRST} sections are only displayed on the first page of the resulting pdf.
	 * {@link SectionUsage#REMAINING} sections are displayed on every page that is not already displaying a {@link SectionUsage#FIRST} section.
	 */
	@OnlyForUsage
	enum SectionUsage {
		@JsonProperty("First") FIRST,
		@JsonProperty("Remaining") REMAINING,
	}
}
