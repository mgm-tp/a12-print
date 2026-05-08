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
package com.mgmtp.a12.print.engine.runtime;

import com.mgmtp.a12.print.engine.runtime.internal.engine.constant.Constants;
import com.mgmtp.a12.print.engine.runtime.pdf.PdfPrintEngine;
import com.mgmtp.a12.print.engine.runtime.test.internal.PrintTestUtil;
import com.mgmtp.a12.print.engine.runtime.utils.PdfRuntimeTestUtil;
import com.mgmtp.a12.print.engine.runtime.utils.PrintEngineTest;
import com.mgmtp.a12.print.engine.runtime.utils.PrintPdfGenerationTest;

import org.apache.commons.lang3.StringUtils;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.verapdf.pdfa.flavours.PDFAFlavour;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TimeZone;

import static com.mgmtp.a12.print.engine.runtime.utils.PdfRuntimeTestUtil.getFirstLine;
import static com.mgmtp.a12.print.engine.runtime.utils.PdfRuntimeTestUtil.getOneLineTemplate;
import static com.mgmtp.a12.print.engine.runtime.utils.PrintEngineTestExecutor.DEFAULT_EXECUTOR;
import static org.assertj.core.api.Assertions.assertThat;

class PdfGenerationTest extends PrintPdfGenerationTest {

	private static final String FIRST_PAGE_CONTENT = "Test TextFlow: <span entity-id=\"Bh8Qr9ZG9283i87ZIPcY_\" entity-type=\"Field\"><span class=\"field " +
		"nested\">Test String</span></span> <span entity-id=\"vkMPtkFmNFedvHa3l7fOo\" " +
		"entity-type=\"Calculation\"><span class=\"calculation nested\">Test String</span></span>";
	private static final String FIRST_PAGE_CONTENT_2 = "<span style=\"color:#cd1313\">Farbe</span>";
	private static final String FIRST_PAGE_CONTENT_3 = "<span style=\"background-color:#1c8415\">Hintergrund</span>";
	private static final String[] EXPECTED_SPLIT_TABLE_PAGE_TEXTS = {
		"Lorem ipsum dolor\nsit amet,",
		"consectetur\nadipiscing elit, sed\ndo eiusmod tempor\nincididunt ut labore\net dolore magna\naliqua. Ut enim ad\nminim veniam, quis\nnostrud\nexercitation\nullamco laboris nisi\nut aliquip ex ea\ncommodo\nconsequat. Duis\naute irure dolor in\nreprehenderit in\nvoluptate velit esse\ncillum dolore eu\nfugiat nulla\npariatur. Excepteur\nsint occaecat\ncupidatat non\nproident, sunt in\nculpa qui officia\ndeserunt mollit\nanim id est.",
		"The standard\nLorem Ipsum\npassage, used since\nthe 1500s\nThe standard\nLorem Ipsum\npassage, used since\nthe 1500s\nThe standard\nLorem Ipsum\npassage, used since\nthe 1500s",
		"Lorem ipsum dolor\nsit amet,\nconsectetuer\nadipiscing elit.\nAenean commodo\nligula eget dolor.\nAenean\nmassa.Lorem\nipsum dolor sit\namet, consectetuer\nadipiscing elit.\nAenean commodo\nligula eget dolor.\nAenean commodo\nligula eget dolor.\nAenean commodo\nligula eget dolor."
	};

	private static final String[] EXPECTED_SPLIT_LISTING_PAGE_TEXTS = {
		"",
		"Column Column Column\nSed ut\nperspiciatis\nunde omnis\niste natus error\nsit voluptatem\naccusantium\ndoloremque\nlaudantium,\ntotam rem\naperiam, eaque\nipsa quae ab\nillo inventore\nveritatis et\nquasi\narchitecto\nbeatae vitae\ndicta sunt\nexplicabo.\nNemo enim\nipsam\nvoluptatem\nquia voluptas\nsit aspernatur\naut odit aut\nfugit, sed quia\nconsequuntur\nmagni dolores\neos qui ratione\n",
		"Column Column Column\nvoluptatem\nsequi nesciunt.\nNeque porro\nquisquam est,\nqui dolorem\nipsum quia\ndolor sit amet,\nconsectetur,\nadipisci velit,\nsed quia non\nnumquam eius\nmodi tempora\nincidunt ut\nlabore et\ndolore\nmagnam\naliquam\nquaerat\nvoluptatem. Ut\nenim ad\nminima\nveniam, quis\nnostrum\nexercitationem\nullam corporis\nsuscipit\nlaboriosam, nisi\nut aliquid ex ea\nHello World\nLorem ipsum\ndolor sit amet\nconsectetur\nadipiscing elit\nquisque\nfaucibus ex\nsapien vitae\npellentesque\nsem placerat in\nid cursus mi\npretium tellus\nduis convallis\ntempus leo eu.\n",
		"Column Column Column\ncommodi\nconsequatur?\nQuis autem vel\neum iure\nreprehenderit\nqui in ea\nvoluptate velit\nesse quam nihil\nmolestiae\nconsequatur,\nvel illum qui\ndolorem eum\nfugiat quo\nvoluptas nulla\npariatur?\nSed ut\nperspiciatis\nunde omnis\niste natus error\nsit voluptatem\naccusantium\ndoloremque\nlaudantium,\ntotam rem\naperiam, eaque\nipsa quae ab\nillo inventore\nveritatis et\n",
		"Column Column Column\nquasi\narchitecto\nbeatae vitae\ndicta sunt\nexplicabo.\nNemo enim\nipsam\nvoluptatem\nquia voluptas\nsit aspernatur\naut odit aut\nfugit, sed quia\nconsequuntur\nmagni dolores\neos qui ratione\nvoluptatem\nsequi nesciunt.\nNeque porro\nquisquam est,\nqui dolorem\nipsum quia\ndolor sit amet,\nconsectetur,\nadipisci velit,\nsed quia non\nnumquam eius\nmodi tempora\nincidunt ut\nHello World\nLorem ipsum\ndolor sit amet\nconsectetur\nadipiscing elit\nquisque\nfaucibus ex\nsapien vitae\npellentesque\nsem placerat in\nid cursus mi\npretium tellus\nduis convallis\ntempus leo eu.\n"
	};

