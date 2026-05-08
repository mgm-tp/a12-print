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
package com.mgmtp.a12.print.model.api.utils.serialization;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mgmtp.a12.model.header.Annotation;
import com.mgmtp.a12.model.header.Header;
import com.mgmtp.a12.model.header.ModelReference;
import com.mgmtp.a12.print.model.api.inputSource.InputValueSourceResolver;
import com.mgmtp.a12.print.model.api.model.PrintModelContent;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.element.ElementType;
import com.mgmtp.a12.print.model.api.model.element.PrintModelElement;
import com.mgmtp.a12.print.model.api.model.element.properties.BorderProperties.BorderStyle;
import com.mgmtp.a12.print.model.api.model.element.properties.PageOrientation;
import com.mgmtp.a12.print.model.api.model.element.properties.TextProperties;
import com.mgmtp.a12.print.model.api.model.element.properties.TextProperties.Alignment;
import com.mgmtp.a12.print.model.api.model.element.type.field.Field;
import com.mgmtp.a12.print.model.api.model.element.type.text.TextElement;
import com.mgmtp.a12.print.model.api.model.reference.ElementReference;
import com.mgmtp.a12.print.model.api.model.reference.PlaceableReference;
import com.mgmtp.a12.print.model.api.model.segment.ModelSegment;
import com.mgmtp.a12.print.model.api.walker.model.resolver.SegmentIdListResolver;
import com.mgmtp.a12.print.model.api.model.internal.dto.PrintModelDto;
import org.junit.jupiter.api.Test;
import utils.FileUtils;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

public class DeserializationTest {

	@Test
	public void testDeserializationOfSimplePageAndField() throws IOException {
		final String fileContent = FileUtils.getFileContent("/PrintModel-with-field.json");

		final ObjectMapper objectMapper = ObjectMapperFactory.createPrintModelMapper();
		final PrintModelDto printModelDto = objectMapper.readValue(fileContent, PrintModelDto.class);

		// header
		final Header header = printModelDto.getHeader();
		assertThat(header.getId()).isEqualTo("LIZaGfXaMcuNB3POeNZqJ");
		assertThat(header.getModelType()).isEqualTo("print");
		assertThat(header.getLocales()).containsExactly(Locale.GERMAN);

		final List<ModelReference> modelReferences = header.getModelReferences();
		assertThat(modelReferences).hasSize(1);
		assertThat(modelReferences.get(0).getModelType()).isEqualTo("document");
		assertThat(modelReferences.get(0).getReference()).isEqualTo("DomainPerson");
		assertThat(modelReferences.get(0).getAlias()).isEqualTo("DomainPerson");
		assertThat(modelReferences.get(0).getPurpose()).isEqualTo("data binding");

		final List<Annotation> annotations = header.getAnnotations();
		assertThat(annotations).hasSize(3);
		assertThat(annotations
			.stream()
			.filter(annotation -> annotation.getName().equals("roles") && annotation.getValue().equals("admin,guest"))
			.findAny()
		).isPresent();

		// content
		final PrintModelContent content = printModelDto.getContent();
		assertThat(content).isNotNull();
		SegmentIdListResolver segmentIdListResolver = SegmentIdListResolver.fromModel(printModelDto);
		final List<ModelSegment> segments = content.getGeneral().getStructure().stream()
			.flatMap(id -> segmentIdListResolver.resolveSegmentId(id).stream().map(PrintModelTreeTrace::getTracedElement))
			.collect(Collectors.toList());
		assertThat(segments).hasSize(1);

		// element list
		final List<PrintModelElement> elements = content.getElementDefinitions();
		assertThat(elements).hasSize(2);

		// segment
		final ModelSegment segment = segments.get(0);
		assertThat(segment.getTitle()).isEqualTo("Erste Seite");
		assertThat(segment.getType()).isEqualTo(ModelSegment.ModelSegmentType.DEFAULT);
		assertThat((segment).getSegmentProperties()).isPresent();
		assertThat((segment).getSegmentProperties().get().getPageOrientation()).isEqualTo(PageOrientation.PORTRAIT);

		// elements
		final List<ElementReference> references = new ArrayList<>(segment.getReferences());
		assertThat(references).hasSize(1);

		ElementReference reference = references.get(0);
		assertThat(reference instanceof PlaceableReference).isTrue();

		Optional<PrintModelElement> element = elements.stream().filter(el -> el.getId().equals(reference.getRefId())).findFirst();
		assertThat(element).isPresent();

		assertThat(element.get().getId()).isEqualTo("m9eY5Yb6ccJww4yvM_hQM");
		assertThat(element.get().getType()).isEqualTo(ElementType.TEXT);

		PlaceableReference placeable = (PlaceableReference) reference;
		assertThat(placeable.getPosition()).isNotNull();
		assertThat(placeable.getPosition().getX().getValue()).isEqualTo(50);
		assertThat(placeable.getPosition().getY().getValue()).isEqualTo(50);

		assertThat(placeable.getDimensions()).isNotNull();
		assertThat(placeable.getDimensions().getHeight().getValue()).isEqualTo(10);
		assertThat(placeable.getDimensions().getWidth().getValue()).isEqualTo(20);

		assertThat(element.get() instanceof TextElement).isEqualTo(true);
		if (element.get() instanceof TextElement) {
			TextElement textElement = (TextElement) element.get();

			final List<ElementReference> textReferences = new ArrayList<>(textElement.getReferences());
			assertThat(textReferences).hasSize(1);
			ElementReference textReference = textReferences.get(0);
			Optional<PrintModelElement> fieldElement = elements.stream().filter(el -> el.getId().equals(textReference.getRefId())).findFirst();
			assertThat(fieldElement).isPresent();

			assertThat(fieldElement.get() instanceof Field).isEqualTo(true);

			assertThat(textElement.getBorderProperties()).isPresent();
			assertThat(textElement.getBorderProperties().get().getBorderColor()).isPresent().hasValue("#000");
			assertThat(textElement.getBorderProperties().get().getBorderStyle()).isPresent().hasValue(BorderStyle.DASHED);
			assertThat(textElement.getBorderProperties().get().getBorderWidth()).isPresent().hasValue(0.75f);


			final Optional<TextProperties> textProperties = textElement.getTextProperties();


			assertThat(textProperties
				.flatMap(TextProperties::getAlignment)
				.flatMap(alignment -> InputValueSourceResolver.getInputValue(alignment, Alignment::fromString,(String referenceId) -> Optional.empty()))
			).isPresent().hasValue(Alignment.RIGHT);


			assertThat(textProperties
				.flatMap(TextProperties::getTextStyleId)
				.flatMap(textStyle -> InputValueSourceResolver.getInputValue(textStyle,(String referenceId) -> Optional.empty()))
			).isPresent().hasValue("ID_16ee7898-ae39-4593-a91c-30f34d050d72");


			if (fieldElement.get() instanceof Field) {
				assertThat(((Field) fieldElement.get()).getFieldProperties().getPath()).isEqualTo("/general/first");
				assertThat(((Field) fieldElement.get()).getFieldProperties().getModel()).isEqualTo("DomainPerson");
			}
		}
	}
}
