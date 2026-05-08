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
package com.mgmtp.a12.print.model.api.validation.custom.conditions;

import com.mgmtp.a12.kernel.md.document.apiV2.DocumentMultiPointer;
import com.mgmtp.a12.kernel.md.document.apiV2.DocumentPointer;
import com.mgmtp.a12.kernel.md.document.apiV2.PartiallyKnownDocumentMultiPointer;
import com.mgmtp.a12.kernel.md.document.apiV2.immutable.DocumentV2;
import com.mgmtp.a12.kernel.md.rt.api.ICustomCondition;
import com.mgmtp.a12.print.model.api.domain.typings.views.DomainPrintMetaModel;
import com.mgmtp.a12.print.model.api.validation.custom.conditions.utils.TypedElementReferenceWrapper;
import com.mgmtp.a12.print.model.api.validation.custom.conditions.utils.ValidationPathHandler;
import lombok.NonNull;

import java.util.List;
import java.util.Set;
import java.util.TreeMap;

public class IsElementReferenceOverlapped implements ICustomCondition {

	private TreeMap<String, ValidationPathHandler> validationPathHandlerMap;
	private record References(List<TypedElementReferenceWrapper> references, TypedElementReferenceWrapper currentReference) { }

	public IsElementReferenceOverlapped() {
		initializeValidationPathHandlerMap();
	}

	@Override
	public boolean check(
		@NonNull DocumentV2 document,
		Set<? extends DocumentMultiPointer> relevantEntities,
		@NonNull Set<DocumentPointer> formallyIncorrectEntities,
		@NonNull PartiallyKnownDocumentMultiPointer errorEntityInstance
	) {
		if (relevantEntities != null) {
			return false;
		}

		if (!formallyIncorrectEntities.isEmpty()) {
			return false;
		}

		try {
			var referenceResult = getValidationReferences(document, errorEntityInstance);
			if (referenceResult.currentReference == null || referenceResult.references == null) {
				throw new Exception("Cannot access references during executing validation rule print_ElementReferenceOverlapped");
			}

			for (TypedElementReferenceWrapper elementReference : referenceResult.references) {
				if (
					!elementReference.getId().equals(referenceResult.currentReference.getId()) &&
					isElementReferenceOverlapped(elementReference, referenceResult.currentReference)
				) {
					return true;
				}
			}
		} catch (Exception e) {
			throw new RuntimeException(e);
		}

		return false;
	}