	@PrintEngineTest(pdfFileName = "field")
	public void testFieldElement(boolean usePdfBoxPrintProcess, String usedEngine) {
		final String printModel = PrintTestUtil.loadFromResources("/data/field/FieldPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/field/FieldDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/field/FieldDM-1.json");

		final var result = DEFAULT_EXECUTOR.toBuilder()
			.usePdfBoxPrintProcess(usePdfBoxPrintProcess)
			.timeZone(TimeZone.getTimeZone("MST"))
			.build()
			.execute(printModel, "FieldDM", documentModel, document);

		final File pdfFile = PdfRuntimeTestUtil.writeResultFiles(result, "field");

		// PDF is generated
		assertThat(result).isNotNull();

		if (!(result instanceof PdfPrintEngine.ResultWithMarkups resultWithMarkups)) { return; }

		final String firstPageMarkup = resultWithMarkups.getSegmentHtmlMarkup().get(0);
		assertThat(firstPageMarkup).contains("Hello", "World!");
		assertThat(firstPageMarkup).contains("Lorem", "Ipsum...");
		assertThat(pdfFile.exists()).isTrue();

		assertThat(firstPageMarkup).contains("Noto Sans Symbols");
		assertThat(firstPageMarkup).contains("\u2611");
		assertThat(firstPageMarkup).contains("\u2610");
		assertThat(firstPageMarkup).contains("\u2618");
		assertThat(firstPageMarkup).contains("14 03 2023-29 03 2023");
		assertThat(firstPageMarkup).doesNotContain("\u2619");

		final String content = PdfRuntimeTestUtil.getFileContent(pdfFile);

		assertThat(content).contains("Hello", "World", "!");
		assertThat(content).contains("Lorem", "Ipsum...");
	}

	@PrintEngineTest(pdfFileName = "calculation")
	public void testCalculationElement(boolean usePdfBoxPrintProcess, String usedEngine) {
		final String printModel = PrintTestUtil.loadFromResources("/data/computation/CalculationPM" +
			".json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/computation/CalculationDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/computation/CalculationDM-1.json");

		final var result = DEFAULT_EXECUTOR.toBuilder().usePdfBoxPrintProcess(usePdfBoxPrintProcess).build()
			.execute(printModel, "CalculationDM", documentModel, document);

		final File pdfFile = PdfRuntimeTestUtil.writeResultFiles(result, "calculation");

		// PDF is generated
		assertThat(result).isNotNull();

		if (!(result instanceof PdfPrintEngine.ResultWithMarkups resultWithMarkups)) { return; }

		final String firstPageMarkup = resultWithMarkups.getSegmentHtmlMarkup().get(0);
		assertThat(firstPageMarkup).contains("World");
		assertThat(firstPageMarkup).contains("2023_12_01to2024/01/31");
		assertThat(firstPageMarkup).contains("18%");
		assertThat(firstPageMarkup).contains("2019-02-06");

		final String content = PdfRuntimeTestUtil.getFileContent(pdfFile);

		assertThat(content).contains("World");
	}

	@PrintEngineTest(pdfFileName = "text")
	public void testTextElement(boolean usePdfBoxPrintProcess, String usedEngine) {
		final String printModel = PrintTestUtil.loadFromResources("/data/text/TextPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/text/TextDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/text/TextDM-1.json");

		final var result = DEFAULT_EXECUTOR.toBuilder().usePdfBoxPrintProcess(usePdfBoxPrintProcess).build()
			.execute(printModel, "TextDM", documentModel, document);

		final File pdfFile = PdfRuntimeTestUtil.writeResultFiles(result, "text");

		// PDF is generated
		assertThat(result).isNotNull();

		if (!(result instanceof PdfPrintEngine.ResultWithMarkups resultWithMarkups)) { return; }

		final String firstPageMarkup = getOneLineTemplate(resultWithMarkups.getSegmentHtmlMarkup().getFirst());
		assertThat(firstPageMarkup).doesNotContain("<div><p>TEST</p></div>");
		assertThat(firstPageMarkup).contains("<p>TEST</p>");

		assertThat(firstPageMarkup).contains(FIRST_PAGE_CONTENT);
		assertThat(firstPageMarkup).contains(FIRST_PAGE_CONTENT_2);
		assertThat(firstPageMarkup).contains(FIRST_PAGE_CONTENT_3);
		assertThat(firstPageMarkup).contains("<span style=\"font-size:24pt\">Gr\u00f6\u00dfe</span>");

		assertThat(firstPageMarkup).doesNotContain("Empty Text-Flow:");

		assertThat(firstPageMarkup).contains("<span style=\"color:#d71414;background-color:#70e411\" entity-id=\"MZYIOzPW2pkdvUidefgxo\" " +
			"entity-type=\"PageNumber\"></span>");
		assertThat(firstPageMarkup).contains("<span style=\"color:#1723cf;background-color:#16df19\" entity-id=\"P2NDrLzLL5IP1Y27bWdxa\" " +
			"entity-type=\"PageNumberTotal\"></span>");
		assertThat(firstPageMarkup).contains("<p>Create new page for total page number</p>");

		// body is styled correctly
		assertThat(firstPageMarkup).contains("id=\"aymJotzgBFBPVVufjeG89\"");
		assertThat(firstPageMarkup).contains("font-size: 14.0pt");
		assertThat(firstPageMarkup).contains("line-height: 21.0pt");
		assertThat(firstPageMarkup).contains("font-family: Open Sans");

		//headline wrapped in relevant heading tag
		assertThat(firstPageMarkup).contains("<h1 ");
		assertThat(firstPageMarkup).contains("</h1>");

		final String content = PdfRuntimeTestUtil.getFileContent(pdfFile);

		assertThat(content).contains("TEST");

		assertThat(content).contains("Test TextFlow:  Test String Test");
		assertThat(content).contains("Farbe");
		assertThat(content).contains("Hintergrund");
		assertThat(content).contains("Gr\u00f6\u00dfe");

		assertThat(content).doesNotContain("Empty Text-Flow:");

		// first segment page number
		assertThat(content).contains("1");
		// total page number
		assertThat(content).contains("4");
		// second segment page number
		assertThat(content).contains("3");
	}

