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
package com.mgmtp.a12.print.workspace.internal.handler;

import com.mgmtp.a12.print.engine.api.PrintEngineConfig;
import com.mgmtp.a12.print.workspace.internal.Workspace;
import com.mgmtp.a12.print.workspace.internal.elements.FileElement;
import com.mgmtp.a12.print.workspace.internal.elements.FileElementType;
import com.mgmtp.a12.print.workspace.internal.event.EventService;
import com.mgmtp.a12.print.workspace.internal.exceptions.PrintWorkspaceException;
import com.mgmtp.a12.print.workspace.internal.printConfig.ConfigStatus;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

import static com.mgmtp.a12.print.workspace.internal.WorkspaceTest.RUNTIME_WORKSPACE;
import static com.mgmtp.a12.print.workspace.internal.WorkspaceTest.TEST_WORKSPACE;
import static com.mgmtp.a12.print.workspace.internal.elements.FileElementType.DOCUMENT;
import static com.mgmtp.a12.print.workspace.internal.elements.FileElementType.MODEL;
import static com.mgmtp.a12.print.workspace.internal.elements.FileElementType.YAML;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@ExtendWith(MockitoExtension.class)
class WorkspaceHandlerTest {
    @Mock
    private EventService eventService;
    @Spy
    private WorkspaceHandler underTest;
    private static final Map<FileElementType, List<FileElement>> FILE_MAP = Workspace.getInstance().getFileMap();

    @AfterEach
    public void tearDown() {
        FILE_MAP.get(MODEL).clear();
        FILE_MAP.get(DOCUMENT).clear();
        FILE_MAP.get(YAML).clear();
    }

    @Test
    void testGetDocumentModelById() {
        final var modelId = "TestFieldDM";
        final var modelHandler = new ModelHandler(underTest, eventService);
        modelHandler.create(Paths.get(RUNTIME_WORKSPACE, "test/TestFieldDM.json"));

        final var result = underTest.getDocumentModelById(modelId);

        assertThat(result).isNotNull();
    }

    @Test
    void givenValidDocumentModelId_whenGetUnexpandedModel_thenCorrect() {
        final var modelId = "TestFieldDM";
        final var modelHandler = new ModelHandler(underTest, eventService);
        modelHandler.create(Paths.get(RUNTIME_WORKSPACE, "test/TestFieldDM.json"));

        final var result = underTest.getUnexpandedModel(modelId);

        assertThat(result).isNotNull();
    }

    @Test
    void givenInvalidDocumentModelId_whenGetUnexpandedModel_thenIOException() {
        final var modelId = "DomainModelInfoTest";
        final var modelHandler = new ModelHandler(underTest, eventService);
        modelHandler.create(Paths.get(TEST_WORKSPACE, "invalid/DomainModelInfoTest.json"));

        assertThatThrownBy(() -> underTest.getUnexpandedModel(modelId))
                .isInstanceOf(PrintWorkspaceException.class)
                .hasMessageContaining("Unrecognized field \"modelInfos\" (class com.mgmtp.a12.kernel.md.model.a12internal.DocumentModelContent)");
    }

    @Test
    void givenInvalidDocumentModelId_whenGetUnexpandedModel_thenPrintWorkspaceException() {
        final var modelId = "TestDM";
        final var modelHandler = new ModelHandler(underTest, eventService);
        modelHandler.create(Paths.get(RUNTIME_WORKSPACE, "test/TestFieldDM.json"));

        assertThatThrownBy(() -> underTest.getUnexpandedModel(modelId))
                .isInstanceOf(PrintWorkspaceException.class)
                .hasMessage("DocumentModel was not found in the Workspace : " + modelId);
    }

    @Test
    void givenValidDocumentModelId_whenGetExpandedModelContent_thenCorrect() {
        final var modelId = "TestFieldDM";
        final var modelHandler = new ModelHandler(underTest, eventService);
        modelHandler.create(Paths.get(RUNTIME_WORKSPACE, "test/TestFieldDM.json"));

        final var result = underTest.getExpandedModelContent(modelId);

        assertThat(result.isPresent()).isTrue();
    }

    @Test
    void givenValidPrintModelId_whenGetExpandedModelContent_thenCorrect() {
        final var modelId = "TestPM";
        final var modelHandler = new ModelHandler(underTest, eventService);
        modelHandler.create(Paths.get(RUNTIME_WORKSPACE, "test/TestPM.json"));

        final var result = underTest.getExpandedModelContent(modelId);

        assertThat(result.isPresent()).isTrue();
    }

    @Test
    void givenInValidDocumentModelId_whenGetExpandedModelContent_thenCorrect() {
        final var modelId = "TestDM";
        final var modelHandler = new ModelHandler(underTest, eventService);
        modelHandler.create(Paths.get(RUNTIME_WORKSPACE, "test/TestFieldDM.json"));

        final var result = underTest.getExpandedModelContent(modelId);

        assertThat(result.isPresent()).isFalse();
    }

