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
package com.mgmtp.a12.print.model.api.model.general;

import com.mgmtp.a12.print.model.api.model.PrintModelEntity;
import com.mgmtp.a12.print.model.api.model.element.base.ComputationAlternative;
import com.mgmtp.a12.print.model.api.model.element.properties.RuntimeVariable;

import java.util.List;

public interface General extends PrintModelEntity {
	/**
	 * @deprecated Use {@link Metadata#getTitleComputation()} instead.
	 * Note: Title information is now stored in an array of {@link ComputationAlternative}.
	 */
	@Deprecated(since = "3.2.0", forRemoval = true)
	String getTitle();

	/**
	 * @deprecated Use {@link #getMetadata()} to access metadata fields.
	 * Note: Fields from {@link Details} are now stored in an array of {@link ComputationAlternative}.
	 */
	@Deprecated(since = "3.2.0", forRemoval = true)
	Details getDetails();

	Metadata getMetadata();

	SegmentDefaults getSegmentDefaults();

	List<RuntimeVariable> getRuntimeVariables();

	/**
	 * @return List of {@link com.mgmtp.a12.print.model.api.model.textStyle.TextStyle} ids that are in use in this print model. Therefor it can also be empty even with available text styles.
	 */
	List<String> getTextStyles();

	/**
	 * @return List of {@link com.mgmtp.a12.print.model.api.model.segment.ModelSegment} ids. The order defines the segments order during rendering of the pdf file.
	 */
	List<String> getStructure();

	/**
	 * @return List of {@link com.mgmtp.a12.print.model.api.model.section.ModelSection} ids that are in use in this print model. Therefor it can also be empty even with available sections.
	 */
	List<String> getSections();

	/**
	 * @return List of {@link com.mgmtp.a12.print.model.api.model.watermark.Watermark} ids that are in use in this print model. Therefor it can also be empty even with available watermarks.
	 */
	List<String> getWatermarks();
}
