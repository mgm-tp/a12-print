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
package com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.listing;

import com.mgmtp.a12.kernel.md.document.apiV2.immutable.FieldInstanceV2;
import com.mgmtp.a12.kernel.md.document.apiV2.immutable.GroupInstanceV2;
import com.mgmtp.a12.kernel.md.model.api.IElement;
import com.mgmtp.a12.kernel.md.model.api.IField;
import com.mgmtp.a12.kernel.md.model.api.IGroup;
import com.mgmtp.a12.kernel.md.model.api.fieldtypes.IFieldType;
import com.mgmtp.a12.kernel.md.model.internal.wrapper.FieldWrapper;
import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.api.exception.impl.PrintDomainException;
import com.mgmtp.a12.print.engine.runtime.internal.CoreDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.constant.Constants;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.Entity;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.PrintDocumentContext;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.fieldType.FieldTypeFromPathValueDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.formatter.FormattedValueDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.html.SanitizeValueDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.id.NewIdDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.inputSource.ReferenceInputSourceResolver;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.loader.AttachmentDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.AttachmentToAppend;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.FormattingResult;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.ImageAttachmentToAppend;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.PdfAttachmentToAppend;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.textStyleResolver.TextStyleDependency;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalCorePrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.AttachmentSource;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.ListingElementPreCompiler;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.computation.ComputationExpression;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.provider.LogicContainerEvaluation;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.provider.LogicContainerEvaluationDependency;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.Variable;
import com.mgmtp.a12.print.model.api.inputSource.InputValueSourceResolver;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.element.base.ComputationAlternative;
import com.mgmtp.a12.print.model.api.model.element.base.Measure;
import com.mgmtp.a12.print.model.api.model.element.properties.TextProperties;
import com.mgmtp.a12.print.model.api.model.element.type.listing.GroupPropertyComputation;
import com.mgmtp.a12.print.model.api.model.element.type.listing.Listing;
import com.mgmtp.a12.print.model.api.model.element.type.listing.RowPropertyComputation;
import com.mgmtp.a12.print.model.api.model.element.type.listing.column.ColumnProperties;
import com.mgmtp.a12.print.model.api.model.element.type.listing.column.ColumnPropertyComputation;
import com.mgmtp.a12.print.model.api.model.element.type.listing.column.FieldProperties;
import com.mgmtp.a12.print.model.api.model.element.type.listing.column.ListingColumn;
import lombok.Data;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.ToString;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.tuple.ImmutablePair;

import java.io.ByteArrayInputStream;
import java.io.StringReader;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import java.util.stream.Stream;

import static com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.listing.ListingPathUtils.checkIsSubPath;
import static com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.listing.ListingPathUtils.checkPathsEqual;
import static com.mgmtp.a12.print.model.api.model.element.type.listing.GroupPropertyComputation.PropertyType.IS_HIDDEN;

@Slf4j
public class ListingDependencyValueProducer implements CoreDependencyValueProvider<ListingValueResult, ListingValueDependency> {

	private static final String ATTACHMENT_ID = "attachment_id";

	private final ListingElementPreCompiler.FieldTypeSerializer fieldTypeSerializer = new ListingElementPreCompiler.FieldTypeSerializer();


