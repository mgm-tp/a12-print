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
package com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.table;

import com.mgmtp.a12.print.engine.runtime.internal.PrintEngineRuntimeDependency;
import com.mgmtp.a12.print.engine.runtime.internal.RuntimeType;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.ValueDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.PrintDocumentContext;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.element.PrintModelElement;
import com.mgmtp.a12.print.model.api.model.element.type.table.Table;
import com.mgmtp.a12.print.model.api.model.reference.TableColumnReference;
import com.mgmtp.a12.print.model.document.internal.base.IContentHolder;
import com.mgmtp.a12.print.model.document.internal.element.table.TableSumCellType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NonNull;

import java.util.Collection;
import java.util.List;
import java.util.Optional;


@Data
@AllArgsConstructor
@PrintEngineRuntimeDependency(type = RuntimeType.CORE)
public class TableValuesDependency implements ValueDependency<TableValueResult> {
	private final PrintModelTreeTrace<Table> table;
	private final PrintDocumentContext printDocumentContext;
	private final RowContentProvider streamContentProvider;
	private final SumValueContentProvider sumValueContentProvider;

	@FunctionalInterface
	public interface RowContentProvider {
		List<IContentHolder> provideRowContent(
			@NonNull final PrintDocumentContext subRange,
			@NonNull final Collection<TableColumnReference> references
		);
	}

	@FunctionalInterface
	public interface SumValueContentProvider {
		IContentHolder provideSumValue(
			@NonNull final PrintModelTreeTrace<PrintModelElement> printModelTreeTrace,
			@NonNull ValueFactory<Optional<String>> value,
			@NonNull final TableSumCellType tableSumCellType
		);
	}
}
