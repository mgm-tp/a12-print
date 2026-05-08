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
package com.mgmtp.a12.print.model.api.walker.model;

import com.mgmtp.a12.print.model.api.model.PrintModel;
import com.mgmtp.a12.print.model.api.model.PrintModelContent;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.container.BaseReferenceContainer;
import com.mgmtp.a12.print.model.api.model.element.PrintModelElement;
import com.mgmtp.a12.print.model.api.model.element.type.chart.barChart.BarChart;
import com.mgmtp.a12.print.model.api.model.element.type.text.TextElement;
import com.mgmtp.a12.print.model.api.model.general.General;
import com.mgmtp.a12.print.model.api.model.general.Metadata;
import com.mgmtp.a12.print.model.api.model.reference.ElementReference;
import com.mgmtp.a12.print.model.api.model.reference.PrintModelReference;
import com.mgmtp.a12.print.model.api.model.section.ModelSection;
import com.mgmtp.a12.print.model.api.model.segment.ModelSegment;
import com.mgmtp.a12.print.model.api.model.segment.ModelSegmentContainer;
import com.mgmtp.a12.print.model.api.model.segment.ModelSegmentReference;
import com.mgmtp.a12.print.model.api.model.watermark.Watermark;
import com.mgmtp.a12.print.model.api.walker.DescendCommand;
import com.mgmtp.a12.print.model.api.walker.TraversalCommand;
import com.mgmtp.a12.print.model.api.walker.model.resolver.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;
import org.mockito.MockedConstruction;
import org.mockito.MockedStatic;

import java.util.List;
import java.util.Optional;
import java.util.function.Function;

import static com.mgmtp.a12.print.model.api.walker.model.PrintModelWalker.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

public class PrintModelWalkerTest {

	private static final String SEGMENT_ID = "segmentId";

	private static final String WATERMARK_ID = "watermarkId";
	private static final String SECTION_ID = "sectionId";
	private static final String REFERENCE_MODEL = "ReferenceModel";
	private PrintModelWalker underTest;
	private PrintModel printModel;
	private PrintModelVisitor printModelVisitor;
	private ReferenceResolver referenceResolver;
	private SegmentIdResolver segmentIdResolver;
	private SectionIdResolver sectionIdResolver;

	private WatermarkIdResolver watermarkIdResolver;
	private ReferenceElementResolver referenceElementResolver;
	private PrintModelResolver printModelResolver;

	@BeforeEach
	public void init() {
		printModel = mock(PrintModel.class);
		printModelVisitor = mock(PrintModelVisitor.class);
		referenceResolver = mock(ReferenceResolver.class);
		segmentIdResolver = mock(SegmentIdResolver.class);
		sectionIdResolver = mock(SectionIdResolver.class);
		watermarkIdResolver = mock(WatermarkIdResolver.class);
		referenceElementResolver = mock(ReferenceElementResolver.class);
		printModelResolver = mock(PrintModelResolver.class);

		underTest = new PrintModelWalker(
			printModelVisitor,
			referenceResolver,
			segmentIdResolver,
			sectionIdResolver,
			watermarkIdResolver,
			referenceElementResolver,
			printModelResolver
		);

		PrintModelContent printModelContent = mock(PrintModelContent.class);
		when(printModel.getContent()).thenReturn(printModelContent);
		underTest = spy(underTest);
	}

	@Test
	public void givenPrintModel_whenWalkPrintModelWithDefaultResolver_thenReturnVisitor() {
		try (
			MockedConstruction<PrintModelWalker> mockConstruction = mockConstruction(PrintModelWalker.class);
			MockedStatic<ReferenceMultiModelResolver> modelResolver = mockStatic(ReferenceMultiModelResolver.class);
			MockedStatic<SegmentIdListResolver> segmentResolver = mockStatic(SegmentIdListResolver.class);
			MockedStatic<SectionIdListResolver> sectionResolver = mockStatic(SectionIdListResolver.class);
			MockedStatic<WatermarkIdListResolver> watermarkResolver = mockStatic(WatermarkIdListResolver.class);
			MockedStatic<ReferenceElementListResolver> listResolver = mockStatic(ReferenceElementListResolver.class);
		) {
			PrintModelVisitor resultVisitor = walkPrintModelWithDefaultResolver(
				printModel,
				printModelResolver,
				printModelVisitor
			);
			var printModelWalker = mockConstruction.constructed().get(0);
			when(printModelWalker.walkPrintModel(printModel)).thenReturn(TraversalCommand.CONTINUE);

			verify(printModelWalker).walkPrintModel(printModel);
			assertThat(resultVisitor).isEqualTo(printModelVisitor);
		}
	}

	@Test
	public void givenVisitor_whenWalkPrintModel_thenReturnMarkupResult() {
		Function resultExtractor = mock(Function.class);
		String markupResult = "MarkupResult";
		when(resultExtractor.apply(printModelVisitor)).thenReturn(markupResult);

		try (MockedConstruction<PrintModelWalker> mockConstruction = mockConstruction(PrintModelWalker.class)) {
			var actualResult = underTest.walkPrintModel(
				printModelVisitor,
				referenceResolver,
				segmentIdResolver,
				sectionIdResolver,
				watermarkIdResolver,
				referenceElementResolver,
				printModelResolver,
				printModel,
				resultExtractor);

			var walker = mockConstruction.constructed().get(0);

			verify(walker).walkPrintModel(printModel);
			assertThat(actualResult).isEqualTo(markupResult);
		}
	}

	@Test
	public void givenVisitor_whenWalkPrintModelContent_thenReturnMarkupResult() {
		Function resultExtractor = mock(Function.class);
		String markupResult = "MarkupResult";
		when(resultExtractor.apply(printModelVisitor)).thenReturn(markupResult);
		final var basePath = PrintModelPath.create(printModel).with(printModel.getContent(), 0);

		try (MockedConstruction<PrintModelWalker> mockConstruction = mockConstruction(PrintModelWalker.class)) {
			var actualResult = underTest.walkPrintModelContent(
				printModelVisitor,
				referenceResolver,
				segmentIdResolver,
				sectionIdResolver,
				watermarkIdResolver,
				referenceElementResolver,
				printModelResolver,
				basePath,
				printModel.getContent(),
				resultExtractor);

			var walker = mockConstruction.constructed().get(0);

			verify(walker).walkPrintModelContent(basePath, printModel.getContent());
			assertThat(actualResult).isEqualTo(markupResult);
		}
	}

