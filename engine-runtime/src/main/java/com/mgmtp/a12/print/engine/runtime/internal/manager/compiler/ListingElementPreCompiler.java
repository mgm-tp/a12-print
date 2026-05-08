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
package com.mgmtp.a12.print.engine.runtime.internal.manager.compiler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mgmtp.a12.kernel.md.model.a12internal.fieldtypes.FieldType;
import com.mgmtp.a12.kernel.md.model.api.IElement;
import com.mgmtp.a12.kernel.md.model.api.IField;
import com.mgmtp.a12.kernel.md.model.api.IGroup;
import com.mgmtp.a12.kernel.md.model.api.IIdNamed;
import com.mgmtp.a12.kernel.md.model.internal.wrapper.FieldWrapper;
import com.mgmtp.a12.kernel.md.model.internal.wrapper.fieldtypes.FieldTypeWrapper;
import com.mgmtp.a12.kernel.md.serializer.model.a12internal.services.DocumentModelSerializer;
import com.mgmtp.a12.print.engine.api.exception.PrintCompilerException;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.listing.PreCompiledListing;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.rewrite.DataModelMetaFieldVariableRewrite;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.synthetics.SyntheticVariable;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.types.A12TypeComparison;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.types.A12TypeComparisonMapping;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.DocumentModelIndex;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.KernelElementUtils;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.egg.EggRewriteRuleFactory;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.egg.RewriteSyntaxTree;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.*;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.visitor.SyntaxTreeRenderer;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.kernel.IFieldTypeExt;
import com.mgmtp.a12.print.model.api.model.element.base.internal.LogicComponent;
import com.mgmtp.a12.print.model.api.model.element.base.internal.LogicContainer;
import com.mgmtp.a12.print.model.api.model.element.type.listing.Listing;
import com.mgmtp.a12.print.model.api.model.element.type.listing.column.ColumnProperties;
import com.mgmtp.a12.print.model.api.model.element.type.listing.column.ListingColumn;
import com.mgmtp.a12.print.model.api.model.path.PrintModelPathElement;
import com.mgmtp.a12.print.model.api.walker.model.PrintModelPath;
import lombok.Builder;
import lombok.Data;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.io.Reader;
import java.io.StringReader;
import java.io.StringWriter;
import java.math.BigDecimal;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.mgmtp.a12.kernel.md.serializer.model.internal.service.DocumentModelSerializerImpl.getMapper;
import static com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.ComputationFieldTypeExt.computationFieldTypeFrom;

@Slf4j
@RequiredArgsConstructor
public class ListingElementPreCompiler {

	private final @NonNull Listing listing;
	private final @NonNull PrintModelPath printModelPath;

	private final @NonNull PrintModelPreCompiler preCompiler;
	private final @NonNull A12TypeComparison typeComparison;
	private final @NonNull IGroup listingRootGroup;
	private final @NonNull DocumentModelIndex documentModelIndex;

	public ListingElementPreCompiler(
		@NonNull Listing listing,
		@NonNull PrintModelPath printModelPath,
		@NonNull PrintModelPreCompiler preCompiler,
		@NonNull A12TypeComparisonMapping typeComparisonMapping,
		@NonNull Function<String, DocumentModelIndex> documentModelResolver
	) {
		this.listing = listing;
		this.printModelPath = printModelPath;
		this.preCompiler = preCompiler;
		this.typeComparison = new A12TypeComparison(typeComparisonMapping);

		final var modelName = listing.getListingProperties().getModel();
		final var groupPath = listing.getListingProperties().getBasePath();

		this.documentModelIndex = documentModelResolver.apply(modelName);

		this.listingRootGroup = (IGroup) documentModelIndex
			.getDocumentModelSearchService()
			.getByPath(groupPath.startsWith("/") ? groupPath : String.format("/%s", groupPath))
			.orElseThrow(() -> new PrintCompilerException("missing path " + groupPath));
	}

