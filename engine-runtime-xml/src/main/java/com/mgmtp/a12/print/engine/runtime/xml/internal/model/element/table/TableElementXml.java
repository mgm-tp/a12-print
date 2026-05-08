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
package com.mgmtp.a12.print.engine.runtime.xml.internal.model.element.table;

import com.mgmtp.a12.print.engine.runtime.xml.internal.model.element.PrintElementTypeXml;
import com.mgmtp.a12.print.engine.runtime.xml.internal.model.element.PrintElementXml;
import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlElementWrapper;
import jakarta.xml.bind.annotation.XmlRootElement;
import jakarta.xml.bind.annotation.XmlType;

import java.util.List;

@XmlRootElement(name = "table")
@XmlType(propOrder = {"headerCells", "rows"})
public class TableElementXml extends PrintElementXml {

	@XmlElementWrapper(name = "headerRow")
	@XmlElement(name = "headerCell")
	private List<String> headerCells;

	@XmlElementWrapper(name = "bodyRows")
	@XmlElement(name = "row")
	private List<TableRowXml> rows;

	public TableElementXml(
		String id,
		List<String> headerCells,
		List<TableRowXml> rows
	) {
		super(id, PrintElementTypeXml.TABLE);
		this.headerCells = headerCells;
		this.rows = rows;
	}

	public TableElementXml() {}
}