	@Test
	public void givenVisitor_whenWalkPrintModelContentWithDefaultResolver_thenReturnVisitor() {
		Function resultExtractor = mock(Function.class);
		String markupResult = "MarkupResult";
		when(resultExtractor.apply(printModelVisitor)).thenReturn(markupResult);
		final var basePath = PrintModelPath.create(printModel)
			.with(printModel.getContent(), 0);

		try (
			MockedConstruction<PrintModelWalker> mockConstruction = mockConstruction(PrintModelWalker.class);
			MockedStatic<ReferenceMultiModelResolver> modelResolver = mockStatic(ReferenceMultiModelResolver.class);
			MockedStatic<SegmentIdListResolver> segmentResolver = mockStatic(SegmentIdListResolver.class);
			MockedStatic<SectionIdListResolver> sectionResolver = mockStatic(SectionIdListResolver.class);
			MockedStatic<WatermarkIdListResolver> watermarkResolver = mockStatic(WatermarkIdListResolver.class);
			MockedStatic<ReferenceElementListResolver> listResolver = mockStatic(ReferenceElementListResolver.class)
		) {
			var actualResult = underTest.walkPrintModelContentWithDefaultResolver(
				printModel,
				basePath,
				printModelResolver,
				printModelVisitor);

			var walker = mockConstruction.constructed().get(0);

			verify(walker).walkPrintModelContent(basePath, printModel.getContent());
			assertThat(actualResult).isEqualTo(printModelVisitor);
		}
	}

	@Test
	public void givenVisitor_whenWalkReferenceContainer_thenReturnMarkupResult() {
		TextElement mockTextElement = mock(TextElement.class);
		List<PrintModelElement> printModelElements = List.of(mockTextElement);
		when(printModel.getContent().getElementDefinitions()).thenReturn(printModelElements);
		var referenceContainer = (BaseReferenceContainer<? extends ElementReference>) printModel.getContent().getElementDefinitions().get(0);
		Function resultExtractor = mock(Function.class);
		String markupResult = "MarkupResult";
		when(resultExtractor.apply(printModelVisitor)).thenReturn(markupResult);
		final var printModelPath = PrintModelPath.create(printModel).with(printModel.getContent(), 0);

		try (MockedConstruction<PrintModelWalker> mockConstruction = mockConstruction(PrintModelWalker.class)) {
			var actualResult = underTest.walkReferenceContainer(
				printModelVisitor,
				referenceResolver,
				segmentIdResolver,
				sectionIdResolver,
				watermarkIdResolver,
				referenceElementResolver,
				printModelResolver,
				printModelPath,
				referenceContainer,
				resultExtractor);

			var walker = mockConstruction.constructed().get(0);

			verify(walker).walkContainer(referenceContainer, printModelPath, 0);
			assertThat(actualResult).isEqualTo(markupResult);
		}
	}

	@Test
	public void givenVisitor_whenWalkReference_thenReturnMarkupResult() {
		var modelSegmentContainer = mock(ModelSegmentContainer.class);
		var elementReference = mock(ElementReference.class);
		var modelReference = mock(PrintModelReference.class);
		when(printModel.getContent().getSegments()).thenReturn(modelSegmentContainer);
		when(modelReference.getRefIds()).thenReturn(List.of(elementReference));
		when(modelSegmentContainer.getReferences()).thenReturn(List.of(modelReference));
		Function resultExtractor = mock(Function.class);
		String markupResult = "MarkupResult";
		when(resultExtractor.apply(printModelVisitor)).thenReturn(markupResult);
		final var basePath = PrintModelPath.create(printModel)
			.with(printModel.getContent(), 0);

		try (MockedConstruction<PrintModelWalker> mockConstruction = mockConstruction(PrintModelWalker.class)) {
			var actualResult = underTest.walkReference(
				printModelVisitor,
				referenceResolver,
				segmentIdResolver,
				sectionIdResolver,
				watermarkIdResolver,
				referenceElementResolver,
				printModelResolver,
				basePath,
				elementReference,
				resultExtractor);

			var walker = mockConstruction.constructed().get(0);

			verify(walker).walkReference(elementReference, basePath, 0);
			assertThat(actualResult).isEqualTo(markupResult);
		}
	}

	@Test
	public void givenReferenceContainer_whenWalkElement_thenWalkContainer() {
		var modelElement = mock(TextElement.class);
		List<PrintModelElement> modelElements = List.of(modelElement);
		var referenceContainer = (BaseReferenceContainer<? extends ElementReference>) modelElement;
		var printModelPath = PrintModelPath.create(printModel).with(printModel.getContent(), 0);
		when(printModel.getContent().getElementDefinitions()).thenReturn(modelElements);
		doReturn(TraversalCommand.CONTINUE).when(underTest).walkContainer(referenceContainer, printModelPath, 0);

		TraversalCommand traversalCommand = underTest.walkElement(modelElement, printModelPath, 0);

		verify(printModelVisitor).beforeVisitElement(modelElement, printModelPath);
		verify(underTest).walkContainer(referenceContainer, printModelPath, 0);
		verify(printModelVisitor, never()).visitElement(modelElement, printModelPath);
		verify(printModelVisitor).afterVisitElement(modelElement, printModelPath);
		assertThat(traversalCommand).isEqualTo(TraversalCommand.CONTINUE);
	}

	@Test
	public void givenModelElement_whenWalkElement_thenVisitElement() {
		var modelElement = mock(BarChart.class);
		List<PrintModelElement> modelElements = List.of(modelElement);
		var printModelPath = PrintModelPath.create(printModel).with(printModel.getContent(), 0);
		when(printModel.getContent().getElementDefinitions()).thenReturn(modelElements);
		when(printModelVisitor.visitElement(modelElement, printModelPath)).thenReturn(TraversalCommand.CONTINUE);

		TraversalCommand traversalCommand = underTest.walkElement(
			modelElement,
			printModelPath,
			0
		);

		verify(printModelVisitor).beforeVisitElement(modelElement, printModelPath);
		verify(underTest, never()).walkContainer(any(), eq(printModelPath), eq(0));
		verify(printModelVisitor).visitElement(modelElement, printModelPath);
		verify(printModelVisitor).afterVisitElement(modelElement, printModelPath);
		assertThat(traversalCommand).isEqualTo(TraversalCommand.CONTINUE);
	}

	@Test
	public void givenResolvers_whenWalkElement_thenReturnExpectedMarkupResult() {
		var modelElement = mock(TextElement.class);
		List<PrintModelElement> printModelElements = List.of(modelElement);
		var basePath = PrintModelPath.create(printModel).with(printModel.getContent(), 0);
		when(printModel.getContent().getElementDefinitions()).thenReturn(printModelElements);
		Function resultExtractor = mock(Function.class);

		try (MockedConstruction<PrintModelWalker> mockConstruction = mockConstruction(PrintModelWalker.class)) {
			String markupResult = "MarkupResult";
			when(resultExtractor.apply(printModelVisitor)).thenReturn(markupResult);

			Object actualResult = walkElement(
				printModelVisitor,
				referenceResolver,
				segmentIdResolver,
				sectionIdResolver,
				watermarkIdResolver,
				referenceElementResolver,
				printModelResolver,
				basePath,
				modelElement,
				resultExtractor
			);

			var printModelWalker = mockConstruction.constructed().get(0);
			when(printModelWalker.walkElement(modelElement, basePath, 0)).thenReturn(TraversalCommand.CONTINUE);

			verify(printModelWalker).walkElement(modelElement, basePath, 0);
			assertThat(actualResult).isEqualTo(markupResult);
		}
	}