	public PreCompiledListing compile() {


		final var subTree = new ListingSubtreeVisitor(
			listing.getListingProperties().getModel(),
			listingRootGroup
		).collect();

		final var rows = subTree.getListingRows();

		rows.stream().flatMap(this::compileRow).forEach(e -> {
		});

		final var rowMap = rows.stream().collect(Collectors.toMap(
			e -> "/" + e.getPath().stream().map(IIdNamed::getName).collect(Collectors.joining("/")),
			e -> e
		));

		return new PreCompiledListing(listing, printModelPath, rowMap);

	}

	private Stream<LogicContainerCompilation> compileRow(ListingRow row) {
		if (row instanceof ListingGroupRow) {
			return compileGroupRow((ListingGroupRow) row);
		} else if (row instanceof ListingFieldRow) {
			return compileFieldRow((ListingFieldRow) row);
		} else {
			throw new PrintCompilerException("not supported");
		}
	}

	private Stream<LogicContainerCompilation> compileGroupRow(ListingGroupRow groupRow) {

		final var listingMetaFieldRewrite = ListingComputationRewrite.group(groupRow, documentModelIndex).build().getRewrite().stream().reduce(
			EggRewriteRuleFactory::andThen
		).orElseThrow(() -> new PrintCompilerException("invalid Listing Rewrite State"));

		return Stream.concat(
			Stream.concat(
				compileRowProperties(listingMetaFieldRewrite, groupRow),
				compileGroupProperties(listingMetaFieldRewrite, groupRow)
			),
			listing.getListingProperties().getColumns().stream().flatMap(
				column -> Stream.concat(
					compileDefaultProperties(listingMetaFieldRewrite, column, groupRow),
					column.getGroupProperties().stream().flatMap(groupColumnProperties ->
						compileColumnProperties(
							listingMetaFieldRewrite,
							groupColumnProperties,
							column.getId(),
							groupRow,
							null
						)
					)
				)
			)
		);

	}

	private Stream<LogicContainerCompilation> compileDefaultProperties(EggRewriteRuleFactory listingMetaFieldRewrite, ListingColumn column, ListingRow row) {
		return column.getDefaultProperties().stream().flatMap(defaultColumnProperties -> {

			final var defaultVariableSpecialHandling = getDefaultVariableSpecialHandling(row);

			final var oneOperationHasValueIdentifier = defaultColumnProperties.getValueComputationAlternatives().stream().anyMatch(e -> e.getOperation().equalsIgnoreCase("[value]"));
			AttachmentSource attachmentSource = null;
			if (oneOperationHasValueIdentifier && row.isAttachmentIdField()) {
				attachmentSource = AttachmentSource.ATTACHMENT_GROUP_ATTACHMENT_ID_FIELD;
			} else if (oneOperationHasValueIdentifier && row.isAttachmentContentField()) {
				attachmentSource = AttachmentSource.ATTACHMENT_GROUP_CONTENT_FIELD;
			}

			return compileColumnProperties(
				defaultVariableSpecialHandling.andThen(listingMetaFieldRewrite),
				defaultColumnProperties,
				column.getId(),
				row,
				attachmentSource
			);
		});
	}

	private static RewriteSyntaxTree getDefaultVariableSpecialHandling(ListingRow row) {
		return row.isAttachmentContentField()
			?
			RewriteSyntaxTree.withRules().variable(
				(o, c) -> {
					if (SyntaxTreeRenderer.getPath(false, c.getSegments()).equals(SyntheticVariable.MetaField.VALUE.getKey())) {
						return b -> SyntheticVariable.NotFilled;
					} else {
						return b -> c;
					}
				}
			).build()
			:
			RewriteSyntaxTree.withRules().variable((o, c) -> {
				if (SyntaxTreeRenderer.getPath(false, c.getSegments()).equals(SyntheticVariable.MetaField.VALUE.getKey())) {
					return b -> SyntheticVariable.createMeta(
						row.getPath(),
						row.getDataModel(),
						SyntheticVariable.MetaField.LITERAL_VALUE
					);
				} else {
					return b -> c;
				}
			}).build();
	}

