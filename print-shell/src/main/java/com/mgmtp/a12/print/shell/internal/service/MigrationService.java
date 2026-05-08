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

import com.mgmtp.a12.print.model.migration.internal.Migration;
import com.mgmtp.a12.print.model.migration.internal.MigrationConfig;
import com.mgmtp.a12.print.model.migration.internal.MigrationResult;
import com.mgmtp.a12.print.model.migration.internal.exceptions.MigrationFailedException;
import com.mgmtp.a12.print.shell.internal.configuration.PrintShellConfiguration;
import com.mgmtp.a12.print.shell.internal.exceptions.PrintShellException;
import com.mgmtp.a12.print.workspace.internal.elements.ModelFileElement;
import com.mgmtp.a12.print.workspace.internal.handler.FileHandler;
import com.mgmtp.a12.print.workspace.internal.handler.WorkspaceHandler;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
@Slf4j
public class MigrationService {

	private final FileHandler fileHandler;
	private final PrintShellConfiguration printShellConfiguration;
	private final WorkspaceHandler workspaceHandler;

	public void migrate(ModelFileElement modelFileElement, boolean overwrite) {
		try {
			String version = modelFileElement.getModelHeader().getModelVersion();
			if (!MigrationConfig.isVersionSupported(version)) {
				log.info("Skip Migration of {} because the version {} is to high. Please migrate this model in the SME.", modelFileElement.getModelHeader().getId(), version);
				return;
			}

			List<String> referenceDocuments = modelFileElement
				.getModelHeader()
				.getModelReferences()
				.stream()
				.map(modelReference -> workspaceHandler.getExpandedModelContent(modelReference.getReference()))
				.filter(Optional::isPresent)
				.map(Optional::get)
				.collect(Collectors.toList());
			MigrationResult migrationResult = Migration.migrate(referenceDocuments, modelFileElement.getPath());

			saveResult(
				modelFileElement.getPath().toString(),
				migrationResult,
				overwrite
			);
		} catch (MigrationFailedException | IOException e) {
			throw new PrintShellException(e);
		}
	}

	private void saveResult(
		String filePath,
		MigrationResult migrationResult,
		boolean shouldOverwrite
	) throws IOException {
		String suffix = "";
		String subDirectory = "";

		boolean createNewFile = !shouldOverwrite;

		if (createNewFile) {
			subDirectory = printShellConfiguration.getResultDirectory();
			suffix = "-" + migrationResult.getTargetVersion();
		}

		String newFileName = String.format("%s%s.json", FilenameUtils.getBaseName(filePath), suffix);
		String updatedFileParentPath = FilenameUtils.getFullPath(filePath) + subDirectory;
		String updatedFilePath = updatedFileParentPath + "/" + newFileName;

		new File(updatedFileParentPath).mkdirs();

		File resultFile = new File(updatedFilePath);
		resultFile.createNewFile();

		FileUtils.writeStringToFile(resultFile, migrationResult.getResultDocument(), "UTF-8");

		if (!createNewFile) {
			fileHandler.modify(resultFile.toPath());
		}

		log.info(String.format(
			"Updated file '%s' from version: %s (step: %s) to version: %s (step: %s)",
			FilenameUtils.getBaseName(filePath),
			migrationResult.getStartVersion(),
			migrationResult.getStartStep()+1,
			migrationResult.getTargetVersion(),
			migrationResult.getTargetStep()+1
		));
	}
}
