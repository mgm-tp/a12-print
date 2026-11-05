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

import com.mgmtp.a12.print.engine.api.exception.impl.PrintDomainException;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.expression.parser.ExpressionParser;
import com.mgmtp.a12.print.model.api.model.element.PrintModelElement;
import com.mgmtp.a12.print.model.api.model.element.base.ComputationAlternative;
import com.mgmtp.a12.print.model.api.model.element.type.calculation.Calculation;
import com.mgmtp.a12.print.model.api.model.element.type.field.Field;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ExpressionInterpreterTest {

	private static final String MODEL = "DM";
	private static final String ELEMENT_ID = "E1";

	private static ExpressionInterpreter interpret(String expression) {
		return interpret(expression, "/");
	}

	private static ExpressionInterpreter interpret(String expression, String basePath) {
		var parserResult = new ExpressionParser(false).parse(expression);
		assertThat(parserResult.hasError())
			.withFailMessage("Unexpected parser error for '%s': %s", expression, parserResult.getErrorMessage())
			.isFalse();
		var counter = new AtomicInteger();
		return new ExpressionInterpreter(ELEMENT_ID, () -> "Expression@" + ELEMENT_ID + "@" + counter.getAndIncrement())
			.interpret(parserResult.getNode(), MODEL, basePath, null);
	}

	private static String placeholder(int index) {
		return "$Expression@" + ELEMENT_ID + "@" + index + "$";
	}

	private static Field field(PrintModelElement element) {
		assertThat(element).isInstanceOf(Field.class);
		return (Field) element;
	}

	private static Calculation calculation(PrintModelElement element) {
		assertThat(element).isInstanceOf(Calculation.class);
		return (Calculation) element;
	}

	private static ComputationAlternative singleAlternative(Calculation calculation) {
		List<ComputationAlternative> alternatives = List.copyOf(calculation.getCalculationProperties().getComputationAlternatives());
		assertThat(alternatives).hasSize(1);
		return alternatives.get(0);
	}

	@Nested
	class Strings {

		@Test
		void strings_areConcatenatedWithoutSeparator() {
			var result = interpret("\"Hello\" \"World\"");
			assertThat(result.getContent()).isEqualTo("HelloWorld");
			assertThat(result.getIncludedEntities()).isEmpty();
		}

		@Test
		void markdown_isPassedThroughUnchanged() {
			var result = interpret("\"**\" [first] \"**\"");
			assertThat(result.getContent()).isEqualTo("**" + placeholder(0) + "**");
		}

		@Test
		void newlineInsideString_isKeptRaw() {
			var result = interpret("\"a\nb\"");
			assertThat(result.getContent()).isEqualTo("a\nb");
		}
	}

	@Nested
	class Fields {

		@Test
		void field_isReplacedByPlaceholderAndVirtualField() {
			var result = interpret("\"Name: \" [first]");
			assertThat(result.getContent()).isEqualTo("Name: " + placeholder(0));
			assertThat(result.getIncludedEntities()).hasSize(1);
			var field = field(result.getIncludedEntities().get(0));
			assertThat(field.getId()).isEqualTo("Expression@E1@0");
			assertThat(field.getFieldProperties().getModel()).isEqualTo(MODEL);
			assertThat(field.getFieldProperties().getPath()).isEqualTo("/first");
		}

		@Test
		void formatter_isIgnored() {
			var result = interpret("[amount | currency]");
			assertThat(field(result.getIncludedEntities().get(0)).getFieldProperties().getDisplayOptions()).isEmpty();
		}

		@Test
		void basePath_isPrefixedToFieldPath() {
			var result = interpret("[first]", "/person");
			assertThat(field(result.getIncludedEntities().get(0)).getFieldProperties().getPath()).isEqualTo("/person/first");
		}

		@Test
		void emptyBasePath_isTreatedAsRoot() {
			var result = interpret("[first]", "");
			assertThat(field(result.getIncludedEntities().get(0)).getFieldProperties().getPath()).isEqualTo("/first");
		}

		@Test
		void sameFieldTwice_createsTwoVirtualFields() {
			var result = interpret("[first] [first]");
			assertThat(result.getContent()).isEqualTo(placeholder(0) + placeholder(1));
			assertThat(result.getIncludedEntities()).hasSize(2);
		}
	}

	@Nested
	class Groups {

		@Test
		void kontext_extendsPathOfNestedFields() {
			var result = interpret("kontext(general) { [first] }");
			assertThat(field(result.getIncludedEntities().get(0)).getFieldProperties().getPath()).isEqualTo("/general/first");
		}

		@Test
		void nestedKontext_extendsPathPerLevel() {
			var result = interpret("kontext(a) { kontext(b) { [c] } }", "/root");
			assertThat(field(result.getIncludedEntities().get(0)).getFieldProperties().getPath()).isEqualTo("/root/a/b/c");
		}

		@Test
		void siblingKontexts_useTheirOwnPath() {
			var result = interpret("kontext(a){[x]}kontext(b){[y]}");
			assertThat(result.getIncludedEntities()).extracting(element -> field(element).getFieldProperties().getPath()).containsExactly("/a/x", "/b/y");
		}

		// the original Expression language iterates repeatable groups; Print creates a single field without index,
		// which fails at print time as soon as the group has more than one instance
		@Test
		void kontext_doesNotIterateRepeatableGroups() {
			var result = interpret("kontext(persons) { [name] }");
			assertThat(result.getContent()).isEqualTo(placeholder(0));
			assertThat(result.getIncludedEntities()).hasSize(1);
			assertThat(field(result.getIncludedEntities().get(0)).getFieldProperties().getPath()).isEqualTo("/persons/name");
		}
	}

	@Nested
	class Cases {

		@Test
		void caseEqual_becomesCalculationWithEqualityPrecondition() {
			var result = interpret("case [first] = \"Hello\" { \"matched\" }");
			assertThat(result.getContent()).isEqualTo(placeholder(0));
			var calculation = calculation(result.getIncludedEntities().get(0));
			assertThat(calculation.getCalculationProperties().getModel()).isEqualTo(MODEL);
			var alternative = singleAlternative(calculation);
			assertThat(alternative.getPrecondition()).contains("[DM/first] == \"Hello\"");
			assertThat(alternative.getOperation()).isEqualTo("\"matched\"");
		}

		@Test
		void caseNotEqual_becomesCalculationWithUnEqualityPrecondition() {
			var result = interpret("case [first] != \"Hello\" { \"other\" }");
			assertThat(singleAlternative(calculation(result.getIncludedEntities().get(0))).getPrecondition()).contains("[DM/first] != \"Hello\"");
		}

		@Test
		void caseEqualEmpty_checksFieldNotFilled() {
			var result = interpret("case [first] = \"\" { \"empty\" }");
			assertThat(singleAlternative(calculation(result.getIncludedEntities().get(0))).getPrecondition()).contains("FieldNotFilled(DM/first)");
		}

		@Test
		void caseNotEqualEmpty_checksFieldFilled() {
			var result = interpret("case [first] != \"\" { \"filled\" }");
			assertThat(singleAlternative(calculation(result.getIncludedEntities().get(0))).getPrecondition()).contains("FieldFilled(DM/first)");
		}

		@Test
		void multipleCases_createOneCalculationEach() {
			var result = interpret("case [gender] = \"m\" {\"Mr\"} case [gender] != \"m\" {\"Mrs\"}");
			assertThat(result.getContent()).isEqualTo(placeholder(0) + placeholder(1));
			assertThat(result.getIncludedEntities())
				.extracting(element -> singleAlternative(calculation(element)).getPrecondition())
				.satisfiesExactly(
					precondition -> assertThat(precondition).contains("[DM/gender] == \"m\""),
					precondition -> assertThat(precondition).contains("[DM/gender] != \"m\""));
		}

		@Test
		void caseInsideKontext_usesGroupPath() {
			var result = interpret("kontext(general) { case [first] = \"x\" { \"y\" } }", "/root");
			assertThat(singleAlternative(calculation(result.getIncludedEntities().get(0))).getPrecondition()).contains("[DM/root/general/first] == \"x\"");
		}

		@Test
		void fieldInsideCaseBody_becomesPlaceholderInOperation() {
			var result = interpret("case [a] = \"1\" { \"Value: \" [b] }");
			assertThat(result.getContent()).isEqualTo(placeholder(0));
			assertThat(result.getIncludedEntities()).hasSize(2);
			var alternative = singleAlternative(calculation(result.getIncludedEntities().get(0)));
			assertThat(alternative.getOperation()).isEqualTo("\"Value: " + placeholder(1) + "\"");
			assertThat(field(result.getIncludedEntities().get(1)).getFieldProperties().getPath()).isEqualTo("/b");
		}

		@Test
		void nestedCase_createsCalculationForEachLevel() {
			var result = interpret("case [a] = \"1\" { case [b] = \"2\" { \"both\" } }");
			assertThat(result.getIncludedEntities()).hasSize(2);
			var outer = singleAlternative(calculation(result.getIncludedEntities().get(0)));
			var inner = singleAlternative(calculation(result.getIncludedEntities().get(1)));
			assertThat(outer.getOperation()).isEqualTo("\"" + placeholder(1) + "\"");
			assertThat(inner.getPrecondition()).contains("[DM/b] == \"2\"");
			assertThat(inner.getOperation()).isEqualTo("\"both\"");
		}

		@Test
		void markdownInsideCaseBody_isPassedIntoCalculationOperation() {
			var result = interpret("case [a] = \"1\" { \"**bold**\" }");
			assertThat(singleAlternative(calculation(result.getIncludedEntities().get(0))).getOperation()).isEqualTo("\"**bold**\"");
		}

		@Test
		void htmlInsideCaseBody_isPassedIntoCalculationOperation() {
			var result = interpret("case [a] = \"1\" { \"x<br>y\" }");
			assertThat(singleAlternative(calculation(result.getIncludedEntities().get(0))).getOperation()).isEqualTo("\"x<br>y\"");
		}
	}

	@Nested
	class LineBreaks {

		@Test
		void emptyLine_becomesBrTag() {
			var result = interpret("\"a\"\n\n\"b\"");
			assertThat(result.getContent()).isEqualTo("a<br/>b");
		}

		@Test
		void emptyLineBetweenFields_becomesBrTag() {
			var result = interpret("[a]\n\n[b]");
			assertThat(result.getContent()).isEqualTo(placeholder(0) + "<br/>" + placeholder(1));
		}

		@Test
		void leadingAndTrailingEmptyLines_becomeBrTags() {
			var result = interpret("\n\n\"a\"\n\n");
			assertThat(result.getContent()).isEqualTo("<br/>a<br/>");
		}

		@Test
		void twoOrMoreEmptyLines_areDropped() {
			var result = interpret("\"a\"\n\n\n\"b\"");
			assertThat(result.getContent()).isEqualTo("ab");
		}

		@Test
		void emptyLineInsideCaseBody_becomesBrTagInOperation() {
			var result = interpret("case [a] = \"1\" { \"x\"\n\n\"y\" }");
			assertThat(singleAlternative(calculation(result.getIncludedEntities().get(0))).getOperation()).isEqualTo("\"x<br/>y\"");
		}
	}

	@Nested
	class Unsupported {

		@Test
		void multilingualText_throws() {
			assertThatThrownBy(() -> interpret("(de: \"Hallo\", en: \"Hello\")")).isInstanceOf(PrintDomainException.class)
				.hasMessageContaining("currently not supported");
		}
	}
}