	@PrintEngineTest(pdfFileName = "without-domain-model", flavours = {PDFAFlavour.PDFA_3_A})
	public void testTextElementWithoutDomainModel(boolean usePdfBoxPrintProcess, String usedEngine) {
		final String printModel = PrintTestUtil.loadFromResources("/data/text/TextWithoutDomainModelPM.json");
		final var result = DEFAULT_EXECUTOR.toBuilder().usePdfBoxPrintProcess(usePdfBoxPrintProcess).build()
			.execute(printModel, Constants.NO_SELECTED_DOCUMENT_ID, null, null);

		final File pdfFile = PdfRuntimeTestUtil.writeResultFiles(result, "without-domain-model");

		// PDF is generated
		assertThat(result).isNotNull();

		if (!(result instanceof PdfPrintEngine.ResultWithMarkups resultWithMarkups)) { return; }

		final String firstPageMarkup = resultWithMarkups.getSegmentHtmlMarkup().get(0);
		assertThat(firstPageMarkup).doesNotContain("<div><p>TEST</p></div>");
		assertThat(firstPageMarkup).contains("<p>TEST</p>");

		// body is styled correctly
		assertThat(firstPageMarkup).contains("id=\"aymJotzgBFBPVVufjeG89\"");
		assertThat(firstPageMarkup).contains("font-size: 11.0pt;");
		assertThat(firstPageMarkup).contains("line-height: 18.0pt");
		assertThat(firstPageMarkup).contains("font-family: Open Sans");

		//headline wrapped in relevant heading tag
		assertThat(firstPageMarkup).contains("<h2 ");
		assertThat(firstPageMarkup).contains("</h2>");

		final String content = PdfRuntimeTestUtil.getFileContent(pdfFile);

		assertThat(content).contains("TEST");
	}

	@PrintEngineTest(pdfFileName = "text-style")
	public void testTextElement_whenTextStyleIdIsNull_shouldUseDefaultTextStyle(boolean usePdfBoxPrintProcess, String usedEngine) {
		final String printModel = PrintTestUtil.loadFromResources("/data/text/TextPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/text/TextDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/text/TextDM-1.json");

		final var result = DEFAULT_EXECUTOR.toBuilder().usePdfBoxPrintProcess(usePdfBoxPrintProcess).build()
			.execute(printModel, "TextDM", documentModel, document);

		final File pdfFile = PdfRuntimeTestUtil.writeResultFiles(result, "text-style");

		// PDF is generated
		assertThat(result).isNotNull();

		if (!(result instanceof PdfPrintEngine.ResultWithMarkups resultWithMarkups)) { return; }

		final String firstPageMarkup = getOneLineTemplate(resultWithMarkups.getSegmentHtmlMarkup().getFirst());
		assertThat(firstPageMarkup).doesNotContain("<div><p>TEST</p></div>");
		assertThat(firstPageMarkup).contains("<p>TEST</p>");

		assertThat(firstPageMarkup).contains(FIRST_PAGE_CONTENT);
		assertThat(firstPageMarkup).contains(FIRST_PAGE_CONTENT_2);
		assertThat(firstPageMarkup).contains(FIRST_PAGE_CONTENT_3);
		assertThat(firstPageMarkup).contains("<span style=\"font-size:24pt\">Gr\u00f6\u00dfe</span>");

		assertThat(firstPageMarkup).doesNotContain("Empty Text-Flow:");

		assertThat(firstPageMarkup).contains("<span style=\"color:#d71414;background-color:#70e411\" entity-id=\"MZYIOzPW2pkdvUidefgxo\" " +
			"entity-type=\"PageNumber\"></span>");
		assertThat(firstPageMarkup).contains("<span style=\"color:#1723cf;background-color:#16df19\" entity-id=\"P2NDrLzLL5IP1Y27bWdxa\" " +
			"entity-type=\"PageNumberTotal\"></span>");
		assertThat(firstPageMarkup).contains("<p>Create new page for total page number</p>");

		// body is styled correctly
		assertThat(firstPageMarkup).contains("id=\"aymJotzgBFBPVVufjeG56\"");
		assertThat(firstPageMarkup).contains("font-size: 12.0pt;");
		assertThat(firstPageMarkup).contains("line-height: 18.0pt");
		assertThat(firstPageMarkup).contains("font-family: Open Sans");

		//headline wrapped in relevant heading tag
		assertThat(firstPageMarkup).contains("<p ");
		assertThat(firstPageMarkup).contains("</p>");

		final String content = PdfRuntimeTestUtil.getFileContent(pdfFile);

		assertThat(content).contains("TEST");

		assertThat(content).contains("Test TextFlow:  Test String Test");
		assertThat(content).contains("Farbe");
		assertThat(content).contains("Hintergrund");
		assertThat(content).contains("Gr\u00f6\u00dfe");

		assertThat(content).doesNotContain("Empty Text-Flow:");

		// first segment page number
		assertThat(content).contains("1");
		// total page number
		assertThat(content).contains("4");
		// second segment page number
		assertThat(content).contains("3");
	}

	@PrintEngineTest(pdfFileName = "horizontalLine")
	public void testHorizontalLineElement(boolean usePdfBoxPrintProcess, String usedEngine) {
		final String printModel = PrintTestUtil.loadFromResources("/data/horizontalLine/LinePM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/horizontalLine/LineDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/horizontalLine/LineDM-1.json");

		final var result = DEFAULT_EXECUTOR.toBuilder().usePdfBoxPrintProcess(usePdfBoxPrintProcess).build()
			.execute(printModel, "LineDM", documentModel, document);

		PdfRuntimeTestUtil.writeResultFiles(result, "horizontalLine");

		// PDF is generated
		assertThat(result).isNotNull();

		if (!(result instanceof PdfPrintEngine.ResultWithMarkups resultWithMarkups)) { return; }

		final String firstPageMarkup = resultWithMarkups.getSegmentHtmlMarkup().get(0);
		// line generated
		assertThat(firstPageMarkup).contains("<hr");

		// line properties are set correctly
		assertThat(firstPageMarkup).contains("border-color: #000000");
		assertThat(firstPageMarkup).contains("border-width: 3.75pt");
		assertThat(firstPageMarkup).contains("border-style: solid");
	}

