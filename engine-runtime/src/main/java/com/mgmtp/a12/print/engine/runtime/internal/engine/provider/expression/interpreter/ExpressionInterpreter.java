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
package com.mgmtp.a12.print.engine.runtime.internal.engine.provider.expression.interpreter;

import com.mgmtp.a12.kernel.md.model.api.IElement;
import com.mgmtp.a12.kernel.md.model.api.IField;
import com.mgmtp.a12.print.engine.api.exception.PrintCompilerException;
import com.mgmtp.a12.print.engine.runtime.internal.engine.hashing.IDService;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.expression.parser.ExpressionNode;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.PrintModelCompilationContext;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.*;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.visitor.SyntaxTreeRenderer;
import com.mgmtp.a12.print.model.api.model.element.ElementType;
import com.mgmtp.a12.print.model.api.model.element.PrintModelElement;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.base.ComputationAlternativeDto;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.type.calculation.CalculationDto;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.type.calculation.CalculationPropertiesDto;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.type.field.FieldDto;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.type.field.FieldPropertiesDto;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.function.Supplier;

@Slf4j
public class ExpressionInterpreter {
	@NonNull
	private final String elementId;
	private final ArrayList<PrintModelElement> includedEntities = new ArrayList<>();
	@NonNull
	private final Supplier<String> idFactory;
	private String content = "";
	private String modelId;

	public ExpressionInterpreter(@NonNull String elementId, @NonNull Supplier<String> idFactory) {
		this.elementId = elementId;
		this.idFactory = idFactory;
	}

	public @NonNull String getElementId() {
		return elementId;
	}

	public ArrayList<PrintModelElement> getIncludedEntities() {
		return includedEntities;
	}

	public String getContent() {
		return content;
	}

	public ExpressionInterpreter interpret(
		ExpressionNode rootNode,
		String modelId,
		String context,
		PrintModelCompilationContext printModel
	) {
		this.modelId = modelId;
		if (rootNode.getType().equals("filter")) {
			if (rootNode.getContent() != null && rootNode.getContext() != null) {
				includedEntities.add(getFilterEntity(rootNode, context, printModel));
			}
		} else {
			for (ExpressionNode node : rootNode.getChildren()) {
				this.interpretNode(node, context.length() > 0 ? context : "/", printModel);
			}
		}
		return this;
	}

	private PrintModelElement getFilterEntity(
		ExpressionNode rootNode,
		String context,
		PrintModelCompilationContext printModel
	) {
		var filterExpression = traverseFilterContext(rootNode, "");
		var path = join(this.modelId, join(context, filterExpression));

		var constant = Constant.builder()
			.value(rootNode.getContent())
			.constantType(getConstantTypeByPath(filterExpression, context, printModel))
			.build();

		var variable = Variable.builder()
			.segments(getReferenceSegments(path))
			.build();

		var dereference = Dereference.builder()
			.variable(variable)
			.build();

		var compare = Compare.builder()
			.branches(new CompareBranch[]{dereference, constant});

		final var isEqualityOperator = isEqualityOperator(rootNode);
		final var equalityPrecondition = new SyntaxTreeRenderer().render(
			compare.operator(Compare.Operator.EQUALITY).build()
		);
		final var unEqualityPrecondition = new SyntaxTreeRenderer().render(
			compare.operator(Compare.Operator.UN_EQUALITY).build()
		);

		var computationAlternativeTrue =
			ComputationAlternativeDto.builder()
				.precondition(isEqualityOperator ? equalityPrecondition : unEqualityPrecondition)
				.operation("\"True\"")
				.id(IDService.getId())
				.build();

		var computationAlternativeFalse =
			ComputationAlternativeDto.builder()
				.precondition(isEqualityOperator ? unEqualityPrecondition : equalityPrecondition)
				.operation("\"False\"")
				.id(IDService.getId())
				.build();

		return CalculationDto.builder()
			 .id(rootNode.getName())
			 .type(ElementType.CALCULATION)
			 .calculationProperties(
				 CalculationPropertiesDto.builder()
					 .computationAlternatives(List.of(computationAlternativeFalse, computationAlternativeTrue))
					 .id(IDService.getId())
					 .model(this.modelId)
					 .name(rootNode.getName())
					 .build()
			 )
			 .build();
	}

	private boolean isEqualityOperator(ExpressionNode node) {
		return switch (node.getOperation()) {
			case "=", "==" -> true;
			case "!=" -> false;
			default ->
				throw new PrintCompilerException(String.format("Unsupported operator '%s' in filter expression", node.getOperation()));
		};
	}

