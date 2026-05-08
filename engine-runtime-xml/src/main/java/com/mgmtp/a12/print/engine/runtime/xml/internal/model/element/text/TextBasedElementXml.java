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
package com.mgmtp.a12.print.engine.runtime.xml.internal.model.element.text;

import com.mgmtp.a12.print.engine.runtime.xml.internal.model.base.IPrintElementNestedContainerXml;
import com.mgmtp.a12.print.engine.runtime.xml.internal.model.base.IPrintElementXml;
import com.mgmtp.a12.print.engine.runtime.xml.internal.model.element.*;
import com.mgmtp.a12.print.engine.runtime.xml.internal.model.base.IContentXml;
import jakarta.xml.bind.annotation.*;

import java.util.List;

@XmlType
@XmlAccessorType(XmlAccessType.NONE)
public abstract class TextBasedElementXml extends PrintElementXml implements IContentXml, IPrintElementNestedContainerXml {
	@XmlElement(required = true)
	private String value;

	@XmlElement
	private String text;

	@XmlAttribute(required = true)
	private boolean isNested;

	@XmlAttribute(required = true)
	private boolean valueIsRenderedAsHtml;

	@XmlElementWrapper(name = "entities")
	@XmlElementRefs({
		@XmlElementRef(type = CalculationElementXml.class),
		@XmlElementRef(type = FieldElementXml.class),
		@XmlElementRef(type = PageNumberElementXml.class),
		@XmlElementRef(type = PageNumberTotalElementXml.class)
	})
	private List<IPrintElementXml> elements;

	public TextBasedElementXml(
		String id,
		PrintElementTypeXml type,
		String value,
		String text,
		boolean isNested,
		boolean valueIsRenderedAsHtml,
		List<IPrintElementXml> elements
	) {
		super(id, type);
		this.value = value;
		this.text = text;
		this.isNested = isNested;
		this.valueIsRenderedAsHtml = valueIsRenderedAsHtml;
		this.elements = elements;
	}

	public TextBasedElementXml() {}

	@Override
	public String getValue() {
		return value;
	}

	@Override
	public String getText() {
		return text;
	}

	public boolean isNested() {
		return isNested;
	}

	@Override
	public boolean isValueIsRenderedAsHtml() {
		return valueIsRenderedAsHtml;
	}

	@Override
	public List<IPrintElementXml> getElements() {
		return elements;
	}
}
