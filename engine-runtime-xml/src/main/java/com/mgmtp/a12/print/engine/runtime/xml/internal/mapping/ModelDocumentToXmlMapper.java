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
package com.mgmtp.a12.print.engine.runtime.xml.internal.mapping;

import com.mgmtp.a12.print.engine.runtime.xml.internal.exceptions.XmlMappingException;
import com.mgmtp.a12.print.engine.runtime.xml.internal.model.PrintDocumentXml;
import com.mgmtp.a12.print.engine.runtime.xml.internal.model.attachments.ImageAttachmentXml;
import com.mgmtp.a12.print.engine.runtime.xml.internal.model.attachments.PdfAttachmentXml;
import com.mgmtp.a12.print.engine.runtime.xml.internal.model.attachments.PrintAttachmentXml;
import com.mgmtp.a12.print.engine.runtime.xml.internal.model.base.IPrintElementXml;
import com.mgmtp.a12.print.engine.runtime.xml.internal.model.element.HorizontalLineElementXml;
import com.mgmtp.a12.print.engine.runtime.xml.internal.model.element.PageNumberElementXml;
import com.mgmtp.a12.print.engine.runtime.xml.internal.model.element.PageNumberTotalElementXml;
import com.mgmtp.a12.print.engine.runtime.xml.internal.model.element.container.AreaElementXml;
import com.mgmtp.a12.print.engine.runtime.xml.internal.model.element.container.BoundingBoxElementXml;
import com.mgmtp.a12.print.engine.runtime.xml.internal.model.element.container.PrintElementNestedContainerXml;
import com.mgmtp.a12.print.engine.runtime.xml.internal.model.element.container.SwitchElementXml;
import com.mgmtp.a12.print.engine.runtime.xml.internal.model.element.image.*;
import com.mgmtp.a12.print.engine.runtime.xml.internal.model.element.listing.ListingCellXml;
import com.mgmtp.a12.print.engine.runtime.xml.internal.model.element.listing.ListingElementXml;
import com.mgmtp.a12.print.engine.runtime.xml.internal.model.element.listing.ListingRowXml;
import com.mgmtp.a12.print.engine.runtime.xml.internal.model.element.table.*;
import com.mgmtp.a12.print.engine.runtime.xml.internal.model.element.tableLayout.TableLayoutCellXml;
import com.mgmtp.a12.print.engine.runtime.xml.internal.model.element.tableLayout.TableLayoutElementXml;
import com.mgmtp.a12.print.engine.runtime.xml.internal.model.element.tableLayout.TableLayoutRowXml;
import com.mgmtp.a12.print.engine.runtime.xml.internal.model.element.text.*;
import com.mgmtp.a12.print.engine.runtime.xml.internal.model.section.PrintSectionTypeXml;
import com.mgmtp.a12.print.engine.runtime.xml.internal.model.section.PrintSectionXml;
import com.mgmtp.a12.print.engine.runtime.xml.internal.model.segment.PageOrientationXml;
import com.mgmtp.a12.print.engine.runtime.xml.internal.model.segment.PrintSegmentXml;
import com.mgmtp.a12.print.engine.runtime.xml.internal.model.watermark.PrintWatermarkXml;
import com.mgmtp.a12.print.model.document.PrintModelDocumentMapper;
import com.mgmtp.a12.print.model.document.internal.PrintModelDocument;
import com.mgmtp.a12.print.model.document.internal.attachments.AttachmentType;
import com.mgmtp.a12.print.model.document.internal.attachments.PrintAttachment;
import com.mgmtp.a12.print.model.document.internal.base.IPrintElement;
import com.mgmtp.a12.print.model.document.internal.element.ImageBasedElement;
import com.mgmtp.a12.print.model.document.internal.element.PrintElementNestedContainer;
import com.mgmtp.a12.print.model.document.internal.element.TextBasedElement;
import com.mgmtp.a12.print.model.document.internal.element.listing.ListingCell;
import com.mgmtp.a12.print.model.document.internal.element.listing.ListingElement;
import com.mgmtp.a12.print.model.document.internal.element.table.TableBasedElement;
import com.mgmtp.a12.print.model.document.internal.element.table.TableCell;
import com.mgmtp.a12.print.model.document.internal.element.table.TableSumCell;
import com.mgmtp.a12.print.model.document.internal.section.PrintSection;
import com.mgmtp.a12.print.model.document.internal.segment.PrintSegment;
import com.mgmtp.a12.print.model.document.internal.watermark.PrintWatermark;

