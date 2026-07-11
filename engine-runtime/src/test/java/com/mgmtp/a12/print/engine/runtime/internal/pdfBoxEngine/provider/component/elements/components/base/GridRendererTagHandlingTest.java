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
package com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.base;

import org.apache.commons.lang3.tuple.Pair;
import org.apache.pdfbox.cos.COSName;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.documentinterchange.logicalstructure.PDStructureElement;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.List;

import static com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.base.AccessibilityUtils.getStructElement;
import static org.apache.pdfbox.pdmodel.documentinterchange.taggedpdf.StandardStructureTypes.*;
import static org.assertj.core.api.Assertions.assertThat;

class GridRendererTagHandlingTest {

	private PDPage page;

	@BeforeEach
	void setUp() {
		page = new PDPage();
	}

	@Nested
	class FlatMode {

		@Test
		void noOperations_returnsEmptyResult() {
			var handler = new GridRendererTagHandling(false, page);

			var result = handler.getAccessibilityResult();

			assertThat(result.getStructureElements()).isEmpty();
			assertThat(result.getParentTreeElements()).isEmpty();
		}

		@Test
		void tagHeader_accumulatesStructureAndParentElements() {
			var handler = new GridRendererTagHandling(false, page);
			var structElement = getStructElement(P, page);
			var parentElement = getStructElement(P, page);

			handler.tagHeader(List.of(new AccessibilityData(List.of(structElement), List.of(parentElement))));

			var result = handler.getAccessibilityResult();
			assertThat(result.getStructureElements()).containsExactly(structElement);
			assertThat(result.getParentTreeElements()).containsExactly(parentElement);
		}

		@Test
		void tagContent_accumulatesStructureAndParentElements() {
			var handler = new GridRendererTagHandling(false, page);
			var structElement = getStructElement(P, page);
			var parentElement = getStructElement(P, page);

			handler.tagContent(List.of(Pair.of(1, new AccessibilityData(List.of(structElement), List.of(parentElement)))));

			var result = handler.getAccessibilityResult();
			assertThat(result.getStructureElements()).containsExactly(structElement);
			assertThat(result.getParentTreeElements()).containsExactly(parentElement);
		}

		@Test
		void multipleHeaderAndContentCells_accumulatesAll() {
			var handler = new GridRendererTagHandling(false, page);
			var headerStruct = getStructElement(P, page);
			var headerParent = getStructElement(P, page);
			var contentStruct = getStructElement(P, page);
			var contentParent = getStructElement(P, page);

			handler.tagHeader(List.of(new AccessibilityData(List.of(headerStruct), List.of(headerParent))));
			handler.tagContent(List.of(Pair.of(1, new AccessibilityData(List.of(contentStruct), List.of(contentParent)))));

			var result = handler.getAccessibilityResult();
			assertThat(result.getStructureElements()).containsExactly(headerStruct, contentStruct);
			assertThat(result.getParentTreeElements()).containsExactly(headerParent, contentParent);
		}
	}

	@Nested
	class TaggedMode {

		@Test
		void noHeader_returnsTableWithBodyOnly() {
			var handler = new GridRendererTagHandling(true, page);
			handler.tagContent(List.of(Pair.of(1, AccessibilityData.EMPTY_ACCESSIBILITY_DATA)));

			var result = handler.getAccessibilityResult();

			assertThat(result.getStructureElements()).hasSize(1);
			var table = (PDStructureElement) result.getStructureElements().getFirst();
			assertThat(table.getStructureType()).isEqualTo(TABLE);
			var tableKids = table.getKids();
			assertThat(tableKids).hasSize(1);
			assertThat(((PDStructureElement) tableKids.getFirst()).getStructureType()).isEqualTo(T_BODY);
		}

		@Test
		void withHeader_returnsTableWithHeadAndBody() {
			var handler = new GridRendererTagHandling(true, page);
			handler.tagHeader(List.of(AccessibilityData.EMPTY_ACCESSIBILITY_DATA));
			handler.tagContent(List.of(Pair.of(1, AccessibilityData.EMPTY_ACCESSIBILITY_DATA)));

			var result = handler.getAccessibilityResult();

			var table = result.getStructureElements().getFirst();
			var tableKids = table.getKids();
			assertThat(tableKids).hasSize(2);
			assertThat(((PDStructureElement) tableKids.get(0)).getStructureType()).isEqualTo(T_HEAD);
			assertThat(((PDStructureElement) tableKids.get(1)).getStructureType()).isEqualTo(T_BODY);
		}

		@Test
		void tagContent_colSpanOne_noColSpanAttribute() {
			var handler = new GridRendererTagHandling(true, page);
			var parent = getStructElement(P, page);
			handler.tagContent(List.of(Pair.of(1, new AccessibilityData(List.of(), List.of(parent)))));

			var td = getTdFromFirstRow(handler);

			assertThat(td.getCOSObject().containsKey(COSName.getPDFName("A"))).isFalse();
		}

		@Test
		void tagContent_colSpanGreaterThanOne_setsColSpanAttribute() {
			var handler = new GridRendererTagHandling(true, page);
			var parent = getStructElement(P, page);
			handler.tagContent(List.of(Pair.of(2, new AccessibilityData(List.of(), List.of(parent)))));

			var td = getTdFromFirstRow(handler);

			assertThat(td.getCOSObject().containsKey(COSName.getPDFName("A"))).isTrue();
		}

		@Test
		void multipleRows_eachInSeparateTrElement() {
			var handler = new GridRendererTagHandling(true, page);
			handler.tagContent(List.of(Pair.of(1, AccessibilityData.EMPTY_ACCESSIBILITY_DATA)));
			handler.tagContent(List.of(Pair.of(1, AccessibilityData.EMPTY_ACCESSIBILITY_DATA)));

			var table = handler.getAccessibilityResult().getStructureElements().getFirst();
			var tbody = (PDStructureElement) table.getKids().getFirst();
			assertThat(tbody.getKids()).hasSize(2);
			assertThat(((PDStructureElement) tbody.getKids().get(0)).getStructureType()).isEqualTo(TR);
			assertThat(((PDStructureElement) tbody.getKids().get(1)).getStructureType()).isEqualTo(TR);
		}

		@Test
		void parentTreeElements_collectedFromHeaderAndContent() {
			var handler = new GridRendererTagHandling(true, page);
			var headerParent = getStructElement(P, page);
			var contentParent = getStructElement(P, page);

			handler.tagHeader(List.of(new AccessibilityData(List.of(), List.of(headerParent))));
			handler.tagContent(List.of(Pair.of(1, new AccessibilityData(List.of(), List.of(contentParent)))));

			var result = handler.getAccessibilityResult();
			assertThat(result.getParentTreeElements()).containsExactly(headerParent, contentParent);
		}

		private PDStructureElement getTdFromFirstRow(GridRendererTagHandling handler) {
			var table = handler.getAccessibilityResult().getStructureElements().getFirst();
			var tbody = (PDStructureElement) table.getKids().getFirst();
			var tr = (PDStructureElement) tbody.getKids().getFirst();
			return (PDStructureElement) tr.getKids().getFirst();
		}
	}
}
