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
package com.mgmtp.a12.print.engine.runtime.internal.engine.rendering;

import com.mgmtp.a12.print.engine.api.constant.CssConstants;
import com.mgmtp.a12.print.engine.runtime.internal.engine.constant.Constants;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.markup.ChartHtmlTemplateParameters;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.markup.HorizontalLineHtmlTemplateParameters;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.markup.ImageHtmlTemplateParameters;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.markup.container.ContainerHtmlTemplateParameters;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.markup.listing.ListingHtmlTemplateParameters;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.markup.text.NestingType;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.tableLayout.TableLayoutRow;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.tableLayout.TableLayoutRowElement;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.MarkupResult;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.textStyleResolver.TextStyleDependency;
import com.mgmtp.a12.print.model.api.inputSource.InputValueSourceResolver;
import com.mgmtp.a12.print.model.api.model.element.PrintModelElement;
import com.mgmtp.a12.print.model.api.model.element.base.DisplayOptions;
import com.mgmtp.a12.print.model.api.model.element.base.inputSource.MeasureInputSource;
import com.mgmtp.a12.print.model.api.model.element.base.Measure;
import com.mgmtp.a12.print.model.api.model.element.base.Styleable;
import com.mgmtp.a12.print.model.api.model.element.properties.BorderProperties;
import com.mgmtp.a12.print.model.api.model.element.properties.TextProperties;
import com.mgmtp.a12.print.model.api.model.element.type.calculation.Calculation;
import com.mgmtp.a12.print.model.api.model.element.type.field.Field;
import com.mgmtp.a12.print.model.api.model.element.type.listing.Listing;
import com.mgmtp.a12.print.model.api.model.element.type.listing.RowPropertyComputation;
import com.mgmtp.a12.print.model.api.model.element.type.listing.column.ColumnPropertyComputation;
import com.mgmtp.a12.print.model.api.model.element.type.table.Table;
import com.mgmtp.a12.print.model.api.model.element.type.tableLayout.TableLayout;
import com.mgmtp.a12.print.model.api.model.reference.PlaceableReference;
import com.mgmtp.a12.print.model.api.model.textStyle.TextStyle;
import com.mgmtp.a12.print.model.document.internal.base.IContentHolder;
import lombok.NonNull;
import org.apache.commons.lang3.EnumUtils;
import org.apache.commons.lang3.StringUtils;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.mgmtp.a12.print.engine.api.constant.CssConstants.*;
import static com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.markup.text.NestingType.NONE;
import static com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.markup.text.NestingType.TABLE_LAYOUT_CELL;
import static com.mgmtp.a12.print.model.api.model.element.base.Measure.MeasureUnit.PERCENT;

public class CssUtil {

	private static final String NORMAL = "normal";

	public String getCssClasses(
		final @NonNull PrintModelElement element
	) {
		return getCssClasses(element, NONE);
	}

	public String getCssClasses(
		final @NonNull PrintModelElement element,
		final NestingType nestingType
	) {
		final List<String> cssClasses = new ArrayList<>();
		cssClasses.add(element.getType().name().toLowerCase());
		cssClasses.add(nestingType.equals(NONE) ? "element" : nestingType.getIdentifier());

		return String.join(" ", cssClasses);
	}

	public TextStyleDependency getTextStyleFromStyleable(Styleable styleable, InputValueSourceResolver.ReferenceResolver referenceValueResolver) {
		return TextStyleDependency.create(styleable.getTextProperties().flatMap(TextProperties::getTextStyleId), referenceValueResolver);
	}

	public String getStyle(@NonNull final PrintModelElement element, PlaceableReference reference, InputValueSourceResolver.ReferenceResolver referenceInputSourceResolver) {
		return getStyle(element, reference, null, NONE, false, referenceInputSourceResolver);
	}

	public String getStyle(
		@NonNull final PrintModelElement element,
		final PlaceableReference placeableReference,
		final TextStyle textStyle,
		InputValueSourceResolver.ReferenceResolver referenceInputSourceResolver
	) {
		return getStyle(element, placeableReference, textStyle, NONE, false, referenceInputSourceResolver);
	}