	private void handleEvaluationFor(
		HashMap<String, Integer> columnOrder,
		ListingRow listingRow,
		LogicContainerEvaluation evaluation,
		InternalCorePrintEngineRuntime runtime
	) {
		final var rowLogicContainer = (ListingElementPreCompiler.ListingRow.RowLogicContainer) evaluation
			.getDependency()
			.getLogicContainer()
			.getTracedElement();

		final var container = rowLogicContainer.source();
		final var rowId = rowLogicContainer.getColumnId();
		switch (container) {
			case FieldProperties fieldProperties -> {
				final var cell = listingRow.getListingCells().get(columnOrder.get(rowId));
				evaluation.getValue()
					.map(e -> {
						final var outputType = FieldWrapper.getFieldType(
							fieldTypeSerializer.readFieldType(new StringReader(fieldProperties.getOutputFieldTypeSerialized()))
						);
						return FormattedValueDependency.buildFrom(
							e,
							((FieldProperties) container).getDisplayOptions().orElse(null),
							outputType.orElse(null)
						);
					})
					.map(runtime::provide)
					.flatMap(e -> Optional.ofNullable(e.get()))
					.ifPresent(e -> setCellValue(cell, e, runtime));
			}
			case ColumnPropertyComputation columnPropertyComputation ->
				evaluation.getValue().ifPresent(value ->
					listingRow.getListingCells().get(
						columnOrder.get(rowId)
					).columnProperties.put(columnPropertyComputation.getProperty(), value)
				);
			case RowPropertyComputation rowPropertyComputation ->
				evaluation.getValue().ifPresent(value ->
					listingRow.getRowProperties().put(rowPropertyComputation.getProperty(), value)
				);
			case GroupPropertyComputation groupPropertyComputation ->
				evaluation.getValue().ifPresent(value ->
					listingRow.getGroupProperties().put(
						new ImmutablePair<>(groupPropertyComputation.getProperty(), groupPropertyComputation.getGroupPath()),
						value
					)
				);
			case ColumnProperties columnProperties -> {
				final var cell = listingRow.getListingCells().get(columnOrder.get(rowId));
				cell.setAttachmentSource(rowLogicContainer.getAttachmentSource().orElse(null));

				List<ComputationAlternative> computationAlternatives = columnProperties.getValueComputationAlternatives();
				if (CollectionUtils.isEmpty(computationAlternatives)) {
					evaluation.getValue().map(e -> String.format(Constants.STRING_FORMAT, e)).ifPresent(cell::setValue);
				} else {
					Optional<IFieldType> referencedFieldType = runtime.provide(
						new FieldTypeFromPathValueDependency(
							computationAlternatives,
							evaluation.getDependency().getLogicContainer().getPath().getParents()
						)
					).get();
					evaluation.getValue()
						.map(e -> runtime.provide(
								FormattedValueDependency.buildFrom(e, null, referencedFieldType.orElse(null))
							).get()
						)
						.ifPresent(e -> setCellValue(cell, e, runtime));
				}
			}
			default -> throw new PrintException("Invalid container: {}", container.getClass().getName());
		}
	}

	private void setCellValue(ListingCell cell, FormattingResult formattingResult, InternalCorePrintEngineRuntime runtime) {
		cell.setValue(formattingResult.getFormattedValue());
		cell.setContentIsHTML(formattingResult.isHtml());
		if (formattingResult.isHtml()) {
			cell.getValue().ifPresent(value -> cell.setValue(runtime.provide(new SanitizeValueDependency(value)).get()));
		}
	}

