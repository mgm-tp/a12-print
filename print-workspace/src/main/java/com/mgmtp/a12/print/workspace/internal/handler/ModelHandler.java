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

import com.mgmtp.a12.model.header.DefaultHeaderParser;
import com.mgmtp.a12.model.header.Header;
import com.mgmtp.a12.model.header.HeaderParseException;
import com.mgmtp.a12.model.header.HeaderParser;
import com.mgmtp.a12.print.workspace.internal.Workspace;
import com.mgmtp.a12.print.workspace.internal.elements.FileElementType;
import com.mgmtp.a12.print.workspace.internal.elements.ModelFileElement;
import com.mgmtp.a12.print.workspace.internal.elements.TransactionLogFileElement;
import com.mgmtp.a12.print.workspace.internal.event.EventService;
import com.mgmtp.a12.print.workspace.internal.event.ModelChangeEvent;
import com.mgmtp.a12.print.workspace.internal.event.Operation;
import com.mgmtp.a12.print.workspace.internal.utils.FileUtils;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;

@AllArgsConstructor
@Slf4j
public class ModelHandler implements BaseFileHandler {

	private final Workspace workspace = Workspace.getInstance();
	private final HeaderParser headerParser = new DefaultHeaderParser();
	private final WorkspaceHandler workspaceHandler;

	private final EventService eventService;

	@Override
	public void create(Path path) {
		log.debug("Creating workspace model {}", path);
		final var fileContent = FileUtils.readFileContent(path);
		getModelFileElement(fileContent, path).ifPresent(this::addIfNotExists);
	}

	private void addIfNotExists(ModelFileElement model) {
		boolean modelAlreadyExists = workspaceHandler.getModelFileElement(model.getModelHeader().getId()).isPresent();

		if (modelAlreadyExists) {
			log.error(
				"The model with the id {} is already loaded and could not be imported twice. " +
					"The path to the model, which should be imported is {}.",
				model.getModelHeader().getId(),
				model.getPath()
			);
		} else {
			workspace.getFileMap().get(FileElementType.MODEL).add(model);
			send(
				Operation.CREATE,
				model.getModelHeader().getId(),
				model.getModelHeader().getModelType()
			);
		}
	}

	@Override
	public boolean delete(Path path) {
		Optional<ModelFileElement> modelFileElement = workspaceHandler.getModelFileElement(path);
		if (modelFileElement.isPresent()) {
			log.debug("Deleting workspace model {}", path);
			workspace.getFileMap().get(FileElementType.MODEL).remove(modelFileElement.get());
			send(
				Operation.DELETE,
				modelFileElement.get().getModelHeader().getId(),
				modelFileElement.get().getModelHeader().getModelType()
			);
			return true;
		}
		return false;
	}

	@Override
	public void modify(Path path) {
		BaseFileHandler.super.modify(path);

		workspaceHandler.getModelFileElement(path)
			.ifPresent(modelFileElement -> {
				send(
					Operation.UPDATE,
					modelFileElement.getModelHeader().getId(),
					modelFileElement.getModelHeader().getModelType()
				);
			});
	}

	private Optional<ModelFileElement> getModelFileElement(String content, Path path) {
		try {
			Header header = headerParser.parseJson(content);
			ModelFileElement modelFileElement = new ModelFileElement(path, header);
			Path relatedLogPath = modelFileElement.getRelatedLogPath();

			if (Files.exists(relatedLogPath)) {
				TransactionLogFileElement transactionLogFileElement = new TransactionLogFileElement(relatedLogPath);
				modelFileElement.setRelatedTransactionLogFileElement(transactionLogFileElement);
			}

			return Optional.of(modelFileElement);
		} catch (HeaderParseException e) {
			log.error(String.format("Error when creating a ModelFileElement at %s", path));
			e.printStackTrace();
			return Optional.empty();
		}
	}

	private void send(final Operation operation, String modelName, String modelType) {
		eventService.sendEvent(new ModelChangeEvent(operation, modelName, modelType));
	}
}