	public String getStyle(
		@NonNull final PrintModelElement element,
		final PlaceableReference placeableReference,
		final TextStyle textStyle,
		final NestingType nestingType,
		final boolean isHtml,
		InputValueSourceResolver.ReferenceResolver referenceInputSourceResolver
	) {
		final var styleProperties = initStyleProperties(placeableReference);

		Optional<DisplayOptions.DisplayType> displayType = getDisplayOptions(element).flatMap(DisplayOptions::getDisplayType);
		if (
			isHtml ||
				(displayType.isPresent() && displayType.get().equals(DisplayOptions.DisplayType.HTML))
		) {
			styleProperties.put("white-space", NORMAL);
		}

		if (element instanceof Styleable styleable &&
			!(element instanceof TableLayout) &&
			!(element instanceof Listing)
		) {
			styleable.getTextProperties().ifPresent(textProperties -> {
				styleProperties.putAll(getTextPropertyStyles(textProperties, referenceInputSourceResolver));
				styleProperties.putAll(getTextStyles(textStyle));
			});

			if (nestingType.equals(TABLE_LAYOUT_CELL)) {
				styleProperties.put("display", "block");
			} else if (nestingType.equals(NONE)) {
				styleable.getBorderProperties().ifPresent(borderProperties ->
					styleProperties.putAll(getBorderPropertyStyles(borderProperties))
				);
			}
		}
		return styles2String(styleProperties);
	}

	private Map<String, String> initStyleProperties(final PlaceableReference placeableReference) {
		return Optional.ofNullable(placeableReference).map(this::getPlaceableStyles).orElseGet(HashMap::new);
	}

	private Map<String, String> getTextStyles(TextStyle textStyle) {
		if (textStyle == null) {
			return Collections.emptyMap();
		}
		return Map.of(
			"font-family", textStyle.getFont(),
			"font-size", asPt(textStyle.getFontSize()),
			LINE_HEIGHT, asPt(textStyle.getLineHeight()));
	}

	public String getHeadingTag(TextStyle textStyle) {
		if (textStyle != null) {
			String semantic = textStyle.getSemantic().name().toLowerCase();
			Matcher matcher = Pattern.compile(Constants.HEADING_PATTERN).matcher(semantic);
			if (matcher.find()) {
				return semantic;
			}
		}
		return StringUtils.EMPTY;
	}

	public String getTableColumnWidth(final MeasureInputSource inputSource) {
		return InputValueSourceResolver.getInputValue(inputSource)
			.map(measure -> withUnit(inputSource.getUnit(), measure.getValue()))
			.orElse("");
	}

	public String getTableRowStyle(final Table table, boolean isHeader, TextStyle textStyle, InputValueSourceResolver.ReferenceResolver referenceInputSourceResolver ) {
		return styles2String(getTableRowStyles(table, isHeader, textStyle, referenceInputSourceResolver));
	}

	public String getHeadingSemanticTableRowStyle(final Table table, boolean isHeader, TextStyle textStyle, InputValueSourceResolver.ReferenceResolver referenceInputSourceResolver) {
		final Map<String, String> styles = getHeadingSemanticStyles(
			getTableRowStyles(table, isHeader, textStyle, referenceInputSourceResolver), textStyle
		);
		return styles2String(styles);
	}

	public Map<String, String> getTableRowStyles(final Table table, boolean isHeader, TextStyle textStyle,  InputValueSourceResolver.ReferenceResolver referenceInputSourceResolver) {
		final Map<String, String> styleProperties = new HashMap<>();
		table.getBorderProperties().ifPresent(borderProperties ->
			styleProperties.putAll(getBorderPropertyStyles(borderProperties))
		);
		styleProperties.putAll(getTextStyles(textStyle));
		if (isHeader) {
			table.getTableProperties().getHeaderTextProperties().ifPresent(headerTextProperties ->
				styleProperties.putAll(getTextPropertyStyles(headerTextProperties, referenceInputSourceResolver))
			);
		} else {
			table.getTextProperties().ifPresent(textProperties ->
				styleProperties.putAll(getTextPropertyStyles(textProperties, referenceInputSourceResolver))
			);
		}
		return styleProperties;
	}

