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
package com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.synthetics;

import com.mgmtp.a12.kernel.md.model.api.IElement;
import com.mgmtp.a12.kernel.md.model.api.IField;
import com.mgmtp.a12.kernel.md.model.api.IGroup;
import com.mgmtp.a12.kernel.md.model.api.IIdNamed;
import com.mgmtp.a12.print.engine.api.exception.impl.PrintCompilerException;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.egg.EggNode;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.egg.EquivalenceGeneralizationGraph;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.*;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.visitor.SyntaxTreeRenderer;
import lombok.Builder;
import lombok.Data;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;

import java.util.*;

@Data
@Builder
@RequiredArgsConstructor
public class SyntheticVariable {


	public static final String PREFIX = "@Synthetic";
	public static final Variable NotFilled = Variable.builder().segments(new ReferenceSegment[]{
		ReferenceSegment.builder().label(PREFIX).build(),
		ReferenceSegment.builder().label(SyntheticVariableType.NOT_FILLED_FIELD.name()).build()
	}).build();
	private static final String LOCALIZED = "Localized";
	private final Integer nodeId;
	private final ComputationFieldType computationFieldType;
	private final MetaField metaField;
	private final MetaConstant metaConstant;
	private final String dataModel;
	private final List<String> rest;
	private final List<String> path;
	@NonNull
	private final Variable variable;
	@NonNull
	private final SyntheticVariableType syntheticVariableType;

	public static SyntheticVariable from(Variable node) {
		final var segments
			= Arrays.stream(node.getSegments())
					.map(ReferenceSegment::getLabel)
					.iterator();

		final var builder = SyntheticVariable.builder().variable(node);

		try {
			final var prefix = segments.next();
			if (!PREFIX.equals(prefix)) {
				throw new PrintCompilerException("Invalid SyntheticVariable");
			}
			final var syntheticVariableType = SyntheticVariableType.valueOf(segments.next());
			builder.syntheticVariableType(syntheticVariableType);

			if (syntheticVariableType.equals(SyntheticVariableType.NOT_FILLED_FIELD)) {
				return builder.build();
			}

			if (SyntheticVariableType.META.equals(syntheticVariableType)) {
				handleMetaVariable(builder, segments);
			} else {
				builder.nodeId(Integer.valueOf(segments.next()));
				if (syntheticVariableType.equals(SyntheticVariableType.CONSTANT)) {
					builder.computationFieldType(ComputationFieldType.valueOf(segments.next()));
				}
			}
			return builder.build();
		} catch (NoSuchElementException e) {
			throw new PrintCompilerException("Invalid SyntheticVariable", e);
		}
	}

	private static void handleMetaVariable(SyntheticVariableBuilder builder, Iterator<@NonNull String> segments) {
		builder.computationFieldType(ComputationFieldType.valueOf(segments.next()));
		final var metaField = MetaField.valueOf(segments.next());
		builder.metaField(metaField);
		if (MetaField.CONSTANT.equals((metaField))) {
			builder.metaConstant(MetaConstant.valueOf(segments.next()));
		}
		if (metaField.isPathDependent()) {
			final var rest = new ArrayList<String>();
			for (var c = segments.next(); !"of".equals(c); c = segments.next()) {
				rest.add(c);
			}
			rest.trimToSize();
			if (!rest.isEmpty()) {
				builder.rest(rest);
			}
			builder.dataModel(segments.next());
			final var path = new ArrayList<String>();
			while (segments.hasNext()) {
				path.add(segments.next());
			}
			if (!path.isEmpty()) {
				builder.path(path);
			}
		}
	}

	public static SyntheticVariable from(EggNode node) {

		final var segments = new ArrayList<String>(10);

		segments.add(PREFIX);

		final var synType = syntheticFieldTypeFrom(node);
		segments.add(synType.name());
		segments.add(Integer.toString(node.id()));

		final var builder = SyntheticVariable
			.builder()
			.nodeId(node.id())
			.syntheticVariableType(synType);

		if (synType == SyntheticVariableType.CONSTANT) {
			final var constant = ((Constant) node.getTree());
			final var computationFieldType = ComputationFieldTypeExt.computationFieldTypeFrom(
				constant.getConstantType()
			);
			segments.add(computationFieldType.name());
			builder.computationFieldType(computationFieldType);
		}

		return builder.variable(
						  Variable
							  .builder()
							  .isAbsolute(false)
							  .segments(
								  segments.stream()
										  .map(e -> ReferenceSegment
											  .builder()
											  .label(e)
											  .isList(false)
											  .isTurningGroup(false)
											  .build()
										  ).toArray(ReferenceSegment[]::new)
							  ).build())
					  .build();
	}

