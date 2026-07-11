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
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.documentHandle.SectionDocumentHandle;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.documentHandle.SegmentDocumentHandle;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.BaseComponent;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.ComponentResult;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.PreflightedComponent;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.PreflightedComponentResult;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.base.*;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.factories.text.ParagraphList;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.PDFUnitUtil;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.Position;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.Size;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.SizeResolverUtils;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing.HtmlStyle;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing.InnerTextToken;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing.TextRenderStyle;
import com.mgmtp.a12.print.model.api.model.element.properties.BorderProperties;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.NonNull;
import lombok.Value;
import lombok.experimental.SuperBuilder;
import org.apache.fontbox.util.BoundingBox;
import org.apache.pdfbox.cos.COSInteger;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.documentinterchange.logicalstructure.PDObjectReference;
import org.apache.pdfbox.pdmodel.documentinterchange.logicalstructure.PDStructureElement;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.graphics.state.RenderingMode;
import org.apache.pdfbox.pdmodel.interactive.action.PDActionURI;
import org.apache.pdfbox.pdmodel.interactive.annotation.PDAnnotationLink;
import org.apache.pdfbox.pdmodel.interactive.annotation.PDBorderStyleDictionary;

import java.awt.*;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.base.AccessibilityConstants.SPAN_COSNAME;
import static com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.base.AccessibilityUtils.getMarkedContent;
import static com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.base.AccessibilityUtils.getStructElement;
import static com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.base.RenderUtils.setNonStrokingColor;
import static com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.base.RenderUtils.setStrokingColor;
import static com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.PDFUnitUtil.getFontSizeRelatedMetrics;
import static com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.PDFUnitUtil.longPtToFloat;
import static org.apache.pdfbox.pdmodel.documentinterchange.taggedpdf.StandardStructureTypes.*;

@Value
@EqualsAndHashCode(callSuper = true)
@SuperBuilder(toBuilder = true)
public class TextComponent extends BaseComponent {
	private static final float UNDERLINE_FACTOR = 0.07f;
	private static final float BOLD_FACTOR = 0.04f;
	private static final float ITALIC_SHEAR = 0.21256f;

	HtmlStyle style;
	@NonNull LineCountSettings lineCountSettings;
	@NonNull TextRenderStyle textRenderStyle;
	@NonNull Size size;
	@NonNull ParagraphList paragraphList;
	@NonNull PDFont font;
	@NonNull PDFont fallbackFont;
	BorderProperties borderProperties;
	@Builder.Default
	boolean ongoingRendering = false;

	public TextComponent(
		String id,
		HtmlStyle style,
		@NonNull TextRenderStyle textRenderStyle,
		@NonNull LineCountSettings lineCountSettings,
		@NonNull Size size,
		@NonNull ParagraphList paragraphList,
		@NonNull PDFont font,
		@NonNull PDFont fallbackFont,
		BorderProperties borderProperties
	) {
		super(id);
		this.style = style;
		this.textRenderStyle = textRenderStyle;
		this.lineCountSettings = lineCountSettings;
		this.size = size;
		this.paragraphList = paragraphList;
		this.font = font;
		this.fallbackFont = fallbackFont;
		this.borderProperties = borderProperties;
		this.ongoingRendering = false;
	}

	@Override
	public ComponentResult render(@NonNull RegionCursor regionCursor, boolean preventPageBreak) {
		final var preflightResult = preflightText(regionCursor, preventPageBreak);
		return renderText(preflightResult, regionCursor, preventPageBreak);
	}

	@Override
	public PreflightedComponent preflight(@NonNull RegionCursor regionCursor, boolean preventPageBreak) {
		final var preflightResult = preflightText(regionCursor, preventPageBreak);

		return new PreflightedComponent() {
			@Override
			public PreflightedComponentResult renderPreflightedComponent() {
				return new PreflightedComponentResult(
					renderText(preflightResult, regionCursor, preventPageBreak),
					regionCursor
				);
			}

			@Override
			public ComponentResult getPreflightedComponentResult() {
				if (preflightResult.onNextPage) {
					return new ComponentResult(Optional.of(TextComponent.this), regionCursor.getRemainingRegionSpace());
				} else if (preflightResult.remainder != null && preflightResult.remainder.totalLinesCount() > 0) {
					return getFinalComponentResult(preflightResult, regionCursor, null);
				} else {
					return new ComponentResult(Optional.empty(), size.getHeight());
				}
			}
		};
	}

