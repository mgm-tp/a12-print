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
package com.mgmtp.a12.print.workspace.internal.handler;

import com.mgmtp.a12.print.workspace.internal.Workspace;
import com.mgmtp.a12.print.workspace.internal.elements.DocumentFileElement;
import com.mgmtp.a12.print.workspace.internal.elements.FileElementType;
import com.mgmtp.a12.print.workspace.internal.event.DocumentChangeEvent;
import com.mgmtp.a12.print.workspace.internal.event.EventService;
import com.mgmtp.a12.print.workspace.internal.event.Operation;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.nio.file.Path;
import java.util.Optional;

@AllArgsConstructor
@Slf4j
public class DocumentHandler implements BaseFileHandler {

	private final Workspace workspace = Workspace.getInstance();
	private final WorkspaceHandler workspaceHandler;
	private final EventService eventService;

	@Override
	public void create(Path path) {
		log.debug("Creating workspace document {}", path);
		String documentModelName = DocumentFileElement.resolveModelName(path);
		String documentId = DocumentFileElement.resolveDocumentId(path);

		DocumentFileElement documentFileElement = new DocumentFileElement(path, documentModelName, documentId);

		addIfNotExists(documentFileElement);
	}

	private void addIfNotExists(DocumentFileElement document) {
		boolean modelAlreadyExists = workspaceHandler.getDocumentFileElement(document.getDocumentId()).isPresent();

		if (modelAlreadyExists) {
			log.error(
				"The document with the id {} is already loaded and could not be imported twice. " +
					"The path to the document, which should be imported is {}.",
				document.getDocumentId(),
				document.getPath()
			);
		} else {
			workspace.getFileMap().get(FileElementType.DOCUMENT).add(document);
			send(Operation.CREATE, document);
		}
	}

	@Override
	public boolean delete(Path path) {
		Optional<DocumentFileElement> documentFileElement = workspaceHandler.getDocumentFileElement(path);
		if (documentFileElement.isPresent()) {
			log.debug("Deleting workspace document {}", path);
			workspace.getFileMap().get(FileElementType.DOCUMENT).remove(documentFileElement.get());
			send(Operation.DELETE, documentFileElement.get());
			return true;
		}
		return false;
	}

	@Override
	public void modify(Path path) {
		BaseFileHandler.super.modify(path);
		workspaceHandler.getDocumentFileElement(path)
			.ifPresent(documentFileElement -> {
				send(Operation.UPDATE, documentFileElement);
			});
	}

	private void send(final Operation operation, DocumentFileElement documentFileElement) {
		eventService.sendEvent(
			new DocumentChangeEvent(
				operation,
				documentFileElement.getDocumentId(),
				documentFileElement.getDocumentModelId()
			)
		);
	}
}

