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
package com.mgmtp.a12.print.shell.internal.command;

import com.mgmtp.a12.print.shell.internal.service.MigrationService;
import com.mgmtp.a12.print.shell.internal.workspace.WorkspaceBuilder;
import com.mgmtp.a12.print.workspace.internal.elements.ModelFileElement;
import com.mgmtp.a12.print.workspace.internal.handler.WorkspaceHandler;
import lombok.AllArgsConstructor;
import org.springframework.shell.standard.ShellComponent;
import org.springframework.shell.standard.ShellMethod;
import org.springframework.shell.standard.ShellOption;

import java.util.List;

@ShellComponent
@AllArgsConstructor
@Deprecated(since = "3.0.0")
public class MigrationCommand {

	private final WorkspaceBuilder workspaceBuilder;
	private final WorkspaceHandler workspaceHandler;

	private final MigrationService migrationService;

	@ShellMethod("Migrate print models")
	public void migrate(
		@ShellOption(
			value = {"--workspace", "-w"},
			help = "Workspace (String): Path to directory, which includes the print models to migrate. Default: current directory",
			defaultValue = ""
		) final String workspacePath,
		@ShellOption(
			value = {"--overwrite", "-o"},
			help = "Overwrite (Boolean): Define if the migrated print model should overwrite the origin model. Default: true",
			defaultValue = "true"
		) final boolean overwrite
	) {
		workspaceBuilder.build(workspacePath);

		List<ModelFileElement> modelFileElements = workspaceHandler.getModelFileElementsByType("print");

		modelFileElements.forEach(modelFileElement -> migrationService.migrate(modelFileElement, overwrite));
	}
}
