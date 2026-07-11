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
package com.mgmtp.a12.print.engine.runtime.internal.engine.provider.html;

import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.api.PdfBoxPrintEngine;
import com.mgmtp.a12.print.engine.runtime.internal.CoreDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.constant.Constants;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalCorePrintEngineRuntime;
import com.mgmtp.a12.print.model.api.model.element.ElementType;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Attributes;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
public class HtmlReplacementDependencyValueProducer implements CoreDependencyValueProvider<String, HtmlReplacementDependency> {

	private static final String ENTITY_TYPE = "entity-type";
	private static final String ENTITY_ID = "entity-id";
	private static final String SPAN = "span";
	private static final String STYLE = "style";


	private static void searchLastChildrenAndSetValue(
		Element entity,
		String newValue,
		boolean isHtml,
		LinkedHashMap<String, String> additionalAttributes,
		PrintEngine<?> engine
	) {
		if (!entity.children().isEmpty()) {
			searchLastChildrenAndSetValue(entity.child(0), newValue, isHtml, additionalAttributes, engine);
		} else {
			var elementToCustomize = entity;

			// add span element for page number / page number total usage
			if (
				additionalAttributes.containsKey(ENTITY_TYPE) &&
					!elementToCustomize.tag().getName().equals(SPAN)
			) {
				final var newSpanElement = new Element(SPAN);
				elementToCustomize.html(Constants.EMPTY_STRING);
				elementToCustomize.appendChild(newSpanElement);
				elementToCustomize = newSpanElement;
			}

			for (Map.Entry<String, String> entry : additionalAttributes.entrySet()) {
				elementToCustomize.attr(entry.getKey(), entry.getValue());
			}

			if (isHtml || !(engine instanceof PdfBoxPrintEngine)) {
				elementToCustomize.html(newValue);
			} else {
				// Jsoup escapes special HTML characters (e.g. < > &) which is required for plain-text values injected into HTML
				elementToCustomize.text(newValue);
			}
		}
	}

	@Override
	public ValueFactory<String> produce(
		HtmlReplacementDependency dependency,
		PrintJob job,
		PrintEngine<?> engine,
		InternalCorePrintEngineRuntime runtime
	) {
		final Document htmlDocument = Jsoup.parseBodyFragment(dependency.getOriginHtml());
		final var markupResults = dependency.getMarkupResults();

		Elements entities = htmlDocument.getElementsByAttribute(ENTITY_ID);
		for (Element entity : entities) {
			Attributes attributes = entity.attributes();
			String entityId = attributes.get(ENTITY_ID);
			String entityType = attributes.get(ENTITY_TYPE);

			markupResults.stream()
						 .filter(el -> el.getId().equals(entityId))
						 .findFirst()
						 .ifPresentOrElse((markupResult) -> {
							 LinkedHashMap<String, String> additionalAttributes = new LinkedHashMap<>();
							 final var markup = markupResult.getMarkup();
							 if (markup.isEmpty() && isPageNumberOrPageNumberTotalEntity(entityType)) {
								 entity.removeAttr(ENTITY_TYPE);
								 entity.removeAttr(ENTITY_ID);
								 additionalAttributes.put(ENTITY_ID, entityId);
								 additionalAttributes.put(ENTITY_TYPE, entityType);
							 }
							 searchLastChildrenAndSetValue(
								 entity,
								 markup,
								 markupResult.isHtml(),
								 additionalAttributes,
								 engine
							 );
						 }, () -> {
							 log.debug(
								 "html-entity-id {} in text {}({}) was not replaced, no markup result provided",
								 entityId,
								 dependency.getTextElement().getId(),
								 dependency.getTextElement().getType()
							 );
						 });
		}

		// set margin 0 to all p tags
		Elements pTags = htmlDocument.select("p");
		for (Element pTag : pTags) {
			runtime.provide(new AddStylesToHtmlDependency(pTag, Map.of("margin", "0px")));
		}
		htmlDocument.outputSettings().prettyPrint(false);

		return () -> htmlDocument.body().html();
	}

	private static boolean isPageNumberOrPageNumberTotalEntity(String entityType) {
		return entityType.equals(ElementType.PAGE_NUMBER.getIdentifier()) ||
			entityType.equals(ElementType.PAGE_NUMBER_TOTAL.getIdentifier());
	}
}