	@PrintEngineTest(pdfFileName = "image")
	public void testImageElement(boolean usePdfBoxPrintProcess, String usedEngine) {
		final String printModel = PrintTestUtil.loadFromResources("/data/image/ImagePM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/image/ImageDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/image/ImageDM-1.json");

		final var result = DEFAULT_EXECUTOR.toBuilder()
			.usePdfBoxPrintProcess(usePdfBoxPrintProcess)
			.attachments(Map.of("REFERENCED_IMAGE", PrintTestUtil.loadStreamFromResources("/data/image/referenceImage.jpg")))
			.build()
			.execute(printModel, "ImageDM", documentModel, document);

		PdfRuntimeTestUtil.writeResultFiles(result, "image");

		// PDF is generated
		assertThat(result).isNotNull();

		if (!(result instanceof PdfPrintEngine.ResultWithMarkups resultWithMarkups)) { return; }

		final String firstPageMarkup = resultWithMarkups.getSegmentHtmlMarkup().get(0);
		// image tag was generated
		assertThat(firstPageMarkup).contains("<img");

		// Image source for blue square is set correctly; Test for Attachment upload
		assertThat(firstPageMarkup).contains("xAAUEAEAAAAAAAAAAAAAAAAAAABQ/9oACAEBAAE/EEf/2Q==");

		// Image source for red square is set correctly; Test for Attachment field
		assertThat(firstPageMarkup).contains("8QAFBABAAAAAAAAAAAAAAAAAAAAUP/aAAgBAQABPxBH/9k=");

		// Image source for green square is set correctly; Test for String field
		assertThat(firstPageMarkup).contains("EABQQAQAAAAAAAAAAAAAAAAAAAFD/2gAIAQEAAT8QR//Z");

		// Image source for referenced image is set correctly; Test for attachment_id field
		assertThat(firstPageMarkup).contains("4QAiRXhpZgAATU0AKgAAAAgAAQESAAMAAAABAAEAAAAAAAD");

		// height and width are set correctly
		assertThat(firstPageMarkup).contains("height: 37mm");
		assertThat(firstPageMarkup).contains("width: 50mm");

		assertThat(firstPageMarkup).contains("height: 62mm");
		assertThat(firstPageMarkup).contains("width: 75mm");

		assertThat(firstPageMarkup).contains("height: 12mm");
		assertThat(firstPageMarkup).contains("width: 30mm");

		// alt-text is set correctly
		assertThat(firstPageMarkup).contains("Alternative Text 1");
		assertThat(firstPageMarkup).contains("Alternative Text 2");
		assertThat(firstPageMarkup).contains("Alternative Text 3");
		assertThat(firstPageMarkup).contains("Alternative Text 4");
	}

	@PrintEngineTest(pdfFileName = "expression")
	public void testExpressionElement(boolean usePdfBoxPrintProcess, String usedEngine) {
		final String printModel = PrintTestUtil.loadFromResources("/data/expression/ExpressionPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/expression/ExpressionDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/expression/ExpressionDM-1.json");

		final var result = DEFAULT_EXECUTOR.toBuilder().usePdfBoxPrintProcess(usePdfBoxPrintProcess).build()
			.execute(printModel, "ExpressionDM", documentModel, document);

		PdfRuntimeTestUtil.writeResultFiles(result, "expression");

		// PDF is generated
		assertThat(result).isNotNull();

		if (!(result instanceof PdfPrintEngine.ResultWithMarkups resultWithMarkups)) { return; }

		final String firstPageMarkup = getOneLineTemplate(resultWithMarkups.getSegmentHtmlMarkup().getFirst());
		// expression was generated
		assertThat(firstPageMarkup).contains("<strong><span class=\"field nested\">Hello " +
			"World!</span></strong>");
		assertThat(firstPageMarkup).contains("<em><span class=\"field nested\">Lorem Ipsum...</span></em>");

		// case operator is working correctly
		assertThat(firstPageMarkup).contains("Case Operator Success");
		assertThat(firstPageMarkup).doesNotContain("Case Operator Fail");

		// expression markup is replaced
		assertThat(firstPageMarkup).doesNotContain("kontext");
		assertThat(firstPageMarkup).doesNotContain("case [first]");
	}