	@Override
	public ValueFactory<ListingValueResult> produce(ListingValueDependency dependency, PrintJob job, PrintEngine<?> engine, InternalCorePrintEngineRuntime runtime) {

		final var preCompiled = runtime.provide(new PreCompiledListingDependency(dependency.getListing().getTracedElement().getId())).get();
		final var listingElement = dependency.getListing().getTracedElement();
		final var properties = listingElement.getListingProperties();
		final var listingColumns = properties.getColumns();

		final var columnOrdering = new HashMap<String, Integer>();
		for (var i = 0; i < listingColumns.size(); i++) {
			columnOrdering.put(listingColumns.get(i).getId(), i);
		}

		final var sortingIndex = IntStream.range(0, listingColumns.size()).filter(e -> listingColumns.get(e).isSortingIndex().filter(k -> k).isPresent()).findFirst();
		final var sortingTree = new SortingTree(null);

		final var basePath = properties.getBasePath();

		final var referenceInputSourceResolver = ReferenceInputSourceResolver.builder()
			.runtime(runtime)
			.printModelTreeTrace(new PrintModelTreeTrace<>(dependency.getListing().getPath(), listingElement))
			.build();

		final var listingRows = new ArrayList<ListingRowValue>();

		for (final var entityInstance : dependency.getPrintDocumentContext().findInstancesContext(Variable.abs(basePath)).toList()) {
			final var preCompiledRow = preCompiled.getRowMap().get(entityInstance.getPath());

			// this can happen if the listing path contains more the one repeatable group
			if (preCompiledRow == null) {
				continue;
			}

			final var listingRow = new ListingRow(
				preCompiledRow.getPath().toArray(IElement[]::new),
				new ArrayList<>(listingColumns.size()),
				entityInstance
			);

			final var instanceContext = entityInstance.context();

			IntStream.range(0, listingColumns.size())
				.forEach(i -> listingRow.getListingCells()
					.add(new ListingCell(listingColumns.get(i))));

			final var dependencyStream
				= preCompiledRow.getContainerCompilations()
				.stream()
				.map(e -> new LogicContainerEvaluationDependency(
					dependency.getListing().createDescendent(e),
					new ComputationExpression.Parameters()
						.withEntityInstance(entityInstance)
						.withElement(preCompiledRow.getElement())
						.withPrintDocumentContext(instanceContext)
				));

			runtime
				.streamLogicContainerEvaluationDependency(dependencyStream)
				.forEach(evaluation -> handleEvaluationFor(columnOrdering, listingRow, evaluation, runtime));

			handleHiddenGroupComputations(listingRows, listingRow, entityInstance.getPath());

			listingRows.add(listingRow);
		}

		listingRows.stream()
			.filter(Objects::nonNull).forEach(a -> {
				synchronized (sortingTree) {
					sortingTree.add(a);
				}
			});

		final var result
			= sortingTree.stream(sortingIndex.orElse(-1))
			.filter(Objects::nonNull).toList();

		if (log.isTraceEnabled()) {
			result.forEach(r -> {
				var sb = new StringBuilder();

				for (var val : r.getColumnValues()) {
					sb.append(String.format("%1$-" + 20 + "s", val.getValue().orElse("")), 0, 20);
					sb.append("\t");
				}
				sb.append("\t");
				sb.append(String.format("%1$-" + 20 + "s", Arrays.toString(r.getRepetition().getRepetitions())));
				sb.append("\t");
				sb.append(r.getRepetition().getPath());
				sb.append("\t");
				log.trace(sb.toString());
			});
		}

		final List<String> headerCells = listingElement.getListingProperties().hideHeader().orElse(false)
			? null
			: listingElement
			.getListingProperties()
			.getColumns()
			.stream()
			.map(column -> InputValueSourceResolver.getInputValue(
					column.getLabel(),
					ReferenceInputSourceResolver
						.builder()
						.runtime(runtime)
						.printModelTreeTrace(
							new PrintModelTreeTrace<>(
								dependency.getListing().getPath(),
								dependency.getListing().getTracedElement())
							)
						.build()
					)
				.orElse(Constants.EMPTY_STRING)
			).toList();

		LinkedHashMap<String, AttachmentToAppend> attachmentsToAppend = new LinkedHashMap<>();
		final var markupRowValues = result.stream().map(row -> new ListingValues.MarkupListingRowValue(
			row.getRepetition().getPath(),
			row.getRowProperties(),
			row.getGroupProperties().entrySet().stream().collect(
				HashMap::new,
				(m, e) -> m.put(e.getKey().getLeft(), e.getValue()),
				HashMap::putAll
			),
			getColumns(runtime, row, dependency.getTextStyleProvider(), attachmentsToAppend, referenceInputSourceResolver)
		)).toList();

		final var colGroups = findColGroups(listingElement, result);

		return () -> new ListingValueResult(markupRowValues, attachmentsToAppend, colGroups, headerCells);

	}

	private static void handleHiddenGroupComputations(
		@NonNull final List<ListingRowValue> listingRows,
		@NonNull final ListingRowValue listingRow,
		@NonNull final String instancePath
	) {
		final var hiddenGroupPaths = listingRow.getGroupProperties().entrySet().stream()
			.filter(e -> e.getKey().getLeft().equals(IS_HIDDEN) &&
				e.getValue() instanceof Boolean booleanValue &&
				booleanValue
			)
			.map(e -> e.getKey().getRight())
			.toList();

		if (!hiddenGroupPaths.isEmpty()) {
			for (final var hiddenGroupPath : hiddenGroupPaths) {
				if (!checkIsSubPath(instancePath, hiddenGroupPath, true)) {
					throw new PrintDomainException("The instance path {} needs to be a sub-path of the hidden group path {}", instancePath, hiddenGroupPath);
				}
				setHiddenInLastMatching(listingRows, hiddenGroupPath);
			}
		}
	}