	@Override
	public boolean isLocatedOnPageBreak(@NonNull RegionCursor regionCursor) {
		final var lineHeight = textRenderStyle.getLineHeight();
		final var borderWidth = SizeResolverUtils.getBorderWidth(borderProperties);

		final var visibleLineCount = getVisibleLineCount(
			regionCursor.getRemainingRegionSpace(),
			regionCursor.getRegionSpace(),
			size.getHeight(),
			borderWidth,
			lineHeight,
			paragraphList,
			regionCursor.getContainerDocumentHandle() instanceof SectionDocumentHandle
		);

		return visibleLineCount == 0 || visibleLineCount < paragraphList.totalLinesCount();
	}

	private ComponentResult getFinalComponentResult(
		@NonNull TextPreflightResult preflightResult,
		@NonNull RegionCursor regionCursor,
		AccessibilityData accessibilityData
	) {
		final var lineHeight = textRenderStyle.getLineHeight();
		final var borderWidth = SizeResolverUtils.getBorderWidth(borderProperties);
		final long remainingHeight = lineHeight * preflightResult.remainder.totalLinesCount() + borderWidth + textRenderStyle.getPaddingBottom();
		return new ComponentResult(Optional.of(
			this.toBuilder()
				.paragraphList(preflightResult.remainder)
				.ongoingRendering(true)
				.size(new Size(size.getWidth(), remainingHeight))
				.build()
		), regionCursor.getRemainingRegionSpace(), accessibilityData);
	}

	record TextPreflightResult(
		boolean onNextPage,
		ParagraphList toRender,
		ParagraphList remainder
	) {}

	private TextPreflightResult preflightText(@NonNull RegionCursor regionCursor, boolean preventPageBreak) {
		final var remainingSpace = regionCursor.getRemainingRegionSpace();
		final var regionSpace = regionCursor.getRegionSpace();
		final var documentHandle = regionCursor.getContainerDocumentHandle();
		final var lineHeight = textRenderStyle.getLineHeight();
		final var borderWidth = SizeResolverUtils.getBorderWidth(borderProperties);

		if (size.getHeight() == 0) {
			return new TextPreflightResult(false, null, null);
		}

		final var visibleLineCount = getVisibleLineCount(
			remainingSpace,
			regionSpace,
			size.getHeight(),
			borderWidth,
			lineHeight,
			paragraphList,
			documentHandle instanceof SectionDocumentHandle
		);

		// Text Element is completely on next page
		if (visibleLineCount == 0 || (
				preventPageBreak &&
					visibleLineCount < paragraphList.totalLinesCount() &&
					size.getHeight() <= regionSpace
			)
		) {
			return new TextPreflightResult(true, null, null);
		}

		ParagraphList.ParagraphSlice slice = ParagraphList.slice(paragraphList, visibleLineCount);

		return new TextPreflightResult(false, slice.visible(), slice.remaining());
	}