	public String getTableLayoutRowStyle(final TableLayoutRow row) {
		final Map<String, String> styleProperties = new HashMap<>();
		final var rowProperties = row.getRowProperties();
		rowProperties.ifPresent(properties -> InputValueSourceResolver.getInputValue(properties.getMinHeight())
			.ifPresent(minHeight ->
				styleProperties.put(HEIGHT, withUnit(properties
					.getMinHeight()
					.getUnit(), minHeight.getValue()))
			));
		return styles2String(styleProperties);
	}

	public String getTableLayoutCellContent(final IContentHolder contentHolder) {
		return ((MarkupResult) contentHolder).getMarkup();
	}

	public String getTableLayoutCellStyle(final TableLayout layout, final TableLayoutRowElement cell) {
		final Map<String, String> styleProperties = new HashMap<>();

		layout.getBorderProperties().flatMap(BorderProperties::getBorderStyle).ifPresent(
			style -> styleProperties.putAll(getBorderPropertyStyles(layout.getBorderProperties().get()))
		);

		cell.getBorderProperties().flatMap(BorderProperties::getBorderStyle).ifPresent(
			style -> styleProperties.putAll(getBorderPropertyStyles(cell.getBorderProperties().get()))
		);

		cell.getColumnProperties().ifPresent(props -> {
			styleProperties.put("vertical-align", props.getVerticalAlignment().name().toLowerCase());
			InputValueSourceResolver.getInputValue(props.getWidth()).ifPresent(width -> styleProperties.put(WIDTH, withUnit(props.getWidth().getUnit(), width.getValue())));
		});
		return styles2String(styleProperties);
	}

	public String getLineStyle(final HorizontalLineHtmlTemplateParameters context) {
		final var line = context.getElement();
		final var styleProperties = initStyleProperties(context.getPlaceableReference());

		styleProperties.remove(HEIGHT);

		line.getBorderProperties().ifPresent(borderProperties -> {
			borderProperties.getBorderColor().ifPresent(color -> styleProperties.put(BORDER_COLOR, color));
			borderProperties.getBorderStyle().ifPresent(style -> styleProperties.put(BORDER_STYLE,
				String.format("%s none none none", getBorderStyle(style))
			));
			borderProperties.getBorderWidth().ifPresent(width -> styleProperties.put(BORDER_WIDTH, asPt(width)));
		});
		return styles2String(styleProperties);
	}

	public String getImageStyle(final ImageHtmlTemplateParameters context) {
		final var styleProperties = getPlaceableStyles(context.getPlaceableReference());

		context.getImageDimensions().getHeight()
			   .ifPresent(height -> styleProperties.put(HEIGHT, withUnit(height)));

		context.getImageDimensions().getWidth()
			   .ifPresent(width -> styleProperties.put(WIDTH, withUnit(width)));

		return styles2String(styleProperties);
	}

	public String getContainerStyle(final ContainerHtmlTemplateParameters context) {
		final var styleProperties = this.getPlaceableStyles(context.placeableReference());
		styleProperties.put(HEIGHT, withUnit(context.dimensions().getHeight()));
		styleProperties.put(WIDTH, withUnit(context.dimensions().getWidth()));

		return styles2String(styleProperties);
	}

	public String getContainerOverlayStyle(final ContainerHtmlTemplateParameters context) {
		final var styleProperties = new HashMap<String, String>();

		context.borderProperties().ifPresent(borderProperties ->
			styleProperties.putAll(getBorderPropertyStyles(borderProperties))
		);

		return styles2String(styleProperties);
	}