	private static void setHiddenInLastMatching(List<ListingRowValue> list, String hiddenGroupPath) {
		for (int i = list.size() - 1; i >= 0; i--) {
			final var row = list.get(i);
			if (checkPathsEqual(row.getRepetition().getPath(), hiddenGroupPath)) {
				row.getGroupProperties().put(
					new ImmutablePair<>(GroupPropertyComputation.PropertyType.IS_HIDDEN, hiddenGroupPath), true
				);
				return;
			}
		}
		throw new PrintDomainException("No matching group for the hidden group path: {}", hiddenGroupPath);
	}

	private List<Optional<Integer>> findColGroups(Listing listing, List<ListingRowValue> rows) {

		final var result = listing
			.getListingProperties()
			.getColumns()
			.stream()
			.map(e -> InputValueSourceResolver.getInputValue(e.getWidth()).map(Measure::getValue)).collect(Collectors.toCollection(ArrayList::new));

		final var retain = new ArrayList<Optional<Integer>>();

		for (int i = 0; i < result.size(); i++) {
			final var index = i;
			if (rows.isEmpty() || !rows.stream().allMatch(row -> Objects.equals(
				true,
				row.getColumnValues()
					.get(index)
					.getColumnProperties()
					.get(ColumnPropertyComputation.PropertyType.IS_HIDDEN)
			))) {
				retain.add(result.get(i));
			}
		}

		return retain;

	}

	private List<ListingValues.MarkupListingColumnValue> getColumns(
		InternalCorePrintEngineRuntime runtime,
		ListingRowValue row,
		ListingValueDependency.TextStyleProvider textStyleProvider,
		LinkedHashMap<String, AttachmentToAppend> attachmentsToAppend,
		InputValueSourceResolver.ReferenceResolver referenceInputSourceResolver
	) {
		List<ListingValues.MarkupListingColumnValue> resultColumns = new ArrayList<>();

		String attachmentId = null;

		for (ListingColumnValue col : row.getColumnValues()) {
			attachmentId = getColumValue(
				runtime,
				col,
				row,
				textStyleProvider,
				attachmentId,
				attachmentsToAppend,
				resultColumns,
				referenceInputSourceResolver
			);
		}

		return resultColumns;
	}

	private String getColumValue(
		InternalCorePrintEngineRuntime runtime,
		ListingColumnValue originColumnValue,
		ListingRowValue rowValue,
		ListingValueDependency.TextStyleProvider textStyleProvider,
		String attachmentId,
		LinkedHashMap<String, AttachmentToAppend> attachmentsToAppend,
		List<ListingValues.MarkupListingColumnValue> resultColumns,
		InputValueSourceResolver.ReferenceResolver referenceInputSourceResolver
	) {
		final var path = rowValue.getPath();
		final var currentElement = path[path.length - 1];
		final var attachmentParentGroup
			= Optional.ofNullable(currentElement.getParent())
			.filter(g -> g.getUsageType().filter(u -> u.equals("attachment")).isPresent());
		final var rowValueEntity = rowValue.getRepetition();
		final Optional<String> currentInstanceValue = rowValueEntity.getInstance() instanceof FieldInstanceV2 &&
			rowValueEntity.getValue().isPresent() &&
			rowValueEntity.getValue().get() instanceof String instanceValue
				? Optional.of(instanceValue)
				: Optional.empty();

		if (isAttachmentField(attachmentParentGroup.orElse(null), currentElement, attachmentId)) {
			final var attachmentGroup = rowValue
				.getRepetition()
				.parentGroup();

			final var mimeTypeObject = attachmentGroup
				.findSingleFieldInstance("mime_type", true)
				.flatMap(Entity::getValue);

			if (
				mimeTypeObject.isPresent() &&
					mimeTypeObject.get() instanceof String mimeType &&
					(
						PdfAttachmentToAppend.possibleMimeTypes.contains(mimeTypeObject.get()) ||
							ImageAttachmentToAppend.possibleMimeTypes.contains(mimeTypeObject.get())
					)

			) {
				final var changedAttachmentId = setAttachmentToAppend(
					runtime,
					attachmentsToAppend,
					mimeType,
					attachmentGroup,
					currentInstanceValue.orElse(null),
					currentElement
				);
				attachmentId = changedAttachmentId == null ? attachmentId : changedAttachmentId;
			}
		}

		final var originalValue = originColumnValue.getValue();
		String cellValue = originalValue.orElse(Constants.EMPTY_STRING);

		final var replaceContentByLink = StringUtils.isNoneEmpty(attachmentId) && originColumnValue.attachmentSource().isPresent();
		if (replaceContentByLink) {
			cellValue = getContentWithLinkText(
				attachmentId,
				currentElement,
				currentInstanceValue.orElse(null),
				cellValue,
				originalValue.orElse(null)
			);
		}

		resultColumns.add(new ListingValues.MarkupListingColumnValue(
			textStyleProvider.provideTextStyle(
				 TextStyleDependency.create(originColumnValue.getColumn().getTextProperties().flatMap(TextProperties::getTextStyleId), referenceInputSourceResolver)
			),
			originColumnValue.getColumn(),
			originColumnValue.getColumnProperties(),
			cellValue,
			originColumnValue.contentIsHTML() || replaceContentByLink
		));

		return attachmentId;
	}

