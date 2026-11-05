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
package com.mgmtp.a12.print.engine.runtime.internal.engine.provider.expression.parser;

import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;

class ExpressionParserTest {

	private static ExpressionNode parse(String input) {
		var result = new ExpressionParser(false).parse(input);
		assertThat(result.hasError()).withFailMessage("Unexpected parser error for '%s': %s", input, result.getErrorMessage()).isFalse();
		assertThat(result.getNode().getType()).isEqualTo("root");
		return result.getNode();
	}

	private static List<ExpressionNode> parseChildren(String input) {
		return parse(input).getChildren();
	}

	private static void assertParseError(String input) {
		var result = new ExpressionParser(false).parse(input);
		assertThat(result.hasError()).withFailMessage("Expected a parser error for '%s' but got %s", input, result.getNode()).isTrue();
	}

	@Nested
	class Strings {

		@Test
		void quotedText_isStringNodeWithoutQuotes() {
			var children = parseChildren("\"Hello World!\"");
			assertThat(children).hasSize(1);
			assertThat(children.get(0).getType()).isEqualTo("string");
			assertThat(children.get(0).getContent()).isEqualTo("Hello World!");
		}

		@Test
		void multipleStrings_areSeparateNodes() {
			var children = parseChildren("\"a\" \"b\"");
			assertThat(children).extracting(ExpressionNode::getContent).containsExactly("a", "b");
		}

		@Test
		void whitespaceInsideString_isPreserved() {
			var children = parseChildren("\" test \"");
			assertThat(children.get(0).getContent()).isEqualTo(" test ");
		}

		@Test
		void emptyString_isAllowed() {
			var children = parseChildren("\"\"");
			assertThat(children.get(0).getType()).isEqualTo("string");
			assertThat(children.get(0).getContent()).isEmpty();
		}

		@Test
		void textWithoutQuotes_isRejected() {
			assertParseError("Hello");
		}

		// supported by the original Expression language since the switch to ANTLR
		@Test
		void escapedQuote_isNotSupported() {
			assertParseError("\"say \\\"hi\\\"\"");
		}
	}

	@Nested
	class Fields {

		@Test
		void field_isFieldNodeWithName() {
			var children = parseChildren("[first]");
			assertThat(children).hasSize(1);
			assertThat(children.get(0).getType()).isEqualTo("field");
			assertThat(children.get(0).getName()).isEqualTo("first");
		}

		@Test
		void fieldName_mayContainDigitsHyphenAndUnderscore() {
			var children = parseChildren("[field_1-a]");
			assertThat(children.get(0).getName()).isEqualTo("field_1-a");
		}

		@Test
		void whitespaceAroundFieldName_isIgnored() {
			var children = parseChildren("[ first ]");
			assertThat(children.get(0).getName()).isEqualTo("first");
		}

		// leftover of the legacy grammar, removed from the original Expression language in 2022
		@Test
		void fieldWithFormatter_keepsOnlyTheFieldName() {
			var children = parseChildren("[amount | currency]");
			assertThat(children).hasSize(1);
			assertThat(children.get(0).getType()).isEqualTo("field");
			assertThat(children.get(0).getName()).isEqualTo("amount");
		}

		@ParameterizedTest
		@ValueSource(strings = {"[general/first]", "[general.first]"})
		void fieldNameWithUnsupportedCharacters_isRejected(String input) {
			assertParseError(input);
		}

		@Test
		void stringsAndFields_canBeMixed() {
			var children = parseChildren("\"Name: \" [first] \" \" [last]");
			assertThat(children).extracting(ExpressionNode::getType).containsExactly("string", "field", "string", "field");
		}
	}

	@Nested
	class Groups {

		@Test
		void kontext_isGroupNodeWithChildren() {
			var children = parseChildren("kontext(general) { [first] \" \" [last] }");
			assertThat(children).hasSize(1);
			var group = children.get(0);
			assertThat(group.getType()).isEqualTo("group");
			assertThat(group.getName()).isEqualTo("general");
			assertThat(group.getChildren()).extracting(ExpressionNode::getType).containsExactly("field", "string", "field");
		}

		@Test
		void kontext_canBeNested() {
			var children = parseChildren("kontext(a) { kontext(b) { [c] } }");
			var outer = children.get(0);
			var inner = outer.getChildren().get(0);
			assertThat(inner.getType()).isEqualTo("group");
			assertThat(inner.getName()).isEqualTo("b");
			assertThat(inner.getChildren().get(0).getName()).isEqualTo("c");
		}

		@Test
		void siblingKontexts_doNotShareChildren() {
			var children = parseChildren("kontext(a){[x]}kontext(b){[y]}");
			assertThat(children).extracting(ExpressionNode::getName).containsExactly("a", "b");
			assertThat(children.get(0).getChildren()).extracting(ExpressionNode::getName).containsExactly("x");
			assertThat(children.get(1).getChildren()).extracting(ExpressionNode::getName).containsExactly("y");
		}

		// supported by the original Expression language since 2023
		@Test
		void delimiterOption_isNotSupported() {
			assertParseError("kontext(persons, delimiter = \", \") { [name] }");
		}
	}

	@Nested
	class Cases {

		@Test
		void caseEqual_isCaseNodeWithEqualOperation() {
			var children = parseChildren("case [first] = \"Hello\" { \"matched\" }");
			var caseNode = children.get(0);
			assertThat(caseNode.getType()).isEqualTo("case");
			assertThat(caseNode.getName()).isEqualTo("first");
			assertThat(caseNode.getOperation()).isEqualTo("equal");
			assertThat(caseNode.getContent()).isEqualTo("Hello");
			assertThat(caseNode.getChildren()).extracting(ExpressionNode::getContent).containsExactly("matched");
		}