	@Test
	public void givenResolvers_whenWalkContainer_thenReturnExpectedMarkupResult() {
		TextElement mockTextElement = mock(TextElement.class);
		final var basePath = PrintModelPath.create(printModel)
			.with(printModel.getContent(), 0);
		List<PrintModelElement> printModelElements = List.of(mockTextElement);
		Function resultExtractor = mock(Function.class);
		when(printModel.getContent().getElementDefinitions()).thenReturn(printModelElements);

		try (MockedConstruction<PrintModelWalker> mockConstruction = mockConstruction(PrintModelWalker.class)) {
			String markupResult = "MarkupResult";
			when(resultExtractor.apply(printModelVisitor)).thenReturn(markupResult);

			Object actualResult = walkContainer(
				printModelVisitor,
				referenceResolver,
				segmentIdResolver,
				sectionIdResolver,
				watermarkIdResolver,
				referenceElementResolver,
				printModelResolver,
				basePath,
				mockTextElement,
				resultExtractor
			);

			var walker = mockConstruction.constructed().get(0);
			when(walker.walkElement(mockTextElement, basePath, 0)).thenReturn(TraversalCommand.CONTINUE);

			verify(walker).walkContainer(mockTextElement, basePath, 0);
			assertThat(actualResult).isEqualTo(markupResult);
		}
	}

	@Test
	public void givenPrintModel_whenWalkElementWithDefaultResolver_thenReturnVisitor() {
		final var basePath = PrintModelPath.create(printModel)
			.with(printModel.getContent(), 0);
		TextElement mockTextElement = mock(TextElement.class);
		List<PrintModelElement> printModelElements = List.of(mockTextElement);

		when(printModel.getContent().getElementDefinitions()).thenReturn(printModelElements);

		try (
			MockedConstruction<PrintModelWalker> mockConstruction = mockConstruction(PrintModelWalker.class);
			MockedStatic<ReferenceMultiModelResolver> modelResolver = mockStatic(ReferenceMultiModelResolver.class);
			MockedStatic<SegmentIdListResolver> segmentResolver = mockStatic(SegmentIdListResolver.class);
			MockedStatic<SectionIdListResolver> sectionResolver = mockStatic(SectionIdListResolver.class);
			MockedStatic<WatermarkIdListResolver> watermarkResolver = mockStatic(WatermarkIdListResolver.class);
			MockedStatic<ReferenceElementListResolver> listResolver = mockStatic(ReferenceElementListResolver.class)
		) {
			PrintModelVisitor resultVisitor = PrintModelWalker.walkElementWithDefaultResolver(
				printModel,
				mockTextElement,
				basePath,
				printModelResolver,
				printModelVisitor
			);
			var printModelWalker = mockConstruction.constructed().get(0);
			doReturn(TraversalCommand.CONTINUE).when(printModelWalker).walkElement(mockTextElement, basePath, 0);

			verify(printModelWalker).walkElement(mockTextElement, basePath, 0);
			assertThat(resultVisitor).isEqualTo(printModelVisitor);
		}
	}

	@Test
	public void givenDescendFirst_whenWalkPrintModel_thenWalkPrintModelContentAndVisitPrintModel() {
		when(printModelVisitor.descendPrintModel(printModel)).thenReturn(DescendCommand.DESCEND_FIRST);
		when(printModelVisitor.visitPrintModel(printModel)).thenReturn(TraversalCommand.HALT);
		doReturn(TraversalCommand.CONTINUE).when(underTest).walkPrintModelContent(any(), any());

		TraversalCommand actualResult = underTest.walkPrintModel(printModel);

		InOrder methodCallingOrder = inOrder(underTest, printModelVisitor);
		methodCallingOrder.verify(underTest).walkPrintModelContent(any(), any());
		methodCallingOrder.verify(printModelVisitor).visitPrintModel(printModel);
		assertThat(actualResult).isEqualTo(TraversalCommand.HALT);
	}

	@Test
	public void givenElementFirst_whenWalkPrintModel_thenVisitPrintModelAndWalkPrintModelContent() {
		when(printModelVisitor.descendPrintModel(printModel)).thenReturn(DescendCommand.ELEMENT_FIRST);
		when(printModelVisitor.visitPrintModel(printModel)).thenReturn(TraversalCommand.CONTINUE);
		doReturn(TraversalCommand.HALT).when(underTest).walkPrintModelContent(any(), any());

		TraversalCommand actualResult = underTest.walkPrintModel(printModel);

		InOrder methodCallingOrder = inOrder(underTest, printModelVisitor);
		methodCallingOrder.verify(printModelVisitor).visitPrintModel(printModel);
		methodCallingOrder.verify(underTest).walkPrintModelContent(any(), any());
		assertThat(actualResult).isEqualTo(TraversalCommand.HALT);
	}

	@Test
	public void givenNoDescend_whenWalkPrintModel_thenVisitPrintModelOnly() {
		when(printModelVisitor.descendPrintModel(printModel)).thenReturn(DescendCommand.NO_DESCEND);
		when(printModelVisitor.visitPrintModel(printModel)).thenReturn(TraversalCommand.HALT);

		TraversalCommand actualResult = underTest.walkPrintModel(printModel);

		verify(underTest, never()).walkPrintModelContent(any(PrintModelPath.class), any(PrintModelContent.class));
		verify(printModelVisitor).visitPrintModel(printModel);
		assertThat(actualResult).isEqualTo(TraversalCommand.HALT);
	}

	@Test
	public void givenSections_whenWalkPrintModelContent_thenWalkSections() {
		var printModelPath = PrintModelPath.create(printModel).with(printModel.getContent(), 0);
		List<String> structures = mock(List.class);
		List<String> sections = mock(List.class);
		General general = mock(General.class);
		Metadata metadata = mock(Metadata.class);
		when(printModel.getContent().getGeneral()).thenReturn(general);
		when(general.getMetadata()).thenReturn(metadata);
		when(general.getStructure()).thenReturn(structures);
		when(general.getSections()).thenReturn(sections);
		doReturn(TraversalCommand.CONTINUE).when(underTest).walkMetadata(printModelPath, metadata);
		doReturn(TraversalCommand.CONTINUE).when(underTest).walkStructure(printModelPath, structures);
		doReturn(TraversalCommand.CONTINUE).when(underTest).walkSections(printModelPath, sections);

		TraversalCommand actualResult = underTest.walkPrintModelContent(printModelPath, printModel.getContent());

		verify(underTest).walkStructure(printModelPath, structures);
		verify(underTest).walkSections(printModelPath, sections);
		assertThat(actualResult).isEqualTo(TraversalCommand.CONTINUE);
	}

