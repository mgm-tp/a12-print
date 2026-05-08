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
import com.mgmtp.a12.kernel.md.document.api.IFieldInstance;
import com.mgmtp.a12.kernel.md.model.api.IElement;
import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.index.PrintDocumentIndex;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.index.Repetition;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.ComputationParser;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.DocumentModelIndex;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.Variable;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.visitor.SyntaxTreeRenderer;
import lombok.Data;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

@RequiredArgsConstructor
public class PrintDocumentContext {

	@NonNull
	private final PrintDocument document;
	@NonNull
	private final List<Variable> variables;
	@NonNull
	private final List<RepetitionPrefix> repetitions;
	@NonNull
	private final List<List<IEntityInstance>> slices;
	private final int latestRestrictionIndex;
	private boolean allowImplicitRelativePaths;

	public PrintDocumentContext(@NonNull PrintDocument document) {
		this.document = document;
		slices = List.of();
		variables = List.of();
		repetitions = List.of();
		latestRestrictionIndex = -1;
	}

	private PrintDocumentContext(@NonNull PrintDocumentContext context, boolean allowImplicitRelativePaths) {
		document = context.document;
		slices = context.slices.subList(0, context.slices.size());
		variables = context.variables.subList(0, context.variables.size());
		repetitions = context.repetitions.subList(0, context.repetitions.size());
		latestRestrictionIndex = context.latestRestrictionIndex;
		this.allowImplicitRelativePaths = allowImplicitRelativePaths;

	}

	public int[][] getFlatRepetitions() {
		return repetitions.stream().map(rep ->
			rep.getRepetitions().stream().map(RepetitionRange::getStart).mapToInt(i -> i).toArray()
		).toArray(int[][]::new);
	}

	public int[] getCurrentMinimalRepetitions() {
		return !repetitions.isEmpty()
			? repetitions.get(latestRestrictionIndex).getMinimalRepetitionPath()
			: new int[0];
	}

	public DocumentModelIndex getDocumentModel() {
		return document.getDocumentModel();
	}

	private Variable expectNoneEmpty(String path) {
		var variable = ComputationParser.variable(path);
		if (variable.getSegments().length == 0) {
			throw new IllegalArgumentException("there are no repetitions for empty path");
		}
		return variable;
	}

	private PrintDocumentContextRestriction createRestrictionFor(Variable input) {

		if (!input.isAbsolute()) {
			if (allowImplicitRelativePaths && latestRestrictionIndex >= 0) {
				input = Variable.join(variables.get(latestRestrictionIndex), input);
			} else {
				throw new IllegalArgumentException("absolute variable required");
			}
		}

		final var variable = input;

		final var index = Collections.binarySearch(
			variables,
			variable,
			Variable::compareTo
		);

		if (index < 0) {
			final var longestPrefix = IntStream.range(0, variables.size())
											   .filter(i -> variables.get(i).isPrefixOf(variable))
											   .max();
			final var targetIndex = (index + 1) * -1;
			if (longestPrefix.isPresent()) {
				return PrintDocumentContextRestriction.broad(
					this,
					targetIndex,
					variable,
					repetitions.get(longestPrefix.getAsInt()).growFor(variable),
					slices.get(longestPrefix.getAsInt())
				);
			} else {
				return PrintDocumentContextRestriction.broad(
					this,
					targetIndex,
					variable,
					RepetitionPrefix.initialFor(variable),
					document.entities
				);
			}
		} else {
			return new PrintDocumentContextRestriction(
				new PrintDocumentContext(this, this.allowImplicitRelativePaths),
				slices.get(index),
				index
			);
		}
	}

	public PrintDocumentContext enableImplicitRelative() {
		return new PrintDocumentContext(this, true);
	}

	private PrintDocumentContextRestriction createRestrictionFor(String path) {
		return createRestrictionFor(expectNoneEmpty(path));
	}

	public int findMaxRepetition(IElement element) {
		return createRestrictionFor(Variable.absoluteDirectory(element))
			.apply()
			.getRepetitionPrefix()
			.getCurrentRepetition()
			.getMaximumRepetition();
	}

	public int findMaxRepetition(String searchPath) {
		return createRestrictionFor(expectNoneEmpty(searchPath))
			.apply()
			.getRepetitionPrefix()
			.getCurrentRepetition()
			.getMaximumRepetition();
	}

	public RepetitionRange findCurrentRepetition() {
		return repetitions.get(latestRestrictionIndex).getCurrentRepetition();
	}

