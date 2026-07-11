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
package com.mgmtp.a12.print.workspace.internal;

import com.mgmtp.a12.print.workspace.internal.elements.FileElement;
import com.mgmtp.a12.print.workspace.internal.elements.FileElementType;
import lombok.Getter;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.AbstractMap;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class Workspace {

	@Getter
	private static final Workspace instance = new Workspace();
	@Getter
	private Path path = Paths.get("");
	@Getter
	private Map<FileElementType, List<FileElement>> fileMap = getInitialFileMap();

	private Workspace() {}

	public void setWorkspace(Path path) {
		this.fileMap = getInitialFileMap();
		this.path = path;
	}

	private static Map<FileElementType, List<FileElement>> getInitialFileMap() {
		return Map.ofEntries(
			new AbstractMap.SimpleEntry<>(FileElementType.MODEL, new ArrayList<>()),
			new AbstractMap.SimpleEntry<>(FileElementType.PROPERTIES, new ArrayList<>()),
			new AbstractMap.SimpleEntry<>(FileElementType.PDF, new ArrayList<>()),
			new AbstractMap.SimpleEntry<>(FileElementType.LOG, new ArrayList<>()),
			new AbstractMap.SimpleEntry<>(FileElementType.DOCUMENT, new ArrayList<>()),
			new AbstractMap.SimpleEntry<>(FileElementType.UNKNOWN, new ArrayList<>())
		);
	}

}