	@Test
	public void givenNonSections_whenWalkPrintModelContent_thenNotWalkSections() {
		var printModelPath = PrintModelPath.create(printModel).with(printModel.getContent(), 0);
		List<String> structures = mock(List.class);
		General general = mock(General.class);
		Metadata metadata = mock(Metadata.class);
		when(printModel.getContent().getGeneral()).thenReturn(general);
		when(general.getMetadata()).thenReturn(metadata);
		when(general.getStructure()).thenReturn(structures);
		doReturn(TraversalCommand.CONTINUE).when(underTest).walkMetadata(printModelPath, metadata);
		doReturn(TraversalCommand.HALT).when(underTest).walkStructure(printModelPath, structures);

		TraversalCommand actualResult = underTest.walkPrintModelContent(printModelPath, printModel.getContent());

		verify(underTest, never()).walkSections(any(PrintModelPath.class), any(List.class));
		assertThat(actualResult).isEqualTo(TraversalCommand.HALT);
	}

	@Test
	public void givenEmptySegment_whenWalkStructure_thenVisitUnresolvedSegmentReturnStop() {
		var printModelPath = PrintModelPath.create(printModel);
		General general = mock(General.class);
		List<String> structures = List.of(SEGMENT_ID);
		when(printModel.getContent().getGeneral()).thenReturn(general);
		when(general.getStructure()).thenReturn(structures);
		Optional<PrintModelTreeTrace<ModelSegment>> modelSegmentTrace = Optional.empty();
		when(segmentIdResolver.resolveSegmentId(SEGMENT_ID)).thenReturn(modelSegmentTrace);
		when(printModelVisitor.visitUnresolvedSegment(SEGMENT_ID, 0)).thenReturn(TraversalCommand.STOP);

		TraversalCommand result = underTest.walkStructure(printModelPath, structures);

		verify(segmentIdResolver).resolveSegmentId(SEGMENT_ID);
		verify(printModelVisitor).visitUnresolvedSegment(SEGMENT_ID, 0);
		verify(underTest, never()).walkContainer(any(BaseReferenceContainer.class), any(PrintModelPath.class), anyInt());
		assertThat(result).isEqualTo(TraversalCommand.CONTINUE);
	}

	@Test
	public void givenEmptySegment_whenWalkStructure_thenVisitUnresolvedSegmentReturnHalt() {
		General general = mock(General.class);
		List<String> structures = List.of(SEGMENT_ID);
		when(printModel.getContent().getGeneral()).thenReturn(general);
		when(general.getStructure()).thenReturn(structures);
		Optional<PrintModelTreeTrace<ModelSegment>> modelSegmentTrace = Optional.empty();
		when(segmentIdResolver.resolveSegmentId(SEGMENT_ID)).thenReturn(modelSegmentTrace);
		when(printModelVisitor.visitUnresolvedSegment(SEGMENT_ID, 0)).thenReturn(TraversalCommand.HALT);

		var printModelPath = PrintModelPath.create(printModel);
		TraversalCommand result = underTest.walkStructure(printModelPath, structures);

		assert TraversalCommand.HALT == result;
		verify(segmentIdResolver).resolveSegmentId(SEGMENT_ID);
		verify(printModelVisitor).visitUnresolvedSegment(SEGMENT_ID, 0);
		verify(underTest, never()).walkContainer(any(BaseReferenceContainer.class), any(PrintModelPath.class), anyInt());
	}

	@Test
	public void givenSegment_whenWalkStructure_thenWalkContainerReturnContinue() {
		var printModelPath = PrintModelPath.create(printModel);
		List<String> structures = List.of(SEGMENT_ID);
		General general = mock(General.class);
		Optional<PrintModelTreeTrace<ModelSegment>> modelSegmentTraceOpt = mock(Optional.class);
		PrintModelTreeTrace<ModelSegment> modelSegmentTrace = mock(PrintModelTreeTrace.class);
		when(printModel.getContent().getGeneral()).thenReturn(general);
		when(general.getStructure()).thenReturn(structures);
		when(modelSegmentTraceOpt.get()).thenReturn(modelSegmentTrace);
		when(segmentIdResolver.resolveSegmentId(SEGMENT_ID)).thenReturn(modelSegmentTraceOpt);
		doReturn(TraversalCommand.STOP).when(underTest).walkContainer(any(), any(), anyInt());

		TraversalCommand result = underTest.walkStructure(printModelPath, structures);

		verify(segmentIdResolver).resolveSegmentId(SEGMENT_ID);
		verify(underTest).walkContainer(any(), any(), anyInt());
		verify(printModelVisitor, never()).visitUnresolvedSegment(SEGMENT_ID, 0);
		assertThat(result).isEqualTo(TraversalCommand.CONTINUE);
	}

	@Test
	public void givenSegment_whenWalkStructure_thenWalkContainerReturnHalt() {
		General general = mock(General.class);
		List<String> structures = List.of(SEGMENT_ID);
		when(printModel.getContent().getGeneral()).thenReturn(general);
		when(general.getStructure()).thenReturn(structures);
		Optional<PrintModelTreeTrace<ModelSegment>> modelSegmentTraceOpt = mock(Optional.class);
		PrintModelTreeTrace<ModelSegment> modelSegmentTrace = mock(PrintModelTreeTrace.class);
		when(modelSegmentTraceOpt.get()).thenReturn(modelSegmentTrace);
		when(segmentIdResolver.resolveSegmentId(any())).thenReturn(modelSegmentTraceOpt);
		doReturn(TraversalCommand.HALT).when(underTest).walkContainer(any(), any(), anyInt());

		var printModelPath = PrintModelPath.create(printModel);
		TraversalCommand result = underTest.walkStructure(printModelPath, structures);

		verify(segmentIdResolver).resolveSegmentId(SEGMENT_ID);
		verify(underTest).walkContainer(any(), any(), anyInt());
		verify(printModelVisitor, never()).visitUnresolvedSegment(SEGMENT_ID, 0);
		assertThat(result).isEqualTo(TraversalCommand.HALT);
	}

