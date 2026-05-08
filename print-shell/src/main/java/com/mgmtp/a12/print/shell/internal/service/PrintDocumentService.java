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
package com.mgmtp.a12.print.shell.internal.service;

import com.mgmtp.a12.kernel.md.document.apiV2.immutable.DocumentV2;
import com.mgmtp.a12.print.engine.runtime.internal.engine.constant.Constants;
import com.mgmtp.a12.print.shell.internal.exceptions.PrintShellException;
import com.mgmtp.a12.print.workspace.internal.elements.DocumentFileElement;
import com.mgmtp.a12.print.workspace.internal.handler.WorkspaceHandler;
import lombok.AllArgsConstructor;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.shell.standard.ShellComponent;

import java.util.Collection;
import java.util.Optional;

@ShellComponent
@AllArgsConstructor
@Slf4j
public class PrintDocumentService {

	@NonNull
	private final WorkspaceHandler workspaceHandler;

	private static final DocumentV2 DEFAULT_DOCUMENT = DocumentV2.empty(Constants.NO_SELECTED_DOCUMENT_ID);

	public DocumentV2 getDocumentToPrint(
		String printModelId,
		String documentId
	) {
		final var possibleDocuments = workspaceHandler.getPossibleDocuments(printModelId).values().stream().flatMap(Collection::stream).toList();

		Optional<DocumentV2> documentToPrint = Optional.empty();


		if (!possibleDocuments.isEmpty()) {
			if (StringUtils.isBlank(documentId)) {
				documentToPrint = workspaceHandler.getDocument(possibleDocuments.get(0));
			} else {
				documentToPrint = possibleDocuments.stream()
					.filter(
						document -> DocumentFileElement.resolveIdWithoutModel(document).equals(documentId)
					).findFirst().flatMap(workspaceHandler::getDocument);
			}
		}

		if (documentToPrint.isEmpty() && !StringUtils.isBlank(documentId)) {
			throw new PrintShellException("The selected document is not present and could not be printed.");
		}

		return documentToPrint.orElse(DEFAULT_DOCUMENT);
	}

}
