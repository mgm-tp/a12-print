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
package com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.factories;

import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.api.exception.impl.PrintDomainException;
import com.mgmtp.a12.print.engine.runtime.internal.PdfBoxDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.image.ImageValueDependency;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalPdfBoxPrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.Component;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.ImageComponent;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.Size;
import com.mgmtp.a12.print.model.api.model.element.base.Measure;

import static com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.ImageComponentUtils.*;
import static com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.PDFUnitUtil.mmToLongPt;

public class ImageComponentDependencyValueProducer implements PdfBoxDependencyValueProvider<Component, ImageComponentDependency> {

	@Override
	public ValueFactory<Component> produce(ImageComponentDependency dependency, PrintJob job, PrintEngine<?> engine, InternalPdfBoxPrintEngineRuntime runtime) {
		final var image = dependency.getImage();
		final var id = image.getId();
		final var altText = image.getImageProperties().getAlternativeText();
		final var printDocumentContext = dependency.getPrintDocumentContext();

		final var src = runtime.provide(new ImageValueDependency(image, printDocumentContext));
		final var imageSrc = src.get();

		final var dims = image.getImageProperties().getDimensions();

		final int widthMm;
		final Integer heightMm;
		if (dims.getWidth().isPresent() && dims.getHeight().isPresent()) {
			widthMm = dims.getWidth().get().getValue();
			heightMm = dims.getHeight().get().getValue();
		} else if (dims.getWidth().isEmpty() && dims.getHeight().isEmpty()) {
			widthMm = dims.getOriginalWidth().map(Measure::getValue).orElseThrow(
				() -> new PrintDomainException("The original width of the image element with alt text '{}' is not set", altText)
			);
			heightMm = dims.getOriginalHeight().map(Measure::getValue).orElseThrow(
				() -> new PrintDomainException("The original height of the image element with alt text '{}' is not set", altText)
			);
		} else if (dims.getWidth().isPresent()) {
			widthMm = dims.getWidth().get().getValue();
			heightMm = null;
		} else {
			heightMm = dims.getHeight().get().getValue();
			widthMm = dims.getOriginalWidth().map(Measure::getValue).orElseThrow(
				() -> new PrintDomainException("The width of the image element with alt text '{}' is not set", altText)
			);
		}

		if (imageSrc.isEmpty()) {
			return () -> new ImageComponent(id, new byte[0], altText, Size.ofMm(widthMm, 0));
		}
		final var srcUri = imageSrc.get();
		final var imageBytes = decodeToBytes(srcUri);

		if (heightMm != null) {
			return () -> new ImageComponent(id, imageBytes, altText, Size.ofMm(widthMm, heightMm));
		}

		final var resolvedWidth = mmToLongPt(widthMm);
		final var resolvedHeight = calcImageHeight(resolvedWidth, getImageAspectRatio(imageBytes));
		return () -> new ImageComponent(id, imageBytes, altText, new Size(resolvedWidth, resolvedHeight));
	}
}