	@Test
	public void givenEmptyWatermark_whenWalkWatermarks_thenVisitUnresolvedWatermarkReturnHalt() {
		General general = mock(General.class);
		List<String> watermarks = List.of(WATERMARK_ID);
		when(printModel.getContent().getGeneral()).thenReturn(general);
		when(general.getWatermarks()).thenReturn(watermarks);
		Optional<PrintModelTreeTrace<Watermark>> watermarkTreeTrace = Optional.empty();
		when(watermarkIdResolver.resolveWatermarkId(WATERMARK_ID)).thenReturn(watermarkTreeTrace);
		when(printModelVisitor.visitUnresolvedWatermark(WATERMARK_ID, 0)).thenReturn(TraversalCommand.HALT);

		var printModelPath = PrintModelPath.create(printModel);
		TraversalCommand result = underTest.walkWatermarks(printModelPath, watermarks);

		assert TraversalCommand.HALT == result;
		verify(watermarkIdResolver).resolveWatermarkId(WATERMARK_ID);
		verify(printModelVisitor).visitUnresolvedWatermark(WATERMARK_ID, 0);
		verify(underTest, never()).walkContainer(any(BaseReferenceContainer.class), any(PrintModelPath.class), anyInt());
	}

	@Test
	public void givenWatermark_whenWalkWatermarks_thenWalkContainerReturnContinue() {
		var printModelPath = PrintModelPath.create(printModel);
		List<String> watermarks = List.of(WATERMARK_ID);
		General general = mock(General.class);
		Optional<PrintModelTreeTrace<Watermark>> watermarkTraceOpt = mock(Optional.class);
		PrintModelTreeTrace<Watermark> watermarkTrace = mock(PrintModelTreeTrace.class);
		when(printModel.getContent().getGeneral()).thenReturn(general);
		when(general.getWatermarks()).thenReturn(watermarks);
		when(watermarkTraceOpt.get()).thenReturn(watermarkTrace);
		when(watermarkIdResolver.resolveWatermarkId(WATERMARK_ID)).thenReturn(watermarkTraceOpt);
		doReturn(TraversalCommand.STOP).when(underTest).walkContainer(any(), any(), anyInt());

		TraversalCommand result = underTest.walkWatermarks(printModelPath, watermarks);

		verify(watermarkIdResolver).resolveWatermarkId(WATERMARK_ID);
		verify(underTest).walkContainer(any(), any(), anyInt());
		verify(printModelVisitor, never()).visitUnresolvedWatermark(WATERMARK_ID, 0);
		assertThat(result).isEqualTo(TraversalCommand.CONTINUE);
	}

	@Test
	public void givenWatermark_whenWalkWatermarks_thenWalkContainerReturnHalt() {
		General general = mock(General.class);
		List<String> watermarks = List.of(WATERMARK_ID);
		when(printModel.getContent().getGeneral()).thenReturn(general);
		when(general.getWatermarks()).thenReturn(watermarks);
		Optional<PrintModelTreeTrace<Watermark>> watermarkTraceOpt = mock(Optional.class);
		PrintModelTreeTrace<Watermark> watermarkTrace = mock(PrintModelTreeTrace.class);
		when(watermarkTraceOpt.get()).thenReturn(watermarkTrace);
		when(watermarkIdResolver.resolveWatermarkId(any())).thenReturn(watermarkTraceOpt);
		doReturn(TraversalCommand.HALT).when(underTest).walkContainer(any(), any(), anyInt());

		var printModelPath = PrintModelPath.create(printModel);
		TraversalCommand result = underTest.walkWatermarks(printModelPath, watermarks);

		verify(watermarkIdResolver).resolveWatermarkId(WATERMARK_ID);
		verify(underTest).walkContainer(any(), any(), anyInt());
		verify(printModelVisitor, never()).visitUnresolvedWatermark(WATERMARK_ID, 0);
		assertThat(result).isEqualTo(TraversalCommand.HALT);
	}

	@Test
	public void givenEmptySections_whenWalkSections_thenVisitUnresolvedSectionReturnContinue() {
		var printModelPath = PrintModelPath.create(printModel);
		General general = mock(General.class);
		List<String> sections = List.of(SECTION_ID);
		when(printModel.getContent().getGeneral()).thenReturn(general);
		when(general.getSections()).thenReturn(sections);
		Optional<PrintModelTreeTrace<ModelSection>> modelSectionTrace = Optional.empty();
		when(sectionIdResolver.resolveSectionId(SECTION_ID)).thenReturn(modelSectionTrace);
		when(printModelVisitor.visitUnresolvedSection(SECTION_ID, 0)).thenReturn(TraversalCommand.STOP);

		TraversalCommand result = underTest.walkSections(printModelPath, sections);

		verify(sectionIdResolver).resolveSectionId(SECTION_ID);
		verify(printModelVisitor).visitUnresolvedSection(SECTION_ID, 0);
		verify(underTest, never()).walkContainer(any(BaseReferenceContainer.class), any(PrintModelPath.class), anyInt());
		assertThat(result).isEqualTo(TraversalCommand.CONTINUE);
	}

	@Test
	public void givenSection_whenWalkSections_thenWalkContainerReturnHalt() {
		var printModelPath = PrintModelPath.create(printModel);
		General general = mock(General.class);
		List<String> sections = List.of(SECTION_ID);
		when(printModel.getContent().getGeneral()).thenReturn(general);
		when(general.getSections()).thenReturn(sections);
		Optional<PrintModelTreeTrace<ModelSection>> modelSectionTraceOpt = mock(Optional.class);
		PrintModelTreeTrace<ModelSection> modelSectionTrace = mock(PrintModelTreeTrace.class);
		when(modelSectionTraceOpt.get()).thenReturn(modelSectionTrace);
		when(sectionIdResolver.resolveSectionId(SECTION_ID)).thenReturn(modelSectionTraceOpt);
		doReturn(TraversalCommand.HALT).when(underTest).walkContainer(any(), any(), anyInt());

		TraversalCommand result = underTest.walkSections(printModelPath, sections);

		verify(sectionIdResolver).resolveSectionId(SECTION_ID);
		verify(underTest).walkContainer(any(), any(), anyInt());
		verify(printModelVisitor, never()).visitUnresolvedSegment(SECTION_ID, 0);
		assertThat(result).isEqualTo(TraversalCommand.HALT);
	}

	@Test
	public void givenDescendFirst_whenWalkContainer_thenWalkReferencesAndVisitContainer() {
		var modelElement = mock(TextElement.class);
		List<PrintModelElement> printModelElements = List.of(modelElement);
		when(printModel.getContent().getElementDefinitions()).thenReturn(printModelElements);
		var referenceContainer = (BaseReferenceContainer<? extends ElementReference>) printModel.getContent().getElementDefinitions().get(0);
		var printModelPath = PrintModelPath.create(printModel).with(printModel.getContent(), 0);
		when(printModelVisitor.descendContainer(any(), any(), anyInt())).thenReturn(DescendCommand.DESCEND_FIRST);
		doReturn(TraversalCommand.CONTINUE).when(underTest).walkReferences(any(), any());
		when(printModelVisitor.visitContainer(any(), any())).thenReturn(TraversalCommand.HALT);

		TraversalCommand actualResult = underTest.walkContainer(referenceContainer, printModelPath, 0);

		InOrder methodCallingOrder = inOrder(underTest, printModelVisitor);
		methodCallingOrder.verify(underTest).walkReferences(any(), any());
		methodCallingOrder.verify(printModelVisitor).visitContainer(any(), any());
		assertThat(actualResult).isEqualTo(TraversalCommand.HALT);
	}

