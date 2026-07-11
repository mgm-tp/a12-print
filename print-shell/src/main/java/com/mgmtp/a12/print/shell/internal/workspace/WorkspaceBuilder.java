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
package com.mgmtp.a12.print.shell.internal.workspace;

import com.mgmtp.a12.print.shell.internal.exceptions.PrintShellException;
import com.mgmtp.a12.print.workspace.internal.Workspace;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@RequiredArgsConstructor
@Slf4j
public class WorkspaceBuilder {

	private final WorkspaceVisitor workspaceVisitor;

	public void build(
		final String workspacePathString
	) {
		String userDirectory = System.getProperty("user.dir");
		try {
			File workspaceFile = new File(
				StringUtils.isBlank(workspacePathString) ? userDirectory : workspacePathString
			);
			Path workspacePath = workspaceFile.toPath();
			if (workspacePath.equals(Workspace.getInstance().getPath())){
				log.debug("The selected workspace path is the same as for the command before, so the workspace will not be initiate again.");
				return;
			}
			Workspace.getInstance().setWorkspace(workspacePath);
			Files.walkFileTree(workspacePath, workspaceVisitor);
		} catch (IOException e) {
			throw new PrintShellException(e);
		}
	}
}