	private Stream<LogicContainerCompilation> compileColumnProperties(EggRewriteRuleFactory listingMetaFieldRewrite, ColumnProperties columnProperties, String id, ListingRow row, AttachmentSource attachmentSource) {
		final var columnPropertiesContainer = row.createContainer(id, columnProperties);
		columnPropertiesContainer.setAttachmentSource(attachmentSource);
		return Stream.concat(
			Stream.of(compileLogicContainer(
				columnPropertiesContainer,
				ComputationFieldType.STRING,
				listingMetaFieldRewrite
			)),
			columnProperties.getPropertyComputations().stream().map(
				propertyComputation -> compileLogicContainer(
					row.createContainer(id, propertyComputation),
					computationFieldTypeFrom(propertyComputation.getProperty()),
					listingMetaFieldRewrite
				)
			)
		);
	}

	private Stream<LogicContainerCompilation> compileFieldRow(ListingFieldRow fieldRow) {

		final var listingMetaFieldRewrite = ListingComputationRewrite.field(fieldRow, documentModelIndex).build().getRewrite().stream().reduce(
			EggRewriteRuleFactory::andThen
		).orElseThrow(() -> new PrintCompilerException("invalid Listing Rewrite State"));

		final var rowFieldType = IFieldTypeExt.getEffectiveFieldType(
			fieldRow.getField().getFieldType()
		);

		if (!(rowFieldType instanceof FieldTypeWrapper<?>)) {
			throw new PrintCompilerException("unable to compare fieldTypes");
		}

		final var fieldTypeSerializer = new FieldTypeSerializer();
		final var writer = new StringWriter();
		try {
			final var str = FieldTypeWrapper.class.getDeclaredField("fieldType");
			str.setAccessible(true);
			final var fieldTypeRaw = (FieldType) str.get(rowFieldType);
			fieldTypeSerializer.writeFieldType(writer, fieldTypeRaw);
		} catch (Exception e) {
			throw new PrintCompilerException("unable to compare fieldTypes", e);
		}
		final var mapper = new ObjectMapper();
		try {

			final var rawRowFieldTypeTree = mapper.readTree(writer.toString());
			return Stream.concat(
				Stream.concat(
					compileRowProperties(listingMetaFieldRewrite, fieldRow),
					compileGroupProperties(listingMetaFieldRewrite, fieldRow)
				),
				listing.getListingProperties().getColumns().stream().flatMap(column ->
					Stream.concat(
						compileDefaultProperties(listingMetaFieldRewrite, column, fieldRow),
						column.getFieldProperties().stream().flatMap(field -> {

							try {
								final var inputFieldTypeTree = mapper.readTree(field.getInputFieldTypeSerialized());
								if (!typeComparison.checkA12FieldTypeDeepEqual(
									rawRowFieldTypeTree, inputFieldTypeTree
								)) {
									return Stream.empty();
								}

								final var outputFieldType = FieldWrapper.getFieldType(
									fieldTypeSerializer.readFieldType(new StringReader(field.getOutputFieldTypeSerialized()))
								).orElseThrow(() -> new PrintCompilerException("invalid output fieldType"));

								return Stream.concat(
									Stream.of(
										compileLogicContainer(
											fieldRow.createContainer(column.getId(), field),
											ComputationFieldTypeExt.computationFieldTypeFrom(outputFieldType),
											listingMetaFieldRewrite
										)
									),
									field.getPropertyComputations().stream().map(
										propertyComputation -> compileLogicContainer(
											fieldRow.createContainer(column.getId(), propertyComputation),
											computationFieldTypeFrom(propertyComputation.getProperty()),
											listingMetaFieldRewrite
										)
									)
								);
							} catch (IOException e) {
								throw new PrintCompilerException("unable to compile listing column " + field.getId(), e);
							}

						})
					)
				)
			);
		} catch (IOException e) {
			throw new PrintCompilerException("unable to compile listing column " + fieldRow.getField().getId(), e);
		}


	}

	private LogicContainerCompilation compileLogicContainer(
		ListingRow.RowLogicContainer container,
		ComputationFieldType string,
		EggRewriteRuleFactory listingMetaFieldRewrite
	) {
		return preCompiler.getContainers().computeIfAbsent(
			container,
			r ->
				preCompiler.compileLogicContainer(
					container,
					List.of(
						ComputationFieldType.BOOLEAN,
						string
					),
					c -> c.toBuilder()
						  .root(listingMetaFieldRewrite.apply(c.getRoot()))
						  .build()
				)
		);
	}