	@PrintEngineTest(pdfFileName = "table", flavours = {PDFAFlavour.PDFA_3_A})
	public void testTableElement(boolean usePdfBoxPrintProcess, String usedEngine) {
		final String printModel = PrintTestUtil.loadFromResources("/data/table/TablePM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/table/TableDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/table/TableDM-1.json");

		final var result = DEFAULT_EXECUTOR.toBuilder().usePdfBoxPrintProcess(usePdfBoxPrintProcess).build()
			.execute(printModel, "TableDM", documentModel, document);

		PdfRuntimeTestUtil.writeResultFiles(result, "table");

		// PDF is generated
		assertThat(result).isNotNull();

		if (!(result instanceof PdfPrintEngine.ResultWithMarkups resultWithMarkups)) { return; }

		final String firstPageMarkup = resultWithMarkups.getSegmentHtmlMarkup().get(0);
		// table element was generated
		assertThat(firstPageMarkup).contains("<table");
		assertThat(firstPageMarkup).contains("<tr");
		assertThat(firstPageMarkup).contains("id=\"aymJotzgBFBPVVufjeG4o\"");

		// column width is set
		assertThat(firstPageMarkup).contains("<colgroup");
		assertThat(firstPageMarkup).contains("<col width=\"70%");
		assertThat(firstPageMarkup).contains("<col width=\"30%");

		// string column content is set
		assertThat(firstPageMarkup).contains("ROW A");
		assertThat(firstPageMarkup).contains("ROW B");
		assertThat(firstPageMarkup).contains("ROW C");
		assertThat(firstPageMarkup).contains("ROW D");

		// integer column content is set
		assertThat(firstPageMarkup).contains("5");
		assertThat(firstPageMarkup).contains("7");
		assertThat(firstPageMarkup).contains("9");

		// float column content is set and formatted correctly
		assertThat(firstPageMarkup).contains("63,23");

		// max row count is working correctly
		assertThat(firstPageMarkup).doesNotContain("Z");
		assertThat(firstPageMarkup).doesNotContain("99999");

		// label hidden property is working correctly
		assertThat(firstPageMarkup).contains("Integer");
		assertThat(firstPageMarkup).doesNotContain("String");

		// body is styled correctly
		assertThat(firstPageMarkup).contains("font-size: 4.0pt");
		assertThat(firstPageMarkup).contains("line-height: 18.0pt");
		assertThat(firstPageMarkup).contains("font-family: Open Sans");

		// header is styled correctly
		assertThat(firstPageMarkup).doesNotContain("font-size: 24.0pt");
		assertThat(firstPageMarkup).doesNotContain("line-height: 34.0pt");

		// headline is wrapped in relevant heading tag
		assertThat(firstPageMarkup).contains("<h2 class=\"table_cell\"");
		assertThat(firstPageMarkup).contains("border: none");
		assertThat(firstPageMarkup).contains("</h2>");

		// border is styled correctly
		assertThat(firstPageMarkup).contains("border-width: 3.75pt");
		assertThat(firstPageMarkup).contains("border-color: #0000ff");

		// sum row is visible
		assertThat(firstPageMarkup).contains("84,23");
		assertThat(firstPageMarkup).contains("Summe1");

		// check string filter
		final String secondPageMarkup = resultWithMarkups.getSegmentHtmlMarkup().get(1);

		// sum row is visible
		assertThat(secondPageMarkup).contains("Summe2");

		// check number filter
		final String thirdPageMarkup = resultWithMarkups.getSegmentHtmlMarkup().get(2);

		assertThat(thirdPageMarkup).contains("ROW B");
		assertThat(thirdPageMarkup).doesNotContain("ROW A");
		assertThat(thirdPageMarkup).doesNotContain("ROW C");
		assertThat(thirdPageMarkup).doesNotContain("ROW D");

		// sum row is visible
		assertThat(thirdPageMarkup).contains("Summe3");

		// check boolean filter
		final String fourthPageMarkup = resultWithMarkups.getSegmentHtmlMarkup().get(3);

		assertThat(fourthPageMarkup).contains("ROW A");
		assertThat(fourthPageMarkup).contains("ROW C");
		assertThat(fourthPageMarkup).contains("ROW D");
		assertThat(fourthPageMarkup).doesNotContain("ROW B");

		// sum row is visible and consider filter
		assertThat(fourthPageMarkup).contains("Summe4");
		assertThat(fourthPageMarkup).contains("77,23");

		// check nested filter
		final String fifthPageMarkup = resultWithMarkups.getSegmentHtmlMarkup().get(4);

		assertThat(fifthPageMarkup).contains("Nested C");
		assertThat(fifthPageMarkup).doesNotContain("Nested A");
		assertThat(fifthPageMarkup).doesNotContain("Nested B");
		assertThat(fifthPageMarkup).doesNotContain("Nested D");

		// sum row is not visible
		assertThat(fifthPageMarkup).doesNotContain("Summe5");
	}

	@PrintEngineTest(pdfFileName = "splitTable", flavours = {PDFAFlavour.PDFA_3_A})
	public void testSplitTableElement(boolean usePdfBoxPrintProcess, String usedEngine) {
		final String printModel = PrintTestUtil.loadFromResources("/data/splitRow/table/TablePM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/splitRow/table/TableDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/splitRow/table/TableDM-1.json");

		final var result = DEFAULT_EXECUTOR.toBuilder()
			.usePdfBoxPrintProcess(usePdfBoxPrintProcess)
			.build()
			.execute(printModel, "TableDM", documentModel, document);

		final var pdfFile = PdfRuntimeTestUtil.writeResultFiles(result, "splitTable");

		final List<String> contentPerPage = PdfRuntimeTestUtil.getFileContentPerPage(pdfFile);

		assertThat(result).isNotNull();
		if ((result instanceof PdfPrintEngine.ResultWithMarkups) || !usePdfBoxPrintProcess) { return; }

		int n = 0;
		try (PDDocument doc = PDDocument.load(PrintTestUtil.resolveFile("splitTable-pdfBox.pdf").toPath().toFile())) {
			n = doc.getNumberOfPages();
		} catch (IOException e) {
			assertThat(e).isNull();
		}

		assertThat(n).isEqualTo(EXPECTED_SPLIT_TABLE_PAGE_TEXTS.length);

		final String headerTitle = "Column";

		for (int i = 0; i < EXPECTED_SPLIT_TABLE_PAGE_TEXTS.length; i++) {
			assertThat(getFirstLine(contentPerPage.getFirst())).isEqualTo(headerTitle);
			assertThat(contentPerPage.get(i).replace("\r\n", "\n")).contains(String.format("Header %d/%d", i + 1, EXPECTED_SPLIT_TABLE_PAGE_TEXTS.length));
			assertThat(contentPerPage.get(i).replace("\r\n", "\n")).contains(String.format("Footer %d/%d", i + 1, EXPECTED_SPLIT_TABLE_PAGE_TEXTS.length));
			assertThat(contentPerPage.get(i).replace("\r\n", "\n")).contains(EXPECTED_SPLIT_TABLE_PAGE_TEXTS[i].replace("\r\n", "\n"));
		}
	}

	@PrintEngineTest(pdfFileName = "tableLayout")
	public void testTableLayoutElement(boolean usePdfBoxPrintProcess, String usedEngine) {
		final String printModel = PrintTestUtil.loadFromResources(
			"/data/tableLayout/TableLayoutPM.json");
		final String documentModel = PrintTestUtil.loadFromResources(
			"/data/tableLayout/TableLayoutDM.json"
		);
		final String document = PrintTestUtil.loadFromResources(
			"/data/tableLayout/TableLayoutDM-1.json"
		);

		final var result = DEFAULT_EXECUTOR.toBuilder().usePdfBoxPrintProcess(usePdfBoxPrintProcess).build()
			.execute(printModel, "TableLayoutDM", documentModel, document);

		PdfRuntimeTestUtil.writeResultFiles(result, "tableLayout");

		// PDF is generated
		assertThat(result).isNotNull();

		if (!(result instanceof PdfPrintEngine.ResultWithMarkups resultWithMarkups)) { return; }

		final String firstPageMarkup = resultWithMarkups.getSegmentHtmlMarkup().get(0);
		// all cell contents are generated
		assertThat(firstPageMarkup).contains("Test1");
		assertThat(firstPageMarkup).contains("Test2");
		assertThat(firstPageMarkup).contains("Test3");

		// positions are applied
		assertThat(firstPageMarkup).contains("top: 25mm;");
		assertThat(firstPageMarkup).contains("left: 25mm;");
		assertThat(firstPageMarkup).contains("width: 87mm;");

		// column width is applied
		assertThat(firstPageMarkup).contains("width: 70%");
		assertThat(firstPageMarkup).contains("width: 30%");

		// row height is applied
		assertThat(firstPageMarkup).contains("height: 125mm");

		// custom border is applied
		assertThat(firstPageMarkup).contains("border-width: 1.5pt");
		assertThat(firstPageMarkup).contains("border-color: #FF0000");
		assertThat(firstPageMarkup).contains("border-style: dashed");
	}

