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
package com.mgmtp.a12.print.model.api.walker.model;

import com.google.common.collect.ImmutableList;
import com.mgmtp.a12.print.model.api.model.PrintModel;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.container.TopLevelReferenceContainer;
import com.mgmtp.a12.print.model.api.model.element.PrintModelElement;
import com.mgmtp.a12.print.model.api.model.path.PrintModelPathElement;
import com.mgmtp.a12.print.model.api.model.reference.ElementReference;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.function.BiFunction;
import java.util.function.Predicate;
import java.util.stream.Collectors;

/**
 * Path object that allows {@link PrintModel} traversal.
 * Typically created with {@link #create(PrintModel)} and then extended by {@link #with(PrintModelPathElement, int)}.
 */
public class PrintModelPath implements PrintModelPathElement {

	private final List<PathElement> parents;


	private PrintModelPath(final List<PathElement> parents) {
		this.parents = parents;
	}

	/**
	 * @return A new {@link PrintModelPath} with the {@link PrintModel} as its root.
	 */
	public static PrintModelPath create(PrintModel root) {
		return new PrintModelPath(List.of(new PathElement(root, 0)));
	}

	/**
	 * @return All {@link PathElement}s in the path above the current level.
	 */
	public ImmutableList<PathElement> getParents() {
		return ImmutableList.copyOf(parents);
	}

	/**
	 * @return The direct {@link PathElement} above the current level. Empty if the current {@link PathElement} is the root.
	 */
	public Optional<PathElement> getDirectParent() {
		if (parents.size() > 0) {
			return Optional.ofNullable(parents.get(parents.size() - 1));
		}
		return Optional.empty();
	}

	/**
	 * @return An {@link ElementReference} from the path referencing the given id, matched by refId.
	 */
	public Optional<PrintModelTreeTrace<ElementReference>> findReferenceCallSite(@NonNull String id) {
		return findReferenceCallSite(id, true);
	}

	/**
	 * @return An {@link ElementReference} from the path referencing the given id, matched by refId or id.
	 */
	public Optional<PrintModelTreeTrace<ElementReference>> findReferenceCallSite(@NonNull String id, boolean useRefId) {
		return findParentPath(
			false,
			(a, e) ->
				e.getElement() instanceof ElementReference
					&&
					id.equals(
						useRefId
							? ((ElementReference) e.getElement()).getRefId()
							: ((ElementReference) e.getElement()).getId()
					),
			s -> s
		).map(
			e -> new PrintModelTreeTrace<>(
				e.getPath(),
				(ElementReference) e.getTracedElement().getElement()
			)
		);
	}

	/**
	 * @return An {@link ElementReference} from the path referencing the given {@link PrintModelElement}.
	 */
	public Optional<PrintModelTreeTrace<ElementReference>> findReferenceCallSite(@NonNull PrintModelElement printModelElement) {
		return findReferenceCallSite(printModelElement.getId());
	}

	/**
	 * Applies a function to each parent until the filter condition is met, or no parent is available.
	 * @param state The initial state to test.
	 * @param fold The function to apply to each parent.
	 * @param filter The filter condition that has to be met, to return a result.
	 */
	public <State> Optional<PrintModelTreeTrace<? extends PathElement>> findParentPath(
		State state,
		BiFunction<State, PathElement, State> fold,
		Predicate<State> filter
	) {
		for (var i = parents.size() - 1; i >= 0; i--) {
			final var current = parents.get(i);
			state = fold.apply(state, current);
			if (filter.test(state)) {
				var path = parents.stream().limit(Math.max(0, i - 1)).collect(Collectors.toList());
				return Optional.of(new PrintModelTreeTrace<>(
					new PrintModelPath(path),
					current
				));
			}
		}
		return Optional.empty();
	}

	/**
	 * @return A new {@link PrintModelPath} that extends this path by the provided element and index.
	 */
	public PrintModelPath with(final PrintModelPathElement parent, final int index) {
		return new PrintModelPath(ImmutableList.<PathElement> builder().addAll(parents).add(
			new PathElement(parent, index)
		).build());
	}

	/**
	 * @return A new {@link PrintModelPath} that extends this path by the provided path.
	 */
	public PrintModelPath with(final PrintModelPath path) {
		return new PrintModelPath(ImmutableList.<PathElement> builder().addAll(parents).addAll(
			path.getParents()
		).build());
	}

	/**
	 * @return A new {@link PrintModelPath} that points to the direct parent of this parent.
	 */
	public Optional<PrintModelPath> getPathToParent() {
		if (parents.isEmpty()) {
			return Optional.empty();
		}
		var pathElements = new ArrayList<>(parents);
		pathElements.remove(pathElements.size() - 1);
		return Optional.of(new PrintModelPath(pathElements));
	}

	/**
	 * An element referencing a specific {@link PrintModelPathElement} with an index.
	 */
	@RequiredArgsConstructor
	@Getter
	@EqualsAndHashCode
	public static class PathElement {
		private final PrintModelPathElement element;
		private final int index;
	}

	/**
	 * @return The first {@link PrintModel} from the path.
	 */
	public Optional<PrintModelTreeTrace<PrintModel>> findPrintModel() {
		return findParentPath(
			false,
			(a, e) -> e.getElement() instanceof PrintModel,
			s -> s
		).map(e -> new PrintModelTreeTrace<>(
			e.getPath(),
			(PrintModel) e.getTracedElement().getElement()
		));
	}

	/**
	 * @return The first {@link TopLevelReferenceContainer} from the path.
	 */
	public Optional<PrintModelTreeTrace<TopLevelReferenceContainer>> findParentTopLevelReferenceContainer() {
		return findParentPath(
			false,
			(a, e) -> e.getElement() instanceof TopLevelReferenceContainer,
			s -> s
		).map(
			e -> new PrintModelTreeTrace<>(
				e.getPath(),
				(TopLevelReferenceContainer) e.getTracedElement().getElement()
			)
		);
	}
}