	private Stream<LogicContainerCompilation> compileRowProperties(EggRewriteRuleFactory listingMetaFieldRewrite, ListingRow row) {
		return listing.getListingProperties()
					  .getRowPropertyComputations()
					  .stream()
					  .map(e -> {
						  final var container = row.createContainer(e.getId(), e);
						  return compileLogicContainer(
							  container,
							  ComputationFieldTypeExt.computationFieldTypeFrom(e.getProperty()),
							  listingMetaFieldRewrite
						  );
					  });
	}

	private Stream<LogicContainerCompilation> compileGroupProperties(EggRewriteRuleFactory listingMetaFieldRewrite, ListingRow row) {
		return listing.getListingProperties()
			.getGroupPropertyComputations()
			.stream()
			.map(e -> {
				final var container = row.createContainer(e.getId(), e);
				return compileLogicContainer(
					container,
					ComputationFieldTypeExt.computationFieldTypeFrom(e.getProperty()),
					listingMetaFieldRewrite
				);
			});
	}

	public interface ListingRow {

		IElement getElement();

		String getDataModel();

		List<IElement> getPath();

		List<RowLogicContainer> getContainerCompilations();

		default boolean isAttachmentContentField() {
			return getPath().size() > 1
				&& getElement() instanceof IField
				&& ((IGroup) getPath().get(getPath().size() - 2)).getUsageType().filter(e -> e.equals("attachment")).isPresent()
				&& (getElement().getName().equals("content"));
		}

		default boolean isAttachmentIdField() {
			return getPath().size() > 1
				&& getElement() instanceof IField
				&& ((IGroup) getPath().get(getPath().size() - 2)).getUsageType().filter(e -> e.equals("attachment")).isPresent()
				&& (getElement().getName().equals("attachment_id"));
		}

		default RowLogicContainer createContainer(String columnId, final LogicContainer container) {

			synchronized (this) {

				final var containerId = container.getId();
				assert containerId != null;

				final var id = String.format(
					"%s#%s#%s#%s",
					getElement().getId(),
					columnId,
					containerId,
					getContainerCompilations().size()
				);

				final var rowLogicContainer = new RowLogicContainerInstance(
					container,
					columnId,
					id
				);

				getContainerCompilations().add(rowLogicContainer);
				return rowLogicContainer;
			}
		}

		interface RowLogicContainer extends LogicContainer, PrintModelPathElement {
			LogicContainer source();

			String getColumnId();

			Optional<AttachmentSource> getAttachmentSource();

			void setAttachmentSource(AttachmentSource attachmentSource);
		}

		@Slf4j
		@RequiredArgsConstructor
		class RowLogicContainerInstance implements RowLogicContainer {

			@NonNull
			private final LogicContainer source;
			@NonNull
			private final String columnId;
			@NonNull
			private final String id;

			private AttachmentSource attachmentSource;

			@Override
			public LogicContainer source() {
				return this.source;
			}

			@Override
			public @NonNull String getColumnId() {
				return columnId;
			}

			@Override
			public Optional<AttachmentSource> getAttachmentSource() {
				return Optional.ofNullable(attachmentSource);
			}

			@Override
			public void setAttachmentSource(AttachmentSource attachmentSource) {
				this.attachmentSource = attachmentSource;
			}

			@Override
			public @NonNull String getId() {
				return id;
			}

			@Override
			public Stream<LogicComponent> logicComponents() {
				return source.logicComponents();
			}
		}
	}

	public static class FieldTypeSerializer extends DocumentModelSerializer {

		public FieldType readFieldType(Reader reader) {
			try {
				return getMapper().readValue(reader, FieldType.class);
			} catch (IOException e) {
				throw new PrintCompilerException("Unable to read FieldType", e);
			}
		}

		public void writeFieldType(StringWriter writer, FieldType fieldTypeRaw) {
			try {
				getMapper().writeValue(writer, fieldTypeRaw);
			} catch (IOException e) {
				throw new PrintCompilerException("Unable to write FieldType", e);
			}
		}
	}

