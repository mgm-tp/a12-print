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
package com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.rewrite;

import com.mgmtp.a12.kernel.md.model.api.*;
import com.mgmtp.a12.kernel.md.model.api.fieldtypes.IEnumerationType;
import com.mgmtp.a12.print.engine.api.exception.PrintCompilerException;
import com.mgmtp.a12.print.engine.runtime.internal.engine.hashing.IDService;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.synthetics.SyntheticVariable;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.DocumentModelIndex;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.KernelElementUtils;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.egg.EggRewriteRuleFactory;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.egg.EggRewriteRuleInstance;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.egg.RewriteSyntaxTree;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.egg.rules.ConstantToDereferenceGeneralisation;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.*;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.visitor.SyntaxTreeRenderer;
import lombok.Getter;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Optional;
import java.util.stream.Collectors;

import static com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.PrintModelCompiler.SYNTHETIC_ANNOTATIONS_DATA_MODEL;
import static com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.PrintModelCompiler.SYNTHETIC_METADATA_DATA_MODEL;
import static com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.rewrite.DataModelMetaFieldVariableRewrite.MetaFieldVariable.ANNOTATION;

@Getter
@RequiredArgsConstructor
public class DataModelMetaFieldVariableRewrite implements EggRewriteRuleFactory {

	private static final String NOT_SUPPORTED_FOR_ELEMENT = "is not supported for";
	private static final String INVALID_FOR_ELEMENT = "is invalid for";

	@NonNull
	private final DocumentModelIndex documentModel;

	@NonNull
	private final ConstantToDereferenceGeneralisation constantVariable;

	public static MetaFieldVariable classify(Variable variable) {
		if (variable.getSegments().length < 2) {
			return MetaFieldVariable.UNKNOWN;
		}

		final var label = variable.getSegments()[0].getLabel();
		if (label.equals(SYNTHETIC_ANNOTATIONS_DATA_MODEL)) {
			return ANNOTATION;
		} else if (label.equals(SYNTHETIC_METADATA_DATA_MODEL)) {
			return MetaFieldVariable.ELEMENT_META_DATA;
		}

		return MetaFieldVariable.UNKNOWN;

	}

	private static Optional<IElement> findElement(Variable variable, DocumentModelIndex documentModelIndex) {
		final var segments = variable.getSegments();
		final var elementPath = SyntaxTreeRenderer.getPath(
			true,
			Arrays.stream(segments)
				.limit((long) segments.length - 1)
				.skip(1)
				.toArray(ReferenceSegment[]::new)
		);

		return documentModelIndex.getDocumentModelSearchService().getByPath(elementPath);
	}

	private static PrintCompilerException exceptionFor(String labelKey, String message, IElement element) {
		return new PrintCompilerException(String.format("%s %s %s", message, labelKey, KernelElementUtils.getPath(element)));
	}

	private Variable rewriteConstant(Constant constant) {
		final var deref = constantVariable.apply(constant);
		return ((Dereference) deref).getVariable();
	}

	private Variable rewriteToNotFilled() {
		return SyntheticVariable.NotFilled;
	}

	private Variable rewriteLocalizedText(SyntheticVariable.MetaConstant constant, IElement element, ILocalizedTextMap textMap) {
		if (textMap.isEmpty()) {
			return rewriteToNotFilled();
		} else {
			final var path = KernelElementUtils.getPath(element);
			return SyntheticVariable.createMeta(
				path,
				documentModel.getDocumentModel().getHeader().getId(),
				SyntheticVariable.MetaField.CONSTANT,
				constant
			);
		}
	}

	private static Constant rewriteNumericConstant(int value) {
		final var literal = new BigDecimal(value).toString();
		return Constant.builder().constantType(Constant.ConstantType.INTEGER).value(literal).build();
	}

	private static Constant rewriteBooleanConstant(boolean value) {
		if (value) {
			return Constant.TRUE;
		} else {
			return Constant.FALSE;
		}
	}

	private static Constant createStringConstant(String value) {
		return Constant.builder().constantType(Constant.ConstantType.STRING).value(value).build();
	}

	public static Constant resolveToConstant(Variable variable, DocumentModelIndex documentModelIndex) {
		final var variableClass = classify(variable);

		if (!variableClass.equals(MetaFieldVariable.ELEMENT_META_DATA)) {
			return null;
		}

		final var elementEntity = findElement(variable, documentModelIndex);

		if (elementEntity.isEmpty()) {
			return null;
		}

		final var element = elementEntity.get();
		final var lastSegment = variable.getSegments()[variable.getSegments().length - 1].getLabel();

		return resolveCompileTimeConstant(element, SyntheticVariable.MetaConstant.findByKey(lastSegment), lastSegment);
	}

