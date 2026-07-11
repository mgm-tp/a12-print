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
package com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.types;

import com.mgmtp.a12.print.engine.runtime.PrintJobManager;
import com.mgmtp.a12.print.engine.runtime.internal.engine.constant.Constants;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.PrintModelCompilationContext;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.PrintModelCompiler;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.PrintModelCompilerGraph;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.PrintModelPreCompiler;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.DocumentModelIndex;
import com.mgmtp.a12.print.engine.runtime.test.internal.PrintTestUtil;
import com.mgmtp.a12.print.engine.runtime.utils.PdfRuntimeTestUtil;
import com.mgmtp.a12.print.model.api.model.PrintModelEntity;
import com.mgmtp.a12.print.model.api.model.element.type.switchCase.Switch;
import com.mgmtp.a12.print.model.api.model.element.type.switchCase.SwitchCase;
import com.mgmtp.a12.print.model.api.walker.model.PrintModelPath;
import com.mgmtp.a12.print.model.api.model.internal.dto.PrintModelDto;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

public class PrintModelPreCompilerTest {
	private PrintModelPreCompiler underTest;
	private static final String SWITCH_PATH = "/data/switch";

	@Test
	void givenSwitchPrintModel_whenVisitElementDefinitionsAndPlaceableReferences_thenVisitSwitch() {
		var switchCaseIds = List.of(
			"JmlnZLIyi7qQM7MqQSesA", "dF2XZMLNvOkvRrNHRlP4k", "R09f3xDeZ9gUW3IgPrnKb",
			"XcnxUF5DDa4OpRI5h0dtJ", "VBVBqVYm_gy8XeuvzcmTN", "3YG_GOIWwfjSvQvQMMSWQ",
			"3Z5VZyp0ujw2bhW9XDOMp", "VjnNNtaj1SW9LKIZjdfSb", "nRMZa57MH6ml0BK-C7cxk",
			"RB8AEyxcLpVkEQqpmGZrN", "XZe5rgv1trZjZkKfF_EC0"
		);
		var printModel = PrintTestUtil.loadFromResources(String.format("%s/SwitchPM.json", SWITCH_PATH));
		var documentModel = PrintTestUtil.loadFromResources(String.format("%s/SwitchDM.json", SWITCH_PATH));
		var printModelDto = PrintTestUtil.deserializePrintModel(printModel);
		var managerApi = PdfRuntimeTestUtil.getPrintJobManagerApi(String.format("%s/SwitchPM.json", SWITCH_PATH), documentModel, "SwitchDM");
		var runtime = PdfRuntimeTestUtil.getPrintModelCompilerRuntime(managerApi);
		var context = PdfRuntimeTestUtil.getPrintModelCompilationContext(printModelDto, runtime);
		provideDocumentModelReference(printModelDto, context, managerApi);
		underTest = getInstance(context, managerApi);

		var printModelCompiler = new PrintModelCompiler(runtime);
		printModelCompiler.visitElementDefinitionsAndPlaceableReferences(printModelDto, underTest);

		var containers = underTest.getContainers();
		var switchCaseLogicContainerIds= containers
			.keySet()
			.stream()
			.filter(logicContainer -> logicContainer instanceof SwitchCase)
			.map(PrintModelEntity::getId)
			.toList();

		verify(underTest, times(12)).visitSwitch(any(Switch.class), any(PrintModelPath.class));
		assertThat(switchCaseLogicContainerIds)
			.hasSize(11)
			.containsExactlyInAnyOrder(switchCaseIds.toArray(String[]::new));
	}

	private PrintModelPreCompiler getInstance(PrintModelCompilationContext context, PrintJobManager.PrintJobManagerApi managerApi) {
		var printModelCompilerGraph = new PrintModelCompilerGraph(context);
		var printModelCompilerRuntime = PdfRuntimeTestUtil.getPrintModelCompilerRuntime(managerApi);
		return spy(new PrintModelPreCompiler(
			context,
			printModelCompilerGraph.getEquivalenceGeneralizationGraph(),
			printModelCompilerRuntime.getA12TypeComparisonMapping(),
			null
		));
	}

	public static void provideDocumentModelReference(PrintModelDto printModelDto, PrintModelCompilationContext context, PrintJobManager.PrintJobManagerApi managerApi) {
		for (var modelReference : printModelDto.getHeader().getModelReferences()) {
			if (modelReference.getModelType().equals(Constants.DOCUMENT_MODEL_TYPE)) {
				final var documentModel = managerApi.loadDocumentModel(modelReference.getReference());
				var documentModelIndex = DocumentModelIndex.load(documentModel);
				context.provideDocumentModelReference(modelReference, documentModelIndex);
			}
		}
	}
}