	private void initializeValidationPathHandlerMap() {
		this.validationPathHandlerMap = new TreeMap<>();

		validationPathHandlerMap.put(
			"/content/segments/definitions",
			new ValidationPathHandler(
				"/content/segments/definitions",
				2,
				3,
				((document, index) -> {
					DomainPrintMetaModel domainPrintMetaModel = DomainPrintMetaModel._viewOf(document);
					return domainPrintMetaModel._at(
						DomainPrintMetaModel
							._pointer()
							.content()
							.segments()
							.definitions()
							.get(index)
							.elementReferences()
						).stream().map(e -> new TypedElementReferenceWrapper(e)).toList();
					}
				)
			)
		);
		validationPathHandlerMap.put(
			"/content/sections/definitions",
			new ValidationPathHandler(
				"/content/sections/definitions",
				2,
				3,
				((document, index) -> {
					DomainPrintMetaModel domainPrintMetaModel = DomainPrintMetaModel._viewOf(document);
					return domainPrintMetaModel._at(
						DomainPrintMetaModel
							._pointer()
							.content()
							.sections()
							.definitions()
							.get(index)
							.elementReferences()
						).stream().map(e -> new TypedElementReferenceWrapper(e)).toList();
					}
				)
			)
		);
		validationPathHandlerMap.put(
			"/content/watermarks/definitions",
			new ValidationPathHandler(
				"/content/watermarks/definitions",
				2,
				3,
				((document, index) -> {
					DomainPrintMetaModel domainPrintMetaModel = DomainPrintMetaModel._viewOf(document);
					return domainPrintMetaModel._at(
						DomainPrintMetaModel
							._pointer()
							.content()
							.watermarks()
							.definitions()
							.get(index)
							.elementReferences()
						).stream().map(e -> new TypedElementReferenceWrapper(e)).toList();
					}
				)
			)
		);
		validationPathHandlerMap.put(
			"/content/elementDefinitions/boundingBox",
			new ValidationPathHandler(
				"/content/elementDefinitions/boundingBox",
				1,
				3,
				((document, index) -> {
					DomainPrintMetaModel domainPrintMetaModel = DomainPrintMetaModel._viewOf(document);
					return domainPrintMetaModel._at(
						DomainPrintMetaModel
							._pointer().content()
							.elementDefinitions()
							.get(index)
							.boundingBox()
							.elementReferences()
						).stream().map(e -> new TypedElementReferenceWrapper(e)).toList();
					}
				)
			)
		);
		validationPathHandlerMap.put(
			"/content/elementDefinitions/area",
			new ValidationPathHandler(
				"/content/elementDefinitions/area",
				1,
				3,
				((document, index) -> {
					DomainPrintMetaModel domainPrintMetaModel = DomainPrintMetaModel._viewOf(document);
					return domainPrintMetaModel._at(
						DomainPrintMetaModel
							._pointer()
							.content()
							.elementDefinitions()
							.get(index)
							.area()
							.elementReferences()
						).stream().map(e -> new TypedElementReferenceWrapper(e)).toList();
					}
				)
			)
		);
		validationPathHandlerMap.put(
			"/content/elementDefinitions/override",
			new ValidationPathHandler(
				"/content/elementDefinitions/override",
				1,
				4,
				((document, index) -> {
					DomainPrintMetaModel domainPrintMetaModel = DomainPrintMetaModel._viewOf(document);
					return domainPrintMetaModel._at(
						DomainPrintMetaModel
							._pointer()
							.content()
							.elementDefinitions()
							.get(index)
							.override()
							.boundingBox()
							.elementReferences()
						).stream().map(e -> new TypedElementReferenceWrapper(e)).toList();
					}
				)
			)
		);
	}

	private References getValidationReferences(
		@NonNull DocumentV2 document,
		@NonNull PartiallyKnownDocumentMultiPointer errorEntityInstance
	) throws Exception {
		var fieldPath = errorEntityInstance.fullName();
		var indices = errorEntityInstance.repetitionIndexes();

		var matchingKey = validationPathHandlerMap
			.keySet()
			.stream()
			.filter(fieldPath::startsWith)
			.findFirst()
			.orElse(null);

		if (matchingKey == null) {
			throw new Exception("Cannot get references during executing validation rule print_ElementReferenceOverlapped");
		}

		var handler = validationPathHandlerMap.get(matchingKey);

		var references = handler.getReferences.getReferences(document, indices.get(handler.containerIndex));

		var currentReference =  references.get(indices.get(handler.referenceIndex) - 1);
		return new References(references, currentReference);
	}

	private boolean isElementReferenceOverlapped(TypedElementReferenceWrapper reference1, TypedElementReferenceWrapper reference2) throws Exception {
		try {
			var x1 = reference1.getPositionX();
			var minWidth1 = reference1.getMinWidth();
			var x2 = reference2.getPositionX();
			var minWidth2 = reference2.getMinWidth();

			var y1 = reference1.getPositionY();
			var minHeight1 = reference1.getMinHeight();
			var marginBottom1  = reference1.getBottomMargin();
			var marginTop1  = reference1.getTopMargin();

			var y2 = reference2.getPositionY();
			var minHeight2 = reference2.getMinHeight();
			var marginBottom2  = reference2.getBottomMargin();
			var marginTop2  = reference2.getTopMargin();

			return (
				(x1.add(minWidth1).min(x2.add(minWidth2)).compareTo(x1.max(x2)) > 0)
					&&
					(
						y1.add(minHeight1).add(marginBottom1).min(y2.add(minHeight2).add(marginBottom2))
							.compareTo(
								y1.subtract(marginTop1).max(y2.subtract(marginTop2))
							) > 0
					)
			);
		} catch (Exception e) {
			throw new Exception("Couldn't access reference properties.");
		}
	}
}
