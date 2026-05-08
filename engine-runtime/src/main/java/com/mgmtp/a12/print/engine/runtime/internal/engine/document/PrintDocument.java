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
package com.mgmtp.a12.print.engine.runtime.internal.engine.document;

import com.mgmtp.a12.kernel.md.document.api.IEntityInstance;
import lombok.EqualsAndHashCode;
import lombok.NonNull;
import org.apache.commons.collections4.list.UnmodifiableList;

import java.util.Collection;
import java.util.List;

@EqualsAndHashCode(callSuper = true)
public class PrintDocument extends MutablePrintDocument {


	PrintDocument(@NonNull MutablePrintDocument sourceDocument) {
		super(sourceDocument.getDocumentModel(), new UnmodifiableList<>(sourceDocument.entities), null);
		sourceDocument.entities = List.of();
	}

	@Override
	public void setId(String id) {
		throw invalidMutation();
	}

	private UnsupportedOperationException invalidMutation() {
		return new UnsupportedOperationException("PrintDocument cannot be modified");
	}

	public PrintDocumentContext context() {
		return new PrintDocumentContext(this);
	}

	@Override
	public boolean addEntityInstance(IEntityInstance entityInstance) {
		throw invalidMutation();
	}

	@Override
	public boolean removeEntityInstance(IEntityInstance entityInstance) {
		throw invalidMutation();
	}

	@Override
	public boolean add(IEntityInstance entityInstance) {
		throw invalidMutation();
	}

	@Override
	public boolean remove(Object o) {
		throw invalidMutation();
	}

	@Override
	public boolean addAll(@NonNull Collection<? extends IEntityInstance> c) {
		throw invalidMutation();
	}

	@Override
	public boolean retainAll(@NonNull Collection<?> c) {
		throw invalidMutation();
	}

	@Override
	public boolean removeAll(@NonNull Collection<?> c) {
		throw invalidMutation();
	}

	@Override
	public void clear() {
		throw invalidMutation();
	}

}
