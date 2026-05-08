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
package com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.tableLayout;

import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.runtime.internal.CoreDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.referenceResolver.ReferenceElementDependency;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalCorePrintEngineRuntime;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.element.base.Styleable;
import com.mgmtp.a12.print.model.api.model.element.type.tableLayout.IndexedProperties;
import com.mgmtp.a12.print.model.api.model.element.type.tableLayout.TableLayout;
import com.mgmtp.a12.print.model.api.model.reference.TableLayoutCellReference;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;


@Slf4j
public class TableLayoutValuesDependencyValueProducer implements CoreDependencyValueProvider<List<TableLayoutRow>, TableLayoutValuesDependency> {
	private Optional<PrintModelTreeTrace<TableLayoutCellReference>> getReferenceByCoordinate(
		PrintModelTreeTrace<TableLayout> parent,
		List<TableLayoutCellReference> references,
		int row,
		int col
	) {
		return references.stream()
			.filter(ref -> ref.getColumn().equals(col) && ref.getRow().equals(row))
			.map(parent::createDescendent)
			.findFirst();
	}

	private <T extends IndexedProperties> Optional<T> getPropertiesByIndex(
		List<T> propertiesList,
		final int row
	) {
		return propertiesList.stream()
			.filter(props -> props.getIndex().equals(row + 1))
			.findFirst();
	}

	@Override
	public ValueFactory<List<TableLayoutRow>> produce(TableLayoutValuesDependency dependency, PrintJob job, PrintEngine<?> engine, InternalCorePrintEngineRuntime runtime) {
		final var tableLayout = dependency.getTableLayout();
		final var cellContentProvider = dependency.getContentProvider();
		final var tableLayoutProperties = tableLayout.getTracedElement().getTableLayoutProperties();
		final var references = tableLayout.getTracedElement().getReferences();
		final var columnProperties = tableLayoutProperties.getColumnProperties();
		final var rowProperties = tableLayoutProperties.getRowProperties();

		var rows = new ArrayList<TableLayoutRow>();
		for (int i = 0; i < tableLayoutProperties.getRowCount(); i++) {
			var cells = new ArrayList<TableLayoutRowElement>();
			for (int j = 0; j < tableLayoutProperties.getColumnCount(); j++) {
				final var columnProps = getPropertiesByIndex(columnProperties, j).orElse(null);
				final var cell = getReferenceByCoordinate(tableLayout, references, i, j).map(ref -> {
					final var content = cellContentProvider.provideCellContent(ref);
					final var borderProperties = runtime.provide(new ReferenceElementDependency(ref)).get()
						.flatMap(el -> el.tryCastTracedElement(Styleable.class))
						.flatMap(el -> el.getTracedElement().getBorderProperties())
						.orElse(null);
					return new TableLayoutRowElement(content, borderProperties, columnProps);
				}).orElse(new TableLayoutRowElement(columnProps));
				cells.add(cell);
			}
			rows.add(new TableLayoutRow(cells, getPropertiesByIndex(rowProperties, i).orElse(null)));
		}
		return () -> rows;
	}


}
