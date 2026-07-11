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
package com.mgmtp.a12.print.workspace.internal.utils;

import com.mgmtp.a12.kernel.md.model.a12internal.*;
import com.mgmtp.a12.kernel.md.model.a12internal.fieldtypes.CustomFieldType;
import com.mgmtp.a12.kernel.md.model.a12internal.fieldtypes.FieldType;
import com.mgmtp.a12.kernel.md.model.a12internal.fieldtypes.StringType;
import com.mgmtp.a12.model.header.Header;
import com.mgmtp.a12.print.workspace.internal.event.EventService;
import com.mgmtp.a12.print.workspace.internal.handler.ModelHandler;
import com.mgmtp.a12.print.workspace.internal.handler.WorkspaceHandler;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.nio.file.Paths;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import static com.mgmtp.a12.print.workspace.internal.WorkspaceTest.RUNTIME_WORKSPACE;
import static com.mgmtp.a12.print.workspace.internal.WorkspaceTest.TEST_WORKSPACE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DocumentModelUtilsTest {
	@Spy
	private WorkspaceHandler workspaceHandler;
	@Mock
	private EventService eventService;
	@Spy
	@InjectMocks
    private DocumentModelUtils underTest;

    @Test
    void givenValidDomainModel_whenExpand_thenCorrect() {
		final var modelId = "TestFieldDM";
		final var modelHandler = new ModelHandler(workspaceHandler, eventService);
		modelHandler.create(Paths.get(RUNTIME_WORKSPACE, "test/TestFieldDM.json"));

        final var result = underTest.expand(modelId);

		assertThat(result).isNotNull();
    }

	@Test
	void givenInvalidDomainModel_whenExpand_stillSuccessfully() {
		final var modelId = "DomainReferenceCycleTest";
		final var modelHandler = new ModelHandler(workspaceHandler, eventService);
		modelHandler.create(Paths.get(TEST_WORKSPACE, "invalid/DomainReferenceCycleTest.json"));

		final var result = underTest.expand(modelId);

		assertThat(result).isNotNull();
	}

    @Test
    void prefixTypeDefinitionWithModelName() {
		final var documentModelId = "TestFieldDM";
		final var atomicInteger = new AtomicInteger(0);
		final var mockHeader = mock(Header.class);
		final var mockContent = mock(DocumentModelContent.class);
		final var mockDocumentModel = mock(DocumentModel.class);
		when(mockDocumentModel.getHeader()).thenReturn(mockHeader);
		when(mockHeader.getId()).thenReturn(documentModelId);
		when(mockDocumentModel.getContent()).thenReturn(mockContent);
		when(mockContent.getTypeDefinitions()).thenReturn(List.of(
			FieldTypeDefinition.builder().id("id1").name("typeDef1").fieldType(mock(FieldType.class)).build(),
			FieldTypeDefinition.builder().id("id2").name("typeDef2").fieldType(mock(FieldType.class)).build(),
			FieldTypeDefinition.builder().id("id3").name("typeDef3").fieldType(mock(FieldType.class)).build()
		));

        underTest.prefixTypeDefinitionWithModelName(mockDocumentModel);

		mockContent.getTypeDefinitions().forEach(fieldTypeDefinition -> {
			assertThat(fieldTypeDefinition.getName()).isEqualTo(String.format("%s_%s", documentModelId, "typeDef" + atomicInteger.incrementAndGet()));
		});
    }

    @Test
    void convertCustomTypeDefinitionsToStringType() {
		final var mockHeader = mock(Header.class);
		final var customFieldType = CustomFieldType.builder().name("name").build();
		final var fieldTypeDefinition = FieldTypeDefinition
			.builder()
			.id("id")
			.name("name")
			.fieldType(customFieldType)
			.build();
		final var mockDocumentModelContent = DocumentModelContent
			.builder()
			.typeDefinitions(List.of(fieldTypeDefinition))
			.modelInfo(mock(DocumentModelInfo.class))
			.modelConfig(mock(DocumentModelConfig.class))
			.build();
		final var documentModel = new DocumentModel(mockHeader, mockDocumentModelContent);

		underTest.convertCustomTypeDefinitionsToStringType(documentModel);

		assertThat(fieldTypeDefinition.getFieldType()).isInstanceOf(StringType.class);
    }
}
