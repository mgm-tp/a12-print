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

import com.mgmtp.a12.kernel.md.document.api.IFieldInstance;
import com.mgmtp.a12.kernel.md.document.api.IGroupInstance;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.MutablePrintDocument;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.PrintDocument;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.DocumentModelIndex;
import com.mgmtp.a12.print.engine.runtime.test.internal.DocumentDeserializer;
import com.mgmtp.a12.print.engine.runtime.test.internal.DocumentModelResolver;
import com.mgmtp.a12.print.engine.runtime.test.internal.PrintTestUtil;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PrintDocumentPrintDocumentContextTest {


	private static PrintDocument printDocument;

	@BeforeAll
	static void setup() throws IOException {

		final var resolver = new DocumentModelResolver(
			PrintTestUtil.loadFromResources("/data/printdocumentslice/PrintDocumentTestDM.json")
		);

		final var document = new DocumentDeserializer().provide(
			"PrintDocumentTestDM",
			PrintTestUtil.loadFromResources("/data/printdocumentslice/PrintDocumentTestDM-1.json"),
			resolver
		);
		printDocument = MutablePrintDocument.from(document, DocumentModelIndex.buildFrom(resolver.getDocumentModelById(""))).setImmutable();
	}

	@Test
	void loading() {
		assertThat(printDocument).isNotEmpty();
	}

	@Test
	void findMaxRepetition() {

		final var slice = printDocument.context();

		assertThat(slice.findMaxRepetition("/NoneRepeatable/NR_Repeatable")).isEqualTo(7);
		assertThat(slice.findMaxRepetition("/NoneRepeatable/NR_Repeatable2")).isEqualTo(5);
		assertThat(slice.findMaxRepetition("/Repeatable")).isEqualTo(2);
		assertThat(slice.findMaxRepetition("/Repeatable/NestedRepeatable")).isEqualTo(5);
		assertThat(slice.findMaxRepetition("/NoneRepeatable")).isEqualTo(1);
	}

	@Test
	void findRepetitions() {
		final var slice = printDocument.context();

		assertThatThrownBy(() -> slice.findRepetitions("/")).isInstanceOf(IllegalArgumentException.class);

		final var Repeatable = slice.findRepetitions("/Repeatable").toList();
		assertThat(Repeatable.size()).isEqualTo(2);

		final var firstRepeatable = Repeatable.get(0);

		assertThat(firstRepeatable.findRepetitions("/Repeatable/NestedRepeatable").count()).isEqualTo(5);

		final var secondRepeatable = Repeatable.get(1);

		assertThat(secondRepeatable.findRepetitions("/Repeatable/NestedRepeatable").count()).isEqualTo(2);

		final var NoneRepeatable = slice.findRepetitions("/NoneRepeatable").toList();
		;

		assertThat(NoneRepeatable.size()).isEqualTo(1);

		final var singleRepetition = NoneRepeatable.get(0);

		final var NR_Repeatable = singleRepetition.findRepetitions("/NoneRepeatable/NR_Repeatable").toList();
		assertThat(NR_Repeatable.size()).isEqualTo(7);

		assertThat(slice.findRepetitions("/NoneRepeatable/NR_Repeatable").count()).isEqualTo(7);
		assertThat(slice.findRepetitions("/NoneRepeatable/NR_Repeatable2").count()).isEqualTo(5);

		final var doc = MutablePrintDocument.from(printDocument, printDocument.context().getDocumentModel());
		final var groups = printDocument.getEntityInstances().stream().filter(e -> e instanceof IGroupInstance).toList();
		groups.forEach(doc::removeEntityInstance);

		final var withoutGroups = doc.setImmutable().context();
		final var reps = withoutGroups.findRepetitions("/Repeatable/NestedRepeatable").toList();
		assertThat(reps.size()).isEqualTo(5);
		for (var r : reps) {
			assertThat(r.getLatestSlice().size()).isEqualTo(20);
		}


	}

	@Test
	void findInstances() {

		final var slice = printDocument.context();

		final var NoneRepeatable = slice.findInstancesContext("/NoneRepeatable").collect(Collectors.toList());
		assertThat(NoneRepeatable).isNotEmpty();
		for (var instance : NoneRepeatable) {
			if (instance.getInstance() instanceof IFieldInstance) {
				final var parent = instance.parentGroup();
				assertThat(parent).isNotNull();
				assertThat(parent.getLatestSlice()).isNotEmpty();
			}
		}
		final var Repeatable = slice.findInstancesContext("/Repeatable").collect(Collectors.toList());
		assertThat(Repeatable).isNotEmpty();
		for (var instance : Repeatable) {
			if (instance.getInstance() instanceof IFieldInstance) {
				final var parent = instance.parentGroup();
				assertThat(parent).isNotNull();
				assertThat(parent.getLatestSlice()).isNotEmpty();
			}
		}
	}

	@Test
	void prefixSingleInstance() {
		final var resolver = new DocumentModelResolver(
			PrintTestUtil.loadFromResources("/data/printdocumentslice/A12PrintEvalResultsDM.json")
		);
		final var document = new DocumentDeserializer().provide(
			"A12PrintEvalResultsDM",
			PrintTestUtil.loadFromResources("/data/printdocumentslice/A12PrintEvalResultsDM-1.json"),
			resolver
		);
		printDocument = MutablePrintDocument.from(document, DocumentModelIndex.buildFrom(resolver.getDocumentModelById(""))).setImmutable();

		final var slice = printDocument.context();
		final var node12Instance = slice.findSingleFieldInstance("/A12_Print_Eval_Results/Node_12");
		assertThat(node12Instance.isEmpty()).isTrue();
		final var node128Instance = slice.findSingleFieldInstance("/A12_Print_Eval_Results/Node_128");
		assertThat(node128Instance.isPresent()).isTrue();
		assertThat(node128Instance.get().getInstance().getPath()).isEqualTo("/A12_Print_Eval_Results/Node_128");
	}

	@Test
	void findInstancesRepBB() {
		final var resolver = new DocumentModelResolver(
			PrintTestUtil.loadFromResources("/data/repeatableArea/RepeatableSegmentDM.json")
		);
		final var document = new DocumentDeserializer().provide(
			"RepeatableSegmentDM",
			PrintTestUtil.loadFromResources("/data/repeatableArea/RepeatableSegmentDM-2.json"),
			resolver
		);
		printDocument = MutablePrintDocument.from(document, DocumentModelIndex.buildFrom(resolver.getDocumentModelById(""))).setImmutable();

		final var slice = printDocument.context();
		final var Repeatable = slice.findRepetitions("/general/repeatable1").toList();
		assertThat(Repeatable.size()).isEqualTo(2);

		for (var r : Repeatable) {
			assertThat(r.findFieldInstances("/general/repeatable1/string_field1").count()).isEqualTo(1);
		}

	}
}