	public String getChartStyle(final ChartHtmlTemplateParameters context) {
		final var styleProperties = getPlaceableStyles(context.getPlaceableReference());

		styleProperties.put(WIDTH, withUnit(context.getDimensions().getWidth()));
		styleProperties.put(HEIGHT, withUnit(context.getDimensions().getHeight()));

		return styles2String(styleProperties);
	}

	public boolean getListingRowHidden(final ListingHtmlTemplateParameters.MarkupListingRowValue listingRowValue) {
		Object isHidden = listingRowValue.getRowProperties().get(RowPropertyComputation.PropertyType.IS_HIDDEN);
		return (isHidden instanceof Boolean booleanValue && booleanValue) ||
			listingRowValue.getColumnValues().stream().allMatch(this::getListingCellHidden);
	}

	public boolean getListingCellHidden(final ListingHtmlTemplateParameters.MarkupListingColumnValue listingColumnValue) {
		Object isHidden = listingColumnValue.getColumnProperties().get(ColumnPropertyComputation.PropertyType.IS_HIDDEN);
		return checkObjectIsBooleanAndTrue(isHidden);
	}

	public boolean getListingCellContentHidden(final ListingHtmlTemplateParameters.MarkupListingColumnValue listingColumnValue) {
		Object isHidden = listingColumnValue.getColumnProperties().get(ColumnPropertyComputation.PropertyType.IS_CONTENT_HIDDEN);
		return checkObjectIsBooleanAndTrue(isHidden);
	}

	public String getListingCellColumnSpan(final ListingHtmlTemplateParameters.MarkupListingColumnValue listingColumnValue) {
		Object columnSpan = listingColumnValue.getColumnProperties().get(ColumnPropertyComputation.PropertyType.COLUMN_SPAN);
		if (columnSpan instanceof Number numberValue) {
			return String.format("colspan=\"%s\"", numberValue.intValue());
		}
		return "";
	}

	public Optional<TextStyle> getListingCellTextStyle(final ListingHtmlTemplateParameters.MarkupListingColumnValue listingColumnValue, TextStyle listingTextStyle) {
		return Optional.ofNullable(listingColumnValue.getColumn().hasCustomTextProperties().orElse(false) ? listingColumnValue.getTextStyle() : listingTextStyle);
	}

	public String getListingHeaderCellStyle(final Listing listing, TextStyle textStyle, InputValueSourceResolver.ReferenceResolver referenceInputSourceResolver) {
		return styles2String(getListingHeaderCellStyles(listing, textStyle, referenceInputSourceResolver));
	}

	public String getHeadingSemanticListingHeaderCellStyle(final Listing listing, TextStyle textStyle,  InputValueSourceResolver.ReferenceResolver referenceInputSourceResolver) {
		final Map<String, String> styles = getHeadingSemanticStyles(
			getListingHeaderCellStyles(listing, textStyle, referenceInputSourceResolver), textStyle
		);
		return styles2String(styles);
	}

	public Map<String, String> getListingHeaderCellStyles(final Listing listing, TextStyle textStyle, InputValueSourceResolver.ReferenceResolver referenceInputSourceResolver) {
		final Map<String, String> styleProperties = new HashMap<>();
		listing.getBorderProperties().ifPresent(borderProperties ->
			styleProperties.putAll(getBorderPropertyStyles(borderProperties))
		);
		styleProperties.putAll(getTextStyles(textStyle));
		listing.getListingProperties().getHeaderTextProperties().ifPresent(headerTextProperties ->
			styleProperties.putAll(getTextPropertyStyles(headerTextProperties, referenceInputSourceResolver))
		);
		return styleProperties;
	}

