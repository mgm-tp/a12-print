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
package com.mgmtp.a12.print.model.api.validation.internal;

import com.mgmtp.a12.kernel.md.rt.api.IDocumentValidationResult;
import com.mgmtp.a12.print.model.api.validation.IPrintModelIntegrityMessage;
import com.mgmtp.a12.print.model.api.validation.IPrintModelIntegrityReport;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class PrintModelIntegrityReport implements IPrintModelIntegrityReport {

	private final boolean noErrorOccurred;
	private final List<IPrintModelIntegrityMessage> messages;

	public PrintModelIntegrityReport(IDocumentValidationResult result) {
		this(result, List.of());
	}

	public PrintModelIntegrityReport(IDocumentValidationResult result, List<IPrintModelIntegrityMessage> extraMessages) {
		List<IPrintModelIntegrityMessage> kernelMessages = result.getMessages().stream()
			.map(PrintModelMetaModelValidationMessage::new)
			.collect(Collectors.toList());
		List<IPrintModelIntegrityMessage> combined = new ArrayList<>(kernelMessages.size() + extraMessages.size());
		combined.addAll(kernelMessages);
		combined.addAll(extraMessages);
		this.messages = List.copyOf(combined);
		boolean hasHtmlError = extraMessages.stream()
			.anyMatch(m -> m.getSeverityType() == IPrintModelIntegrityMessage.SeverityType.ERROR);
		this.noErrorOccurred = result.noErrorOccurred() && !hasHtmlError;
	}

	@Override
	public boolean noErrorOccurred() {
		return noErrorOccurred;
	}

	@Override
	public List<IPrintModelIntegrityMessage> getMessages() {
		return messages;
	}
}