public class ModelDocumentToXmlMapper implements PrintModelDocumentMapper<PrintDocumentXml> {

	public PrintDocumentXml map(PrintModelDocument source) {
		return new PrintDocumentXml(
			source.getSegments().stream().map(ModelDocumentToXmlMapper::map).toList(),
			source.getAttachments().stream().map(ModelDocumentToXmlMapper::map).toList(),
			source.getLanguage(),
			source.getTitle(),
			source.getAuthor(),
			source.getDescription()
		);
	}

	private static PrintSegmentXml map(PrintSegment source) {
		return new PrintSegmentXml(
			source.getId(),
			source.getElements().stream().map(ModelDocumentToXmlMapper::map).toList(),
			source.getHeaderSections().stream().map(ModelDocumentToXmlMapper::map).toList(),
			source.getFooterSections().stream().map(ModelDocumentToXmlMapper::map).toList(),
			PageOrientationXml.valueOf(source.getPageOrientation().name()),
			source.getWatermark() != null ? map(source.getWatermark()) : null
		);
	}

	private static PrintAttachmentXml map(PrintAttachment source) {
		return source.getType().equals(AttachmentType.IMAGE)
			? new ImageAttachmentXml(
					source.getId(),
					source.getBase64(),
					source.getAlternativeText()
				)
			: new PdfAttachmentXml(
					source.getId(),
					source.getBase64(),
					source.getAlternativeText()
				);
	}

	private static PrintWatermarkXml map(PrintWatermark source) {
		return new PrintWatermarkXml(
			source.getId(),
			source.getElements().stream().map(ModelDocumentToXmlMapper::map).toList()
		);
	}

	private static IPrintElementXml map(IPrintElement source) {
		if (source instanceof TextBasedElement textBasedElement) {
			return map(textBasedElement);
		} else if (source instanceof ImageBasedElement imageBasedElement) {
			return map(imageBasedElement);
		} else if (source instanceof ListingElement listingElement) {
			return map(listingElement);
		} else if (source instanceof TableBasedElement tableBasedElement) {
			return map(tableBasedElement);
		} else if (source instanceof PrintElementNestedContainer containerElement) {
			return map(containerElement);
		} else {
			return switch (source.getType()) {
				case PAGE_NUMBER_TOTAL -> new PageNumberTotalElementXml(source.getId());
				case PAGE_NUMBER -> new PageNumberElementXml(source.getId());
				case HORIZONTAL_LINE -> new HorizontalLineElementXml(source.getId());
				default -> throw new XmlMappingException(
					String.format("The element with the type '%s' could not be mapped", source.getType())
				);
			};
		}
	}

	private static PrintSectionXml map(PrintSection source) {
		return new PrintSectionXml(
			source.getId(),
			source.getElements().stream().map(ModelDocumentToXmlMapper::map).toList(),
			PrintSectionTypeXml.valueOf(source.getSectionUsage().name())
		);
	}

	private static PrintElementNestedContainerXml map(PrintElementNestedContainer source) {
		return switch (source.getType()) {
			case AREA -> new AreaElementXml(
				source.getId(),
				source.getElements().stream().map(ModelDocumentToXmlMapper::map).toList()
			);
			case BOUNDING_BOX -> new BoundingBoxElementXml(
				source.getId(),
				source.getElements().stream().map(ModelDocumentToXmlMapper::map).toList()
			);
			case SWITCH -> new SwitchElementXml(
				source.getId(),
				source.getElements().stream().map(ModelDocumentToXmlMapper::map).toList()
			);
			default -> throw new XmlMappingException(
				String.format("The container element with the type '%s' could not be mapped", source.getType())
			);
		};
	}