    @Test
    void givenDocumentModel_whenGetModelFileElementsByType_thenCorrect() {
        final var modelHandler = new ModelHandler(underTest, eventService);
        modelHandler.create(Paths.get(RUNTIME_WORKSPACE, "test/TestFieldDM.json"));

        final var result = underTest.getModelFileElementsByType("document");

        assertThat(!result.isEmpty()).isTrue();
    }

    @Test
    void givenDocumentModel_whenGetModelFileElementById_thenCorrect() {
        final var modelId = "TestFieldDM";
        final var modelHandler = new ModelHandler(underTest, eventService);
        modelHandler.create(Paths.get(RUNTIME_WORKSPACE, "test/TestFieldDM.json"));

        final var result = underTest.getModelFileElement(modelId);

        assertThat(result.isPresent()).isTrue();
    }

    @Test
    void givenDocumentModel_whenGetModelFileElementByPath_thenCorrect() {
        final var path = Paths.get(RUNTIME_WORKSPACE, "test/TestFieldDM.json");
        final var modelHandler = new ModelHandler(underTest, eventService);
        modelHandler.create(path);

        final var result = underTest.getModelFileElement(path);

        assertThat(result.isPresent()).isTrue();
    }

    @Test
    void givenDocumentModel_whenGetFileElementContent_thenCorrect() {
        final var modelHandler = new ModelHandler(underTest, eventService);
        modelHandler.create(Paths.get(RUNTIME_WORKSPACE, "test/TestFieldDM.json"));
        final var fileElement = Workspace.getInstance().getFileMap().get(MODEL).get(0);

        final var result = underTest.getFileElementContent(fileElement);

        assertThat(result).isNotBlank();
    }

    @Test
    void givenDocumentModelId_whenGetDocumentFileElementsByModelId_thenCorrect() {
        final var modelId = "TestFieldDM";
        final var documentHandler = new DocumentHandler(underTest, eventService);
        documentHandler.create(Paths.get(RUNTIME_WORKSPACE, "test/TestFieldDM-1.json"));

        final var result = underTest.getDocumentFileElementsByModelId(modelId);

        assertThat(result).hasSize(1);
    }

    @Test
    void givenDocument_whenGetDocumentFileElementById_thenCorrect() {
        final var documentId = "TestFieldDM-1";
        final var documentHandler = new DocumentHandler(underTest, eventService);
        documentHandler.create(Paths.get(RUNTIME_WORKSPACE, "test/TestFieldDM-1.json"));

        final var result = underTest.getDocumentFileElement(documentId);

        assertThat(result.isPresent()).isTrue();
    }

    @Test
    void givenDocument_whenGetDocumentFileElementPath_thenCorrect() {
        final var path = Paths.get(RUNTIME_WORKSPACE, "test/TestFieldDM-1.json");
        final var documentHandler = new DocumentHandler(underTest, eventService);
        documentHandler.create(path);

        final var result = underTest.getDocumentFileElement(path);

        assertThat(result.isPresent()).isTrue();
    }

    @Test
    void givenDocument_whenGetDocumentContent_thenCorrect() {
        final var documentId = "TestFieldDM-1";
        final var documentHandler = new DocumentHandler(underTest, eventService);
        documentHandler.create(Paths.get(RUNTIME_WORKSPACE, "test/TestFieldDM-1.json"));

        final var result = underTest.getDocumentContent(documentId);

        assertThat(result.isPresent()).isTrue();
    }

    @Test
    void givenDocument_whenGetDocument_thenCorrect() {
        final var documentId = "LineDM-1";
        final var modelHandler = new ModelHandler(underTest, eventService);
        final var documentHandler = new DocumentHandler(underTest, eventService);
        modelHandler.create(Paths.get(RUNTIME_WORKSPACE, "horizontalLine/LineDM.json"));
        modelHandler.create(Paths.get(RUNTIME_WORKSPACE, "horizontalLine/LinePM.json"));
        documentHandler.create(Paths.get(RUNTIME_WORKSPACE, "horizontalLine/LineDM-1.json"));

        final var result = underTest.getDocument(documentId);

        assertThat(result.isPresent()).isTrue();
    }

    @Test
    void givenLine_whenGetPossibleDocuments_thenCorrect() {
        final var printModelId = "LinePM";
        final var modelHandler = new ModelHandler(underTest, eventService);
        final var documentHandler = new DocumentHandler(underTest, eventService);
        modelHandler.create(Paths.get(RUNTIME_WORKSPACE, "horizontalLine/LineDM.json"));
        modelHandler.create(Paths.get(RUNTIME_WORKSPACE, "horizontalLine/LinePM.json"));
        documentHandler.create(Paths.get(RUNTIME_WORKSPACE, "horizontalLine/LineDM-1.json"));

        final var result = underTest.getPossibleDocuments(printModelId);

        assertThat(result).containsKey("LineDM");
        assertThat(result).containsValue(List.of("LineDM-1"));
    }

    @Test
    void givenDocumentModel_whenGetFileElement_thenCorrect() {
        final var path = Paths.get(RUNTIME_WORKSPACE, "test/TestFieldDM.json");
        final var modelHandler = new ModelHandler(underTest, eventService);
        modelHandler.create(path);

        final var result = underTest.getFileElement(path, MODEL);

        assertThat(result.isPresent()).isTrue();
    }
}