	private ComponentResult renderText(
		@NonNull TextPreflightResult preflightResult,
		@NonNull RegionCursor regionCursor,
		boolean preventPageBreak
	) {
		final var contentStream = regionCursor.getContentStream();
		final var position = regionCursor.getPosition();
		final var remainingSpace = regionCursor.getRemainingRegionSpace();
		final var lineHeight = textRenderStyle.getLineHeight();
		final var borderWidth = SizeResolverUtils.getBorderWidth(borderProperties);

		if (preflightResult.onNextPage) {
			return new ComponentResult(Optional.of(this), remainingSpace);
		} else if (preflightResult.toRender == null) {
			return new ComponentResult(Optional.empty(), size.getHeight());
		}

		ParagraphList toRender = preflightResult.toRender;
		ParagraphList remainder = preflightResult.remainder;

		final var width = size.getWidth();
		final var maxWidth = width - (borderWidth * 2) - textRenderStyle.getHorizontalPadding();
		final var fontSize = textRenderStyle.getFontSize();
		final var wrappingStructType = textRenderStyle.getWrappingStructType();

		final long initialXPosition = position.getX() + borderWidth + textRenderStyle.getPaddingLeft();
		long iterateYPosition = PDFUnitUtil.invertYPos(position.getY() + borderWidth + textRenderStyle.getPaddingTop(), contentStream.getPage());

		BoxComponent.renderBorder(
			regionCursor,
			size,
			borderProperties,
			ongoingRendering,
			preventPageBreak
		);

		final var linkStructElements = new ArrayList<PDStructureElement>();
		final var structElements = new ArrayList<PDStructureElement>();
		for (final var paragraph : toRender.getParagraphs()) {
			for (int idx = 0; idx < paragraph.getLinesCount(); idx++) {
				final var line = paragraph.getLineAt(idx);

				final var renderAlignment = new TextRenderAlignment(line, paragraph.isLastLine(idx), initialXPosition, maxWidth);
				long iterateXPosition = renderAlignment.getAlignmentPosition();

				final var tags = new ArrayList<>();

				final var wrappingStructElement = getStructElement(
					wrappingStructType.equals(DIV) ? P : SPAN,
					contentStream.getPage()
				);

				renderTokens(
					regionCursor,
					line,
					fontSize,
					lineHeight,
					renderAlignment,
					iterateXPosition,
					iterateYPosition,
					wrappingStructElement,
					linkStructElements,
					tags
				);
				iterateYPosition -= lineHeight;

				addTagsToStructElement(tags, wrappingStructElement);

				structElements.add(wrappingStructElement);
			}
		}

		final var wrappingStructElement = getStructElement(wrappingStructType, contentStream.getPage());
		for (final var pStructElement : structElements) {
			wrappingStructElement.appendKid(pStructElement);
		}
		contentStream.addLinkStructElements(linkStructElements);

		if (remainder.totalLinesCount() > 0) {
			return getFinalComponentResult(
				preflightResult,
				regionCursor,
				new AccessibilityData(List.of(wrappingStructElement), structElements)
			);
		}
		return new ComponentResult(
			Optional.empty(),
			size.getHeight(),
			new AccessibilityData(List.of(wrappingStructElement), structElements)
		);
	}

	private static void addTagsToStructElement(ArrayList<Object> tags, PDStructureElement wrappingStructElement) {
		if (tags.size() == 1) {
			final var firstTag = tags.getFirst();
			if (firstTag instanceof PDStructureElement structureElement) {
				wrappingStructElement.appendKid(structureElement);
			} else {
				wrappingStructElement.appendKid(getMarkedContent((COSInteger) tags.getFirst()));
			}
		} else {
			wrappingStructElement.setKids(tags);
		}
	}

	private void renderTokens(
		RegionCursor regionCursor,
		List<InnerTextToken> line,
		long fontSize,
		long lineHeight,
		TextRenderAlignment renderAlignment,
		long iterateXPosition,
		long iterateYPosition,
		PDStructureElement wrappingStructElement,
		ArrayList<PDStructureElement> linkStructElements,
		ArrayList<Object> tags
	) {
		for (final InnerTextToken innerTextToken : line) {
			final var innerTextRenderResult = renderInnerTextToken(
				regionCursor,
				font,
				fontSize,
				lineHeight,
				innerTextToken,
				renderAlignment,
				new Position(iterateXPosition, iterateYPosition)
			);
			final var linkStructElement = innerTextRenderResult.linkElement;
			if (linkStructElement != null) {
				linkStructElement.setParent(wrappingStructElement);
				linkStructElements.add(linkStructElement);
				tags.add(linkStructElement);
			} else {
				tags.add(innerTextRenderResult.getTaggingId());
			}

			iterateXPosition += getWidth(innerTextToken, renderAlignment);
		}
	}