	private String setAttachmentToAppend(
		@NonNull final InternalCorePrintEngineRuntime runtime,
		@NonNull final LinkedHashMap<String, AttachmentToAppend> attachmentsToAppend,
		@NonNull final String mimeType,
		@NonNull final PrintDocumentContext attachmentGroup,
		final String currentInstanceValue,
		@NonNull final IElement currentElement
	) {
		String attachmentId = null;
		final var altText = attachmentGroup
			.findSingleFieldInstance("description", true)
			.flatMap(Entity::getValue)
			.map(Object::toString)
			.orElse(
				attachmentGroup
					.findSingleFieldInstance("original_filename", true)
					.flatMap(Entity::getValue)
					.map(Object::toString)
					.orElse(Constants.EMPTY_STRING)
			);

		ByteArrayInputStream attachmentContent = null;
		if (
			currentInstanceValue != null && !currentInstanceValue.isBlank()
		) {
			if (currentElement.getName().equals(ATTACHMENT_ID)) {
				if (getNonBlankField(attachmentGroup, "content").isPresent()) {
					log.debug(
						"The attachment with the id {} has the fields 'attachment_id' and 'content' set. In this case the 'content' field attachment is used",
						currentInstanceValue
					);
				} else {
					attachmentContent = runtime.provide(new AttachmentDependency(currentInstanceValue)).get();
				}
			} else {
				attachmentContent = base64ToBinary(currentInstanceValue);
			}
		}

		if (attachmentContent != null) {
			attachmentId = runtime.provide(new NewIdDependency()).get();
			if (PdfAttachmentToAppend.possibleMimeTypes.contains(mimeType)) {
				attachmentsToAppend.put(attachmentId, new PdfAttachmentToAppend(attachmentContent, altText, mimeType));
			} else {
				attachmentsToAppend.put(attachmentId, new ImageAttachmentToAppend(attachmentContent, altText, mimeType));
			}
		}
		return attachmentId;
	}

	private static String getContentWithLinkText(
		@NonNull final String attachmentId,
		@NonNull final IElement currentElement,
		final String currentInstanceValue,
		@NonNull final String cellValue,
		final String originalValue
	) {
		final var isNonReplacedAttachmentId = currentElement.getName().equals(ATTACHMENT_ID) &&
			currentInstanceValue != null && currentInstanceValue.equals(cellValue);
		String attachmentLinkHref = AttachmentToAppend.getAttachmentLinkHrefById(attachmentId);
		String attachmentLinkLabel = originalValue != null && !isNonReplacedAttachmentId
			? cellValue
			: "Link";
		return String.format("<a href=\"%s\">%s</a>", attachmentLinkHref, attachmentLinkLabel);
	}

