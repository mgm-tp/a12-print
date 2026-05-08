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

import com.mgmtp.a12.print.engine.runtime.internal.manager.PrintModelCompilerRuntime;
import com.mgmtp.a12.print.engine.runtime.test.internal.PrintTestUtil;
import com.mgmtp.a12.print.engine.runtime.utils.PdfRuntimeTestUtil;
import com.mgmtp.a12.print.model.api.model.PrintModel;
import com.mgmtp.a12.print.model.api.model.element.type.switchCase.Switch;
import org.junit.jupiter.api.Test;

import java.util.List;

import static com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.types.PrintModelPreCompilerTest.provideDocumentModelReference;
import static org.assertj.core.api.Assertions.assertThat;

class MarginLayoutDependencyValueProducerFactoryTest {
	private MarginLayoutDependencyValueProducerFactory underTest;
	private static final String SWITCH_PATH = "/data/switch";

	@Test
	public void givenSwitchPrintModel_whenSetDependencyValueProducer_thenCorrect() {
		var switchIds = List.of(
			"FIRST_SWITCH", "SECOND_SWITCH", "THIRD_SWITCH",
			"FOURTH_SWITCH", "FIFTH_SWITCH", "SIXTH_SWITCH",
			"SWITCH_1", "SWITCH_2", "SWITCH_3", "SWITCH_3_SWITCH"
		);
		var printModel = PrintTestUtil.loadFromResources(String.format("%s/SwitchPM.json", SWITCH_PATH));
		var documentModel = PrintTestUtil.loadFromResources(String.format("%s/SwitchDM.json", SWITCH_PATH));
		var printModelDto = PrintTestUtil.deserializePrintModel(printModel);
		var managerApi = PdfRuntimeTestUtil.getPrintJobManagerApi(String.format("%s/SwitchPM.json", SWITCH_PATH), documentModel, "SwitchDM");
		var runtime = PdfRuntimeTestUtil.getPrintModelCompilerRuntime(managerApi);
		var context = PdfRuntimeTestUtil.getPrintModelCompilationContext(printModelDto, runtime);
		provideDocumentModelReference(printModelDto, context, managerApi);
		underTest = getInstance(printModelDto, runtime);

		underTest.setDependencyValueProducer(context);

		var spreadExpressionManager = context.getSpreadExpressionManager();
		var spreadExpressionMap = spreadExpressionManager.getExpressions();
		var switchExpressionIds= spreadExpressionMap
			.entrySet()
			.stream()
			.filter(entry -> {
				if (entry.getValue() instanceof NestedContainerSpreadExpression switchContainerSpreadExpression) {
					return switchContainerSpreadExpression.getContainer() instanceof Switch;
				}
				return false;
			})
			.map(entry -> entry.getKey())
			.toList();
		assertThat(switchExpressionIds)
			.hasSize(10)
			.containsExactlyInAnyOrder(switchIds.toArray(String[]::new));
	}

	private MarginLayoutDependencyValueProducerFactory getInstance(PrintModel printModel, PrintModelCompilerRuntime runtime) {
		return new MarginLayoutDependencyValueProducerFactory(printModel, runtime);
	}
}