	public String getListingRowStyle(
		final Listing listing,
		final ListingHtmlTemplateParameters.MarkupListingRowValue listingRowValue,
		TextStyle textStyle,
		InputValueSourceResolver.ReferenceResolver referenceInputSourceResolver
	) {
		final Map<String, String> styleProperties = new HashMap<>();

		for (Map.Entry<RowPropertyComputation.PropertyType, Object> entry : listingRowValue.getRowProperties().entrySet()) {
			setComputedProperties(entry.getKey(), entry.getValue(), styleProperties);
		}

		getTextStyles(textStyle).forEach(styleProperties::putIfAbsent);
		listing.getTextProperties().ifPresent(props ->
			getTextPropertyStyles(props, referenceInputSourceResolver).forEach(styleProperties::putIfAbsent)
		);

		listing.getBorderProperties().ifPresent(props -> getBorderPropertyStyles(props).forEach(styleProperties::putIfAbsent));

		styleProperties.put("min-height", styleProperties.remove(LINE_HEIGHT));
		return styles2String(styleProperties);
	}

	public String getListingCellStyle(
		final Listing listing,
		final ListingHtmlTemplateParameters.MarkupListingRowValue listingRowValue,
		final ListingHtmlTemplateParameters.MarkupListingColumnValue listingColumnValue,
		TextStyle textStyle,
		InputValueSourceResolver.ReferenceResolver referenceInputSourceResolver
	) {
		return styles2String(getListingCellStyles(listing, listingRowValue, listingColumnValue, textStyle, referenceInputSourceResolver));
	}

	public String getHeadingSemanticListingCellStyle(
		final Listing listing,
		final ListingHtmlTemplateParameters.MarkupListingRowValue listingRowValue,
		final ListingHtmlTemplateParameters.MarkupListingColumnValue listingColumnValue,
		TextStyle textStyle,
		InputValueSourceResolver.ReferenceResolver referenceInputSourceResolver
	) {
		final Map<String, String> styleProperties = getHeadingSemanticStyles(
			getListingCellStyles(listing, listingRowValue, listingColumnValue, textStyle, referenceInputSourceResolver),
			textStyle
		);
		return styles2String(styleProperties);
	}

	public Map<String, String> getHeadingSemanticStyles(Map<String, String> styleProperties, TextStyle textStyle) {
		if (StringUtils.EMPTY.equals(getHeadingTag(textStyle))) {
			return styleProperties;
		}
		// Listing and table cell's value with heading semantic should not have border style (We applied border for column, so this will lead to double border)
		// LinkedHashMap is required here because we need to have "border: none" at the end of style list to remove border
		final Map<String, String> headingProperties = new LinkedHashMap<>(styleProperties);
		headingProperties.put(CssConstants.BORDER, CssConstants.NONE);

		return headingProperties;
	}

	public Map<String, String> getListingCellStyles(
		final Listing listing,
		final ListingHtmlTemplateParameters.MarkupListingRowValue listingRowValue,
		final ListingHtmlTemplateParameters.MarkupListingColumnValue listingColumnValue,
		TextStyle textStyle,
		InputValueSourceResolver.ReferenceResolver referenceInputSourceResolver
	) {
		final Map<String, String> styleProperties = new HashMap<>();

		for (Map.Entry<ColumnPropertyComputation.PropertyType, Object> entry : listingColumnValue.getColumnProperties().entrySet()) {
			if (EnumUtils.isValidEnum(RowPropertyComputation.PropertyType.class, entry.getKey().name())) {
				setComputedProperties(RowPropertyComputation.PropertyType.valueOf(entry.getKey().name()), entry.getValue(), styleProperties);
			}
		}

		for (Map.Entry<RowPropertyComputation.PropertyType, Object> entry : listingRowValue.getRowProperties().entrySet()) {
			setComputedProperties(entry.getKey(), entry.getValue(), styleProperties);
		}

		if (listingColumnValue.getColumn().hasCustomTextProperties().orElse(false)) {
			if (listingColumnValue.getTextStyle() != null) {
				getTextStyles(listingColumnValue.getTextStyle()).forEach(styleProperties::putIfAbsent);
			}
			listingColumnValue.getColumn().getTextProperties().ifPresent(props ->
				getTextPropertyStyles(props, referenceInputSourceResolver).forEach(styleProperties::putIfAbsent)
			);
		} else {
			getTextStyles(textStyle).forEach(styleProperties::putIfAbsent);
			listing.getTextProperties().ifPresent(props ->
				getTextPropertyStyles(props, referenceInputSourceResolver).forEach(styleProperties::putIfAbsent)
			);
		}

		if (listingColumnValue.getColumn().hasCustomBorderProperties().orElse(false)) {
			listingColumnValue.getColumn().getBorderProperties().ifPresent(props ->
				getBorderPropertyStyles(props).forEach(styleProperties::putIfAbsent)
			);
		} else {
			listing.getBorderProperties().ifPresent(props ->
				getBorderPropertyStyles(props).forEach(styleProperties::putIfAbsent)
			);
		}

		if (styleProperties.containsKey(LINE_HEIGHT)) {
			styleProperties.put("min-height", styleProperties.get(LINE_HEIGHT));
		}
		return styleProperties;
	}

