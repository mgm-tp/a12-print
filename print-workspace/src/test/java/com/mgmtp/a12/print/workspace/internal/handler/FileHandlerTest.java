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

import com.mgmtp.a12.print.workspace.internal.event.EventService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.nio.file.Path;
import java.nio.file.Paths;

import static com.mgmtp.a12.print.workspace.internal.WorkspaceTest.RUNTIME_WORKSPACE;
import static com.mgmtp.a12.print.workspace.internal.elements.FileElementType.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FileHandlerTest {
    @Spy
    private WorkspaceHandler workspaceHandler = new WorkspaceHandler();
    @Mock
    private EventService eventService;
    @Spy
    @InjectMocks
    private FileHandler underTest;

    @Test
    void testCreate() {
        final var mockPath = mock(Path.class, "Path");

        underTest.create(mockPath);

        verify(underTest).getElementType(mockPath);
    }

    @Test
    void testModify() {
        final var mockPath = mock(Path.class, "Path");

        underTest.modify(mockPath);

        verify(underTest).getElementType(mockPath);
    }

    @Test
    void testDelete() {
        final var mockPath = mock(Path.class, "Path");
        when(mockPath.getParent()).thenReturn(mockPath);
        when(mockPath.resolve(anyString())).thenReturn(mockPath);

        final var result = underTest.delete(mockPath);

        assertThat(result).isFalse();
    }

    @Test
    void givenModelFile_whenGetElementType_thenCorrect() {
        final var path = Paths.get(RUNTIME_WORKSPACE, "test/TestPM.json");

        final var result = underTest.getElementType(path);

        assertThat(result).isEqualTo(MODEL);
    }

    @Test
    void givenDocumentFile_whenGetElementType_thenCorrect() {
        final var path = Paths.get(RUNTIME_WORKSPACE, "test/TestFieldDM-1.json");

        final var result = underTest.getElementType(path);

        assertThat(result).isEqualTo(DOCUMENT);
    }

    @Test
    void givenPropertiesFile_whenGetElementType_thenCorrect() {
        final var path = Paths.get(RUNTIME_WORKSPACE, "test/TestFieldDM.properties");

        final var result = underTest.getElementType(path);

        assertThat(result).isEqualTo(PROPERTIES);
    }

    @Test
    void givenPdfFile_whenGetElementType_thenCorrect() {
        final var path = Paths.get(RUNTIME_WORKSPACE, "test/TestFieldDM.pdf");

        final var result = underTest.getElementType(path);

        assertThat(result).isEqualTo(PDF);
    }

    @Test
    void givenLogFile_whenGetElementType_thenCorrect() {
        final var path = Paths.get(RUNTIME_WORKSPACE, "test/TestFieldDM.log");

        final var result = underTest.getElementType(path);

        assertThat(result).isEqualTo(LOG);
    }

    @Test
    void givenTransactionLogFile_whenGetElementType_thenCorrect() {
        final var path = Paths.get(RUNTIME_WORKSPACE, "test/TestFieldDM.wal");

        final var result = underTest.getElementType(path);

        assertThat(result).isEqualTo(TRANSACTION_LOG);
    }
}
