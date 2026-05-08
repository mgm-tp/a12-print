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
package com.mgmtp.a12.print.model.api.inputSource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

import com.mgmtp.a12.print.model.api.exceptions.InputSourceException;
import com.mgmtp.a12.print.model.api.model.element.properties.TextProperties.Alignment;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.base.inputSource.AlignmentInputSourceDto;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.base.inputSource.BooleanInputSourceDto;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.base.inputSource.StringInputSourceDto;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.properties.TextPropertiesDto;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.type.chart.pieChart.PieChartDto;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.type.table.TableDto;

class InputSourceResolverTest {

    @Test
    void testGetInputSourceByPath() {
        TableDto table = createDummyTableDTO();
        PieChartDto pieChart = createDummyPieChartDTO();

        assertEquals("dummyStyleId", InputValueSourceResolver.getInputSourceByPath(table, "textProperties/textStyleId").getValue().orElse(null));
        assertEquals("red", InputValueSourceResolver.getInputSourceByPath(table, "textProperties/color").getValue().orElse(null));
        assertEquals("white", InputValueSourceResolver.getInputSourceByPath(table, "textProperties/backgroundColor").getValue().orElse(null));
        assertEquals(Alignment.CENTER, InputValueSourceResolver.getInputSourceByPath(table, "textProperties/alignment").getValue().orElse(null));
        assertEquals(true, InputValueSourceResolver.getInputSourceByPath(table, "textProperties/bold").getValue().orElse(null));
        assertEquals(false, InputValueSourceResolver.getInputSourceByPath(table, "textProperties/italic").getValue().orElse(null));
        assertEquals(true, InputValueSourceResolver.getInputSourceByPath(table, "textProperties/underlined").getValue().orElse(null));

        assertThrows(InputSourceException.class, () -> {
            InputValueSourceResolver.getInputSourceByPath(table, "nonExisting/path");
        }, "The path 'nonExisting/path' does not exist in the model.");

        assertThrows(InputSourceException.class, () -> {
            InputValueSourceResolver.getInputSourceByPath(pieChart, "textProperties/textStyleId");
        }, "The PieChartDto does not support getting input source by path.");
    }


    private PieChartDto createDummyPieChartDTO() {
        return PieChartDto
            .builder()
            .chartProperties(null)
            .textProperties(null)
            .build();
    }

    private TableDto createDummyTableDTO() {
        TextPropertiesDto textProperties = TextPropertiesDto.builder()
            .textStyleId(StringInputSourceDto.builder().value("dummyStyleId").build())
            .color(StringInputSourceDto.builder().value("red").build())
            .backgroundColor(StringInputSourceDto.builder().value("white").build())
            .alignment(AlignmentInputSourceDto.builder().value(Alignment.CENTER).build())
            .bold(BooleanInputSourceDto.builder().value(true).build())
            .italic(BooleanInputSourceDto.builder().value(false).build())
            .underlined(BooleanInputSourceDto.builder().value(true).build())
            .build();

        return TableDto
            .builder()
            .tableProperties(null)
            .textProperties(textProperties)
            .build();
    }

}