	@Test
	public void givenElementFirst_whenWalkContainer_thenVisitContainerAndWalkReferences() {
		var modelElement = mock(TextElement.class);
		List<PrintModelElement> printModelElements = List.of(modelElement);
		when(printModel.getContent().getElementDefinitions()).thenReturn(printModelElements);
		var referenceContainer = (BaseReferenceContainer<? extends ElementReference>) printModel.getContent().getElementDefinitions().get(0);
		var printModelPath = PrintModelPath.create(printModel).with(printModel.getContent(), 0);
		when(printModelVisitor.descendContainer(any(), any(), anyInt())).thenReturn(DescendCommand.ELEMENT_FIRST);
		doReturn(TraversalCommand.CONTINUE).when(printModelVisitor).visitContainer(any(), any());

		TraversalCommand actualResult = underTest.walkContainer(referenceContainer, printModelPath, 0);

		InOrder methodCallingOrder = inOrder(underTest, printModelVisitor);
		methodCallingOrder.verify(printModelVisitor).visitContainer(any(), any());
		methodCallingOrder.verify(underTest).walkReferences(any(), any());
		assertThat(actualResult).isEqualTo(TraversalCommand.CONTINUE);
	}

	@Test
	public void givenNoDescend_whenWalkContainer_thenVisitContainerOnly() {
		var modelElement = mock(TextElement.class);
		List<PrintModelElement> printModelElements = List.of(modelElement);
		when(printModel.getContent().getElementDefinitions()).thenReturn(printModelElements);
		var referenceContainer = (BaseReferenceContainer<? extends ElementReference>) printModel.getContent().getElementDefinitions().get(0);
		var printModelPath = PrintModelPath.create(printModel).with(printModel.getContent(), 0);
		when(printModelVisitor.descendContainer(any(), any(), anyInt())).thenReturn(DescendCommand.NO_DESCEND);
		when(printModelVisitor.visitContainer(any(), any())).thenReturn(TraversalCommand.HALT);

		TraversalCommand actualResult = underTest.walkContainer(referenceContainer, printModelPath, 0);

		verify(printModelVisitor).visitContainer(any(), any());
		verify(underTest, never()).walkReferences(any(), any());
		assertThat(actualResult).isEqualTo(TraversalCommand.HALT);
	}

	@Test
	public void givenNoDescend_whenWalkContainer_thenVisitContainerAndReturnStop() {
		var printModelPath = PrintModelPath.create(printModel).with(printModel.getContent(), 0);
		var modelSegment = mock(ModelSegment.class);
		var modelSegmentReference = Optional.of(mock(ModelSegmentReference.class));
		when(printModelVisitor.descendContainer(eq(modelSegment), any(PrintModelPath.class), eq(0))).thenReturn(DescendCommand.NO_DESCEND);
		when(printModelVisitor.visitContainer(eq(modelSegment), any(PrintModelPath.class))).thenReturn(TraversalCommand.CONTINUE);
		when(modelSegment.getDinTemplate()).thenReturn(modelSegmentReference);
		doReturn(TraversalCommand.STOP).when(underTest).walkDinTemplate(eq(modelSegmentReference.get()), any(PrintModelPath.class));

		TraversalCommand result = underTest.walkContainer(modelSegment, printModelPath, 0);

		verify(printModelVisitor).visitContainer(eq(modelSegment), any(PrintModelPath.class));
		assertThat(result).isEqualTo(TraversalCommand.STOP);
	}

	@Test
	public void givenStopWalkReferences_whenWalkReferences_thenReturnContinue() {
		var elementReference = mock(ElementReference.class);
		var elementReferences = List.of(elementReference);
		var printModelPath = PrintModelPath.create(printModel).with(printModel.getContent(), 0);
		doReturn(TraversalCommand.STOP).when(underTest).walkReference(elementReference, printModelPath, 0);

		TraversalCommand result = underTest.walkReferences(elementReferences, printModelPath);

		assertThat(result).isEqualTo(TraversalCommand.CONTINUE);
	}

	@Test
	public void givenHaltWalkReferences_whenWalkReferences_thenReturnHalf() {
		var elementReference = mock(ElementReference.class);
		var elementReferences = List.of(elementReference);
		var printModelPath = PrintModelPath.create(printModel).with(printModel.getContent(), 0);
		doReturn(TraversalCommand.HALT).when(underTest).walkReference(elementReference, printModelPath, 0);

		TraversalCommand result = underTest.walkReferences(elementReferences, printModelPath);

		assertThat(result).isEqualTo(TraversalCommand.HALT);
	}

	@Test
	public void givenContinueWalkReferences_whenWalkReferences_thenReturnContinue() {
		var elementReference = mock(ElementReference.class);
		var elementReferences = List.of(elementReference);
		var printModelPath = PrintModelPath.create(printModel).with(printModel.getContent(), 0);
		doReturn(TraversalCommand.CONTINUE).when(underTest).walkReference(elementReference, printModelPath, 0);

		TraversalCommand result = underTest.walkReferences(elementReferences, printModelPath);

		assertThat(result).isEqualTo(TraversalCommand.CONTINUE);
	}

	@Test
	public void givenEmptyPrintModelTreeTrace_whenWalkReference_thenReturnContinue() {
		var elementReference = mock(ElementReference.class);
		var printModelPath = PrintModelPath.create(printModel).with(printModel.getContent(), 0);
		when(printModelVisitor.visitReference(elementReference, printModelPath, 0)).thenReturn(TraversalCommand.CONTINUE);
		when(referenceResolver.resolveReference(any(PrintModelTreeTrace.class))).thenReturn(Optional.empty());
		when(printModelVisitor.visitUnresolvedElement(elementReference, printModelPath, 0)).thenReturn(TraversalCommand.CONTINUE);

		TraversalCommand result = underTest.walkReference(elementReference, printModelPath, 0);

		verify(printModelVisitor).visitUnresolvedElement(elementReference, printModelPath, 0);
		verify(underTest, never()).walkElement(any(PrintModelElement.class), any(PrintModelPath.class), anyInt());
		assertThat(result).isEqualTo(TraversalCommand.CONTINUE);
	}