	private InnerTextRenderResult renderInnerTextToken(
		@NonNull final RegionCursor regionCursor,
		@NonNull final PDFont font,
		final long fontSize,
		final long lineHeight,
		@NonNull final InnerTextToken innerTextToken,
		final TextRenderAlignment renderAlignment,
		@NonNull final Position position
	) {
		final var documentHandle = regionCursor.getContainerDocumentHandle();
		final var contentStream = regionCursor.getContentStream();
		final var htmlStyle = innerTextToken.getStyle().overrideWith(style);
		final var backgroundColor = htmlStyle.getBackgroundColor();
		final var bold = htmlStyle.isBold();
		final var italic = htmlStyle.isItalic();
		final var underline = htmlStyle.isUnderline();
		final var isLink = htmlStyle.getAttachmentId() != null && documentHandle instanceof SegmentDocumentHandle;
		final var isDefaultUnderline = htmlStyle.isDefaultUnderline();
		final var color = getTextColor(htmlStyle, isLink);

		final var fontBoundingBox = getFontBoundingBox(font);
		final var ascent = getFontSizeRelatedMetrics(fontBoundingBox.getUpperRightY(), fontSize);
		final var descent = getFontSizeRelatedMetrics(-fontBoundingBox.getLowerLeftY(), fontSize);
		final var textHeight = ascent + descent;
		final var verticalOffset = Math.max((lineHeight - textHeight) / 2, 0);
		final var textBaseline = position.getY() - ascent - verticalOffset;

		final var textPosition = new Position(position.getX(), position.getY() - verticalOffset);
		renderBackgroundColor(contentStream, backgroundColor, innerTextToken, textPosition, renderAlignment, textHeight);

		final var hasGraphicStateChanges = color != null || backgroundColor != null || bold;
		if (hasGraphicStateChanges) {
			contentStream.saveGraphicsState();
		}

		final var taggingId = contentStream.beginMarkedContent(SPAN_COSNAME);
		contentStream.beginText();

		setTextColorAndStyle(contentStream, bold, fontSize, color);
		final var leaning = italic ? ITALIC_SHEAR : 0;
		contentStream.setTextMatrix(1, 0, leaning, 1, position.getX(), textBaseline);

		contentStream.setFont(innerTextToken.isFallbackFont() ? fallbackFont : font, fontSize);
		synchronized (innerTextToken.isFallbackFont() ? fallbackFont : font) {
			contentStream.showText(innerTextToken.toString());
		}
		contentStream.endText();
		contentStream.endMarkedContent();

		if (hasGraphicStateChanges) {
			contentStream.restoreGraphicsState();
		}

		if (underline || (isLink && isDefaultUnderline)) {
			final var underlineOffset = Math.round(getFontSizeRelatedMetrics(-font.getFontDescriptor().getDescent(), fontSize));
			final long thickness = Math.round(fontSize * UNDERLINE_FACTOR);
			final var yPosition = contentStream.getPageHeight() - thickness / 2 - (textBaseline - underlineOffset);

			new LineComponent(
				getId(),
				color,
				BorderProperties.BorderStyle.SOLID,
				thickness,
				new Size(getWidth(innerTextToken, renderAlignment), thickness)
			).render(regionCursor.toBuilder()
				.position(new Position(position.getX(), yPosition))
				.build(),
				false
			);
		}

		PDStructureElement linkStructElement = null;
		if (isLink) {
			linkStructElement = addLink(
				htmlStyle.getAttachmentId(),
				contentStream,
				innerTextToken,
				textPosition,
				renderAlignment,
				textHeight,
				taggingId
			);
		}

		return new InnerTextRenderResult(COSInteger.get(taggingId), linkStructElement);
	}

	@Value
	private static class InnerTextRenderResult {
		@NonNull COSInteger taggingId;
		PDStructureElement linkElement;
	}

	private PDStructureElement addLink(
		@NonNull final String attachmentId,
		@NonNull final ContentStreamAdapter contentStream,
		@NonNull final InnerTextToken innerTextToken,
		@NonNull final Position position,
		final TextRenderAlignment renderAlignment,
		final long height,
		int taggingId
	) {
		final PDAnnotationLink link = new PDAnnotationLink();
		PDBorderStyleDictionary styleDict = new PDBorderStyleDictionary();
		styleDict.setWidth(0);
		styleDict.setStyle(PDBorderStyleDictionary.STYLE_SOLID);
		link.setBorderStyle(styleDict);
		link.setAnnotationFlags(4);

		final var action = new PDActionURI();
		action.setURI(attachmentId);
		link.setAction(action);

		final var linkRect = new PDRectangle(
			longPtToFloat(position.getX()),
			longPtToFloat(position.getY() - height),
			longPtToFloat(getWidth(innerTextToken, renderAlignment)),
			longPtToFloat(height)
		);
		link.setRectangle(linkRect);

		try {
			var annotations = contentStream.getPage().getAnnotations();
			if (annotations == null) {
				annotations = new ArrayList<>();
			}
			annotations.add(link);
			contentStream.getPage().setAnnotations(annotations);
		} catch (IOException e) {
			throw new PrintRenderingException(e);
		}

		final var tags = new ArrayList<>();
		tags.add(COSInteger.get(taggingId));
		final var objRef = new PDObjectReference();
		objRef.setReferencedObject(link);
		tags.add(objRef);

		final var linkStruct = getStructElement(LINK, contentStream.getPage());
		linkStruct.setKids(tags);
		return linkStruct;
	}