	@PrintEngineTest(pdfFileName = "chart")
	public void testChartElement(boolean usePdfBoxPrintProcess, String usedEngine) {
		final String printModel = PrintTestUtil.loadFromResources("/data/chart/ChartPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/chart/ChartDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/chart/ChartDM-1.json");

		final var result = DEFAULT_EXECUTOR.toBuilder().usePdfBoxPrintProcess(usePdfBoxPrintProcess).build()
			.execute(printModel, "ChartDM", documentModel, document);

		PdfRuntimeTestUtil.writeResultFiles(result, "chart");

		// PDF is generated
		assertThat(result).isNotNull();

		if (!(result instanceof PdfPrintEngine.ResultWithMarkups resultWithMarkups)) { return; }

		final String firstPageMarkup = resultWithMarkups.getSegmentHtmlMarkup().get(0);
		// image tag was generated
		assertThat(firstPageMarkup).contains("<img");

		// height and width are set correctly
		assertThat(firstPageMarkup).contains("height: 75mm");
		assertThat(firstPageMarkup).contains("width: 75mm");

		assertThat(firstPageMarkup).contains("height: 100mm");
		assertThat(firstPageMarkup).contains("width: 175mm");

		assertThat(firstPageMarkup).contains("height: 50mm");
		assertThat(firstPageMarkup).contains("width: 50mm");
	}

	@PrintEngineTest(pdfFileName = "boundingBox")
	public void testBoundingBoxElement(boolean usePdfBoxPrintProcess, String usedEngine) {
		final String printModel = PrintTestUtil.loadFromResources("/data/boundingBox/BoundingBoxPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/boundingBox/BoundingBoxDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/boundingBox/BoundingBoxDM-1.json");

		final var result = DEFAULT_EXECUTOR.toBuilder().usePdfBoxPrintProcess(usePdfBoxPrintProcess).build()
			.execute(printModel, "BoundingBoxDM", documentModel, document);

		PdfRuntimeTestUtil.writeResultFiles(result, "boundingBox");

		// PDF is generated
		assertThat(result).isNotNull();

		if (!(result instanceof PdfPrintEngine.ResultWithMarkups resultWithMarkups)) { return; }

		final String firstPageMarkup = resultWithMarkups.getSegmentHtmlMarkup().get(0);
		// All visible text elements are created
		assertThat(firstPageMarkup).contains("Text0");
		assertThat(firstPageMarkup).contains("Text1");
		assertThat(firstPageMarkup).contains("Text2");

		// field values are resolved
		assertThat(firstPageMarkup).contains("Lorem ipsum");
		assertThat(firstPageMarkup).contains("Hello World");

		// First Bounding box is moved
		Optional<Integer> firstBoxPos = PdfRuntimeTestUtil.getElementYPosition("DB_0pVw1pI5KAMGFh5WMP", firstPageMarkup);
		assertThat(firstBoxPos.isPresent()).isTrue();
		assertThat(firstBoxPos.get()).isGreaterThan(55);

		// Second Bounding box has static distance to first box
		Optional<Integer> secondBoxPos = PdfRuntimeTestUtil.getElementYPosition("AFasdawmBLnd_Utvrsdfsfa", firstPageMarkup);
		assertThat(secondBoxPos.isPresent()).isTrue();
		assertThat(secondBoxPos.get()).isEqualTo(firstBoxPos.get() + 51);

		// BoundingBox border color applied
		assertThat(firstPageMarkup).contains("#57d5ff");
		assertThat(firstPageMarkup).contains("#ffd557");
	}

	@PrintEngineTest(pdfFileName = "area")
	public void testAreaElement(boolean usePdfBoxPrintProcess, String usedEngine) {
		final String printModel = PrintTestUtil.loadFromResources("/data/area/AreaPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/area/AreaDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/area/AreaDM-1.json");

		final var result = DEFAULT_EXECUTOR.toBuilder().usePdfBoxPrintProcess(usePdfBoxPrintProcess).build()
			.execute(printModel, "AreaDM", documentModel, document);

		PdfRuntimeTestUtil.writeResultFiles(result, "area");

		// PDF is generated
		assertThat(result).isNotNull();

		if (!(result instanceof PdfPrintEngine.ResultWithMarkups resultWithMarkups)) { return; }

		final String firstPageMarkup = resultWithMarkups.getSegmentHtmlMarkup().get(0);
		// All visible text elements are visible
		assertThat(firstPageMarkup).contains("Text1");
		assertThat(firstPageMarkup).contains("Text2");
		assertThat(firstPageMarkup).contains("Readable Text");
		assertThat(firstPageMarkup).contains("Multi");
		assertThat(firstPageMarkup).contains("Next Page Text");
		assertThat(firstPageMarkup).contains("Moved up across section");
		assertThat(firstPageMarkup).contains("Footer 1");
		assertThat(firstPageMarkup).contains("Footer 2");
		assertThat(firstPageMarkup).contains("Header 1");
		assertThat(firstPageMarkup).contains("Header 2");
		assertThat(firstPageMarkup).contains("Last Nested Element");

		// Hidden text elements are hidden
		assertThat(firstPageMarkup).doesNotContain("Hidden");

		// field values are resolved
		assertThat(firstPageMarkup).contains("Lorem ipsum");
		assertThat(firstPageMarkup).contains("Hello World");

		// First area is moved
		assertElementPosAndHeight(firstPageMarkup, "FIRST_AREA", 0, 221);

		// Second area is moved
		assertElementPosAndHeight(firstPageMarkup, "SECOND_AREA", 222, 101);

		// Interaction with SectionOffset
		assertElementPos(firstPageMarkup, "MOVED_ACROSS_PAGE", 9);

		// Interaction with HideConfigurations
		assertElementPos(firstPageMarkup, "NEXT_PAGE_TEXT", 42);

		// Interaction with SectionOffset
		assertElementPosAndHeight(firstPageMarkup, "LAST_AREA", 373, 183);
		assertElementPosAndHeight(firstPageMarkup, "LAST_NESTED_AREA", 94, 67);
		assertElementPos(firstPageMarkup, "LAST_GROWING_TEXT", 3);

		// Area border color applied
		assertThat(firstPageMarkup).contains("#57d5ff");
		assertThat(firstPageMarkup).contains("#ffd557");
	}