	private void setComputedProperties(
		RowPropertyComputation.PropertyType key,
		Object value,
		Map<String, String> styleProperties
	) {
		switch (key) {
			case BOLD:
				if (checkObjectIsBooleanAndTrue(value)) {
					styleProperties.putIfAbsent("font-weight", "bold");
				}
				break;
			case ITALIC:
				if (checkObjectIsBooleanAndTrue(value)) {
					styleProperties.putIfAbsent("font-style", "italic");
				}
				break;
			case UNDERLINE:
				if (checkObjectIsBooleanAndTrue(value)) {
					styleProperties.putIfAbsent("text-decoration", "underline");
				}
				break;
			case FONT:
				styleProperties.putIfAbsent("font-family", value.toString());
				break;
			case FONT_SIZE:
				if (value instanceof Number numberValue) {
					styleProperties.putIfAbsent("font-size", asPt(numberValue.floatValue()));
				}
				break;
			case LINE_HEIGHT:
				if (value instanceof Number numberValue) {
					styleProperties.putIfAbsent(LINE_HEIGHT, asPt(numberValue.floatValue()));
				}
				break;
			case HORIZONTAL_ALIGNMENT:
				styleProperties.putIfAbsent("text-align", value.toString());
				break;
			case VERTICAL_ALIGNMENT:
				styleProperties.putIfAbsent("vertical-align", value.toString());
				break;
			case COLOR:
				styleProperties.putIfAbsent("color", value.toString());
				break;
			case BACKGROUND_COLOR:
				styleProperties.putIfAbsent("background-color", value.toString());
				break;
			case BORDER_STYLE:
				styleProperties.putIfAbsent(BORDER_STYLE, value.toString());
				break;
			case BORDER_WIDTH:
				if (value instanceof Number numberValue) {
					styleProperties.putIfAbsent(BORDER_WIDTH, asPt(numberValue.floatValue()));
				}
				break;
			case BORDER_COLOR:
				styleProperties.putIfAbsent(BORDER_COLOR, value.toString());
				break;
			case PADDING_TOP:
				if (value instanceof Number numberValue) {
					styleProperties.putIfAbsent("padding-top", asMm(numberValue.floatValue()));
				}
				break;
			case PADDING_BOTTOM:
				if (value instanceof Number numberValue) {
					styleProperties.putIfAbsent("padding-bottom", asMm(numberValue.floatValue()));
				}
				break;
			case PADDING_LEFT:
				if (value instanceof Number numberValue) {
					styleProperties.putIfAbsent("padding-left", asMm(numberValue.floatValue()));
				}
				break;
			case PADDING_RIGHT:
				if (value instanceof Number numberValue) {
					styleProperties.putIfAbsent("padding-right", asMm(numberValue.floatValue()));
				}
				break;
			default:
				break;
		}
	}

	private boolean checkObjectIsBooleanAndTrue(Object object) {
		return object instanceof Boolean booleanObject && booleanObject;
	}

	public Optional<DisplayOptions> getDisplayOptions(final PrintModelElement element) {
		switch (element.getType()) {
			case FIELD:
				return ((Field) element).getFieldProperties().getDisplayOptions();
			case CALCULATION:
				return ((Calculation) element).getCalculationProperties().getDisplayOptions();
			default:
				return Optional.empty();
		}
	}