	private int getVisibleLineCount(
		long remainingSpace,
		long regionSpace,
		long currentHeight,
		long border,
		long lineHeight,
		ParagraphList paragraphList,
		boolean insideSection
	) {
		final var orphans = insideSection ? 0 : lineCountSettings.getOrphans();
		final var widows = insideSection ? 0 : lineCountSettings.getWidows();
		final var totalLineCount = paragraphList.totalLinesCount();

		if (currentHeight <= remainingSpace) {
			return totalLineCount;
		}

		var remainingSpaceWithoutBorder =
			ongoingRendering
				? remainingSpace - (border) - textRenderStyle.getPaddingBottom()
				: remainingSpace - (2 * border) - textRenderStyle.getVerticalPadding();

		if (remainingSpace == regionSpace && remainingSpaceWithoutBorder - lineHeight < 0) {
			throw new PrintDomainException("The line height {} is too high for the page size", longPtToFloat(lineHeight));
		}
		var availableLines = (int) Math.floor((double) remainingSpaceWithoutBorder / lineHeight);

		if (totalLineCount <= availableLines) {
			return totalLineCount;
		}

		return getVisibleLinesPerParagraph(orphans, widows, availableLines);
	}

	private int getVisibleLinesPerParagraph(
		final int orphans,
		final int widows,
		int availableLines
	) {
		var visibleLines = 0;
		for (ParagraphList.Paragraph paragraph : paragraphList.getParagraphs()) {
			if (availableLines == 0) {
				return visibleLines;
			}
			final var lineCount = paragraph.getLinesCount();

			if (lineCount <= availableLines) {
				visibleLines += lineCount;
				availableLines -= lineCount;
				continue;
			}

			if (lineCount < (widows + orphans)) {
				return visibleLines;
			}

			if (availableLines < orphans) {
				return visibleLines;
			}

			final var remainingLineCount = lineCount - availableLines;

			if (remainingLineCount < widows) {
				return visibleLines + lineCount - widows;
			}

			return visibleLines + availableLines;
		}

		return visibleLines;
	}

	private void renderBackgroundColor(
		@NonNull final ContentStreamAdapter contentStream,
		final Integer backgroundColor,
		@NonNull final InnerTextToken innerTextToken,
		@NonNull final Position position,
		final TextRenderAlignment renderAlignment,
		final long height
	) {
		if (backgroundColor != null) {
			final var revertPositionInvert = new Position(
				position.getX(),
				contentStream.getPageHeight() - position.getY()
			);
			final var textSize = new Size(getWidth(innerTextToken, renderAlignment), height);
			BoxRenderer.renderBackground(
				contentStream,
				revertPositionInvert,
				textSize,
				BoxStyleParameters.builder().backgroundColor(backgroundColor).build()
			);
		}
	}

	private Integer getTextColor(HtmlStyle htmlStyle, boolean isLink) {
		boolean isDefaultColor = htmlStyle.isDefaultColor();

		if (isLink && isDefaultColor) {
			return Color.blue.getBlue();
		}

		return htmlStyle.getColor();
	}

	private void setTextColorAndStyle(ContentStreamAdapter contentStream, boolean bold, long fontSize, Integer color) {
		if (color != null) {
			setNonStrokingColor(contentStream, color);
		}

		if (bold) {
			contentStream.setRenderingMode(RenderingMode.FILL_STROKE);
			contentStream.setLineWidth(Math.round(fontSize * BOLD_FACTOR));

			if (color != null) {
				setStrokingColor(contentStream, color);
			}
		}
	}

	private static BoundingBox getFontBoundingBox(
		@NonNull final PDFont font
	) {
		try {
			return font.getBoundingBox();
		} catch (IOException e) {
			throw new PrintRenderingException(e);
		}
	}

	private static long getWidth(
		@NonNull final InnerTextToken innerTextToken,
		final TextRenderAlignment renderAlignment
	) {
		if (renderAlignment.isJustifyApplied()) {
			return innerTextToken.getWidthOrThrow() + renderAlignment.getExtraWidth(innerTextToken);
		}
		return innerTextToken.getWidthOrThrow();
	}
}
