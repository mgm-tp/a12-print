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
package com.mgmtp.a12.print.engine.runtime.internal.engine;

import com.mgmtp.a12.kernel.md.document.apiV2.DocumentPointer;
import com.mgmtp.a12.kernel.md.document.apiV2.PathPart;
import com.mgmtp.a12.kernel.md.document.apiV2.immutable.FieldInstanceV2;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.PrintDocumentContext;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.DocumentModelIndex;
import com.mgmtp.a12.print.engine.runtime.test.internal.DocumentModelResolver;
import com.mgmtp.a12.print.engine.runtime.test.internal.DocumentV2Deserializer;
import com.mgmtp.a12.print.engine.runtime.test.internal.PrintTestUtil;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PrintDocumentContextTest {


	private static PrintDocumentContext printDocumentContext;

	@BeforeAll
	static void setup() {

		final var resolver = new DocumentModelResolver(
			PrintTestUtil.loadFromResources("/data/printdocumentslice/PrintDocumentTestDM.json")
		);

		final var dmModelId = "PrintDocumentTestDM";
		final var document = new DocumentV2Deserializer().provide(
			dmModelId,
			PrintTestUtil.loadFromResources("/data/printdocumentslice/PrintDocumentTestDM-1.json"),
			resolver
		);
		final var documentModel = resolver.getDocumentModelById("");
		printDocumentContext = new PrintDocumentContext(document, DocumentModelIndex.buildFrom(documentModel), dmModelId);
	}

	private void checkMaxRepetition(PrintDocumentContext printDocumentContext, String path, int expected, boolean wildcardOnPointerEqual) {
		final var element = printDocumentContext.getDocumentModel().getByPath(path);
		assertThat(element).isNotEmpty();
		assertThat(printDocumentContext.findMaxRepetition(element.get(), wildcardOnPointerEqual)).isEqualTo(expected);
	}

	private void checkMaxRepetition(String path, int expected) {
		checkMaxRepetition(printDocumentContext, path, expected, false);
	}

	private PrintDocumentContext getRepeatableContext() {
		return new PrintDocumentContext(
			printDocumentContext.getDocument(),
			DocumentPointer.of(List.of(PathPart.of("Repeatable", 1))),
			printDocumentContext.getDocumentModelIndex(),
			printDocumentContext.getDocumentModelId()
		);
	}

	@Test
	void findMaxRepetition() {
		checkMaxRepetition("/NoneRepeatable/NR_Repeatable", 7);
		checkMaxRepetition("/NoneRepeatable/NR_Repeatable2", 5);
		checkMaxRepetition("/Repeatable", 2);
		checkMaxRepetition("/NoneRepeatable", 1);
		// Will assume first repetition of Repeatable
		checkMaxRepetition("/Repeatable/NestedRepeatable", 5);

		checkMaxRepetition(getRepeatableContext(), "/Repeatable", 1, false);
		checkMaxRepetition(getRepeatableContext(), "/Repeatable", 2, true);
	}

	@Test
	void findRepetitions() {
		final var slice = printDocumentContext;

		assertThatThrownBy(() -> slice.findRepetitions("/")).isInstanceOf(IllegalArgumentException.class);

		final var repeatable = slice.findRepetitions("/Repeatable").toList();
		assertThat(repeatable).hasSize(2);

		assertThat(getRepeatableContext().findRepetitions("/Repeatable").toList()).hasSize(1);

		final var firstRepeatable = repeatable.get(0);

		assertThat(firstRepeatable.findRepetitions("/Repeatable/NestedRepeatable").count()).isEqualTo(5);

		final var secondRepeatable = repeatable.get(1);

		assertThat(secondRepeatable.findRepetitions("/Repeatable/NestedRepeatable").count()).isEqualTo(2);

		final var noneRepeatable = slice.findRepetitions("/NoneRepeatable").toList();

		assertThat(noneRepeatable).hasSize(1);

		final var singleRepetition = noneRepeatable.getFirst();

		final var nrRepeatable = singleRepetition.findRepetitions("/NoneRepeatable/NR_Repeatable").toList();
		assertThat(nrRepeatable).hasSize(7);

		assertThat(slice.findRepetitions("/NoneRepeatable/NR_Repeatable").count()).isEqualTo(7);
		assertThat(slice.findRepetitions("/NoneRepeatable/NR_Repeatable2").count()).isEqualTo(5);
	}

	@Test
	void findInstances() {

		final var slice = printDocumentContext;

		final var noneRepeatable = slice.findInstancesContext("/NoneRepeatable").toList();
		assertThat(noneRepeatable).isNotEmpty().hasSize(66);
		for (var instance : noneRepeatable) {
			if (instance.getInstance() instanceof FieldInstanceV2) {
				final var parent = instance.parentGroup();
				assertThat(parent).isNotNull();
			}
		}
		final var repeatable = slice.findInstancesContext("/Repeatable").toList();
		assertThat(repeatable).isNotEmpty().hasSize(184);
		for (var instance : repeatable) {
			if (instance.getInstance() instanceof FieldInstanceV2) {
				final var parent = instance.parentGroup();
				assertThat(parent).isNotNull();
			}
		}

		final var subRepeatable = getRepeatableContext().findInstancesContext("/Repeatable").toList();
		assertThat(subRepeatable).hasSize(131);
	}

	@Test
	void prefixSingleInstance() {
		final var resolver = new DocumentModelResolver(
			PrintTestUtil.loadFromResources("/data/printdocumentslice/A12PrintEvalResultsDM.json")
		);
		final var dmModelId = "A12PrintEvalResultsDM";
		final var document = new DocumentV2Deserializer().provide(
			dmModelId,
			PrintTestUtil.loadFromResources("/data/printdocumentslice/A12PrintEvalResultsDM-1.json"),
			resolver
		);

		final var documentModel = resolver.getDocumentModelById("");
		printDocumentContext = new PrintDocumentContext(document, DocumentModelIndex.buildFrom(documentModel), dmModelId);

		final var node12Instance = printDocumentContext.findSingleFieldInstance("/A12_Print_Eval_Results/Node_12");
		assertThat(node12Instance).isEmpty();
		final var node128Instance = printDocumentContext.findSingleFieldInstance("/A12_Print_Eval_Results/Node_128");
		assertThat(node128Instance).isPresent();
		assertThat(node128Instance.get().getPath()).isEqualTo("/A12_Print_Eval_Results/Node_128");
	}

	@Test
	void findInstancesRepBB() {
		final var resolver = new DocumentModelResolver(
			PrintTestUtil.loadFromResources("/data/repeatableArea/RepeatableSegmentDM.json")
		);
		final var dmModelId = "RepeatableSegmentDM";
		final var document = new DocumentV2Deserializer().provide(
			dmModelId,
			PrintTestUtil.loadFromResources("/data/repeatableArea/RepeatableSegmentDM-2.json"),
			resolver
		);
		final var documentModel = resolver.getDocumentModelById("");
		printDocumentContext = new PrintDocumentContext(document, DocumentModelIndex.buildFrom(documentModel), dmModelId);

		final var repeatable = printDocumentContext.findRepetitions("/general/repeatable1").toList();
		assertThat(repeatable).hasSize(2);

		for (var r : repeatable) {
			assertThat(r.findSingleFieldInstance("/general/repeatable1/string_field1")).isPresent();
		}
	}
}
