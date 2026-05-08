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
import com.mgmtp.a12.print.workspace.internal.elements.FileElement;
import com.mgmtp.a12.print.workspace.internal.elements.FileElementType;
import com.mgmtp.a12.print.workspace.internal.elements.PdfFileElement;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.nio.file.Path;
import java.util.Optional;

@AllArgsConstructor
@Slf4j
public class PdfHandler implements BaseFileHandler {

	private static final Workspace workspace = Workspace.getInstance();
	private final WorkspaceHandler workspaceHandler;

	@Override
	public void create(Path path) {
		log.debug("Creating workspace pdf {}", path);
		PdfFileElement pdfFileElement = new PdfFileElement(path);
		if (!workspace.getFileMap().get(FileElementType.PDF).contains(pdfFileElement)) {
			workspace.getFileMap().get(FileElementType.PDF).add(pdfFileElement);
		}
	}

	@Override
	public boolean delete(Path path) {
		Optional<FileElement> deletedPdf = workspaceHandler.getFileElement(path, FileElementType.PDF);
		if (deletedPdf.isPresent()) {
			log.debug("Deleting workspace pdf {}", path);
			workspace.getFileMap().get(FileElementType.PDF).remove(deletedPdf.get());
			return true;
		}
		return false;
	}
}
