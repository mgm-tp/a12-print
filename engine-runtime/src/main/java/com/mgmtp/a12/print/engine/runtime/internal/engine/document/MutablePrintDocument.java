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

import com.mgmtp.a12.kernel.md.document.api.IDocument;
import com.mgmtp.a12.kernel.md.document.api.IEntityInstance;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.index.PrintDocumentIndex;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.eval.kernel.ComputedDocument;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.DocumentModelIndex;
import lombok.*;

import java.util.*;

@EqualsAndHashCode
@AllArgsConstructor(access = AccessLevel.PROTECTED)
public class MutablePrintDocument implements IDocument, Set<IEntityInstance> {

	@NonNull
	protected final DocumentModelIndex model;

	public static final char PATH_DELIMITER = '/';

	@NonNull
	protected List<IEntityInstance> entities;

	private String id;

	protected DocumentModelIndex getDocumentModel() {
		return model;
	}

	@Override
	public Optional<String> getId() {
		return Optional.ofNullable(id);
	}

	@Override
	public void setId(String id) {
		this.id = id;
	}

	@Override
	public @NonNull String getDocumentModelId() {
		return model.getHeader().getId();
	}

	@Override
	public Set<IEntityInstance> getEntityInstances() {
		return this;
	}

	@Override
	public boolean addEntityInstance(IEntityInstance entityInstance) {
		final var slot = PrintDocumentIndex.find(entityInstance, entities);
		if (!slot.isExisting()) {
			entities.add(slot.getElementIndex(), entityInstance);
		}
		return slot.isExisting();
	}

	@Override
	public boolean removeEntityInstance(IEntityInstance entityInstance) {
		final var slot = PrintDocumentIndex.find(entityInstance, entities);
		if (slot.isExisting()) {
			entities.remove(slot.getElementIndex());
		}
		return slot.isExisting();
	}

	@Override
	public int size() {
		return entities.size();
	}

	@Override
	public boolean isEmpty() {
		return entities.isEmpty();
	}

	@Override
	public boolean contains(Object o) {
		if (o instanceof IEntityInstance) {
			return PrintDocumentIndex.find((IEntityInstance) o, entities).isExisting();
		} else {
			return false;
		}
	}

	@Override
	public Iterator<IEntityInstance> iterator() {
		return entities.iterator();
	}

	@Override
	public Object[] toArray() {
		return entities.toArray();
	}

	@Override
	public <T> T[] toArray(T @NonNull [] a) {
		return entities.toArray(a);
	}

	@Override
	public boolean add(IEntityInstance iEntityInstance) {
		return addEntityInstance(iEntityInstance);
	}

	@Override
	public boolean remove(Object o) {
		if (o instanceof IEntityInstance) {
			return removeEntityInstance((IEntityInstance) o);
		} else {
			return false;
		}
	}

	@Override
	public boolean containsAll(@NonNull Collection<?> c) {
		return c.stream().allMatch(this::contains);
	}

	@Override
	public boolean addAll(@NonNull Collection<? extends IEntityInstance> c) {
		return c.stream().reduce(true, (a,instance) -> addEntityInstance(instance), (a,b) -> a || b);
	}

	@Override
	public boolean retainAll(@NonNull Collection<?> c) {
		return entities.retainAll(c);
	}

	@Override
	public boolean removeAll(@NonNull Collection<?> c) {
		return entities.removeAll(c);
	}

	@Override
	public void clear() {
		entities.clear();
	}

	/**
	 * Creates a shallow copy of this document into the ImmutablePrintDocument.
	 * The current Document is then set immutable by having its storage swapped with empty UnmodifiableList.
	 *
	 * @return the immutable print document
	 */
	public PrintDocument setImmutable() {
		return new PrintDocument(this);
	}

	public static MutablePrintDocument from(IDocument document, DocumentModelIndex documentModel){
		final var entities = new ArrayList<>(document.getEntityInstances());
		entities.sort(PrintDocumentIndex::compare);
		entities.trimToSize();
		final var result = new MutablePrintDocument(documentModel, entities, null);
		document.getId().ifPresent(result::setId);
		return result;
	}

}