	@Override
	public EggRewriteRuleInstance instantiate(final SyntaxTreeElement e) {
		var variableRenaming = RewriteSyntaxTree
			.withRules()
			.variable((o, c) -> {
				final var variableClass = classify(c);
				if (MetaFieldVariable.UNKNOWN.equals(variableClass)) {
					return b -> c;
				}

				final var elementEntity = findElement(c, documentModel);

				if (elementEntity.isEmpty()) {
					throw new PrintCompilerException("invalid element");
				}

				final var element = elementEntity.get();
				final var lastSegment = c.getSegments()[c.getSegments().length - 1].getLabel();

				if (variableClass.equals(ANNOTATION)) {
					return b -> createAnnotation(element, lastSegment);
				} else if (variableClass.equals(MetaFieldVariable.ELEMENT_META_DATA)) {
					final var metaConstant = SyntheticVariable.MetaConstant.findByKey(lastSegment);

					final var compileTimeConstant = resolveCompileTimeConstant(element, metaConstant, lastSegment);
					if (compileTimeConstant != null) {
						return b -> rewriteConstant(compileTimeConstant);
					}

					final var runtimeValue = resolveRuntimeValue(element, metaConstant, lastSegment);
					if (runtimeValue != null) {
						return b -> runtimeValue;
					}
				}

				throw exceptionFor(lastSegment, NOT_SUPPORTED_FOR_ELEMENT, element);

			})
			.build();

		return variableRenaming.instantiate(e);
	}

	private static Constant resolveCompileTimeConstant(IElement element, SyntheticVariable.MetaConstant metaConstant, String lastSegment) {
		switch (metaConstant) {
			case PATH: {
				final var pathList = KernelElementUtils.getPath(element);
				final var pathString = String.format("/%s/", pathList.stream().map(IIdNamed::getName).collect(Collectors.joining("/")));
				return createStringConstant(pathString);
			}
			case REQUIRED: {
				if (element instanceof IField field) {
					return rewriteBooleanConstant(field.getRequirednessConfig().isPresent());
				} else if (element instanceof IGroup) {
					return rewriteBooleanConstant(false);
				} else {
					throw exceptionFor(lastSegment, NOT_SUPPORTED_FOR_ELEMENT, element);
				}
			}
			case REPEATABILITY: {
				if (!(element instanceof IGroup)) {
					throw exceptionFor(lastSegment, INVALID_FOR_ELEMENT, element);
				}
				return rewriteNumericConstant(((IGroup) element).getRepeatability());
			}
			default:
				return null;
		}
	}

	private Variable resolveRuntimeValue(IElement element, SyntheticVariable.MetaConstant metaConstant, String lastSegment) {
		switch (metaConstant) {
			case LABEL: {
				if (!(element instanceof ILabeled)) {
					throw exceptionFor(lastSegment, INVALID_FOR_ELEMENT, element);
				}
				return rewriteLocalizedText(metaConstant, element, ((ILabeled) element).getLabel());
			}
			case EXTERNAL_DESCRIPTION: {
				return rewriteLocalizedText(metaConstant, element, element.getExternalDescription());
			}
			case ERROR_MESSAGE: {
				if (!(element instanceof IField)) {
					throw exceptionFor(lastSegment, INVALID_FOR_ELEMENT, element);
				}

				final var fieldElement = (IField) element;
				final var fieldTypeOptional = fieldElement.getEffectiveType();

				if (fieldTypeOptional.isEmpty()) {
					throw exceptionFor(lastSegment, INVALID_FOR_ELEMENT, element);
				}

				final var fieldType = fieldTypeOptional.get();
				if (!(fieldType instanceof IEnumerationType)) {
					throw exceptionFor(lastSegment, INVALID_FOR_ELEMENT, element);
				}

				return rewriteLocalizedText(SyntheticVariable.MetaConstant.ERROR_MESSAGE, element, ((IEnumerationType) fieldType).getErrorMessage());
			}
			default:
				return null;
		}
	}

	private Variable createAnnotation(IElement element, String lastSegment) {
		final var annotations = element.getAnnotations();
		final var annotation = annotations.stream().filter(anno ->
			IDService.sanitize(anno.getName()).equals(IDService.sanitize(lastSegment))
		).findFirst().orElse(null);
		if (annotation != null && annotation.getValue() != null) {
			return rewriteConstant(createStringConstant(annotation.getValue()));
		} else {
			return rewriteToNotFilled();
		}
	}

	public enum MetaFieldVariable {
		UNKNOWN,
		ANNOTATION,
		ELEMENT_META_DATA
	}
}
