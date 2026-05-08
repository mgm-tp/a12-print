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
import com.mgmtp.a12.print.model.api.domain.typings.views._domainprintmetamodel._content._elementdefinitions._listing.Columns;
import lombok.NonNull;

import java.util.*;

public class OnlyOneIsSortingColumn implements ICustomCondition {

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
		var listingIndex = errorEntityInstance.repetitionIndexes().get(1);
		DomainPrintMetaModel domainPrintMetaModel = DomainPrintMetaModel._viewOf(document);
		var columns = domainPrintMetaModel._at(
			DomainPrintMetaModel._pointer().content().elementDefinitions().get(listingIndex).listing().columns()
		);
		return columns.stream().filter(col -> Boolean.TRUE.equals(col.isSortingIndex())).count() > 1;
	}
}