	@Test
	public void givenPrintModelTreeTrace_whenWalkReference_thenReturnContinue() {
		var elementReference = mock(ElementReference.class);
		var printModelPath = PrintModelPath.create(printModel).with(printModel.getContent(), 0);
		when(printModelVisitor.visitReference(elementReference, printModelPath, 0)).thenReturn(TraversalCommand.CONTINUE);
		Optional<PrintModelTreeTrace> sectionPathOpt = Optional.of(mock(PrintModelTreeTrace.class));
		when(referenceResolver.resolveReference(any(PrintModelTreeTrace.class))).thenReturn(sectionPathOpt);
		when(printModelVisitor.visitUnresolvedElement(elementReference, printModelPath, 0)).thenReturn(TraversalCommand.CONTINUE);
		doReturn(TraversalCommand.CONTINUE).when(underTest).walkElement(any(), any(), anyInt());

		TraversalCommand result = underTest.walkReference(elementReference, printModelPath, 0);

		verify(printModelVisitor, never()).visitUnresolvedElement(elementReference, printModelPath, 0);
		verify(underTest).walkElement(any(), any(), anyInt());
		assertThat(result).isEqualTo(TraversalCommand.CONTINUE);
	}

	@Test
	public void givenDescendDINTemplateReturnDescendFirstAndHasDinReference_whenWalkDinTemplate_thenVisitDINTemplate() {
		try (MockedStatic<SegmentIdListResolver> segmentIdListResolverMockedStatic = mockStatic(SegmentIdListResolver.class)) {
			ModelSegment modelSegment = mock(ModelSegment.class);
			ModelSegmentReference modelSegmentReference = mock(ModelSegmentReference.class);
			PrintModelReference printModelReference = mock(PrintModelReference.class);
			PrintModelTreeTrace<PrintModelReference> printModelReferenceTrace = mock(PrintModelTreeTrace.class);
			when(printModelReferenceTrace.getTracedElement()).thenReturn(printModelReference);
			when(printModelReference.getReferenceModel()).thenReturn(REFERENCE_MODEL);
			when(referenceElementResolver.resolveReferenceElement(any())).thenReturn(Optional.of(printModelReferenceTrace));
			PrintModelTreeTrace<PrintModel> printModelTrace = mock(PrintModelTreeTrace.class);
			when(printModelResolver.resolvePrintModel(any())).thenReturn(Optional.of(printModelTrace));
			SegmentIdListResolver segmentIdListResolver = mock(SegmentIdListResolver.class);
			PrintModelTreeTrace modelSegmentTrace = mock(PrintModelTreeTrace.class);
			segmentIdListResolverMockedStatic.when(() -> SegmentIdListResolver.fromModel(any())).thenReturn(segmentIdListResolver);
			when(segmentIdListResolver.resolveSegmentId(any())).thenReturn(Optional.of(modelSegmentTrace));
			when(printModelVisitor.descendDINTemplate(any(), any())).thenReturn(DescendCommand.DESCEND_FIRST);
			doReturn(TraversalCommand.CONTINUE).when(underTest).walkDINTemplateReferences(any(), any());
			when(printModelVisitor.visitDINTemplate(any(), any())).thenReturn(TraversalCommand.CONTINUE);

			TraversalCommand result = underTest.walkDinTemplate(modelSegmentReference, PrintModelPath.create(printModel).with(modelSegment, 0));

			verify(referenceElementResolver).resolveReferenceElement(any());
			verify(printModelResolver).resolvePrintModel(any());
			verify(printModelVisitor).descendDINTemplate(any(), any());
			verify(underTest).walkDINTemplateReferences(any(), any());
			verify(printModelVisitor).visitDINTemplate(any(), any());
			verify(printModelVisitor, never()).visitUnresolvedDinTemplate(any());
			assertThat(result).isEqualTo(TraversalCommand.CONTINUE);
		}
	}

	@Test
	public void given_when_then() {
		var printModelPath = PrintModelPath.create(printModel).with(printModel.getContent(), 0);
		PrintModelTreeTrace<ModelSegment> dinTemplateSegment = mock(PrintModelTreeTrace.class);
		when(dinTemplateSegment.getTracedElement()).thenReturn(mock(ModelSegment.class));
		try (
			var mockConstruction = mockConstruction(PrintModelWalker.class)
		) {
			underTest.walkDINTemplateReferences(printModelPath, dinTemplateSegment);
			var walker = mockConstruction.constructed().get(0);
			when(walker.walkReferences(any(), any())).thenReturn(TraversalCommand.CONTINUE);

			verify(walker).walkReferences(any(), any());
		}

	}

	@Test
	public void givenDescendDINTemplateReturnDescendFirstAndDoesNotHaveDinReference_whenWalkDinTemplate_thenNotVisitDINTemplate() {
		try (MockedStatic<SegmentIdListResolver> segmentIdListResolverMockedStatic = mockStatic(SegmentIdListResolver.class)) {
			ModelSegment modelSegment = mock(ModelSegment.class);
			ModelSegmentReference modelSegmentReference = mock(ModelSegmentReference.class);
			PrintModelReference printModelReference = mock(PrintModelReference.class);
			PrintModelTreeTrace<PrintModelReference> printModelReferenceTrace = mock(PrintModelTreeTrace.class);
			when(printModelReferenceTrace.getTracedElement()).thenReturn(printModelReference);
			when(printModelReference.getReferenceModel()).thenReturn(REFERENCE_MODEL);
			when(referenceElementResolver.resolveReferenceElement(any())).thenReturn(Optional.of(printModelReferenceTrace));
			PrintModelTreeTrace<PrintModel> printModelTrace = mock(PrintModelTreeTrace.class);
			when(printModelResolver.resolvePrintModel(any())).thenReturn(Optional.of(printModelTrace));
			SegmentIdListResolver segmentIdListResolver = mock(SegmentIdListResolver.class);
			PrintModelTreeTrace modelSegmentTrace = mock(PrintModelTreeTrace.class);
			segmentIdListResolverMockedStatic.when(() -> SegmentIdListResolver.fromModel(any())).thenReturn(segmentIdListResolver);
			when(segmentIdListResolver.resolveSegmentId(any())).thenReturn(Optional.of(modelSegmentTrace));
			when(printModelVisitor.descendDINTemplate(any(), any())).thenReturn(DescendCommand.DESCEND_FIRST);
			doReturn(TraversalCommand.STOP).when(underTest).walkDINTemplateReferences(any(), any());

			TraversalCommand result = underTest.walkDinTemplate(modelSegmentReference, PrintModelPath.create(printModel).with(modelSegment, 0));

			assert result == TraversalCommand.STOP;
			InOrder methodCallingOrder = inOrder(referenceElementResolver, printModelResolver, printModelVisitor, underTest);
			methodCallingOrder.verify(referenceElementResolver).resolveReferenceElement(any());
			methodCallingOrder.verify(printModelResolver).resolvePrintModel(any());
			methodCallingOrder.verify(printModelVisitor).descendDINTemplate(any(), any());
			methodCallingOrder.verify(underTest).walkDINTemplateReferences(any(), any());
			verify(printModelVisitor, never()).visitDINTemplate(any(), any());
			verify(printModelVisitor, never()).visitUnresolvedDinTemplate(any());
			assertThat(result).isEqualTo(TraversalCommand.STOP);
		}
	}