	private boolean isAttachmentField(
		final IGroup attachmentParentGroup,
		@NonNull final IElement currentElement,
		final String attachmentId
	) {
		return attachmentParentGroup != null
			&& currentElement instanceof IField
			&& (currentElement.getName().equals("content") || currentElement.getName().equals(ATTACHMENT_ID))
			&& StringUtils.isEmpty(attachmentId);
	}

	private ByteArrayInputStream base64ToBinary(final String base64) {
		final String[] base64Parts = base64.split("base64,");
		final String base64PartsWithoutPadding = base64Parts.length < 2 ? base64 : base64Parts[1];
		final byte[] binaryPdf = Base64.getDecoder().decode(base64PartsWithoutPadding.getBytes());
		return new ByteArrayInputStream(binaryPdf);
	}

	private Optional<String> getNonBlankField(
		PrintDocumentContext attachmentGroup,
		String name
	) {
		return attachmentGroup
			.findSingleFieldInstance(name, true)
			.flatMap(Entity::getValue)
			.map(Object::toString)
			.filter(value -> !value.isBlank());
	}

	@Data
	@RequiredArgsConstructor
	private static class SortingTree {

		private final Map<String, Map<Integer, SortingTree>> subtree = new HashMap<>();

		@ToString.Exclude
		private final SortingTree parent;
		private ListingRowValue value;

		private static Function<Map.Entry<String, Map<Integer, SortingTree>>, Integer> compareByTreePosition(SortingTree tree) {
			return a -> {
				if (tree.value == null) {
					return -1;
				}
				assert tree.value.getRepetition().getInstance() instanceof GroupInstanceV2;
				final var el = ((IGroup) tree.value.getPath()[tree.value.getPath().length - 1]).getElements();
				return IntStream.range(0, el.size()).filter(e -> el.get(e).getName().equals(a.getKey())).findAny().orElse(Integer.MAX_VALUE);
			};
		}

		public void add(ListingRowValue value) {
			addInternal(value, 0);
		}

		private void addInternal(ListingRowValue value, int index) {
			if (value.getPath().length <= index) {
				assert this.value == null;
				this.value = value;
			} else {
				final var name = value.getPath()[index].getName();
				final var rep = value.getRepetition().getRepetitions()[index];

				subtree
					.computeIfAbsent(name, k -> new HashMap<>())
					.computeIfAbsent(rep, k -> new SortingTree(this))
					.addInternal(value, index + 1);
			}
		}

		public Stream<ListingRowValue> stream(int sortingColumnIndex) {
			if (sortingColumnIndex < 0) {
				return streamInternal(
					tree -> Comparator.comparing(compareByTreePosition(tree)).thenComparing(Map.Entry::getKey),
					tree -> Map.Entry.comparingByKey()
				);
			} else {
				return streamWithSorting(sortingColumnIndex);
			}
		}

		private Stream<ListingRowValue> streamWithSorting(int sortingColumnIndex) {
			return streamInternal(
				tree -> (
					Comparator.comparing((Map.Entry<String, Map<Integer, SortingTree>> a)
							-> a.getValue().values().stream().allMatch(e ->
							e.getValue().getRepetition().getInstance() instanceof FieldInstanceV2) ? 0 : 1)
						.thenComparing((a, b) -> sortByValue(sortingColumnIndex, a, b))
				)
					.thenComparing(compareByTreePosition(tree))
					.thenComparing(Map.Entry::getKey),
				tree -> Comparator
					.comparing((Map.Entry<Integer, SortingTree> a) ->
						Optional.ofNullable(a.getValue())
							.map(SortingTree::getValue)
							.map(ListingRowValue::getRepetition)
							.map(i -> i.getInstance() instanceof FieldInstanceV2 ? 0 : 100)
							.orElse(0)
					)
					.thenComparing((a, b) -> {
						var aTree = a.getValue();
						var bTree = b.getValue();

						if (aTree == null || bTree == null || aTree.value == null || bTree.value == null)
							return 0;

						final var aMin = aTree.value.getColumnValues().get(sortingColumnIndex).getValue();
						final var bMin = bTree.value.getColumnValues().get(sortingColumnIndex).getValue();

						return aMin.map(s -> bMin.map(s::compareTo).orElse(-1))
							.orElseGet(() -> bMin.isPresent() ? 1 : 0);
					}).thenComparing(Map.Entry::getKey)
			);
		}

