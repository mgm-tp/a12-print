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
package com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.documentHandle;

import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.base.ContentStreamAdapter;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.Position;
import lombok.Data;
import lombok.NonNull;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.graphics.state.PDExtendedGraphicsState;

@Data
public class WatermarkDocumentHandle implements ContainerDocumentHandle {
	private final ContentStreamAdapter originContentStreamAdapter;
	private final ContentStreamAdapter watermarkContentStreamAdapter;

	public WatermarkDocumentHandle(
		@NonNull ContentStreamAdapter originContentStreamAdapter,
		Float opacity
	) {
		this.originContentStreamAdapter = originContentStreamAdapter;

		synchronized(this.originContentStreamAdapter) {
			this.watermarkContentStreamAdapter = new ContentStreamAdapter(
				originContentStreamAdapter.getDocument(),
				originContentStreamAdapter.getPage(),
				PDPageContentStream.AppendMode.APPEND,
				false,
				false,
				originContentStreamAdapter.getTagIdIncrementer()
			);
		}

		if (opacity != null && opacity != 1.0f) {
			final var graphicsState = new PDExtendedGraphicsState();
			graphicsState.setStrokingAlphaConstant(opacity);
			graphicsState.setNonStrokingAlphaConstant(opacity);
			watermarkContentStreamAdapter.setGraphicsStateParameters(graphicsState);
		}
	}

	@Override
	public RegionCursor getInitialRegionCursor(@NonNull Position position) {
		final var pageHeight = originContentStreamAdapter.getPageHeight();
		final long finalY = position.getY();
		final int pageNumber = (int) Math.ceil((double) finalY / pageHeight);

		if (pageNumber > 1) {
			return null;
		}

		final var currentY = finalY - (pageHeight * (pageNumber - 1));
		final var remainingSpace = pageHeight - currentY;

		return new RegionCursor(
			new Position(position.getX(), currentY),
			remainingSpace,
			pageHeight,
			0,
			pageNumber,
			this,
			this.watermarkContentStreamAdapter
		);
	}

	@Override
	public PDDocument getDocument() {
		return originContentStreamAdapter.getDocument();
	}
}
