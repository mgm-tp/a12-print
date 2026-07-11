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
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import picocli.CommandLine;

@CommandLine.Command(
	name = "compare",
	description = "Compare PDFs"
)
@RequiredArgsConstructor
public class PdfCompareCommand implements Runnable {

	@NonNull
	private final PdfComparisonService pdfComparisonService;

	@CommandLine.Option(
		names = {"--pdf-1", "-1"},
		description = "First PDF (String): Path to the first PDF for comparison.",
		required = true
	) private String firstPdfPath;

	@CommandLine.Option(
		names = {"--pdf-2", "-2"},
		description = "Second PDF (String): Path to the second PDF for comparison.",
		required = true
	) private String secondPdfPath;

	@CommandLine.Option(
		names = {"--percent", "-p"},
		description = "Second PDF (String): Path to the second PDF for comparison."
	) private double differentPercent = 0.0;

	@Override
	public void run() {
		pdfComparisonService.comparePdfs(firstPdfPath, secondPdfPath, differentPercent);
	}
}