	public static Variable create(EggNode node) {
		return from(node).getVariable();
	}

	public static Variable createMeta(List<IElement> path, String dataModel, MetaField metaField) {
		return createMeta(path, dataModel, metaField, null);
	}

	public static Variable createMeta(List<IElement> path, String dataModel, MetaField metaField, MetaConstant metaConstant, String... rest) {

		final var segments = new ArrayList<String>();
		segments.add(SyntheticVariable.PREFIX);
		segments.add(SyntheticVariableType.META.name());

		switch (metaField) {
			case VALUE: {
				final var lastElement = path.getLast();
				if (lastElement instanceof IGroup) {
					segments.add(ComputationFieldType.STRING.name());
				} else if (lastElement instanceof IField fieldElement) {
					final var computationFieldType = ComputationFieldTypeExt.computationFieldTypeFrom(
						fieldElement.getEffectiveType()
											  .orElseThrow(() -> new PrintCompilerException("Invalid field"))
					);
					segments.add(computationFieldType.name());
				} else {
					throw new PrintCompilerException("Invalid Element");
				}
				break;
			}
			case LITERAL_VALUE: {
				segments.add(ComputationFieldType.STRING.name());
				break;
			}
			case REPETITIONS, REPETITIONS_OF_PARENT, CURRENT_REPETITION, CURRENT_REPETITION_OF_PARENT:
				segments.add(ComputationFieldType.NUMBER.name());
				break;
			case CONSTANT:
				segments.add(metaConstant.getComputationFieldType().name());
				break;
			default:
				throw new PrintCompilerException("Invalid SyntheticListingVariable: " + metaField.name());
		}

		segments.add(metaField.name());
		if (metaConstant != null) {
			segments.add(metaConstant.name());
		}
		segments.addAll(List.of(rest));

		if (metaField.isPathDependent()) {
			segments.add("of");
			segments.add(dataModel);
			segments.addAll(path.stream().map(IIdNamed::getName).toList());
		}

		return Variable.builder()
					   .isAbsolute(false)
					   .segments(
						   segments
							   .stream()
							   .map(e -> ReferenceSegment.builder().label(e).build())
							   .toArray(ReferenceSegment[]::new)
					   )
					   .build();
	}

	public static boolean isSynthetic(Variable variable) {
		return PREFIX.equals(variable.getSegments()[0].getLabel());
	}

	public static SyntheticVariableType syntheticFieldTypeFrom(EggNode node) {
		var tree = node.getTree();
		switch (node.getTree().elementType()) {
			case DEREFERENCE, VARIABLE: {
				final var variable
					= node.getTree() instanceof Dereference dereference
					? dereference.getVariable()
					: ((Variable) node.getTree());

				if (isSynthetic(variable)) {
					final var synth = from(variable);
					if (synth.getSyntheticVariableType().equals(SyntheticVariableType.META)) {
						return SyntheticVariableType.FIELD;
					} else {
						return synth.getSyntheticVariableType();
					}
				} else {
					return SyntheticVariableType.FIELD;
				}
			}
			case CONSTANT:
				return SyntheticVariableType.CONSTANT;
			case PREDICATE:
				return SyntheticVariableType.PREDICATE;
			case ARITHMETIC:
				return switch (((Arithmetic) tree).getOperator()) {
					case PLUS -> SyntheticVariableType.PLUS;
					case MINUS -> SyntheticVariableType.MINUS;
					case DIVISION -> SyntheticVariableType.DIVISION;
					case MULTIPLICATION -> SyntheticVariableType.MULTIPLICATION;
				};
			case COMPARE:
				return switch (((Compare) tree).getOperator()) {
					case EQUALITY -> SyntheticVariableType.EQUALITY;
					case UN_EQUALITY -> SyntheticVariableType.UN_EQUALITY;
					case GREATER_THAN -> SyntheticVariableType.GREATER_THAN;
					case GREATER_THAN_OR_EQUAL -> SyntheticVariableType.GREATER_THAN_OR_EQUAL;
					case LESS_THAN -> SyntheticVariableType.LESS_THAN;
					case LESS_THAN_OR_EQUAL -> SyntheticVariableType.LESS_THAN_OR_EQUAL;
				};
			case LOGIC: {
				return switch (((Logic) tree).getOperator()) {
					case AND -> SyntheticVariableType.AND;
					case OR -> SyntheticVariableType.OR;
				};
			}
			default:
				throw new PrintCompilerException("Unmapped SyntheticFieldType for Tree ", tree);
		}
	}

