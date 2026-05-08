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
package com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.element.text;

import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.runtime.internal.ModelDocumentDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.constant.Constants;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.markup.text.NestingType;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.text.TextDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalModelDocumentPrintEngineRuntime;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.element.PrintModelElement;
import com.mgmtp.a12.print.model.api.model.reference.ElementReference;
import com.mgmtp.a12.print.model.api.model.reference.PlaceableReference;
import com.mgmtp.a12.print.model.api.model.reference.TableColumnReference;
import com.mgmtp.a12.print.model.api.model.reference.TableLayoutCellReference;
import com.mgmtp.a12.print.model.document.internal.base.IPrintElement;
import com.mgmtp.a12.print.model.document.internal.element.TextBasedElement;
import org.jsoup.Jsoup;

import java.util.Collections;

public class TextBasedElementValueProducer implements ModelDocumentDependencyValueProvider<IPrintElement, TextBasedElementDependency> {

	@Override
	public ValueFactory<IPrintElement> produce(TextBasedElementDependency dependency, PrintJob job, PrintEngine<?> engine, InternalModelDocumentPrintEngineRuntime runtime) {
		final var printModelElementTrace = dependency.getPrintModelElementTrace();
		final var elementReference
			= printModelElementTrace.findReferenceCallSite(PrintModelElement::getId);
		final var evaluatedValueOptional = dependency.getEvaluatedValue().get();
		final var isHtml = dependency.isHtml();
		final var evaluatedValue = evaluatedValueOptional.orElse(Constants.EMPTY_STRING);

		final var childElements = dependency.getChildElements();
		final var printModelElement = printModelElementTrace.getTracedElement();
		final var nestingType = elementReference.map(NestingType::fromReference).orElse(NestingType.NONE);
		final var isHidden = TextDependencyValueProducer.isHidden(printModelElementTrace, evaluatedValueOptional.isEmpty());

		if (isHidden) {
			return () -> null;
		}

		final var textContent = isHtml
			? Jsoup.parseBodyFragment(evaluatedValue).body().text()
			: null;

		return () -> new TextBasedElement(
			printModelElement.getId(),
			printModelElement.getType(),
			evaluatedValue,
			textContent,
			nestingType.isNested(),
			isHtml,
			childElements == null ? Collections.emptyList() : childElements
		);
	}
}
