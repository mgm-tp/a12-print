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
package com.mgmtp.a12.print.engine.runtime.internal.engine.pdfBox;

import com.mgmtp.a12.print.engine.api.exception.PrintException;
import lombok.NonNull;
import org.apache.pdfbox.pdmodel.PDDocument;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class PDObjectsExtractor {

	@NonNull
	private final PDObjectExtractor pdObjectExtractor;

	public PDObjectsExtractor(@NonNull final PDDocument pdDocument) {
		this.pdObjectExtractor = new PDObjectExtractor(pdDocument);
	}

	public List<ContainerElementPDObject> extractContent(@NonNull final List<PDDocumentHolder> pdDocumentHolders) throws IOException {
		return resolvePDDocumentHolders(pdDocumentHolders);
	}

	public List<ContainerElementPDObject> extractContent(@NonNull final PDDocumentHolder pdDocumentHolder) throws IOException {
		return resolvePDDocumentHolder(pdDocumentHolder);
	}

	private List<ContainerElementPDObject> resolvePDDocumentHolders(@NonNull final List<PDDocumentHolder> pdDocumentHolders) throws IOException {
		final var pdObjects = new ArrayList<ContainerElementPDObject>();
		for (var pdObjectHolder : pdDocumentHolders) {
			// ignore hidden elements
			if (pdObjectHolder != null) {
				pdObjects.addAll(resolvePDDocumentHolder(pdObjectHolder));
			}
		}
		return pdObjects;
	}

	private List<ContainerElementPDObject> resolvePDDocumentHolder(
		@NonNull final PDDocumentHolder pdDocumentHolder
	) throws IOException {
		return resolvePDDocumentHolder(pdDocumentHolder, new ArrayList<>());
	}

	private List<ContainerElementPDObject> resolvePDDocumentHolder(
		@NonNull final PDDocumentHolder pdDocumentHolder,
		@NonNull final List<PDDocumentHolder> childPdDocumentHolders
	) throws IOException {
		if (pdDocumentHolder instanceof PDDocumentWrapper pdDocumentWrapper) {
			final var pdDocument = pdDocumentWrapper.getPdDocument();

			final var elementPDObject = pdObjectExtractor.extractMarkupPDObject(pdDocument);

			return List.of(new ContainerElementPDObject(
				elementPDObject,
				childPdDocumentHolders.isEmpty()
					? new ArrayList<>()
					: resolvePDDocumentHolders(childPdDocumentHolders)
			));
		} else if (pdDocumentHolder instanceof PDDocumentContainer container) {
			final var containerObject = container.getContainerObject();
			return containerObject.isEmpty()
				? resolvePDDocumentHolders(container.getPDObjectHolders())
				: resolvePDDocumentHolder(containerObject.get(), container.getPDObjectHolders());
		}

		throw new PrintException("Unsupported PDObjectHolder: " + pdDocumentHolder);
	}
}