		private Integer sortByValue(int sortingColumnIndex, Map.Entry<String, Map<Integer, SortingTree>> a, Map.Entry<String, Map<Integer, SortingTree>> b) {
			final var aMin = a.getValue()
				.values()
				.stream()
				.map(e -> e.getValue()
					.getColumnValues().get(sortingColumnIndex).getValue().orElse(null)
				)
				.filter(Objects::nonNull).min(String::compareTo);
			final var bMin = b.getValue()
				.values()
				.stream()
				.map(e -> e.getValue()
					.getColumnValues().get(sortingColumnIndex).getValue().orElse(null)
				)
				.filter(Objects::nonNull).min(String::compareTo);

			return aMin.map(s -> bMin.map(s::compareTo).orElse(-1)).orElseGet(() -> bMin.isPresent() ? 1 : 0);
		}

		private Stream<ListingRowValue> streamInternal(
			@NonNull Function<SortingTree, Comparator<Map.Entry<String, Map<Integer, SortingTree>>>> cmpA,
			@NonNull Function<SortingTree, Comparator<Map.Entry<Integer, SortingTree>>> cmpB
		) {
			return Stream.concat(
				Stream.of(value),
				subtree.entrySet()
					   .stream()
					   .sorted(cmpA.apply(this))
					   .flatMap(
						   e -> e.getValue()
								 .entrySet()
								 .stream()
								 .sorted(cmpB.apply(this))
								 .flatMap(v -> v.getValue().streamInternal(cmpA, cmpB))
					   )
			);
		}
	}

	@RequiredArgsConstructor
	@ToString
	private static class ListingRow implements ListingRowValue {

		@NonNull
		private final IElement[] path;
		@NonNull
		private final List<ListingCell> listingCells;

		@NonNull
		private final Entity<?> repetition;
		private final Map<RowPropertyComputation.PropertyType, Object> rowProperties = new EnumMap<>(RowPropertyComputation.PropertyType.class);
		private final Map<ImmutablePair<GroupPropertyComputation.PropertyType, String>, Object> groupProperties = new HashMap<>();

		public @NonNull List<ListingCell> getListingCells() {
			return listingCells;
		}

		@Override
		public Map<RowPropertyComputation.PropertyType, Object> getRowProperties() {
			return rowProperties;
		}

		@Override
		public Map<ImmutablePair<GroupPropertyComputation.PropertyType, String>, Object> getGroupProperties() {
			return groupProperties;
		}

		@Override
		public List<ListingColumnValue> getColumnValues() {
			return listingCells.stream().map(e -> (ListingColumnValue) e).collect(Collectors.toList());
		}

		@Override
		public @NonNull Entity<?> getRepetition() {
			return repetition;
		}

		@Override
		public IElement[] getPath() {
			return path;
		}


	}

	@RequiredArgsConstructor
	@ToString
	private static class ListingCell implements ListingColumnValue {

		@NonNull
		private final ListingColumn listingColumn;
		@NonNull
		private final Map<ColumnPropertyComputation.PropertyType, Object> columnProperties = new EnumMap<>(ColumnPropertyComputation.PropertyType.class);
		private AttachmentSource attachmentSource;
		private boolean contentIsHTML;
		private String value;

		public void setAttachmentSource(AttachmentSource attachmentSource) {
			this.attachmentSource = attachmentSource;
		}

		public void setContentIsHTML(boolean contentIsHTML) {
			this.contentIsHTML = contentIsHTML;
		}

		@Override
		public @NonNull ListingColumn getColumn() {
			return listingColumn;
		}

		@Override
		public @NonNull Map<ColumnPropertyComputation.PropertyType, Object> getColumnProperties() {
			return columnProperties;
		}

		@Override
		public Optional<String> getValue() {
			return Optional.ofNullable(value);
		}

		public void setValue(@NonNull String value) {
			this.value = value;
		}

		@Override
		public Optional<AttachmentSource> attachmentSource() {
			return Optional.ofNullable(attachmentSource);
		}

		@Override
		public boolean contentIsHTML() {
			return contentIsHTML;
		}

	}
}
