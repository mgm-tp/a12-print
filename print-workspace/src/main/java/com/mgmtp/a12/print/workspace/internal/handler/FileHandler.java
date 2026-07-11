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

import com.mgmtp.a12.print.workspace.internal.elements.*;
import com.mgmtp.a12.print.workspace.internal.event.EventService;
import com.mgmtp.a12.print.workspace.internal.exceptions.PrintWorkspaceException;
import com.mgmtp.a12.print.workspace.internal.utils.FileUtils;

import java.nio.file.Path;
import java.util.Map;
import java.util.Optional;

public class FileHandler implements BaseFileHandler {

	private final Map<FileElementType, BaseFileHandler> handlerMap;

	public FileHandler(
		WorkspaceHandler workspaceHandler,
		EventService eventService
	) {
		this.handlerMap = Map.of(
			FileElementType.PROPERTIES, new PropertyHandler(workspaceHandler),
			FileElementType.PDF, new PdfHandler(workspaceHandler),
			FileElementType.LOG, new LogHandler(workspaceHandler),
			FileElementType.MODEL, new ModelHandler(workspaceHandler, eventService),
			FileElementType.DOCUMENT, new DocumentHandler(workspaceHandler, eventService),
			FileElementType.TRANSACTION_LOG, new TransactionLogHandler(workspaceHandler, eventService),
			FileElementType.UNKNOWN, new UnknownFileHandler(workspaceHandler)
		);
	}

	@Override
	public void create(Path path) {
		FileElementType fileElementType = getElementType(path);
		getHandlerByType(fileElementType).create(path);
	}

	@Override
	public void modify(Path path) {
		FileElementType fileElementType = getElementType(path);
		getHandlerByType(fileElementType).modify(path);
	}

	@Override
	public boolean delete(Path path) {
		boolean deletedSuccessfully = false;
		for(BaseFileHandler baseFileHandler: handlerMap.values()) {
			if (baseFileHandler.delete(path)) {
				deletedSuccessfully = true;
				break;
			}
		}

		return deletedSuccessfully;
	}

	public FileElementType getElementType(Path path) {
		String fileExtension = FileUtils.getFileExtension(path);

		if (ModelFileElement.EXTENSION.equals(fileExtension)) {
			Optional<String> content = FileUtils.tryReadFileContent(path);
			if (ModelFileElement.isModelFile(content)) {
				return FileElementType.MODEL;
			}
		}

		if (DocumentFileElement.EXTENSION.equals(fileExtension) && DocumentFileElement.isDocumentFile(path)) {
			return FileElementType.DOCUMENT;
		}

		if (PropertiesFileElement.EXTENSION.equals(fileExtension)) {
			return FileElementType.PROPERTIES;
		}

		if (PdfFileElement.EXTENSION.equals(fileExtension)) {
			return FileElementType.PDF;
		}

		if (LogFileElement.EXTENSION.equals(fileExtension)) {
			return FileElementType.LOG;
		}

		if (TransactionLogFileElement.EXTENSION.equals(fileExtension)) {
			return FileElementType.TRANSACTION_LOG;
		}

		return FileElementType.UNKNOWN;
	}

	private BaseFileHandler getHandlerByType(FileElementType fileElementType) {
		BaseFileHandler baseFileHandler = handlerMap.get(fileElementType);
		if (baseFileHandler == null) {
			throw new PrintWorkspaceException(
				String.format("There is no file handler for the type %s", fileElementType.getType())
			);
		}

		return baseFileHandler;
	}
}