	@PrintEngineTest(pdfFileName = "switch")
	void testSwitchElement(boolean usePdfBoxPrintProcess, String usedEngine) {
		final String printModel = PrintTestUtil.loadFromResources("/data/switch/SwitchPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/switch/SwitchDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/switch/SwitchDM-1.json");

		final var result = DEFAULT_EXECUTOR.toBuilder().usePdfBoxPrintProcess(usePdfBoxPrintProcess).build()
			.execute(printModel, "SwitchDM", documentModel, document);

		PdfRuntimeTestUtil.writeResultFiles(result, "switch");

		// PDF is generated
		assertThat(result).isNotNull();

		if (!(result instanceof PdfPrintEngine.ResultWithMarkups resultWithMarkups)) { return; }

		final String seg = resultWithMarkups.getSegmentHtmlMarkup().get(0);
		final String seg2 = resultWithMarkups.getSegmentHtmlMarkup().get(1);

		// All visible areas are visible
		assertThat(seg).contains("Two");
		assertThat(seg).contains("First Four");
		assertThat(seg).contains("Second Four");

		// Hidden areas are hidden
		assertThat(seg).doesNotContain("One");
		assertThat(seg).doesNotContain("Three");
		assertThat(seg).doesNotContain("Five");
		assertThat(seg).doesNotContain("Six");

		// Third switch text is not changed
		assertElementPos(seg, "THIRD_SWITCH_TEXT", 50);
		// Fourth switch text is not changed
		assertElementPos(seg, "FOURTH_SWITCH_TEXT", 110);
		// Fifth switch text is moved up
		assertElementPos(seg, "FIFTH_SWITCH_TEXT", 65);
		// Sixth switch text is moved down
		assertElementPos(seg, "SIXTH_SWITCH_TEXT", 235);

		assertElementPosAndHeight(seg, "SECOND_AREA", 50, 50);
		assertThat(seg).contains("FIRST_FOURTH_AREA_TEXT", "SECOND_FOURTH_AREA_TEXT");
		assertThat(seg).contains("FIRST_FOURTH_AREA", "height: 50mm", "top: 125mm");
		assertThat(seg).contains("SECOND_FOURTH_AREA", "height: 50mm", "top: 175mm");

		assertThat(seg2).contains("String Field 1");
		assertThat(seg2).contains("500");

		assertThat(seg2).contains("StringField1");
		assertThat(seg2).contains("SWITCH_2_CASE_AREA", "height: 50mm", "top: 0mm");
		assertThat(seg2).contains("StringField2");
		assertThat(seg2).contains("SWITCH_2_CASE_AREA", "height: 50mm", "top: 50mm");

		assertThat(seg2).contains("SWITCH_3_CASE", "height: 50mm", "top: 190mm");
		assertThat(seg2).contains("SWITCH_3_SWITCH_CASE");
		assertThat(seg2).contains("SWITCH_3_SWITCH_CASE_BOUNDINGBOX", "height: 50mm", "top: 0mm");
		assertThat(seg2).contains("String Field 2");
	}

	private void assertElementPosAndHeight(String markup, String id, int targetPos, int targetHeight) {
		Optional<Integer> pos = PdfRuntimeTestUtil.getElementYPosition(id, markup);
		assertThat(pos).isPresent();
		assertThat(pos.get()).isEqualTo(targetPos);
		Optional<Integer> height = PdfRuntimeTestUtil.getElementHeight(id, markup);
		assertThat(height).isPresent();
		assertThat(height.get()).isEqualTo(targetHeight);
	}

	private void assertElementPos(String markup, String id, int targetPos) {
		Optional<Integer> pos = PdfRuntimeTestUtil.getElementYPosition(id, markup);
		assertThat(pos).isPresent();
		assertThat(pos.get()).isEqualTo(targetPos);
	}

