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
package com.mgmtp.a12.print.engine.runtime.xml.internal.model.segment;

import com.mgmtp.a12.print.engine.runtime.xml.internal.model.base.PrintElementContainerXml;
import com.mgmtp.a12.print.engine.runtime.xml.internal.model.base.IPrintElementXml;
import com.mgmtp.a12.print.engine.runtime.xml.internal.model.section.PrintSectionXml;
import com.mgmtp.a12.print.engine.runtime.xml.internal.model.watermark.PrintWatermarkXml;
import jakarta.xml.bind.annotation.*;

import java.util.List;

@XmlRootElement(name = "segment")
@XmlType(propOrder = {"watermark", "headerSections", "elements", "footerSections"})
public class PrintSegmentXml extends PrintElementContainerXml {
	@XmlElementWrapper(name = "headerSections")
	@XmlElementRef
	private List<PrintSectionXml> headerSections;

	@XmlElementWrapper(name = "footerSections")
	@XmlElementRef
	private List<PrintSectionXml> footerSections;

	@XmlElementRef(required = false)
	private PrintWatermarkXml watermark;

	@XmlAttribute(required = true)
	private PageOrientationXml pageOrientation;

	public PrintSegmentXml(
		String id,
		List<IPrintElementXml> elements,
		List<PrintSectionXml> headerSections,
		List<PrintSectionXml> footerSections,
		PageOrientationXml pageOrientation,
		PrintWatermarkXml watermark
	) {
		super(id, elements);
		this.headerSections = headerSections;
		this.footerSections = footerSections;
		this.pageOrientation = pageOrientation;
		this.watermark = watermark;
	}

	public PrintSegmentXml() {}
}
