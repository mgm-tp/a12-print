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
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.documentinterchange.logicalstructure.PDStructureElement;
import org.apache.pdfbox.pdmodel.documentinterchange.taggedpdf.PDTableAttributeObject;

import java.util.ArrayList;
import java.util.List;

import static com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.base.AccessibilityUtils.getStructElement;
import static org.apache.pdfbox.pdmodel.documentinterchange.taggedpdf.PDTableAttributeObject.SCOPE_COLUMN;
import static org.apache.pdfbox.pdmodel.documentinterchange.taggedpdf.StandardStructureTypes.*;

public class GridRendererTagHandling {
	private final List<PDStructureElement> parentTreeElements = new ArrayList<>();
	private List<PDStructureElement> structureElements;

	private PDStructureElement tableHeadStructElement;
	private PDStructureElement tableBodyStructElement;

	private final boolean tagAsTable;
	private final PDPage page;

	public GridRendererTagHandling(boolean tagAsTable, PDPage page) {
		this.tagAsTable = tagAsTable;
		this.page = page;
		if (tagAsTable) {
			this.tableBodyStructElement = getStructElement(T_BODY, page);
		} else {
			this.structureElements = new ArrayList<>();
		}
	}

	public void tagHeader(List<AccessibilityData> accessibilityData) {
		PDStructureElement tableRowStructElement = null;
		for (final var entry: accessibilityData) {
			parentTreeElements.addAll(entry.getParentTreeElements());
			if (tagAsTable) {
				if (tableHeadStructElement == null) {
					tableHeadStructElement = getStructElement(T_HEAD, page);
				}
				final var thStructElement = getStructElement(TH, page);
				final var attribute = new PDTableAttributeObject();
				attribute.setScope(SCOPE_COLUMN);
				thStructElement.addAttribute(attribute);

				for (final var headerStructElement : entry.getParentTreeElements()) {
					thStructElement.appendKid(headerStructElement);
				}

				if (tableRowStructElement == null) {
					tableRowStructElement = getStructElement(TR, page);
				}

				tableRowStructElement.appendKid(thStructElement);
			} else {
				assert this.structureElements != null;
				this.structureElements.addAll(entry.getStructureElements());
			}
		}
		if (tableHeadStructElement != null) {
			assert tableRowStructElement != null;
			tableHeadStructElement.appendKid(tableRowStructElement);
		}
	}

	public void tagContent(List<Pair<Integer, AccessibilityData>> accessibilityData) {
		PDStructureElement tableRowStructElement = null;
		for(final var entry: accessibilityData) {
			parentTreeElements.addAll(entry.getValue().getParentTreeElements());

			if (tagAsTable) {
				final var tdStructElement = getStructElement(TD, page);
				for (final var bodyStructElement : entry.getValue().getParentTreeElements()) {
					tdStructElement.appendKid(bodyStructElement);
				}
				if (entry.getKey() != 1) {
					final var attribute = new PDTableAttributeObject();
					attribute.setColSpan(entry.getKey());
					tdStructElement.addAttribute(attribute);
				}
				if (tableRowStructElement == null) {
					tableRowStructElement = getStructElement(TR, page);
				}
				tableRowStructElement.appendKid(tdStructElement);
			} else {
				assert this.structureElements != null;
				this.structureElements.addAll(entry.getValue().getStructureElements());
			}
		}
		if (tableBodyStructElement != null) {
			assert tableRowStructElement != null;
			tableBodyStructElement.appendKid(tableRowStructElement);
		}
	}

	public AccessibilityData getAccessibilityResult() {
		List<PDStructureElement> resultStructureElements;
		if (tagAsTable) {
			final var tableStructElement = getStructElement(TABLE, page);
			if (tableHeadStructElement != null) {
				tableStructElement.appendKid(tableHeadStructElement);
			}
			assert tableBodyStructElement != null;
			tableStructElement.appendKid(tableBodyStructElement);
			resultStructureElements = List.of(tableStructElement);
		} else {
			assert structureElements != null;
			resultStructureElements = structureElements;
		}

		return new AccessibilityData(resultStructureElements, parentTreeElements);
	}
}
