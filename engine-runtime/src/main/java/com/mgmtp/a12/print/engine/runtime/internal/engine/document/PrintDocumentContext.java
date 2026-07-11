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

import com.mgmtp.a12.kernel.md.document.apiV2.DocumentMultiPointer;
import com.mgmtp.a12.kernel.md.document.apiV2.DocumentPointer;
import com.mgmtp.a12.kernel.md.document.apiV2.PathPart;
import com.mgmtp.a12.kernel.md.document.apiV2.immutable.DocumentV2;
import com.mgmtp.a12.kernel.md.document.apiV2.immutable.FieldInstanceV2;
import com.mgmtp.a12.kernel.md.document.apiV2.immutable.GroupInstanceV2;
import com.mgmtp.a12.kernel.md.document.apiV2.immutable.utils.IDocumentV2Visitor;
import com.mgmtp.a12.kernel.md.document.apiV2.utils.DocumentV2Utils;
import com.mgmtp.a12.kernel.md.model.api.IElement;
import com.mgmtp.a12.kernel.md.model.api.IField;
import com.mgmtp.a12.kernel.md.model.api.IGroup;
import com.mgmtp.a12.kernel.md.model.api.IIdNamed;
import com.mgmtp.a12.print.engine.api.exception.impl.PrintDomainException;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.ComputationParser;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.DocumentModelIndex;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.KernelElementUtils;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.ReferenceSegment;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.Variable;
import lombok.AllArgsConstructor;
import lombok.NonNull;
import lombok.Value;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

import static java.util.Map.Entry.comparingByKey;

@Value
@AllArgsConstructor
@Slf4j
public class PrintDocumentContext {

	@NonNull
	DocumentV2 document;
	@NonNull
	DocumentPointer documentPointer;
	@NonNull
	DocumentModelIndex documentModelIndex;
	@NonNull
	String documentModelId;

	public PrintDocumentContext(
		@NonNull DocumentV2 document,
		@NonNull DocumentModelIndex documentModelIndex,
		@NonNull String documentModelId
	) {
		this.documentPointer = DocumentPointer.of(new ArrayList<>());
		this.documentModelIndex = documentModelIndex;
		this.documentModelId = documentModelId;
		this.document = document;
	}

	public PrintDocumentContext ofParent() {
		return new PrintDocumentContext(document, documentPointer.parent(), documentModelIndex, documentModelId);
	}

	private PrintDocumentContext withNewPointer(DocumentPointer subGroupPointer) {
		return new PrintDocumentContext(document, subGroupPointer, documentModelIndex, documentModelId);
	}

	public DocumentModelIndex getDocumentModel() {
		return documentModelIndex;
	}

	private Variable expectNoneEmpty(String path) {
		var variable = ComputationParser.variable(path);
		if (variable.getSegments().length == 0) {
			throw new IllegalArgumentException("there are no repetitions for empty path");
		}
		return variable;
	}

	public int findMaxRepetitionOfParent(IElement element, boolean wildcardOnPointerEqual) {
		return ofParent().findMaxRepetition(element.getParent(), wildcardOnPointerEqual);
	}

	public int findMaxRepetition(IElement element, boolean wildcardOnEqual) {
		final var pathElements = KernelElementUtils.getPath(element);
		final var path = StringUtils.join(pathElements.stream().map(IIdNamed::getName).toList(), "/");

		return pathToPointer(path, (updatedPointer, newElementIndex) -> {
			if (pathElements.getLast() instanceof IGroup) {
				return newElementIndex == null && !wildcardOnEqual
					? 1
					: DocumentV2Utils.getGroupInstances(document, getNewElementsWildcardPointer(
						updatedPointer,
						updatedPointer.size() - 1
					)).size();
			} else if (pathElements.getLast() instanceof IField) {
				final var searchedField = document.field(updatedPointer);
				return searchedField != null ? 1 : 0;
			} else {
				throw new IllegalArgumentException("unsupported element type");
			}
		});
	}

	public Stream<PrintDocumentContext> findRepetitions(String path) {
		return pathToPointer(path, this::findRepetitions);
	}

	private DocumentPointer convertToDocumentPointer(ReferenceSegment[] segments) {
		return DocumentPointer.of(Arrays.stream(segments)
			.map(p -> PathPart.of(p.getLabel(), 1))
			.toList());
	}

	private Stream<PrintDocumentContext> findRepetitions(DocumentPointer documentPointer, Integer newElementIndex) {
		return DocumentV2Utils.getGroupInstances(document, getNewElementsWildcardPointer(documentPointer, newElementIndex))
			.stream()
			.sorted(comparingByKey())
			.map(groupInstance ->
				withNewPointer(groupInstance.getKey())
			);
	}

	public Stream<Entity<?>> findInstancesContext(String path) {
		return pathToPointer(path, this::getInstancesContext);
	}