	public String getProviderId() {
		return SyntaxTreeRenderer.getPath(false, getVariable().getSegments());
	}

	public ComputationFieldType getComputationFieldType() {
		if (computationFieldType != null) {
			return computationFieldType;
		} else {
			final var ct = syntheticVariableType.getComputationFieldType();
			if (ct.equals(ComputationFieldType.UNKNOWN) && metaConstant != null) {
				return metaConstant.getComputationFieldType();
			} else {
				return ct;
			}
		}
	}

	public Optional<EggNode> findNode(EquivalenceGeneralizationGraph generalizationGraph) {
		if (nodeId == null) {
			return generalizationGraph.get(Dereference.builder().variable(getVariable()).build());
		}
		return generalizationGraph.get(nodeId);
	}

	public enum MetaConstant {

		PATH("path"),
		ANNOTATION("annotations"),
		NAME("name"),
		PARENT_NAME("parentName"),
		PARENT_PATH("parentPath"),
		DEPTH("depth"),
		LABEL("label"),
		EXTERNAL_DESCRIPTION("externalDescription"),
		REQUIRED("required"),
		REPEATABILITY("repeatability"),
		ERROR_MESSAGE("errorMessage"),
		IS_FIELD("isField");

		@NonNull
		private final String key;

		MetaConstant(@NonNull String k) {
			key = k;
		}

		public static MetaConstant findByKey(String lastSegment) {
			return Arrays.stream(MetaConstant.values())
						 .filter(e -> e.getKey().equals(lastSegment))
						 .findAny()
						 .orElseThrow(() -> new IllegalArgumentException(lastSegment + " is not a MetaConstant"));
		}

		public @NonNull String getKey() {
			return key;
		}

		public ComputationFieldType getComputationFieldType() {
			return switch (this) {
				case IS_FIELD, REQUIRED -> ComputationFieldType.BOOLEAN;
				case DEPTH, REPEATABILITY -> ComputationFieldType.NUMBER;
				default -> ComputationFieldType.STRING;
			};
		}

		public boolean isLocalized() {
			return switch (this) {
				case PATH, ANNOTATION, NAME, PARENT_NAME, PARENT_PATH, DEPTH, REQUIRED, REPEATABILITY, IS_FIELD ->
					false;
				case LABEL, EXTERNAL_DESCRIPTION, ERROR_MESSAGE -> true;
			};
		}
	}

	public enum MetaField {

		VALUE("value"),

		LITERAL_VALUE("literalValue"),
		REPETITIONS("repetitions"),
		CURRENT_REPETITION("currentRepetition"),
		REPETITIONS_OF_PARENT("repetitionsOfParent"),
		CURRENT_REPETITION_OF_PARENT("currentRepetitionOfParent"),
		CONSTANT("metadata");

		@NonNull
		private final String key;

		MetaField(@NonNull String k) {
			key = k;
		}

		public @NonNull String getKey() {
			return key;
		}

		public boolean isPathDependent() {
			return switch (this) {
				case VALUE, CONSTANT, LITERAL_VALUE -> true;
				case REPETITIONS, CURRENT_REPETITION, REPETITIONS_OF_PARENT, CURRENT_REPETITION_OF_PARENT -> false;
			};
		}
	}

}