	public Stream<PrintDocumentContext> findRepetitions(String path) {
		return StreamSupport.stream(Spliterators.spliteratorUnknownSize(
				new RepetitionIterator(createRestrictionFor(path).apply()),
				Spliterator.SORTED | Spliterator.DISTINCT | Spliterator.NONNULL | Spliterator.ORDERED
			),
			false
		);
	}

	public Stream<Entity<IEntityInstance>> findInstancesContext(String path) {
		final var restriction = createRestrictionFor(path).apply();
		return restriction.getResult().mapInstance(restriction.targetIndex);

	}

	private Stream<Entity<IEntityInstance>> mapInstance(int sliceIndex) {
		final var slice = slices.get(sliceIndex);
		return IntStream.range(0, slice.size()).mapToObj(i -> new Entity<>(i, sliceIndex, slice.get(i), this));
	}

	public Stream<Entity<IFieldInstance>> findFieldInstances(String path) {
		return findInstancesContext(path).flatMap(e -> e.asField().stream());
	}

	public Optional<Entity<IFieldInstance>> findSingleFieldInstance(String path) {
		final var instances = findFieldInstances(path).iterator();
		if (!instances.hasNext()) {
			return Optional.empty();
		}
		final var currentMinimalRepetitions = this.getCurrentMinimalRepetitions();
		Entity<IFieldInstance> matched = null;
		Entity<IFieldInstance> first = null;
		while(instances.hasNext()) {
			final var candidate = instances.next();
			if (first == null) {
				first = candidate;
			}
			if (currentMinimalRepetitions.length == 0 || compareRepetitions(currentMinimalRepetitions, candidate.getRepetitions())) {
				if (matched != null) {
					throw new PrintException("invalid State, expected to find only single fieldInstance");
				}
				matched = candidate;
			}
		}

		final var result = (matched != null) ? matched : first;
		assert result != null : "result cannot be null because the iterator had at least one element";

		if ((this.allowImplicitRelativePaths && result.getPath().endsWith(path)) || result.getPath().equals(path)) {
			return Optional.of(result);
		} else {
			return Optional.empty();
		}
	}

	private boolean compareRepetitions(int[] contextRepetitions, int[] instanceRepetitions) {
		int n = contextRepetitions.length;
		if (instanceRepetitions.length < n) return false;

		for (int i = 0; i < n; i++) {
			if (contextRepetitions[i] != instanceRepetitions[i]) return false;
		}
		return true;
	}

	public String getDocumentModelId() {
		return document.getDocumentModelId();
	}

	public List<IEntityInstance> getLatestSlice() {
		return latestRestrictionIndex >= 0 ? slices.get(latestRestrictionIndex) : List.of();
	}

	public Optional<RepetitionRange> findRepetitionPrefix(Variable prefix) {
		final var index = IntStream.range(0, variables.size())
								   .filter(e -> prefix.isPrefixOf(variables.get(e)))
								   .toArray();
		if (index.length == 0) {
			return Optional.empty();
		} else if (index.length > 1) {
			for (var i : index) {
				if (variables.get(i).getSegments().length == prefix.getSegments().length) {
					return Optional.of(repetitions.get(i).getCurrentRepetition());
				}
			}
			throw new PrintException("invalid State, expected to find only single repetition prefix");
		}

		return Optional.of(repetitions.get(index[0]).getCurrentRepetition());
	}

	@Data
	private static class PrintDocumentContextRestriction {
		@NonNull
		private final PrintDocumentContext result;

		private final List<IEntityInstance> filterBase;
		private int targetIndex;

		public PrintDocumentContextRestriction(PrintDocumentContextRestriction source) {
			this.filterBase = null;
			this.targetIndex = source.targetIndex;
			this.result = new PrintDocumentContext(
				source.result.document,
				new ArrayList<>(source.result.variables),
				source.result.repetitions.stream().map(RepetitionPrefix::copy).collect(Collectors.toCollection(ArrayList::new)),
				new ArrayList<>(source.result.slices),
				targetIndex
			);
		}

		public PrintDocumentContextRestriction(@NonNull PrintDocumentContext result, @NonNull List<IEntityInstance> filterBase, int targetIndex) {
			this.result = result;
			this.filterBase = filterBase;
			this.targetIndex = targetIndex;
		}