	private Constant.ConstantType getConstantTypeByPath(
		String filterExpression,
		String context,
		PrintModelCompilationContext printModel
	) {
		var documentModelIndexMap = printModel.getDocumentModelIndexMap();
		var documentModelIndex = documentModelIndexMap.get(this.modelId);
		var pathToField = join(context, filterExpression);

		Optional<IElement> element = documentModelIndex != null
			? documentModelIndex.getByPath(pathToField)
			: Optional.empty();

		if (element.isEmpty() || !(element.get() instanceof IField)) {
			throw new PrintCompilerException(
				String.format(
					"The field \"%s\" specified in the filter expression cannot be found in the document model", pathToField
				)
			);
		}

		var computationFieldType = ComputationFieldTypeExt.computationFieldTypeFrom(((IField) element.get()).getFieldType());
		return ConstantTypeExt.constantTypeFrom(computationFieldType);
	}

	private ReferenceSegment[] getReferenceSegments(String path) {
		var segments = path.split("/");
		List<ReferenceSegment> referenceSegments = new ArrayList<>();

		for (String segment : segments){
			referenceSegments.add(ReferenceSegment.builder().label(segment).build());
		}

		return referenceSegments.toArray(new ReferenceSegment[0]);
	}

	private String traverseFilterContext(ExpressionNode node, String path) {
		ExpressionNode context = node.getContext();
		if (context != null) {
			String currentPath = path.length() > 1 ?
				String.format("%s/%s", path, context.getName()) :
				context.getName();
			if (context.getType().equals("field")) {
				return currentPath;
			} else {
				return traverseFilterContext(node.getContext(), currentPath);
			}
		}
		return path;
	}

	private void interpretNode(ExpressionNode node, String path, PrintModelCompilationContext printModel) {

		switch (node.getType()) {
			case "group": {
				for (ExpressionNode child : node.getChildren()) {
					this.interpretNode(child, join(path, node.getName()), printModel);
				}
				break;
			}
			case "field": {
				final String id = idFactory.get();
				this.content += String.format("$%s$", id);

				var field = FieldDto.builder()
					.id(id)
					.type(ElementType.FIELD)
					.fieldProperties(
						FieldPropertiesDto.builder()
							.id(IDService.getId())
							.model(this.modelId)
							.path(join(path, node.getName()))
							.build()
					).build();


				this.includedEntities.add(field);
				break;
			}

			case "string": {
				if (node.getContent() != null) {
					this.content += node.getContent();
				}
				break;
			}
			case "token": {
				switch (node.getName()) {
					case "newline": {
						this.content += "<br/>";
						break;
					}
					case "": {
						break;
					}
					default: {
						log.warn("found unknown token-node" + node.getName());
					}
				}
				break;
			}
			case "case": {
				final String id = idFactory.get();
				String fieldPath = join(this.modelId, join(path, node.getName()));
				String operator = node.getOperation().equals("equal") ? "==" : "!=";

				this.content += String.format("$%s$", id);
				var nestedExpression = new ExpressionInterpreter(elementId, idFactory)
					.interpret(node, modelId, path, printModel);

				String precondition;
				if (node.getContent().length() > 0) {
					precondition = String.format(
						"[%s] %s \"%s\"",
						fieldPath,
						operator,
						node.getContent()
					);
				} else if (node.getOperation().equals("equal")) {
					precondition = String.format("FieldNotFilled(%s)", fieldPath);
				} else {
					precondition = String.format("FieldFilled(%s)", fieldPath);
				}

				ComputationAlternativeDto computationAlternative = ComputationAlternativeDto.builder()
					.precondition(precondition)
					.operation(String.format("\"%s\"", nestedExpression.getContent()))
					.id(IDService.getId())
					.build();

				var calculationDto = CalculationDto.builder()
					.id(id)
					.type(ElementType.CALCULATION)
					.calculationProperties(
						CalculationPropertiesDto.builder()
							.name(fieldPath)
							.id(IDService.getId())
							.model(this.modelId)
							.computationAlternatives(List.of(computationAlternative))
							.build()
					).build();


				this.includedEntities.add(calculationDto);
				this.includedEntities.addAll(nestedExpression.getIncludedEntities());
				break;
			}
			case "multilingualtext":
			case "filter":
			default: {
				throw new PrintCompilerException(String.format("Expression element '%s' is currently not supported", node.getName()));
			}
		}
	}

	private String join(String a, String b) {
		if (a.length() < 1) {
			return b;
		}
		if (a.charAt(a.length() - 1) == '/' || b.charAt(0) == '/') {
			return String.format("%s%s", a, b);
		} else {
			return String.format("%s%s%s", a, '/', b);
		}
	}
}