	@PrintEngineTest(pdfFileName = "listing", flavours = {PDFAFlavour.PDFA_3_A})
	public void testListingElement(boolean usePdfBoxPrintProcess, String usedEngine) {
		final String printModel = PrintTestUtil.loadFromResources("/data/listing/ListingPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/listing/ListingDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/listing/ListingDM-1.json");

		final var result = DEFAULT_EXECUTOR.toBuilder()
			.usePdfBoxPrintProcess(usePdfBoxPrintProcess)
			.attachments(Map.of("REFERENCED_ATTACHMENT", PrintTestUtil.loadStreamFromResources("/data/listing/referenceAttachment.pdf")))
			.build()
			.execute(printModel, "ListingDM", documentModel, document);

		PdfRuntimeTestUtil.writeResultFiles(result, "listing");

		// PDF is generated
		assertThat(result).isNotNull();

		// both pages + both attachments are included in the pdf
		int n = 0;
		try (PDDocument doc = PDDocument.load(PrintTestUtil.resolveFile("listing.pdf").toPath().toFile())) {
			n = doc.getNumberOfPages();
		} catch (IOException e) {
			assertThat(e).isNull();
		}
		assertThat(n).isEqualTo(5);

		if (!(result instanceof PdfPrintEngine.ResultWithMarkups resultWithMarkups)) { return; }

		// placeholder values
		final String firstPageMarkup = resultWithMarkups.getSegmentHtmlMarkup().get(0);
		assertThat(firstPageMarkup).contains("---");

		// enum values are translated
		assertThat(firstPageMarkup).contains("Herr");

		// every instance of the repeatable group is listed & relativeMetadata
		assertThat(PdfRuntimeTestUtil.containsNumberOfTimes(firstPageMarkup, "Telefonnummer", 4)).isTrue();
		assertThat(firstPageMarkup).contains("0123456789");
		assertThat(firstPageMarkup).contains("00987654321");
		assertThat(firstPageMarkup).contains("1122789654");
		assertThat(firstPageMarkup).contains("8348345895");

		// every attachment/content is replaced by a link
		assertThat(PdfRuntimeTestUtil.containsNumberOfTimes(firstPageMarkup, "<a href=", 3)).isTrue();
		assertThat(PdfRuntimeTestUtil.containsNumberOfTimes(firstPageMarkup, "Link", 3)).isTrue();

		// both attachments are listed
		assertThat(firstPageMarkup).contains("image/png");
		assertThat(PdfRuntimeTestUtil.containsNumberOfTimes(firstPageMarkup, "application/pdf", 2)).isTrue();

		// display options are applied
		assertThat(firstPageMarkup).contains("\u2611");
		assertThat(firstPageMarkup).contains("\u2610");

		// font-family is applied
		assertThat(firstPageMarkup).contains("font-family: Noto Sans Symbols");

		// relativeAnnotation + value + static text
		assertThat(firstPageMarkup).contains("Annotation foo : Value1;");
		assertThat(firstPageMarkup).contains("value : mister");

		// relativeAnnotation + absolute field content + static text
		assertThat(firstPageMarkup).contains("Annotation bar: Value2;");
		assertThat(firstPageMarkup).contains("name : Mustermann");

		// bold & italic are applied
		assertThat(firstPageMarkup).contains("font-weight: bold");
		assertThat(firstPageMarkup).contains("font-style: italic");

		// background color is applied
		assertThat(firstPageMarkup).contains("background-color: #d6d6d6");

		// calculated text color is applied
		assertThat(firstPageMarkup).contains("color: #FF0000");
		assertThat(firstPageMarkup).contains("color: #33FF33");

		// column span is applied
		assertThat(firstPageMarkup).contains("colspan=\"4\"");

		// column width is applied
		assertThat(firstPageMarkup).contains("width=\"35%\"");
		assertThat(firstPageMarkup).contains("width=\"20%\"");
		assertThat(firstPageMarkup).contains("width=\"15%\"");

		// date is formatted correctly
		assertThat(firstPageMarkup).contains("2023-06-14");
	}

	@PrintEngineTest(pdfFileName = "splitListing", flavours = {PDFAFlavour.PDFA_3_A})
	public void testSplitListingElement(boolean usePdfBoxPrintProcess, String usedEngine) {
		final String printModel = PrintTestUtil.loadFromResources("/data/splitRow/listing/ListingPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/splitRow/listing/ListingDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/splitRow/listing/ListingDM-1.json");

		final var result = DEFAULT_EXECUTOR.toBuilder()
			.usePdfBoxPrintProcess(usePdfBoxPrintProcess)
			.build()
			.execute(printModel, "ListingDM", documentModel, document);

		final var pdfFile = PdfRuntimeTestUtil.writeResultFiles(result, "splitListing");

		final List<String> contentPerPage = PdfRuntimeTestUtil.getFileContentPerPage(pdfFile);

		assertThat(result).isNotNull();
		if ((result instanceof PdfPrintEngine.ResultWithMarkups) || !usePdfBoxPrintProcess) { return; }

		int n = 0;
		try (PDDocument doc = PDDocument.load(PrintTestUtil.resolveFile("splitListing-pdfBox.pdf").toPath().toFile())) {
			n = doc.getNumberOfPages();
		} catch (IOException e) {
			assertThat(e).isNull();
		}

		assertThat(n).isEqualTo(12);

		final String headerTitle = "Column";
		// Assert that the header is present on each page
		for (int i = 1; i < 12; i++) {
			assertThat(StringUtils.countMatches(contentPerPage.get(i), headerTitle)).isEqualTo(3);
		}
		// Assert content on first split row
		for (int i = 1; i < EXPECTED_SPLIT_LISTING_PAGE_TEXTS.length; i++) {
			assertThat(contentPerPage.get(i).replace("\r\n", "\n")).isEqualTo(EXPECTED_SPLIT_LISTING_PAGE_TEXTS[i]);
		}
	}

	@PrintEngineTest(pdfFileName = "listingHideGroup")
	public void testListingWithHideGroup(boolean usePdfBoxPrintProcess, String usedEngine) {
		final String printModel = PrintTestUtil.loadFromResources("/data/example/ExampleCustomerPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/example/ExampleCustomerDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/example/ExampleCustomerDM-1.json");

		final var result = DEFAULT_EXECUTOR.toBuilder()
			.usePdfBoxPrintProcess(usePdfBoxPrintProcess)
			.build()
			.execute(printModel, "ExampleCustomerDM", documentModel, document);

		final var pdfFile = PdfRuntimeTestUtil.writeResultFiles(result, "listingHideGroup");

		assertThat(result).isNotNull();

		// Skip for PdfBoxPrintEngine (only test with PdfPrintEngine which produces ResultWithMarkups)
		if ((result instanceof PdfPrintEngine.ResultWithMarkups)) { return; }

		final List<String> contentPerPage = PdfRuntimeTestUtil.getFileContentPerPage(pdfFile);

		assertThat(contentPerPage).hasSize(3);

		// Each page should show exactly 2 addresses (the public ones)

		// Page 1: Hide Addresses with Boolean
		final String page1Content = contentPerPage.get(0);
		assertThat(page1Content).contains("Hide Adresses with Boolean");
		assertThat(StringUtils.countMatches(page1Content, "Musterstr.")).isEqualTo(2);
		assertThat(page1Content).doesNotContain("Bahnhofstr.");

		// Page 2: Hide Addresses with Number
		final String page2Content = contentPerPage.get(1);
		assertThat(page2Content).contains("Hide Adresses with Number");
		assertThat(StringUtils.countMatches(page2Content, "Musterstr.")).isEqualTo(2);
		assertThat(page2Content).doesNotContain("Bahnhofstr.");

		// Page 3: Hide Addresses with String
		final String page3Content = contentPerPage.get(2);
		assertThat(page3Content).contains("Hide Adresses with String");
		assertThat(StringUtils.countMatches(page3Content, "Musterstr.")).isEqualTo(2);
		assertThat(page3Content).doesNotContain("Bahnhofstr.");
	}

}
