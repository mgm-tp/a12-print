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

import com.github.romankh3.image.comparison.ImageComparison;
import com.github.romankh3.image.comparison.ImageComparisonUtil;
import com.github.romankh3.image.comparison.model.ImageComparisonResult;
import com.github.romankh3.image.comparison.model.ImageComparisonState;
import com.mgmtp.a12.print.shell.internal.configuration.PrintShellConfiguration;
import com.mgmtp.a12.print.shell.internal.exceptions.PdfComparisonException;
import com.mgmtp.a12.print.shell.internal.exceptions.PrintShellException;
import lombok.AllArgsConstructor;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FilenameUtils;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.stereotype.Service;

import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.file.Path;

@Service
@Slf4j
@AllArgsConstructor
public class PdfComparisonService {

	private final PrintShellConfiguration printShellConfiguration;


	public void comparePdfs(
		@NonNull final String firstPdfPath,
		@NonNull final String secondPdfPath,
		final double differentPercent
	) {
		File firstPdfFile = new File(firstPdfPath);
		try (
			PDDocument firstDocument = PDDocument.load(firstPdfFile);
			PDDocument secondDocument = PDDocument.load(new File(secondPdfPath))
		) {
			PDFRenderer firstRenderer = new PDFRenderer(firstDocument);
			PDFRenderer secondRenderer = new PDFRenderer(secondDocument);

			int firstDocumentPageSize = firstDocument.getNumberOfPages();
			int secondDocumentPageSize = secondDocument.getNumberOfPages();
			int maxNumberOfPages = Math.max(firstDocumentPageSize, secondDocumentPageSize);

			boolean isEqual = true;
			for (int pageIndex = 0; pageIndex < maxNumberOfPages; pageIndex++) {
				boolean isOutOfPage = pageIndex > firstDocumentPageSize - 1 || pageIndex > secondDocumentPageSize - 1;

				if (isOutOfPage) {
					throw new PdfComparisonException(String.format("The PDF documents do not have the same page size.\n%s\n%s", firstPdfPath, secondPdfPath));
				}

				BufferedImage firstDocumentPageImage = firstRenderer.renderImage(pageIndex);
				BufferedImage secondDocumentPageImage = secondRenderer.renderImage(pageIndex);

				if (differentPercent < 0 || differentPercent > 100) {
					log.warn("Invalid percent value: {}, The valid range is 0 to 100.", differentPercent);
				}

				ImageComparisonResult imageComparisonResult = new ImageComparison(
					firstDocumentPageImage, secondDocumentPageImage
				).setAllowingPercentOfDifferentPixels(differentPercent).compareImages();

				if (!imageComparisonResult.getImageComparisonState().equals(ImageComparisonState.MATCH)) {
					log.warn("The page with the index {} of the PDF documents is different", pageIndex);
					isEqual = false;

					saveCompareResult(firstPdfFile, pageIndex, imageComparisonResult);
				}
			}

			if (!isEqual) {
				throw new PdfComparisonException(
					String.format("The PDF documents are not equal.\n%s\n%s", firstPdfPath, secondPdfPath)
				);
			} else {
				log.info("The PDF documents are equal.\n{}\n{}", firstPdfPath, secondPdfPath);
			}
		} catch (IOException e) {
			throw new PrintShellException(e);
		}
	}

	private void saveCompareResult(
		File firstPdfFile,
		int pageIndex,
		ImageComparisonResult imageComparisonResult
	) {
		Path path = firstPdfFile.toPath();
		String baseName = FilenameUtils.getBaseName(path.toString());
		File resultImageFile = new File(path.resolveSibling(
			String.format(
				"%s/%s-comparison-result-%d.png",
				printShellConfiguration.getResultDirectory(),
				baseName,
				pageIndex
			)
		).toUri());

		ImageComparisonUtil.saveImage(resultImageFile, imageComparisonResult.getResult());
	}
}