	@Data
	@Builder(builderClassName = "Builder")
	static class ListingComputationRewrite {

		@NonNull
		private final ListingRow _row;

		@NonNull
		private final DocumentModelIndex documentModelIndex;

		private final Variable valueReference;

		private final Constant valueConstant;

		@NonNull
		private final Variable currentRepetition;

		@NonNull
		private final Variable repetitions;

		@NonNull
		private final Variable repetitionsOfParent;
		@NonNull
		private final Variable currentRepetitionOfParent;

		@NonNull
		private final Variable relativeMetadata_label;

		@NonNull
		private final Variable relativeMetadata_externalDescription;


		private final Variable relativeMetadata_errorMessage;

		@NonNull
		private final Variable relativeMetadata_required;

		@NonNull
		private final Variable relativeMetadata_repeatability;
		@NonNull
		private final Constant name;
		@NonNull
		private final Constant parentName;

		@NonNull
		private final Constant parentPath;

		@NonNull
		private final Constant path;

		@NonNull
		private final Constant depth;

		@NonNull
		private final Constant isField;

		public static ListingComputationRewrite.Builder element(ListingRow row, DocumentModelIndex documentModelIndex) {
			final var path = row.getPath();
			final var element = row.getElement();
			final var build = ListingComputationRewrite
				.builder()
				._row(row)
				.documentModelIndex(documentModelIndex)
				.depth(
					Constant.builder()
							.constantType(Constant.ConstantType.INTEGER)
							.value(new BigDecimal(path.size())
								.toString()).build()
				)
				.name(
					Constant.builder()
							.constantType(Constant.ConstantType.STRING)
							.value(element.getName()).build()
				)
				.parentName(
					Constant.builder()
							.constantType(Constant.ConstantType.STRING)
							.value(
								Optional.ofNullable(element.getParent())
										.filter(e -> e.getParent() != null && !"RootGroup".equals(e.getName()))
										.map(IIdNamed::getName).orElse("")
							).build())
				.path(
					Constant.builder()
							.constantType(Constant.ConstantType.STRING)
							.value(String.format(
									"/%s",
									path.stream().map(IIdNamed::getName).collect(Collectors.joining("/"))
										+ "/"
								)
							)
							.build()
				)
				.parentPath(
					Constant.builder()
							.constantType(Constant.ConstantType.STRING)
							.value(String.format(
								"/%s",
								path.stream().limit(path.size() - 1).map(IIdNamed::getName).collect(Collectors.joining("/")))
								+ "/"
							)
							.build()
				);

			if (element instanceof IField) {
				build.valueReference(
					SyntheticVariable.createMeta(
						path,
						row.getDataModel(),
						SyntheticVariable.MetaField.VALUE
					)
				);
			} else {
				build.valueConstant(
					Constant.builder().value("").constantType(Constant.ConstantType.STRING).build()
				);
			}

			return build
				.repetitions(SyntheticVariable.createMeta(
					path,
					row.getDataModel(),
					SyntheticVariable.MetaField.REPETITIONS
				))
				.currentRepetition(SyntheticVariable.createMeta(
					path,
					row.getDataModel(),
					SyntheticVariable.MetaField.CURRENT_REPETITION
				))
				.repetitionsOfParent(SyntheticVariable.createMeta(
					path,
					row.getDataModel(),
					SyntheticVariable.MetaField.REPETITIONS_OF_PARENT
				))
				.currentRepetitionOfParent(SyntheticVariable.createMeta(
					path,
					row.getDataModel(),
					SyntheticVariable.MetaField.CURRENT_REPETITION_OF_PARENT
				))
				.relativeMetadata_label(SyntheticVariable.createMeta(
					path,
					row.getDataModel(),
					SyntheticVariable.MetaField.CONSTANT,
					SyntheticVariable.MetaConstant.LABEL
				))
				.relativeMetadata_externalDescription(SyntheticVariable.createMeta(
					path,
					row.getDataModel(),
					SyntheticVariable.MetaField.CONSTANT,
					SyntheticVariable.MetaConstant.EXTERNAL_DESCRIPTION
				))
				.relativeMetadata_required(SyntheticVariable.createMeta(
					path,
					row.getDataModel(),
					SyntheticVariable.MetaField.CONSTANT,
					SyntheticVariable.MetaConstant.REQUIRED
				))
				.relativeMetadata_repeatability(SyntheticVariable.createMeta(
					path,
					row.getDataModel(),
					SyntheticVariable.MetaField.CONSTANT,
					SyntheticVariable.MetaConstant.REPEATABILITY
				))
				;
		}