		public static PrintDocumentContextRestriction broad(
			@NonNull PrintDocumentContext sourceContext,
			int targetIndex,
			@NonNull Variable prefixVariable,
			@NonNull RepetitionPrefix repetitionPrefix,
			@NonNull List<IEntityInstance> filterBase
		) {

			final var variables = new ArrayList<>(sourceContext.variables);
			variables.add(targetIndex, prefixVariable);
			final var repetitions = new ArrayList<>(sourceContext.repetitions);
			repetitions.add(targetIndex, repetitionPrefix);
			final var slices = new ArrayList<>(sourceContext.slices);
			// this is done on purpose to trigger a NPE if access happens to this uninitialized
			slices.add(null);

			return new PrintDocumentContextRestriction(
				new PrintDocumentContext(
					sourceContext.document,
					variables,
					repetitions,
					slices,
					targetIndex
				),
				filterBase,
				targetIndex
			);

		}

		public @NonNull RepetitionPrefix getRepetitionPrefix() {
			return result.repetitions.get(targetIndex);
		}

		public @NonNull Variable getPathPrefix() {
			return result.variables.get(targetIndex);
		}

		public String getPrefixPath() {
			return new SyntaxTreeRenderer().render(getPathPrefix());
		}

		public List<IEntityInstance> getRelevantEntities() {
			return filterBase;
		}

		public @NonNull List<IEntityInstance> getSlice() {
			return result.slices.get(targetIndex);
		}

		public PrintDocumentContext createRepetition(@NonNull List<IEntityInstance> slice, @NonNull RepetitionRange range) {
			final var restriction = new PrintDocumentContextRestriction(this);
			restriction.result.slices.set(targetIndex, slice);
			restriction.result.repetitions.get(targetIndex).setLast(range);
			return restriction.getResult();
		}

		private PrintDocumentContextRestriction apply() {

			final var prefixPath = getPrefixPath();
			final var repetitionPrefix = getRepetitionPrefix();
			final var repetitionIndex = repetitionPrefix.length() - 1;
			final var relevantEntities = getRelevantEntities();
			// this is a double binary search
			// we first find the minimal Repetition
			final var minimalRepetition = new Repetition(prefixPath, repetitionPrefix.getMinimalRepetitionPath());
			final var minRepetitionIndex = minimalRepetition.find(relevantEntities);

			// if there is no minimal Repetition there are none at all in the list
			if (
				!minRepetitionIndex.isExisting() && (
					minRepetitionIndex.getElementIndex() >= relevantEntities.size() ||
					!relevantEntities.get(minRepetitionIndex.getElementIndex()).getPath().startsWith(minimalRepetition.getPath())
				)
			) {
				result.slices.set(targetIndex, List.of());
				result.repetitions.get(targetIndex).setLast(new RepetitionRange(
					0,
					0,
					true
				));
				return this;
			}

			final var minimalRepetitionCount = minimalRepetition.getRepetitions()[repetitionIndex];


			final var initialIndexData = getInitialIndex(minRepetitionIndex, relevantEntities, minimalRepetitionCount, prefixPath, repetitionIndex);
			final var currentMaxRepetition = initialIndexData.maxRepetition;

			var index = initialIndexData.index;

			do {
				if (index >= relevantEntities.size()) {
					break;
				}
				final var currentElement = relevantEntities.get(index);
				final var path = currentElement.getPath();
				// we need to check only if the path has the prefixPath as prefix
				final var delta = PrintDocumentIndex.comparePrefix(
					path,
					prefixPath,
					prefixPath.length()
				);
				if (delta != 0) {
					break;
				}
				if (path.length() > prefixPath.length() && path.charAt(prefixPath.length()) != MutablePrintDocument.PATH_DELIMITER) {
					break;
				}
				final var currentRepetition = currentElement.getRepetitions()[repetitionIndex];
				final var repetitionCmp = Integer.compare(currentRepetition, currentMaxRepetition);
				if (repetitionCmp != 0) {
					break;
				}
				index++;
			} while (true);

			result.slices.set(targetIndex, relevantEntities.subList(
				minRepetitionIndex.getElementIndex(),
				index
			));
			result.repetitions.get(targetIndex).setLast(new RepetitionRange(
				minimalRepetitionCount,
				currentMaxRepetition,
				true
			));

			return this;
		}