	private static TextBasedElementXml map(TextBasedElement source) {
		return switch (source.getType()) {
			case TEXT -> new TextElementXml(
				source.getId(),
				source.getValue(),
				source.getText(),
				source.isNested(),
				source.isValueIsRenderedAsHtml(),
				source.getElements().stream().map(ModelDocumentToXmlMapper::map).toList()
			);
			case EXPRESSION -> new ExpressionElementXml(
				source.getId(),
				source.getValue(),
				source.getText(),
				source.isNested()
			);
			case CALCULATION -> new CalculationElementXml(
				source.getId(),
				source.getValue(),
				source.getText(),
				source.isNested(),
				source.isValueIsRenderedAsHtml()
			);
			case FIELD -> new FieldElementXml(
				source.getId(),
				source.getValue(),
				source.getText(),
				source.isNested(),
				source.isValueIsRenderedAsHtml()
			);
			default -> throw new XmlMappingException(
				String.format("The text element with the type '%s' could not be mapped", source.getType())
			);
		};
	}

	private static ImageBasedElementXml map(ImageBasedElement source) {
		return switch (source.getType()) {
			case IMAGE -> new ImageElementXml(
				source.getId(),
				source.getBase64(),
				source.getAlternativeText()
			);
			case BAR_CHART -> new BarChartElementXml(
				source.getId(),
				source.getBase64(),
				source.getAlternativeText()
			);
			case LINE_CHART -> new LineChartElementXml(
				source.getId(),
				source.getBase64(),
				source.getAlternativeText()
			);
			case PIE_CHART -> new PieChartElementXml(
				source.getId(),
				source.getBase64(),
				source.getAlternativeText()
			);
			default -> throw new XmlMappingException(
				String.format("The image element with the type '%s' could not be mapped", source.getType())
			);
		};
	}

	private static ListingElementXml map(ListingElement source) {
		return new ListingElementXml(
			source.getId(),
			source.getHeaderCells(),
			source.getRows().stream().map(row ->
				new ListingRowXml(row.getCells().stream().map(ModelDocumentToXmlMapper::map).toList())
			).toList()
		);
	}

	private static ListingCellXml map(ListingCell source) {
		return new ListingCellXml(
			source.getValue(),
			source.getText(),
			source.isValueIsRenderedAsHtml()
		);
	}

	private static IPrintElementXml map(TableBasedElement source) {
		return switch (source.getType()) {
			case TABLE -> new TableElementXml(
				source.getId(),
				source.getHeaderCells(),
				source.getRows().stream().map(row ->
					new TableRowXml(row.getCells().stream().map(ModelDocumentToXmlMapper::map).toList())
				).toList()
			);
			case TABLE_LAYOUT -> new TableLayoutElementXml(
				source.getId(),
				source.getRows().stream().map(row ->
					new TableLayoutRowXml(row.getCells().stream().map(ModelDocumentToXmlMapper::mapTableLayoutCell).toList())
				).toList()
			);
			default -> throw new XmlMappingException(
				String.format("The table element with the type '%s' could not be mapped", source.getType())
			);
		};
	}

	private static ITableCellXml map(TableCell source) {
		if (source.getContent() instanceof TextBasedElement textBasedElement) {
			return new TableCellXml(map(textBasedElement));
		} else if (source.getContent() instanceof TableSumCell tableSumCell) {
			return new SumCellXml(
				tableSumCell.getId(),
				SumCellTypeXml.valueOf(tableSumCell.getType().name()),
				tableSumCell.getValue()
			);
		}

		throw new XmlMappingException("The table cell type could not be mapped");
	}

	private static TableLayoutCellXml mapTableLayoutCell(TableCell source) {
		if (source.getContent() instanceof TextBasedElement textBasedElement) {
			return new TableLayoutCellXml(
				new TextElementXml(
					textBasedElement.getId(),
					textBasedElement.getValue(),
					textBasedElement.getText(),
					textBasedElement.isNested(),
					textBasedElement.isValueIsRenderedAsHtml(),
					textBasedElement.getElements().stream().map(ModelDocumentToXmlMapper::map).toList()
				)
			);
		} else if (source.getContent() == null) {
			return new TableLayoutCellXml(null);
		}

		throw new XmlMappingException("The table layout cell type could not be mapped");
	}
}