		public static ListingComputationRewrite.Builder field(ListingFieldRow field, DocumentModelIndex documentModelIndex) {
			final var result = element(field, documentModelIndex).isField(Constant.TRUE);

			if (computationFieldTypeFrom(field.getField().getFieldType()).equals(ComputationFieldType.ENUMERATION)) {
				result.relativeMetadata_errorMessage(SyntheticVariable.createMeta(
					field.getPath(),
					field.getDataModel(),
					SyntheticVariable.MetaField.CONSTANT,
					SyntheticVariable.MetaConstant.ERROR_MESSAGE
				));
			}

			return result;

		}

		public static ListingComputationRewrite.Builder group(ListingGroupRow group, DocumentModelIndex documentModelIndex) {
			return element(group, documentModelIndex).isField(Constant.FALSE);
		}

		public List<EggRewriteRuleFactory> getRewrite() {

			final var renderer = new SyntaxTreeRenderer();
			final var constantMap = new HashMap<>(Map.of(
				SyntheticVariable.MetaConstant.PATH.getKey(), path,
				SyntheticVariable.MetaConstant.NAME.getKey(), name,
				SyntheticVariable.MetaConstant.PARENT_NAME.getKey(), parentName,
				SyntheticVariable.MetaConstant.PARENT_PATH.getKey(), parentPath,
				SyntheticVariable.MetaConstant.DEPTH.getKey(), depth,
				SyntheticVariable.MetaConstant.IS_FIELD.getKey(), isField
			));
			constantMap.put(SyntheticVariable.MetaField.VALUE.getKey(), valueConstant);

			final var variableMap = new HashMap<>(Map.of(
				SyntheticVariable.MetaField.CURRENT_REPETITION.getKey(), currentRepetition,
				SyntheticVariable.MetaField.REPETITIONS.getKey(), repetitions,
				SyntheticVariable.MetaField.CURRENT_REPETITION_OF_PARENT.getKey(), currentRepetitionOfParent,
				SyntheticVariable.MetaField.REPETITIONS_OF_PARENT.getKey(), repetitionsOfParent,
				"relativeMetadata/label", relativeMetadata_label,
				"relativeMetadata/externalDescription", relativeMetadata_externalDescription,
				"relativeMetadata/required", relativeMetadata_required,
				"relativeMetadata/repeatability", relativeMetadata_repeatability
			));
			variableMap.put(SyntheticVariable.MetaField.VALUE.getKey(), valueReference);
			variableMap.put("relativeMetadata/errorMessage", relativeMetadata_errorMessage);

			return List.of(
				RewriteSyntaxTree
					.withRules()
					.dereference((o, clone) -> {
						var variablePath = renderer.render(o.getVariable());
						var constant = constantMap.get(variablePath);
						if (constant != null) {
							return b -> constant;
						}
						var variable = variableMap.get(variablePath);
						if (variable != null) {
							return b -> b.variable(variable).build();
						}

						// Handle absolute metadata fields for compile-time constant resolution
						final var resolvedConstant = DataModelMetaFieldVariableRewrite.resolveToConstant(o.getVariable(), documentModelIndex);
						if (resolvedConstant != null) {
							return b -> resolvedConstant;
						}

						return b -> clone;
					})
					.variable((o, clone) -> {
						var variablePath = renderer.render(o);
						var variable = variableMap.get(variablePath);
						if (variable != null) {
							return b -> variable;
						}
						return b -> clone;
					})
					.build(),
				RewriteSyntaxTree
					.withRules()
					.variable((o, clone) -> {
						if (o.getSegments()[0].getLabel().equals("relativeAnnotation")) {
							return b -> b.segments(
								Stream.concat(
									Stream.concat(
										Stream.of(
											ReferenceSegment.builder().label(PrintModelCompiler.SYNTHETIC_ANNOTATIONS_DATA_MODEL).build()
										),
										_row.getPath().stream().map(e -> ReferenceSegment.builder().label(e.getName()).build())
									),
									Stream.of(ReferenceSegment.builder().label(o.getSegments()[1].getLabel()).build())
								).toArray(ReferenceSegment[]::new)
							).build();
						} else {
							return b -> clone;
						}
					})
					.build()

			);

		}
	}

