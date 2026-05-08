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
import com.mgmtp.a12.print.workspace.internal.elements.YamlFileElement;
import com.mgmtp.a12.print.workspace.internal.event.ConfigChangeEvent;
import com.mgmtp.a12.print.workspace.internal.event.EventService;
import com.mgmtp.a12.print.workspace.internal.event.Operation;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.nio.file.Path;
import java.util.Optional;

import static com.mgmtp.a12.print.engine.api.PrintEngineConfig.CONFIG_FILE_NAME_PATTERN;
import static com.mgmtp.a12.print.workspace.internal.elements.FileElementType.YAML;

@AllArgsConstructor
@Slf4j
public class YamlHandler implements BaseFileHandler {

	private static final Workspace workspace = Workspace.getInstance();
	private final WorkspaceHandler workspaceHandler;
	private final EventService eventService;

	@Override
	public void create(Path path) {
		log.debug("Creating workspace yml/yaml {}", path);
		YamlFileElement yamlFileElement = new YamlFileElement(path);
		addIfNotExists(yamlFileElement);
	}

	@Override
	public boolean delete(Path path) {
		Optional<FileElement> fileElement = workspaceHandler.getFileElement(path, YAML);
		if (fileElement.isPresent()) {
			log.debug("Deleting workspace yml/yaml {}", path);
			workspace.getFileMap().get(YAML).remove(fileElement.get());
			sendConfigEvent(path, Operation.DELETE);
			return true;
		}
		return false;
	}

	@Override
	public void modify(Path path) {
		BaseFileHandler.super.modify(path);

		workspaceHandler.getYamlFileElement(path)
				.ifPresent(yamlFileElement -> {
					sendConfigEvent(path, Operation.UPDATE);
				});
	}

	private void addIfNotExists(YamlFileElement yaml) {
		String fileName = yaml.getPath().getFileName().toString();
		if (!workspace.getFileMap().get(YAML).contains(yaml)) {
			workspace.getFileMap().get(YAML).add(yaml);
			sendConfigEvent(yaml.getPath(), Operation.CREATE);
		}
	}

	private void sendConfigEvent(Path path, Operation operation) {
		var fileName = path.getFileName().toString();
		if (fileName.matches(CONFIG_FILE_NAME_PATTERN)) {
			eventService.sendEvent(new ConfigChangeEvent(operation));
		}
	}
}
