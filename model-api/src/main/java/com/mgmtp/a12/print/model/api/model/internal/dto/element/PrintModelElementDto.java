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
package com.mgmtp.a12.print.model.api.model.internal.dto.element;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.mgmtp.a12.print.model.api.model.element.ElementType;
import com.mgmtp.a12.print.model.api.model.element.PrintModelElement;
import com.mgmtp.a12.print.model.api.model.internal.dto.JsonModel;
import com.mgmtp.a12.print.model.api.model.internal.dto.PrintModelEntityDto;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.type.area.AreaDTO;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.type.boundingBox.BoundingBoxDTO;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.type.calculation.CalculationDto;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.type.chart.barChart.BarChartDto;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.type.chart.lineChart.LineChartDto;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.type.chart.pieChart.PieChartDto;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.type.expression.ExpressionDto;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.type.field.FieldDto;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.type.horizontalLine.HorizontalLineDto;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.type.image.ImageDto;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.type.listing.ListingDto;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.type.override.OverrideElementDto;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.type.pageNumber.PageNumberDto;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.type.pageNumber.PageNumberTotalDto;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.type.switchCase.SwitchDto;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.type.table.TableDto;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.type.tableLayout.TableLayoutDto;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.type.text.TextElementDto;
import lombok.AccessLevel;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@JsonInclude(Include.NON_ABSENT)
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor(force = true, access = AccessLevel.PROTECTED)
@JsonTypeInfo(
	use = JsonTypeInfo.Id.NAME,
	property = "type",
	defaultImpl = PrintModelElementDto.class,
	visible = true
)
@JsonSubTypes({
	@JsonSubTypes.Type(value = BarChartDto.class, name = "BarChart"),
	@JsonSubTypes.Type(value = LineChartDto.class, name = "LineChart"),
	@JsonSubTypes.Type(value = PieChartDto.class, name = "PieChart"),
	@JsonSubTypes.Type(value = ImageDto.class, name = "Image"),
	@JsonSubTypes.Type(value = FieldDto.class, name = "Field"),
	@JsonSubTypes.Type(value = CalculationDto.class, name = "Calculation"),
	@JsonSubTypes.Type(value = TextElementDto.class, name = "Text"),
	@JsonSubTypes.Type(value = TableDto.class, name = "Table"),
	@JsonSubTypes.Type(value = ExpressionDto.class, name = "Expression"),
	@JsonSubTypes.Type(value = ListingDto.class, name = "Listing"),
	@JsonSubTypes.Type(value = TableLayoutDto.class, name = "TableLayout"),
	@JsonSubTypes.Type(value = HorizontalLineDto.class, name = "Line"),
	@JsonSubTypes.Type(value = PageNumberDto.class, name = "PageNumber"),
	@JsonSubTypes.Type(value = PageNumberTotalDto.class, name = "PageNumberTotal"),
	@JsonSubTypes.Type(value = BoundingBoxDTO.class, name = "BoundingBox"),
	@JsonSubTypes.Type(value = OverrideElementDto.class, name = "Override"),
	@JsonSubTypes.Type(value = AreaDTO.class, name = "Area"),
	@JsonSubTypes.Type(value = SwitchDto.class, name = "Switch")
})
public class PrintModelElementDto extends PrintModelEntityDto implements PrintModelElement, JsonModel {
	@JsonProperty(value = "type", required = true)
	private final ElementType type;

	@Override
	public ElementType getType() {
		return type;
	}
}