	public Map<String, String> getTextPropertyStyles(final TextProperties properties, InputValueSourceResolver.ReferenceResolver referenceInputSourceResolver) {
		final Map<String, String> styles = new HashMap<>();
		if (properties == null) {
			return styles;
		}

		properties.getBold()
			.flatMap(bold -> InputValueSourceResolver.getInputValue(bold, referenceInputSourceResolver))
			.ifPresent(bold -> styles.put("font-weight", bold ? "bold" : NORMAL));

		properties.getItalic()
			.flatMap(italic -> InputValueSourceResolver.getInputValue(italic, referenceInputSourceResolver))
			.ifPresent(italic -> styles.put("font-style", italic ? "italic" : NORMAL));

		properties.getUnderlined()
			.flatMap(underlined -> InputValueSourceResolver.getInputValue(underlined, referenceInputSourceResolver))
			.ifPresent(underline -> styles.put("text-decoration", underline ? "underline" : "none"));

		properties.getAlignment()
			.flatMap(alignment -> InputValueSourceResolver.getInputValue(alignment, TextProperties.Alignment::fromString, referenceInputSourceResolver))
			.ifPresent(alignment -> {
				styles.put("text-align", getAlignmentStyle(alignment));
				if (alignment == TextProperties.Alignment.JUSTIFY) {
					styles.put("white-space", NORMAL);
				}
			});

		properties.getColor()
			.flatMap(color -> InputValueSourceResolver.getInputValue(color, referenceInputSourceResolver))
			.ifPresent(color -> styles.put("color", color));
		properties.getBackgroundColor()
			.flatMap(backgroundColor -> InputValueSourceResolver.getInputValue(backgroundColor, referenceInputSourceResolver))
			.ifPresent(backgroundColor -> styles.put("background-color", backgroundColor));

		return styles;
	}

	public Map<String, String> getBorderPropertyStyles(final BorderProperties properties) {
		final Map<String, String> styles = new HashMap<>();
		if (properties == null) {
			return styles;
		}

		properties.getBorderStyle().ifPresent(style -> styles.put(BORDER_STYLE, getBorderStyle(style)));
		properties.getBorderColor().ifPresent(color -> styles.put(BORDER_COLOR, color));
		properties.getBorderWidth().ifPresent(width -> styles.put(BORDER_WIDTH, asPt(width)));

		return styles;
	}

	public Map<String, String> getPlaceableStyles(@NonNull final PlaceableReference placeable) {
		final Map<String, String> styleProperties = new HashMap<>();
		Optional.ofNullable(placeable.getPosition()).ifPresent(position ->
			styleProperties.put("left", withUnit(position.getX()))
		);
		styleProperties.put(WIDTH, withUnit(placeable.getDimensions().getWidth()));
		return styleProperties;
	}

	private String styles2String(Map<String, String> styleMap) {
		return styleMap.entrySet().stream()
					   .map(e -> e.getKey() + ": " + e.getValue())
					   .collect(Collectors.joining("; "));
	}

	public String getBorderStyle(BorderProperties.BorderStyle style) {
		return switch (style) {
			case SOLID -> "solid";
			case DASHED -> "dashed";
			case DOTTED -> "dotted";
		};
	}

	private String getAlignmentStyle(final TextProperties.Alignment alignment) {
		return switch (alignment) {
			case RIGHT -> "right";
			case CENTER -> "center";
			case JUSTIFY -> "justify";
			default -> "left";
		};
	}

	private String withUnit(Measure measure) {
		return withUnit(measure.getUnit(), measure.getValue());
	}

	private String withUnit(Measure.MeasureUnit measureUnit, int value) {
		return String.format("%s%s", value, measureUnit.equals(PERCENT) ? "%" : "mm");
	}

	private String asPt(float value) {
		return String.format("%spt", value);
	}

	private String asMm(float value) {
		return String.format("%smm", value);
	}
}