	private Stream<Entity<?>> getInstancesContext(DocumentPointer pointer, Integer newElementIndex) {
		final var entities = new ArrayList<Entity<?>>();
		final var groups = DocumentV2Utils.getGroupInstances(
			document,
			getNewElementsWildcardPointer(pointer, newElementIndex)
		);
		for (var groupInstance : groups) {
			final var currentGroupPointer = groupInstance.getKey();
			entities.add(new Entity<>(groupInstance.getValue(), withNewPointer(currentGroupPointer)));
			groupInstance.getValue().traverse(new IDocumentV2Visitor() {
				@Override
				public DescendType visitGroup(DocumentPointer pointerRelativeToBase, GroupInstanceV2 group) {
					if (pointerRelativeToBase.size() > 0) {
						entities.add(new Entity<>(group, withNewPointer(currentGroupPointer.withConcatenated(pointerRelativeToBase))));
					}
					return IDocumentV2Visitor.super.visitGroup(pointerRelativeToBase, group);
				}

				@Override
				public void visitField(DocumentPointer pointerRelativeToBase, FieldInstanceV2 field) {
					entities.add(new Entity<>(field, withNewPointer(currentGroupPointer.withConcatenated(pointerRelativeToBase))));
					IDocumentV2Visitor.super.visitField(pointerRelativeToBase, field);
				}
			});
		}
		return entities.stream();
	}

	private DocumentMultiPointer getNewElementsWildcardPointer(DocumentPointer pointer, Integer newElementIndex) {
		if (newElementIndex == null) {
			return DocumentMultiPointer.of(pointer);
		}

		final var pathPartsWithWildcards = new ArrayList<PathPart>();
		for(var i = 0; i < pointer.getPathParts().size(); i++) {
			if (i < newElementIndex) {
				pathPartsWithWildcards.add(pointer.getPathParts().get(i));
			} else {
				pathPartsWithWildcards.add(
					PathPart.of(pointer.getPathParts().get(i).name(), DocumentMultiPointer.WILDCARD)
				);
			}
		}
		return DocumentMultiPointer.of(pathPartsWithWildcards);
	}

	public Optional<Entity<FieldInstanceV2>> findSingleFieldInstance(String path, boolean pathIsRelative, boolean preventRepeatableContextError) {
		final var pathElements = expectNoneEmpty(path).getSegments();

		if (pathIsRelative) {
			final var updatedPointer = documentPointer.withConcatenated(convertToDocumentPointer(pathElements));
			return getFieldInstanceResult(updatedPointer, updatedPointer.size() - 1, preventRepeatableContextError);
		}

		return pathToPointer(pathElements, (updatedPointer, newElementIndex) ->
			getFieldInstanceResult(updatedPointer, newElementIndex, preventRepeatableContextError)
		);
	}

	private Optional<Entity<FieldInstanceV2>> getFieldInstanceResult(@NonNull DocumentPointer subPointer, Integer newElementIndex, boolean preventRepeatableContextError) {
		final var fieldInstances = DocumentV2Utils.getFieldInstances(
			document,
			getNewElementsWildcardPointer(subPointer, newElementIndex)
		);
		if (fieldInstances.size() > 1) {
			if (preventRepeatableContextError) {
				// This is only needed in case a repeatable synthetic field is requested as bycatch
				log.debug("Multiple field instances found for path: {}", subPointer);
				return Optional.empty();
			}
			throw new PrintDomainException(
				"There are multiple values for the path {} but only one value is expected", subPointer.fullName()
			);
		}
		if (fieldInstances.isEmpty()) {
			return Optional.empty();
		}
		return Optional.of(new Entity<>(fieldInstances.iterator().next().getValue(), withNewPointer(subPointer)));
	}

	public Optional<Entity<FieldInstanceV2>> findSingleFieldInstance(String path) {
		return findSingleFieldInstance(path, false, false);
	}

	public Optional<Entity<FieldInstanceV2>> findSingleFieldInstance(String path, boolean pathIsRelative) {
		return findSingleFieldInstance(path, pathIsRelative, false);
	}

	public List<Integer> findRepetitionPrefix(Variable prefix) {
		return pathToPointer(prefix, (updatedPointer, newElementIndex) ->
			updatedPointer.repetitionIndexes()
		);
	}

	@FunctionalInterface
	private interface PathHandler<T> {
		T provide(DocumentPointer updatedPointer, Integer newElementIndex);
	}

	<T> T pathToPointer(String path, PathHandler<T> pathHandler) {
		return pathToPointer(expectNoneEmpty(path), pathHandler);
	}

	<T> T pathToPointer(Variable variable, PathHandler<T> pathHandler) {
		return pathToPointer(variable.getSegments(), pathHandler);
	}

	<T> T pathToPointer(ReferenceSegment[] pathElements, PathHandler<T> pathHandler) {
		final var newPathParts = new ArrayList<PathPart>();
		Integer newElementIndex = null;
		for (var i = 0; i < pathElements.length; i++) {
			final var currentPathElement = pathElements[i];
			final var documentPointerPathElement = i < documentPointer.getPathParts().size()
				? documentPointer.getPathParts().get(i)
				: null;

			if (documentPointerPathElement != null && currentPathElement.getLabel().equals(documentPointerPathElement.name())) {
				newPathParts.add(documentPointerPathElement);
			} else {
				if (newElementIndex == null) {
					newElementIndex = i;
				}
				newPathParts.add(PathPart.of(currentPathElement.getLabel(), 1));
			}
		}

		final var newPointer = DocumentPointer.of(newPathParts);
		return pathHandler.provide(newPointer, newElementIndex);
	}
}