	@Data
	@Builder
	@RequiredArgsConstructor
	public static class ListingGroupRow implements ListingRow {

		@NonNull
		private final IGroup group;
		@NonNull
		private final String dataModel;
		@NonNull
		private final List<IElement> path;

		@NonNull
		@Builder.Default
		private final List<RowLogicContainer> containerCompilations = new ArrayList<>();

		@Override
		public IElement getElement() {
			return group;
		}

		@Override
		public String toString() {
			return "ListingGroupRow{" +
				"path=/" + path.stream().map(IIdNamed::getName).collect(Collectors.joining("/")) +
				'}';
		}
	}

	@Data
	@Builder
	@RequiredArgsConstructor
	public static class ListingFieldRow implements ListingRow {

		@NonNull
		private final IField field;
		@NonNull
		private final String dataModel;
		@NonNull
		private final List<IElement> path;
		@NonNull
		@Builder.Default
		private final List<RowLogicContainer> containerCompilations = new ArrayList<>();


		@Override
		public IElement getElement() {
			return field;
		}


		@Override
		public String toString() {
			return "ListingFieldRow{" +
				"path=/" + path.stream().map(IIdNamed::getName).collect(Collectors.joining("/")) +
				'}';
		}

	}

	private class ListingSubtreeVisitor {

		@NonNull
		private final String model;

		@NonNull
		private final LinkedList<IElement> path;
		private final List<ListingRow> rows = new ArrayList<>();

		private final int prefixLength;

		private ListingSubtreeVisitor(@NonNull String model, @NonNull IGroup root) {
			this.model = model;
			this.path = KernelElementUtils.getPath(root);
			this.prefixLength = this.path.size() - 1;
		}

		private void walk(IGroup group, ListingSubtreeVisitor context) {
			for (var currentElement : group.getElements()) {
				if (currentElement instanceof IGroup currentGroup) {
					context.enter(currentGroup);
				} else if (currentElement instanceof IField currentField) {
					context.enter(currentField);
				}
			}
		}

		public List<ListingRow> getListingRows() {
			return rows;
		}

		public ListingSubtreeVisitor collect() {

			if (!rows.isEmpty() || path.size() == prefixLength) {
				return this;
			}

			final var repeatablePrefixGroups = path
				.stream()
				.filter(e -> e instanceof IGroup group && group.getRepeatability() > 1)
				.map(IIdNamed::getName)
				.toList();

			if (repeatablePrefixGroups.size() > 1 && ((IGroup) path.getLast()).getRepeatability() == 1) {
				log.error("LISTING_CAPTURES_IMPLICIT_REPETITION_CONTEXT: {}", listing.getId());
				log.warn(
					"LISTING_CAPTURES_IMPLICIT_REPETITION_CONTEXT: The Listing Element {} has basePath {} which captures multiple Repeatable Groups ({}). "
						+ " This may result in unexpected computation results, if any computation captures a subtree adjacent to the current element. ",
					listing.getId(),
					listing.getListingProperties().getBasePath(),
					String.join(",", repeatablePrefixGroups)
				);
			}

			enter((IGroup) path.removeLast());
			return this;
		}

		public void enter(IGroup group) {
			rows.add(ListingGroupRow
				.builder()
				.group(group)
				.dataModel(model)
				.path(KernelElementUtils.getPath(group))
				.build()
			);

			path.add(group);
			walk(group, this);
			path.removeLast();
		}

		public void enter(IField currentElement) {
			rows.add(
				ListingFieldRow
					.builder()
					.field(currentElement)
					.dataModel(model)
					.path(KernelElementUtils.getPath(currentElement))
					.build()
			);
		}

	}

}
