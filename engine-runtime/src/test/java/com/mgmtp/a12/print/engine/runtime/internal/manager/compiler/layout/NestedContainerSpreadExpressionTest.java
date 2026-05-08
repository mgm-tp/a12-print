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
package com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout;

import com.mgmtp.a12.print.engine.api.PrintModelId;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.markup.container.switchCase.SwitchMarkupDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.heightCalculation.EvaluatedHeightOffset;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalPdfPrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.provider.LogicContainerEvaluation;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.provider.LogicContainerEvaluationDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.metadata.AccessibilityMetadataDependency;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.pdDocument.AccessibilityMetadata;
import com.mgmtp.a12.print.engine.runtime.test.internal.PrintTestUtil;
import com.mgmtp.a12.print.engine.runtime.utils.PdfRuntimeTestUtil;
import com.mgmtp.a12.print.model.api.model.PrintModel;
import com.mgmtp.a12.print.model.api.model.element.type.switchCase.Switch;
import com.mgmtp.a12.print.model.api.model.segment.ModelSegment;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NestedContainerSpreadExpressionTest {
	private NestedContainerSpreadExpression underTest;

	private static PrintModel switchPrintModel = PrintTestUtil.deserializePrintModel(PrintTestUtil.loadFromResources("/data/switch/SwitchPM.json"));
	private static ModelSegment firstSegment = switchPrintModel.getContent().getSegments().getDefinitions().stream().findFirst().get();
	@Spy
	private static InternalPdfPrintEngineRuntime spyRuntime;

	@Test
	public void givenVisibleSwitch_whenProduce_thenCorrect() {
		var switchId = "FIRST_SWITCH";
		String[] childSpreadExpressionIds = {"FIRST_AREA"};
		String[] dependentSpreadExpressionIds = {""};
		var switchElement = (Switch) PdfRuntimeTestUtil.getPrintModelElement(switchPrintModel, switchId);
		var placeableReference = PdfRuntimeTestUtil.getPlaceableReference(switchPrintModel, switchId);
		var referenceSpreadExpression = PdfRuntimeTestUtil.getReferenceSpreadExpression(switchPrintModel, firstSegment, placeableReference);
		referenceSpreadExpression.setDependentSpreadExpressionIds(dependentSpreadExpressionIds);
		var spreadExpressionDependency = SpreadExpressionDependency
			.builder()
			.spreadExpressionId("SPREAD_EXPRESSION_ID")
			.evaluatedHeightOffset(new EvaluatedHeightOffset(0, 0))
			.totalPageCount(0)
			.build();
		var mockFinalYPositionValueFactory = mock(ValueFactory.class);
		var mockSpreadExpressionResultValueFactory = mock(ValueFactory.class);
		when(spyRuntime.provide(any(FinalYPositionDependency.class))).thenReturn(mockFinalYPositionValueFactory);
		when(spyRuntime.provide(any(SwitchMarkupDependency.class))).thenReturn(mockSpreadExpressionResultValueFactory);
		when(spyRuntime.provide(any(AccessibilityMetadataDependency.class))).thenReturn(() -> new AccessibilityMetadata(
			"title", "language", "description", "author", "producer"
		));
		when(mockFinalYPositionValueFactory.get()).thenReturn(0);

		underTest = new NestedContainerSpreadExpression(
			switchElement.getId(),
			switchElement,
			firstSegment,
			childSpreadExpressionIds,
			null,
			PrintModelId.fromString(switchPrintModel.getHeader().getId()),
			referenceSpreadExpression,
			0
		);

		underTest.produce(spreadExpressionDependency, null, null, spyRuntime);

		verify(spyRuntime, never()).provide(any(LogicContainerEvaluationDependency.class));
		verify(spyRuntime).provide(any(FinalYPositionDependency.class));
		verify(spyRuntime).provide(any(SwitchMarkupDependency.class));
	}

	@Test
	public void givenHiddenSwitch_whenProduce_thenCorrect() {
		var switchId = "THIRD_SWITCH";
		String[] childSpreadExpressionIds = {"THIRD_AREA"};
		String[] dependentSpreadExpressionIds = {""};
		var switchElement = (Switch) PdfRuntimeTestUtil.getPrintModelElement(switchPrintModel, switchId);
		var placeableReference = PdfRuntimeTestUtil.getPlaceableReference(switchPrintModel, switchId);
		var referenceSpreadExpression = PdfRuntimeTestUtil.getReferenceSpreadExpression(switchPrintModel, firstSegment, placeableReference);
		referenceSpreadExpression.setDependentSpreadExpressionIds(dependentSpreadExpressionIds);
		var spreadExpressionDependency = SpreadExpressionDependency.builder().evaluatedHeightOffset(new EvaluatedHeightOffset(0, 0)).totalPageCount(0).build();
		var mockLogicContainerValueFactory = mock(ValueFactory.class);
		var mockFinalYPositionValueFactory = mock(ValueFactory.class);
		var mockLogicContainerEvaluation = mock(LogicContainerEvaluation.class);
		when(spyRuntime.provide(any(LogicContainerEvaluationDependency.class))).thenReturn(mockLogicContainerValueFactory);
		when(spyRuntime.provide(any(FinalYPositionDependency.class))).thenReturn(mockFinalYPositionValueFactory);
		when(mockLogicContainerValueFactory.get()).thenReturn(mockLogicContainerEvaluation);
		when(mockLogicContainerEvaluation.getValue()).thenReturn(Optional.of(true));
		when(mockFinalYPositionValueFactory.get()).thenReturn(0);

		underTest = new NestedContainerSpreadExpression(
			switchElement.getId(),
			switchElement,
			firstSegment,
			childSpreadExpressionIds,
			null,
			PrintModelId.fromString(switchPrintModel.getHeader().getId()),
			referenceSpreadExpression,
			0
		);

		underTest.produce(spreadExpressionDependency, null, null, spyRuntime);

		verify(spyRuntime).provide(any(LogicContainerEvaluationDependency.class));
		verify(spyRuntime).provide(any(FinalYPositionDependency.class));
		verify(spyRuntime, never()).provide(any(SwitchMarkupDependency.class));
	}


}
