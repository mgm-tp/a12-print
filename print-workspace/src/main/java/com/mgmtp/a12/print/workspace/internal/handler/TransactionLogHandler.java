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

import com.mgmtp.a12.print.workspace.internal.elements.ModelFileElement;
import com.mgmtp.a12.print.workspace.internal.elements.TransactionLogFileElement;
import com.mgmtp.a12.print.workspace.internal.event.EventService;
import com.mgmtp.a12.print.workspace.internal.event.ModelChangeEvent;
import com.mgmtp.a12.print.workspace.internal.event.Operation;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.nio.file.Path;
import java.util.Optional;


@AllArgsConstructor
@Slf4j
public class TransactionLogHandler implements BaseFileHandler {

	private final WorkspaceHandler workspaceHandler;

	private final EventService eventService;

	@Override
	public void create(Path path) {
		TransactionLogFileElement transactionLogFileElement = new TransactionLogFileElement(path);
		workspaceHandler.getModelFileElement(transactionLogFileElement.getRelatedModelPath())
			.ifPresent(modelFileElement -> {
				if (modelFileElement.getRelatedTransactionLogFileElement().isEmpty()) {
					log.debug("Adding workspace transaction log to model file {}", path);
					modelFileElement.setRelatedTransactionLogFileElement(transactionLogFileElement);
					send(modelFileElement.getModelHeader().getId(), modelFileElement.getModelHeader().getModelType());
				}
			});
	}

	@Override
	public boolean delete(Path path) {
		Path relatedModelPath = TransactionLogFileElement.getRelatedModelPath(path);

		Optional<ModelFileElement> modelFileElement = workspaceHandler.getModelFileElement(relatedModelPath);
		if (modelFileElement.isPresent() && modelFileElement.get().getRelatedTransactionLogFileElement().isPresent()) {
			log.debug("Deleting transaction log property {}", path);
			modelFileElement.get().setRelatedTransactionLogFileElement(null);
			send(modelFileElement.get().getModelHeader().getId(), modelFileElement.get().getModelHeader().getModelType());
			return true;
		}
		return false;
	}

	@Override
	public void modify(Path path) {
		// do nothing because we modify the file automatically
	}

	private void send(String modelName, String modelType) {
		eventService.sendEvent(new ModelChangeEvent(Operation.UPDATE, modelName, modelType));
	}
}
