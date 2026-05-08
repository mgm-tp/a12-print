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
package com.mgmtp.a12.print.engine.runtime.xml.internal.model.base;

import com.mgmtp.a12.print.engine.runtime.xml.internal.model.element.HorizontalLineElementXml;
import com.mgmtp.a12.print.engine.runtime.xml.internal.model.element.container.AreaElementXml;
import com.mgmtp.a12.print.engine.runtime.xml.internal.model.element.container.BoundingBoxElementXml;
import com.mgmtp.a12.print.engine.runtime.xml.internal.model.element.container.SwitchElementXml;
import com.mgmtp.a12.print.engine.runtime.xml.internal.model.element.image.BarChartElementXml;
import com.mgmtp.a12.print.engine.runtime.xml.internal.model.element.image.ImageElementXml;
import com.mgmtp.a12.print.engine.runtime.xml.internal.model.element.image.LineChartElementXml;
import com.mgmtp.a12.print.engine.runtime.xml.internal.model.element.image.PieChartElementXml;
import com.mgmtp.a12.print.engine.runtime.xml.internal.model.element.listing.ListingElementXml;
import com.mgmtp.a12.print.engine.runtime.xml.internal.model.element.table.TableElementXml;
import com.mgmtp.a12.print.engine.runtime.xml.internal.model.element.tableLayout.TableLayoutElementXml;
import com.mgmtp.a12.print.engine.runtime.xml.internal.model.element.text.ExpressionElementXml;
import com.mgmtp.a12.print.engine.runtime.xml.internal.model.element.text.TextElementXml;
import jakarta.xml.bind.annotation.XmlElementRef;
import jakarta.xml.bind.annotation.XmlElementRefs;
import jakarta.xml.bind.annotation.XmlElementWrapper;
import jakarta.xml.bind.annotation.XmlTransient;

import java.util.List;

@XmlTransient
public class PrintElementContainerXml extends PrintEntityXml implements IPrintElementContainerXml {
	@XmlElementWrapper(name = "elements")
	@XmlElementRefs({
		@XmlElementRef(type = ImageElementXml.class),
		@XmlElementRef(type = PieChartElementXml.class),
		@XmlElementRef(type = LineChartElementXml.class),
		@XmlElementRef(type = BarChartElementXml.class),
		@XmlElementRef(type = ExpressionElementXml.class),
		@XmlElementRef(type = ListingElementXml.class),
		@XmlElementRef(type = TableElementXml.class),
		@XmlElementRef(type = TableLayoutElementXml.class),
		@XmlElementRef(type = HorizontalLineElementXml.class),
		@XmlElementRef(type = TextElementXml.class),
		@XmlElementRef(type = BoundingBoxElementXml.class),
		@XmlElementRef(type = AreaElementXml.class),
		@XmlElementRef(type = SwitchElementXml.class)
	})
	private List<IPrintElementXml> elements;

	public PrintElementContainerXml(
		String id,
		List<IPrintElementXml> elements
	) {
		super(id);
		this.elements = elements;
	}

	public PrintElementContainerXml() {}


	public List<IPrintElementXml> getElements() {
		return elements;
	}
}
