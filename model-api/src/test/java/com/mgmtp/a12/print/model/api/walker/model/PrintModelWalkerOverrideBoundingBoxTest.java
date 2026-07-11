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
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.element.PrintModelElement;
import com.mgmtp.a12.print.model.api.model.element.ElementType;
import com.mgmtp.a12.print.model.api.model.element.type.boundingBox.BoundingBox;
import com.mgmtp.a12.print.model.api.model.element.type.override.OverrideElement;
import com.mgmtp.a12.print.model.api.model.element.type.override.OverrideProperties;
import com.mgmtp.a12.print.model.api.model.internal.dto.PrintModelContentDto;
import com.mgmtp.a12.print.model.api.model.internal.dto.PrintModelDto;
import com.mgmtp.a12.print.model.api.model.internal.dto.PrintModelHeaderDto;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.type.boundingBox.BoundingBoxDTO;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.type.boundingBox.BoundingBoxPropertiesDTO;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.type.override.OverrideBoundingBoxPropertiesDto;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.type.override.OverrideElementDto;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.type.override.OverridePropertiesDto;
import com.mgmtp.a12.print.model.api.model.internal.dto.reference.PlaceableReferenceDto;
import com.mgmtp.a12.print.model.api.model.segment.ModelSegment;
import com.mgmtp.a12.print.model.api.model.internal.dto.segment.ModelSegmentDto;
import com.mgmtp.a12.print.model.api.walker.TraversalCommand;
import com.mgmtp.a12.print.model.api.walker.model.resolver.ReferenceMultiModelResolver;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Tests for {@link PrintModelWalker#walkDINTemplateReferences} covering the Override BoundingBox
 * path fix: nested Override BBs must receive a hierarchical consumer path (rooted at their parent
 * Override BB), not a flat path rooted at the segment origin.
 */
public class PrintModelWalkerOverrideBoundingBoxTest {

	// Template element IDs
	private static final String BB1_ID = "bb1";
	private static final String BB2_ID = "bb2";
	private static final String REF_TO_BB1_ID = "ref-to-bb1";
	private static final String REF_TO_BB2_ID = "ref-to-bb2";

	// Consumer element IDs
	private static final String OVERRIDE1_ID = "override1";
	private static final String OVERRIDE2_ID = "override2";

	// PrintModel IDs
	private static final String TEMPLATE_PM_ID = "template-pm";
	private static final String CONSUMER_PM_ID = "consumer-pm";

	private static PlaceableReferenceDto placeableRef(String id, String refId) {
		return PlaceableReferenceDto.builder().id(id).refId(refId).build();
	}

	private static BoundingBoxDTO boundingBox(String id, List<PlaceableReferenceDto> innerRefs) {
		return BoundingBoxDTO.builder()
			.id(id)
			.type(ElementType.BOUNDING_BOX)
			.boundingBoxProperties(BoundingBoxPropertiesDTO.builder()
				.id(id + "-props")
				.elementReferences(new ArrayList<>(innerRefs))
				.build())
			.build();
	}

	private static OverrideElementDto override(String id, String refId) {
		return OverrideElementDto.builder()
			.id(id)
			.type(ElementType.OVERRIDE)
			.overrideProperties(OverridePropertiesDto.builder()
				.id(id + "-props")
				.refId(refId)
				.overrideType(OverrideProperties.OverrideType.BOUNDING_BOX)
				.boundingBoxProperties(OverrideBoundingBoxPropertiesDto.builder()
					.id(id + "-bb-props")
					.build())
				.build())
			.build();
	}

	private static PrintModel templatePrintModel(List<? extends PrintModelElement> elementDefs) {
		return PrintModelDto.builder()
			.header(PrintModelHeaderDto.builder()
				.id(TEMPLATE_PM_ID)
				.build())
			.content(PrintModelContentDto.builder()
				.id("content-template")
				.elementDefinitions(new ArrayList<>(elementDefs))
				.build())
			.build();
	}

	private static PrintModel consumerPrintModel(List<? extends PrintModelElement> elementDefs) {
		return PrintModelDto.builder()
			.header(PrintModelHeaderDto.builder()
				.id(CONSUMER_PM_ID)
				.build())
			.content(PrintModelContentDto.builder()
				.id("content-consumer")
				.elementDefinitions(new ArrayList<>(elementDefs))
				.build())
			.build();
	}

	private static ModelSegment templateSegment(List<PlaceableReferenceDto> refs) {
		return ModelSegmentDto.builder()
			.id("template-seg")
			.title("Template Segment")
			.references(new ArrayList<>(refs))
			.build();
	}

	// Records every (bb, path, override) tuple passed to visitOverriddenBoundingBox.
	private static class CapturingVisitor implements PrintModelVisitor {
		record Call(BoundingBox bb, PrintModelPath path, OverrideElement override) {}

		final List<Call> calls = new ArrayList<>();

		@Override
		public TraversalCommand visitOverriddenBoundingBox(
			BoundingBox boundingBox,
			PrintModelPath path,
			OverrideElement overrideElement
		) {
			calls.add(new Call(boundingBox, path, overrideElement));
			return TraversalCommand.CONTINUE;
		}
	}

	@Test
	public void givenFlatOverrideBB_whenWalkDINTemplateReferences_thenVisitorReceivesOriginBasedPath() {
		// setup
		var refToBb1 = placeableRef(REF_TO_BB1_ID, BB1_ID);
		var bb1 = boundingBox(BB1_ID, List.of());
		var override1 = override(OVERRIDE1_ID, BB1_ID);

		var templateSeg = templateSegment(List.of(refToBb1));
		var templatePM = templatePrintModel(List.of(bb1));
		var consumerPM = consumerPrintModel(List.of(override1));

		var referenceResolver = new ReferenceMultiModelResolver(templatePM, consumerPM);
		var capturingVisitor = new CapturingVisitor();

		var walker = new PrintModelWalker(
			capturingVisitor,
			referenceResolver,
			segmentId -> java.util.Optional.empty(),
			sectionId -> java.util.Optional.empty(),
			watermarkId -> java.util.Optional.empty(),
			templateId -> java.util.Optional.empty(),
			id -> java.util.Optional.empty()
		);

		var originPath = PrintModelPath.create(consumerPM).with(consumerPM.getContent(), 0);
		var templateSegPath = PrintModelPath.create(templatePM).with(templatePM.getContent(), 0);
		var dinTemplateSegment = new PrintModelTreeTrace<>(templateSegPath, templateSeg);

		// act
		walker.walkDINTemplateReferences(originPath, dinTemplateSegment);

		// assert
		assertThat(capturingVisitor.calls).hasSize(1);

		var call = capturingVisitor.calls.get(0);
		assertThat(call.bb()).isSameAs(bb1);
		assertThat(call.override()).isSameAs(override1);

		// path must contain refToBb1 and override1 as path ancestors
		var pathElements = call.path().getParents().stream()
			.map(PrintModelPath.PathElement::getElement)
			.toList();
		assertThat(pathElements).contains(refToBb1, override1);

		// path must be rooted at the consumer model (originPath), not the template
		assertThat(pathElements).contains(consumerPM);
		assertThat(pathElements).doesNotContain(templatePM);
	}

	@Test
	public void givenNestedOverrideBB_whenWalkDINTemplateReferences_thenInnerOverridePathIsHierarchical() {
		// setup
		var refToBb1 = placeableRef(REF_TO_BB1_ID, BB1_ID);
		var refToBb2 = placeableRef(REF_TO_BB2_ID, BB2_ID);

		// BB1 holds a reference to BB2 (nested structure in the template)
		var bb1 = boundingBox(BB1_ID, List.of(refToBb2));
		var bb2 = boundingBox(BB2_ID, List.of());

		var override1 = override(OVERRIDE1_ID, BB1_ID);
		var override2 = override(OVERRIDE2_ID, BB2_ID);

		var templateSeg = templateSegment(List.of(refToBb1));
		var templatePM = templatePrintModel(List.of(bb1, bb2));
		var consumerPM = consumerPrintModel(List.of(override1, override2));

		var referenceResolver = new ReferenceMultiModelResolver(templatePM, consumerPM);
		var capturingVisitor = new CapturingVisitor();

		var walker = new PrintModelWalker(
			capturingVisitor,
			referenceResolver,
			segmentId -> java.util.Optional.empty(),
			sectionId -> java.util.Optional.empty(),
			watermarkId -> java.util.Optional.empty(),
			templateId -> java.util.Optional.empty(),
			id -> java.util.Optional.empty()
		);

		var originPath = PrintModelPath.create(consumerPM).with(consumerPM.getContent(), 0);
		var templateSegPath = PrintModelPath.create(templatePM).with(templatePM.getContent(), 0);
		var dinTemplateSegment = new PrintModelTreeTrace<>(templateSegPath, templateSeg);

		// act
		walker.walkDINTemplateReferences(originPath, dinTemplateSegment);

		// assert
		assertThat(capturingVisitor.calls).hasSize(2);

		var callOverride1 = capturingVisitor.calls.stream()
			.filter(c -> c.override() == override1).findFirst().orElseThrow();
		var callOverride2 = capturingVisitor.calls.stream()
			.filter(c -> c.override() == override2).findFirst().orElseThrow();

		// assert: override1's path is rooted at originPath
		var pathElems1 = callOverride1.path().getParents().stream()
			.map(PrintModelPath.PathElement::getElement)
			.toList();
		assertThat(pathElems1).contains(refToBb1, override1);
		assertThat(pathElems1).doesNotContain(bb1, override2);

		// assert: override2's path is hierarchical (contains override1 + bb1)
		var pathElems2 = callOverride2.path().getParents().stream()
			.map(PrintModelPath.PathElement::getElement)
			.toList();
		assertThat(pathElems2).contains(override1, bb1, refToBb2, override2);

		// override1 and bb1 must appear BEFORE refToBb2 in the path
		int idxOverride1 = pathElems2.indexOf(override1);
		int idxBb1 = pathElems2.indexOf(bb1);
		int idxRefToBb2 = pathElems2.indexOf(refToBb2);
		assertThat(idxOverride1).isLessThan(idxRefToBb2);
		assertThat(idxBb1).isLessThan(idxRefToBb2);
	}
}
