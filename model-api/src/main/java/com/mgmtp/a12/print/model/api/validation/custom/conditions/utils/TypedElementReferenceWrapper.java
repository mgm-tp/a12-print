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
package com.mgmtp.a12.print.model.api.validation.custom.conditions.utils;

import com.mgmtp.a12.print.model.api.domain.typings.views._domainprintmetamodel._content._segments._definitions.ElementReferences;

import java.math.BigDecimal;
import java.util.function.Supplier;

public record TypedElementReferenceWrapper(Object delegate) implements TypedElementReference {

	@Override
	public String getId() {
		String id = null;

		if (delegate instanceof ElementReferences ref) {
			id = ref.id();
		} else if (delegate instanceof com.mgmtp.a12.print.model.api.domain.typings.views._domainprintmetamodel._content._sections._definitions.ElementReferences ref) {
			id = ref.id();
		} else if (delegate instanceof com.mgmtp.a12.print.model.api.domain.typings.views._domainprintmetamodel._content._watermarks._definitions.ElementReferences ref) {
			id = ref.id();
		} else if (delegate instanceof com.mgmtp.a12.print.model.api.domain.typings.views._domainprintmetamodel._content._elementdefinitions._boundingbox.ElementReferences ref) {
			id = ref.id();
		} else if (delegate instanceof com.mgmtp.a12.print.model.api.domain.typings.views._domainprintmetamodel._content._elementdefinitions._override._boundingbox.ElementReferences ref) {
			id = ref.id();
		} else if (delegate instanceof com.mgmtp.a12.print.model.api.domain.typings.views._domainprintmetamodel._content._elementdefinitions._area.ElementReferences ref) {
			id = ref.id();
		}
		if (id == null) {
			throw new IllegalArgumentException("ElementReference id is null or unknown ElementReference type");
		}
		return id;
	}

	@Override
	public BigDecimal getMinHeight() {
		return getSafe(() -> {
			if (delegate instanceof ElementReferences ref) return ref.dimensions().minHeight().value();
			if (delegate instanceof com.mgmtp.a12.print.model.api.domain.typings.views._domainprintmetamodel._content._sections._definitions.ElementReferences ref) return ref.dimensions().minHeight().value();
			if (delegate instanceof com.mgmtp.a12.print.model.api.domain.typings.views._domainprintmetamodel._content._watermarks._definitions.ElementReferences ref) return ref.dimensions().minHeight().value();
			if (delegate instanceof com.mgmtp.a12.print.model.api.domain.typings.views._domainprintmetamodel._content._elementdefinitions._boundingbox.ElementReferences ref) return ref.dimensions().minHeight().value();
			if (delegate instanceof com.mgmtp.a12.print.model.api.domain.typings.views._domainprintmetamodel._content._elementdefinitions._override._boundingbox.ElementReferences ref) return ref.dimensions().minHeight().value();
			if (delegate instanceof com.mgmtp.a12.print.model.api.domain.typings.views._domainprintmetamodel._content._elementdefinitions._area.ElementReferences ref) return ref.dimensions().minHeight().value();
			return null;
		});
	}

	@Override
	public BigDecimal getMinWidth() {
		return getSafe(() -> {
			if (delegate instanceof ElementReferences ref) return ref.dimensions().minWidth().value();
			if (delegate instanceof com.mgmtp.a12.print.model.api.domain.typings.views._domainprintmetamodel._content._sections._definitions.ElementReferences ref) return ref.dimensions().minWidth().value();
			if (delegate instanceof com.mgmtp.a12.print.model.api.domain.typings.views._domainprintmetamodel._content._watermarks._definitions.ElementReferences ref) return ref.dimensions().minWidth().value();
			if (delegate instanceof com.mgmtp.a12.print.model.api.domain.typings.views._domainprintmetamodel._content._elementdefinitions._boundingbox.ElementReferences ref) return ref.dimensions().minWidth().value();
			if (delegate instanceof com.mgmtp.a12.print.model.api.domain.typings.views._domainprintmetamodel._content._elementdefinitions._override._boundingbox.ElementReferences ref) return ref.dimensions().minWidth().value();
			if (delegate instanceof com.mgmtp.a12.print.model.api.domain.typings.views._domainprintmetamodel._content._elementdefinitions._area.ElementReferences ref) return ref.dimensions().minWidth().value();
			return null;
		});
	}

