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
package com.mgmtp.a12.print.engine.runtime.xml.internal.model;

import com.mgmtp.a12.print.engine.runtime.xml.internal.model.attachments.ImageAttachmentXml;
import com.mgmtp.a12.print.engine.runtime.xml.internal.model.attachments.PdfAttachmentXml;
import com.mgmtp.a12.print.engine.runtime.xml.internal.model.attachments.PrintAttachmentXml;
import com.mgmtp.a12.print.engine.runtime.xml.internal.model.segment.PrintSegmentXml;
import jakarta.xml.bind.annotation.*;

import java.util.List;

@XmlRootElement(name = "document")
public class PrintDocumentXml {

	@XmlElementWrapper(name = "segments")
	@XmlElementRef
	private List<PrintSegmentXml> segments;

	@XmlElementWrapper(name = "attachments")
	@XmlElementRefs({
		@XmlElementRef(type = PdfAttachmentXml.class),
		@XmlElementRef(type = ImageAttachmentXml.class)
	})
	private List<PrintAttachmentXml> attachments;

	@XmlAttribute(required = true)
	private String language;

	@XmlAttribute(required = true)
	private String title;

	@XmlAttribute(required = true)
	private String author;

	@XmlAttribute(required = true)
	private String description;

	public PrintDocumentXml(
		List<PrintSegmentXml> segments,
		List<PrintAttachmentXml> attachments,
		String language,
		String title,
		String author,
		String description
	) {
		this.segments = segments;
		this.attachments = attachments;
		this.language = language;
		this.title = title;
		this.author = author;
		this.description = description;
	}

	public PrintDocumentXml() {}
}
