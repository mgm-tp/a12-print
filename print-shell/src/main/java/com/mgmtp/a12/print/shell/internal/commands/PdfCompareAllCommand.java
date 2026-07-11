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
package com.mgmtp.a12.print.shell.internal.commands;

import com.mgmtp.a12.print.shell.internal.service.PdfComparisonService;
import com.mgmtp.a12.print.shell.internal.workspace.WorkspaceBuilder;
import com.mgmtp.a12.print.workspace.internal.Workspace;
import com.mgmtp.a12.print.workspace.internal.elements.FileElement;
import com.mgmtp.a12.print.workspace.internal.elements.FileElementType;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.apache.commons.io.FilenameUtils;
import picocli.CommandLine;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static com.mgmtp.a12.print.shell.internal.PrintShellConstants.RESULT_DIRECTORY;

@CommandLine.Command(
	name = "compare-all",
	description = "Compare all PDFs in the workspace"
)
@RequiredArgsConstructor
public class PdfCompareAllCommand implements Runnable {

	@NonNull
	private final PdfComparisonService pdfComparisonService;

	@NonNull
	private final WorkspaceBuilder workspaceBuilder;

	@CommandLine.Option(
		names = {"--workspace", "-w"},
		description = "Workspace (String): Path to directory, which includes the PDFs to compare. Default: current directory"
	) private String workspacePath = "";

	@CommandLine.Option(
		names = {"--percent", "-p"},
		description = "Second PDF (String): Path to the second PDF for comparison."
	) private double differentPercent = 0.0;

	@CommandLine.Option(
		names = {"--equal", "-e"},
		description = "This parameter specifies whether the documents being compared must have the same name. Default: Only checks by 'startsWith'"
	) private boolean checkForFileNameEqual = false;

	@Override
	public void run() {
		workspaceBuilder.build(workspacePath);

		List<FileElement> pdfFileElements = Workspace.getInstance().getFileMap().get(FileElementType.PDF);
		List<String> resultPdfPaths = new ArrayList<>();
		List<String> originPdfPaths = new ArrayList<>();

		pdfFileElements.forEach(pdfFileElement -> {
			if(pdfFileElement.getPath().getParent().getFileName().toString()
				.equals(RESULT_DIRECTORY)
			) {
				resultPdfPaths.add(pdfFileElement.getPath().toString());
			} else {
				originPdfPaths.add(pdfFileElement.getPath().toString());
			}
		});

		resultPdfPaths.forEach(resultPdfPath -> {
			String resultFileName = FilenameUtils.getBaseName(resultPdfPath);
			Optional<String> relatedOriginFile = originPdfPaths.stream().filter(originPdfPath -> {
				final var baseName = FilenameUtils.getBaseName(originPdfPath);
				return checkForFileNameEqual
					? baseName.equals(resultFileName)
					: baseName.startsWith(resultFileName);
			}).findFirst();

			relatedOriginFile.ifPresent(originFilePath ->
				pdfComparisonService.comparePdfs(originFilePath, resultPdfPath, differentPercent)
			);
		});
	}
}