	@Override
	public BigDecimal getTopMargin() {
		return getSafe(() -> {
			if (delegate instanceof ElementReferences ref) return ref.margins().top().margin().value();
			if (delegate instanceof com.mgmtp.a12.print.model.api.domain.typings.views._domainprintmetamodel._content._sections._definitions.ElementReferences ref) return ref.margins().top().margin().value();
			if (delegate instanceof com.mgmtp.a12.print.model.api.domain.typings.views._domainprintmetamodel._content._watermarks._definitions.ElementReferences ref) return ref.margins().top().margin().value();
			if (delegate instanceof com.mgmtp.a12.print.model.api.domain.typings.views._domainprintmetamodel._content._elementdefinitions._boundingbox.ElementReferences ref) return ref.margins().top().margin().value();
			if (delegate instanceof com.mgmtp.a12.print.model.api.domain.typings.views._domainprintmetamodel._content._elementdefinitions._override._boundingbox.ElementReferences ref) return ref.margins().top().margin().value();
			if (delegate instanceof com.mgmtp.a12.print.model.api.domain.typings.views._domainprintmetamodel._content._elementdefinitions._area.ElementReferences ref) return ref.margins().top().margin().value();
			return null;
		});
	}

	@Override
	public BigDecimal getBottomMargin() {
		return getSafe(() -> {
			if (delegate instanceof ElementReferences ref) return ref.margins().bottom().margin().value();
			if (delegate instanceof com.mgmtp.a12.print.model.api.domain.typings.views._domainprintmetamodel._content._sections._definitions.ElementReferences ref) return ref.margins().bottom().margin().value();
			if (delegate instanceof com.mgmtp.a12.print.model.api.domain.typings.views._domainprintmetamodel._content._watermarks._definitions.ElementReferences ref) return ref.margins().bottom().margin().value();
			if (delegate instanceof com.mgmtp.a12.print.model.api.domain.typings.views._domainprintmetamodel._content._elementdefinitions._boundingbox.ElementReferences ref) return ref.margins().bottom().margin().value();
			if (delegate instanceof com.mgmtp.a12.print.model.api.domain.typings.views._domainprintmetamodel._content._elementdefinitions._override._boundingbox.ElementReferences ref) return ref.margins().bottom().margin().value();
			if (delegate instanceof com.mgmtp.a12.print.model.api.domain.typings.views._domainprintmetamodel._content._elementdefinitions._area.ElementReferences ref) return ref.margins().bottom().margin().value();
			return null;
		});
	}

	@Override
	public BigDecimal getPositionX() {
		return getSafe(() -> {
			if (delegate instanceof ElementReferences ref) return ref.position().x().value();
			if (delegate instanceof com.mgmtp.a12.print.model.api.domain.typings.views._domainprintmetamodel._content._sections._definitions.ElementReferences ref) return ref.position().x().value();
			if (delegate instanceof com.mgmtp.a12.print.model.api.domain.typings.views._domainprintmetamodel._content._watermarks._definitions.ElementReferences ref) return ref.position().x().value();
			if (delegate instanceof com.mgmtp.a12.print.model.api.domain.typings.views._domainprintmetamodel._content._elementdefinitions._boundingbox.ElementReferences ref) return ref.position().x().value();
			if (delegate instanceof com.mgmtp.a12.print.model.api.domain.typings.views._domainprintmetamodel._content._elementdefinitions._override._boundingbox.ElementReferences ref) return ref.position().x().value();
			if (delegate instanceof com.mgmtp.a12.print.model.api.domain.typings.views._domainprintmetamodel._content._elementdefinitions._area.ElementReferences ref) return ref.position().x().value();
			return null;
		});
	}

	@Override
	public BigDecimal getPositionY() {
		return getSafe(() -> {
			if (delegate instanceof ElementReferences ref) return ref.position().y().value();
			if (delegate instanceof com.mgmtp.a12.print.model.api.domain.typings.views._domainprintmetamodel._content._sections._definitions.ElementReferences ref) return ref.position().y().value();
			if (delegate instanceof com.mgmtp.a12.print.model.api.domain.typings.views._domainprintmetamodel._content._watermarks._definitions.ElementReferences ref) return ref.position().y().value();
			if (delegate instanceof com.mgmtp.a12.print.model.api.domain.typings.views._domainprintmetamodel._content._elementdefinitions._boundingbox.ElementReferences ref) return ref.position().y().value();
			if (delegate instanceof com.mgmtp.a12.print.model.api.domain.typings.views._domainprintmetamodel._content._elementdefinitions._override._boundingbox.ElementReferences ref) return ref.position().y().value();
			if (delegate instanceof com.mgmtp.a12.print.model.api.domain.typings.views._domainprintmetamodel._content._elementdefinitions._area.ElementReferences ref) return ref.position().y().value();
			return null;
		});
	}

	// Helper for null safety and defaulting
	private static BigDecimal getSafe(Supplier<BigDecimal> supplier) {
		try {
			BigDecimal value = supplier.get();
			return value != null ? value : BigDecimal.ZERO;
		} catch (NullPointerException e) {
			return BigDecimal.ZERO;
		}
	}
}