		private record InitialIndexData (int index, int maxRepetition) {}
		private InitialIndexData getInitialIndex(
			@NonNull PrintDocumentIndex minRepetitionIndex,
			@NonNull List<IEntityInstance> relevantEntities,
			int minimalRepetitionCount,
			@NonNull String prefixPath,
			int repetitionIndex
		) {
			int low = minRepetitionIndex.getElementIndex() + 1;
			int high = relevantEntities.size();
			int mid = 0;
			var currentMaxRepetition = minimalRepetitionCount;
			while (low <= high) {

				// calculate the element in the middle of the window
				mid = low + ((high - low) / 2);

				// if the mid is to large we break as there cannot be a larger repetition to be found
				if (mid >= relevantEntities.size()) {
					break;
				}

				final var currentElement = relevantEntities.get(mid);

				final var path = currentElement.getPath();

				// we need to check only if the path has the prefixPath as prefix
				final var delta = PrintDocumentIndex.comparePrefix(
					path,
					prefixPath,
					prefixPath.length()
				);
				if (delta < 0) {
					// next we search the "bottom" half of the list
					low = mid + 1;
				} else if (delta > 0
					||
					// if the path of the current element is larger, i.E a field then we need to check if the prefix is not just
					// a partial match such that /A/A then /A/A/C is a match and /A/AAB is not
					path.length() > prefixPath.length() && path.charAt(prefixPath.length()) != MutablePrintDocument.PATH_DELIMITER) {
					// next we search the "top" half of the list
					high = mid - 1;
				} else {
					// the given element is either a child or the instance of the prefixPath
					final var currentRepetition = currentElement.getRepetitions()[repetitionIndex];
					final var repetitionCmp = Integer.compare(currentRepetition, currentMaxRepetition);
					if (repetitionCmp >= 0) {
						// the repetition of the currentElement is larger, next we search the "bottom" half for even larger repetition
						currentMaxRepetition = currentRepetition;
						low = mid + 1;
					} else {
						// the repetition of the currentElement is smaller, next we search the "top" half for even larger repetition
						high = mid - 1;
					}
				}
			}

			return new InitialIndexData(mid, currentMaxRepetition);
		}

	}

	private static class RepetitionIterator implements Iterator<PrintDocumentContext> {

		@NonNull
		private final PrintDocumentContextRestriction restriction;

		private final List<IEntityInstance> slice;

		private int currentIndex = 0;
		private int repetitionIndex = 0;
		private int currentRepetition = 1;

		public RepetitionIterator(@NonNull PrintDocumentContextRestriction restriction) {
			this.restriction = restriction;
			this.slice = restriction.getSlice();
			this.repetitionIndex = restriction.getRepetitionPrefix().length() - 1;
		}

		@Override
		public boolean hasNext() {
			return currentIndex < slice.size();
		}

		@Override
		public PrintDocumentContext next() {

			final int start = currentIndex;
			final int repetition = currentRepetition;
			for (; currentIndex < slice.size(); currentIndex++) {

				final var currentElement = slice.get(currentIndex);
				currentRepetition = currentElement.getRepetitions()[repetitionIndex];

				if (repetition != currentRepetition) {
					break;
				}

			}

			return restriction.createRepetition(
				slice.subList(start, currentIndex),
				new RepetitionRange(repetition, currentRepetition, false)
			);
		}
	}

	@Data
	public static class Entity<T extends IEntityInstance> implements IEntityInstance {
		private final int entityIndex;
		private final int sliceIndex;

		@NonNull
		private final T instance;

		@NonNull
		private final PrintDocumentContext context;

		@SuppressWarnings("unchecked")
		public Optional<Entity<IFieldInstance>> asField() {
			if (instance instanceof IFieldInstance) {
				return Optional.of((Entity<IFieldInstance>) this);
			} else {
				return Optional.empty();
			}
		}

		public Optional<Object> getValue() {
			return asField().flatMap(e -> e.getInstance().getValue());
		}

		public PrintDocumentContext context() {
			return context;
		}

		public PrintDocumentContext parentGroup() {
			final var path = ComputationParser.variable(getPath());
			final var parentPath = path.getParent();

			final var restriction = context.createRestrictionFor(parentPath);
			final var minimalRepetition = new Repetition(
				SyntaxTreeRenderer.getPath(true, parentPath.getSegments()),
				Arrays.copyOf(getInstance().getRepetitions(), parentPath.getSegments().length)
			);
			final var slice = restriction.getFilterBase();
			final var startIndex = minimalRepetition.find(slice);
			minimalRepetition.getRepetitions()[parentPath.getSegments().length - 1]++;
			final var endIndex = minimalRepetition.find(slice);

			final var subList = slice.subList(
				startIndex.getElementIndex(),
				endIndex.getElementIndex()
			);

			restriction.result.slices.set(restriction.targetIndex, subList);
			restriction.result.repetitions.set(
				restriction.targetIndex,
				RepetitionPrefix.from(Arrays.copyOf(instance.getRepetitions(), parentPath.getSegments().length))
			);
			return restriction.getResult();
		}

		@Override
		public String getPath() {
			return instance.getPath();
		}

		@Override
		public int[] getRepetitions() {
			return instance.getRepetitions();
		}

	}


}