		@Test
		void caseNotEqual_isCaseNodeWithNotEqualOperation() {
			var children = parseChildren("case [first] != \"Hello\" { \"other\" }");
			assertThat(children.get(0).getOperation()).isEqualTo("not_equal");
		}

		@Test
		void caseWithEmptyValue_hasEmptyContent() {
			var children = parseChildren("case [first] = \"\" { \"empty\" }");
			assertThat(children.get(0).getContent()).isEmpty();
		}

		@Test
		void multipleCases_areSiblingNodes() {
			var children = parseChildren("case [gender] = \"m\" {\"Mr\"} case [gender] != \"m\" {\"Mrs\"}");
			assertThat(children).extracting(ExpressionNode::getType, ExpressionNode::getOperation)
				.containsExactly(tuple("case", "equal"), tuple("case", "not_equal"));
		}

		@Test
		void caseWithoutWhitespace_isParsed() {
			var children = parseChildren("case[included]=\"false\"{\"x\"}");
			assertThat(children.get(0).getName()).isEqualTo("included");
			assertThat(children.get(0).getContent()).isEqualTo("false");
		}

		@Test
		void caseBody_canContainFieldsAndNestedCases() {
			var children = parseChildren("case [a] = \"1\" { [b] case [c] != \"2\" { \"x\" } }");
			assertThat(children.get(0).getChildren()).extracting(ExpressionNode::getType).containsExactly("field", "case");
		}

		@ParameterizedTest
		@ValueSource(strings = {
			"case [first] == \"Hello\" { \"x\" }",
			"case [first] = Hello { \"x\" }",
			"case [first] = [last] { \"x\" }",
			"case [first] > \"1\" { \"x\" }"
		})
		void unsupportedCaseSyntax_isRejected(String input) {
			assertParseError(input);
		}
	}

	@Nested
	class LineBreaks {

		@Test
		void singleNewline_isIgnored() {
			var children = parseChildren("\"a\"\n\"b\"");
			assertThat(children).extracting(ExpressionNode::getType).containsExactly("string", "string");
		}

		@Test
		void oneEmptyLine_isNewlineToken() {
			var children = parseChildren("\"a\"\n\n\"b\"");
			assertThat(children).extracting(ExpressionNode::getType).containsExactly("string", "token", "string");
			assertThat(children.get(1).getName()).isEqualTo("newline");
		}

		@Test
		void emptyLineWithWhitespace_isNewlineToken() {
			var children = parseChildren("\"a\"\n \t \n\"b\"");
			assertThat(children).extracting(ExpressionNode::getType).containsExactly("string", "token", "string");
		}

		@Test
		void leadingAndTrailingEmptyLines_areNewlineTokens() {
			var children = parseChildren("\n\n\"a\"\n\n");
			assertThat(children).extracting(ExpressionNode::getType).containsExactly("token", "string", "token");
		}

		// the lexer only matches \n, so an empty line with Windows line endings is skipped as whitespace
		@Test
		void emptyLineWithCarriageReturn_isIgnored() {
			var children = parseChildren("\"a\"\r\n\r\n\"b\"");
			assertThat(children).extracting(ExpressionNode::getType).containsExactly("string", "string");
		}

		@Test
		void twoOrMoreEmptyLines_isNewParagraphToken() {
			var children = parseChildren("\"a\"\n\n\n\"b\"");
			assertThat(children.get(1).getType()).isEqualTo("token");
			assertThat(children.get(1).getName()).isEqualTo("newparagraph");
		}

		@Test
		void newlineInsideString_isKeptAsContent() {
			var children = parseChildren("\"a\nb\"");
			assertThat(children).hasSize(1);
			assertThat(children.get(0).getContent()).isEqualTo("a\nb");
		}
	}

	@Nested
	class MultilingualTexts {

		@Test
		void multilingualText_isParsed() {
			var children = parseChildren("(de: \"Hallo\", en: \"Hello\")");
			assertThat(children).hasSize(1);
			assertThat(children.get(0).getType()).isEqualTo("multilingualtext");
			assertThat(children.get(0).getChildren()).extracting(ExpressionNode::getName, ExpressionNode::getContent).containsExactly(
					tuple("de", "Hallo"),
					tuple("en", "Hello")
				);
		}

		// the original Expression language also accepts region locales such as en_US
		@Test
		void localeWithRegion_isRejected() {
			assertParseError("(en: \"Hello\", en_US: \"Hello US\")");
		}
	}

	@Nested
	class OriginalExamples {

		// complex expression from the original Expression parser tests (core/test/parser.test.ts)
		@Test
		void complexExpression_isParsed() {
			var children = parseChildren("\"**\" [Nachname] \"**\" [Vorname] \"(\" [Geburtsdatum] \")\" \n\n "
				+ "(de:\"Adressen:\", en:\"Adresses:\")kontext(Adresse) { [Plz] [Ort] \n\n } "
				+ "(de:\"Kontakt:\", en:\"Contact:\")kontext(Kontakt) { case [Kontaktart] = \"TELEFON\" {[Telefonnummer]} "
				+ "case [Kontaktart] = \"EMAIL\" { [EmailAdresse] }}");
			assertThat(children).extracting(ExpressionNode::getType).containsExactly(
				"string", "field", "string", "field", "string", "field", "string", "token",
				"multilingualtext", "group", "multilingualtext", "group");
			assertThat(children.get(11).getChildren()).extracting(ExpressionNode::getType).containsExactly("case", "case");
		}

		// "Person" page of the original Expression showcase
		@Test
		void showcaseWithDelimiter_isRejected() {
			assertParseError("kontext(Person) { kontext(Education, delimiter = \", \") { [Major] \" (\" [SchoolName] \")\" } }");
		}
	}
}
