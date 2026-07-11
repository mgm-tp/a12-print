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
package com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components;

import com.mgmtp.a12.print.engine.api.exception.impl.PrintDomainException;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.documentHandle.RegionCursor;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.BaseComponent;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.ComponentResult;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.PreflightedComponent;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.PreflightedComponentResult;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.base.AccessibilityData;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.base.ContentStreamAdapter;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.PDFUnitUtil;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.Size;
import lombok.EqualsAndHashCode;
import lombok.NonNull;
import lombok.Value;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.documentinterchange.taggedpdf.PDLayoutAttributeObject;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.apache.pdfbox.util.Matrix;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

import static com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.ImageComponentUtils.readExifOrientation;
import static com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.base.AccessibilityConstants.FIGURE_COSNAME;
import static com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.base.AccessibilityUtils.getMarkedContent;
import static com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.base.AccessibilityUtils.getStructElement;
import static com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.PDFUnitUtil.longPtToFloat;
import static org.apache.pdfbox.pdmodel.documentinterchange.taggedpdf.PDLayoutAttributeObject.PLACEMENT_BLOCK;
import static org.apache.pdfbox.pdmodel.documentinterchange.taggedpdf.StandardStructureTypes.Figure;

@Value
@EqualsAndHashCode(callSuper = true)
public class ImageComponent extends BaseComponent {
	byte[] image;
	String altText;
	Size size;

	public ImageComponent(String id, byte[] image, String altText, Size size) {
		super(id);
		this.image = image;
		this.altText = altText;
		this.size = size;
	}

	@Override
	public ComponentResult render(@NonNull RegionCursor regionCursor, boolean preventPageBreak) {
		return renderImage(regionCursor, preflightImage(regionCursor));
	}

	@Override
	public PreflightedComponent preflight(@NonNull RegionCursor regionCursor, boolean preventPageBreak) {
		final var preflightResult = preflightImage(regionCursor);
		return new PreflightedComponent() {
			@Override
			public PreflightedComponentResult renderPreflightedComponent() {
				return new PreflightedComponentResult(
					renderImage(regionCursor, preflightResult),
					regionCursor
				);
			}

			@Override
			public ComponentResult getPreflightedComponentResult() {
				return preflightResult.onNextPage
					? new ComponentResult(Optional.of(ImageComponent.this), regionCursor.getRemainingRegionSpace())
					: new ComponentResult(Optional.empty(), preflightResult.height);
			}
		};
	}

	@Override
	public boolean isLocatedOnPageBreak(@NonNull RegionCursor regionCursor) {
		return isLocatedOnPageBreakOnNonEmptyRegion(size, regionCursor.getRemainingRegionSpace(), regionCursor.getRegionSpace());
	}

	private static boolean isLocatedOnPageBreakOnNonEmptyRegion(Size size, long remainingRegionSpace, long regionSpace) {
		return remainingRegionSpace < size.getHeight() && remainingRegionSpace != regionSpace;
	}

	record ImagePreflightResult(long width, long height, boolean onNextPage) {}

	private ImagePreflightResult preflightImage(@NonNull RegionCursor regionCursor) {
		final var remainingRegionSpace = regionCursor.getRemainingRegionSpace();
		final var regionSpace = regionCursor.getRegionSpace();

		long width = size.getWidth();
		long height = size.getHeight();

		if (isLocatedOnPageBreakOnNonEmptyRegion(size, remainingRegionSpace, regionSpace)) {
			return new ImagePreflightResult(width, remainingRegionSpace, true);
		} else if (regionSpace < height && remainingRegionSpace == regionSpace) {
			width = Math.round(((double) width / height) * regionSpace);
			height = regionSpace;
		}

		return new ImagePreflightResult(width, height, false);
	}

	private ComponentResult renderImage(
		@NonNull RegionCursor regionCursor,
		@NonNull ImagePreflightResult preflightResult
	) {
		final var contentStream = regionCursor.getContentStream();
		final var documentHandle = regionCursor.getContainerDocumentHandle();
		final var pdDocument = documentHandle.getDocument();
		final var position = regionCursor.getPosition();
		final var remainingRegionSpace = regionCursor.getRemainingRegionSpace();

		if (preflightResult.onNextPage) {
			return new ComponentResult(Optional.of(this), remainingRegionSpace);
		}

		final PDImageXObject imageToRender;
		synchronized (pdDocument) {
			try {
				imageToRender = PDImageXObject.createFromByteArray(pdDocument, image, altText);
			} catch (IOException e) {
				throw new PrintDomainException("The image with alt text '{}' could not be loaded", altText, e);
			}
		}

		long width = preflightResult.width;
		long height = preflightResult.height;

		long yPosPtInverted = PDFUnitUtil.invertYPos(position.getY(), height, contentStream.getPage());

		final var tagId = contentStream.beginMarkedContent(FIGURE_COSNAME);

		drawImage(contentStream, imageToRender, position.getX(), yPosPtInverted, width, height);

		contentStream.endMarkedContent();

		final var structElement = getStructElement(Figure, contentStream.getPage());
		structElement.setAlternateDescription(altText);

		final var attribute = new PDLayoutAttributeObject();
		attribute.setBBox(new PDRectangle(
			position.getX(), yPosPtInverted, width, height
		));
		attribute.setPlacement(PLACEMENT_BLOCK);

		structElement.addAttribute(attribute);
		structElement.appendKid(getMarkedContent(tagId));

		return new ComponentResult(
			Optional.empty(),
			height,
			new AccessibilityData(List.of(structElement), List.of(structElement))
		);
	}

	private void drawImage(
		final ContentStreamAdapter contentStream,
		final PDImageXObject imageToRender,
		final long x,
		final long y,
		final long width,
		final long height
	) {
		int orientation = readExifOrientation(image);

		if (orientation == 1) {
			contentStream.drawImage(imageToRender, x, y, width, height);
		} else {
			contentStream.drawImage(imageToRender, getOrientationMatrix(
				orientation,
				longPtToFloat(x),
				longPtToFloat(y),
				longPtToFloat(width),
				longPtToFloat(height)
			));
		}
	}

	private static Matrix getOrientationMatrix(int orientation, float x, float y, float width, float height) {
		return switch (orientation) {
			case 2 -> new Matrix(-width,0, 0, height, x + width, y);
			case 3 -> new Matrix(-width,0, 0, -height, x + width, y + height);
			case 4 -> new Matrix(width,0, 0, -height, x, y + height);
			case 5 -> new Matrix(0, -height,-width, 0, x + width, y + height);
			case 6 -> new Matrix(0, -height, width,0, x, y + height);
			case 7 -> new Matrix(0,height, width,  0, x, y);
			case 8 -> new Matrix(0, height,-width, 0, x + width, y);
			default -> new Matrix(width, 0,  0, height, x, y);
		};
	}
}