	@Test
	public void givenDescendDINTemplateReturnElementFirstAndHasDinReferences_whenWalkDinTemplate_thenWalkDINTemplateReferences() {
		try (MockedStatic<SegmentIdListResolver> segmentIdListResolverMockedStatic = mockStatic(SegmentIdListResolver.class)) {
			ModelSegment modelSegment = mock(ModelSegment.class);
			ModelSegmentReference modelSegmentReference = mock(ModelSegmentReference.class);
			PrintModelReference printModelReference = mock(PrintModelReference.class);
			PrintModelTreeTrace<PrintModelReference> printModelReferenceTrace = mock(PrintModelTreeTrace.class);
			when(printModelReferenceTrace.getTracedElement()).thenReturn(printModelReference);
			when(printModelReference.getReferenceModel()).thenReturn(REFERENCE_MODEL);
			when(referenceElementResolver.resolveReferenceElement(any())).thenReturn(Optional.of(printModelReferenceTrace));
			PrintModelTreeTrace<PrintModel> printModelTrace = mock(PrintModelTreeTrace.class);
			when(printModelResolver.resolvePrintModel(any())).thenReturn(Optional.of(printModelTrace));
			SegmentIdListResolver segmentIdListResolver = mock(SegmentIdListResolver.class);
			PrintModelTreeTrace modelSegmentTrace = mock(PrintModelTreeTrace.class);
			segmentIdListResolverMockedStatic.when(() -> SegmentIdListResolver.fromModel(any())).thenReturn(segmentIdListResolver);
			when(segmentIdListResolver.resolveSegmentId(any())).thenReturn(Optional.of(modelSegmentTrace));
			when(printModelVisitor.descendDINTemplate(any(), any())).thenReturn(DescendCommand.ELEMENT_FIRST);
			when(printModelVisitor.visitDINTemplate(any(), any())).thenReturn(TraversalCommand.CONTINUE);
			doReturn(TraversalCommand.CONTINUE).when(underTest).walkDINTemplateReferences(any(), any());

			TraversalCommand result = underTest.walkDinTemplate(modelSegmentReference, PrintModelPath.create(printModel).with(modelSegment, 0));

			InOrder methodCallingOrder = inOrder(referenceElementResolver, printModelResolver, printModelVisitor, underTest);
			methodCallingOrder.verify(referenceElementResolver).resolveReferenceElement(any());
			methodCallingOrder.verify(printModelResolver).resolvePrintModel(any());
			methodCallingOrder.verify(printModelVisitor).descendDINTemplate(any(), any());
			methodCallingOrder.verify(printModelVisitor).visitDINTemplate(any(), any());
			methodCallingOrder.verify(underTest).walkDINTemplateReferences(any(), any());
			verify(printModelVisitor, never()).visitUnresolvedDinTemplate(any());
			assertThat(result).isEqualTo(TraversalCommand.CONTINUE);
		}
	}

	@Test
	public void givenDescendDINTemplateReturnNoDescendAndHasDinReferences_whenWalkDinTemplate_thenNotWalkDINTemplateReferences() {
		try (MockedStatic<SegmentIdListResolver> segmentIdListResolverMockedStatic = mockStatic(SegmentIdListResolver.class)) {
			ModelSegment modelSegment = mock(ModelSegment.class);
			ModelSegmentReference modelSegmentReference = mock(ModelSegmentReference.class);
			PrintModelReference printModelReference = mock(PrintModelReference.class);
			PrintModelTreeTrace<PrintModelReference> printModelReferenceTrace = mock(PrintModelTreeTrace.class);
			when(printModelReferenceTrace.getTracedElement()).thenReturn(printModelReference);
			when(printModelReference.getReferenceModel()).thenReturn(REFERENCE_MODEL);
			when(referenceElementResolver.resolveReferenceElement(any())).thenReturn(Optional.of(printModelReferenceTrace));
			PrintModelTreeTrace<PrintModel> printModelTrace = mock(PrintModelTreeTrace.class);
			when(printModelResolver.resolvePrintModel(any())).thenReturn(Optional.of(printModelTrace));
			SegmentIdListResolver segmentIdListResolver = mock(SegmentIdListResolver.class);
			PrintModelTreeTrace modelSegmentTrace = mock(PrintModelTreeTrace.class);
			segmentIdListResolverMockedStatic.when(() -> SegmentIdListResolver.fromModel(any())).thenReturn(segmentIdListResolver);
			when(segmentIdListResolver.resolveSegmentId(any())).thenReturn(Optional.of(modelSegmentTrace));
			when(printModelVisitor.descendDINTemplate(any(), any())).thenReturn(DescendCommand.NO_DESCEND);
			when(printModelVisitor.visitDINTemplate(any(), any())).thenReturn(TraversalCommand.CONTINUE);

			TraversalCommand result = underTest.walkDinTemplate(modelSegmentReference, PrintModelPath.create(printModel).with(modelSegment, 0));

			InOrder methodCallingOrder = inOrder(referenceElementResolver, printModelResolver, printModelVisitor, underTest);
			methodCallingOrder.verify(referenceElementResolver).resolveReferenceElement(any());
			methodCallingOrder.verify(printModelResolver).resolvePrintModel(any());
			methodCallingOrder.verify(printModelVisitor).descendDINTemplate(any(), any());
			methodCallingOrder.verify(printModelVisitor).visitDINTemplate(any(), any());
			verify(underTest, never()).walkDINTemplateReferences(any(), any());
			verify(printModelVisitor, never()).visitUnresolvedDinTemplate(any());
			assertThat(result).isEqualTo(TraversalCommand.CONTINUE);
		}
	}

	@Test
	public void givenEmptyReferenceElement_whenWalkDinTemplate_thenVisitUnresolvedDinTemplate() {
		ModelSegmentReference modelSegmentReference = mock(ModelSegmentReference.class);
		ModelSegment modelSegment = mock(ModelSegment.class);
		when(referenceElementResolver.resolveReferenceElement(any())).thenReturn(Optional.empty());
		when(printModelVisitor.visitUnresolvedDinTemplate(any())).thenReturn(TraversalCommand.CONTINUE);

		TraversalCommand result = underTest.walkDinTemplate(modelSegmentReference, PrintModelPath.create(printModel).with(modelSegment, 0));

		verify(printModelVisitor).visitUnresolvedDinTemplate(any());
		verify(printModelResolver, never()).resolvePrintModel(any());
		assertThat(result).isEqualTo(TraversalCommand.CONTINUE);
	}

}
