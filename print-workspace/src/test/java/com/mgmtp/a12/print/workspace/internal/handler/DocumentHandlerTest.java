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

import com.mgmtp.a12.print.workspace.internal.Workspace;
import com.mgmtp.a12.print.workspace.internal.elements.DocumentFileElement;
import com.mgmtp.a12.print.workspace.internal.event.DocumentChangeEvent;
import com.mgmtp.a12.print.workspace.internal.event.EventService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.nio.file.Path;
import java.util.Optional;

import static com.mgmtp.a12.print.workspace.internal.elements.FileElementType.DOCUMENT;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DocumentHandlerTest {
    @Mock
    private WorkspaceHandler workspaceHandler;
    @Mock
    private EventService eventService;
    @Spy
    @InjectMocks
    private DocumentHandler underTest;

    @BeforeEach
    public void setUp() {
        Workspace.getInstance().getFileMap().get(DOCUMENT).clear();
    }

    @Test
    void givenExistedDocument_whenCreate_thenCorrect() {
        final var mockPath = mock(Path.class, "Path");
        when(workspaceHandler.getDocumentFileElement(anyString())).thenReturn(Optional.of(mock(DocumentFileElement.class)));

        underTest.create(mockPath);

        verify(workspaceHandler).getDocumentFileElement(anyString());
        verify(eventService, never()).sendEvent(any(DocumentChangeEvent.class));
        assertThat(Workspace.getInstance().getFileMap().get(DOCUMENT)).isEmpty();
    }

    @Test
    void givenNewDocument_whenCreate_thenCorrect() {
        final var mockPath = mock(Path.class, "Path");
        when(workspaceHandler.getDocumentFileElement(anyString())).thenReturn(Optional.empty());

        underTest.create(mockPath);

        verify(workspaceHandler).getDocumentFileElement(anyString());
        verify(eventService).sendEvent(any(DocumentChangeEvent.class));
        assertThat(Workspace.getInstance().getFileMap().get(DOCUMENT)).isNotEmpty();
    }

    @Test
    void givenExistedDocument_whenDelete_thenReturnTrue() {
        final var documentFileElements = Workspace.getInstance().getFileMap().get(DOCUMENT);
        final var mockPath = mock(Path.class, "Path");
        final var mockDocumentFileElement = mock(DocumentFileElement.class);
        when(workspaceHandler.getDocumentFileElement(mockPath)).thenReturn(Optional.of(mockDocumentFileElement));
        documentFileElements.add(mockDocumentFileElement);
        assertThat(documentFileElements).hasSize(1);

        final var result = underTest.delete(mockPath);

        verify(workspaceHandler).getDocumentFileElement(any(Path.class));
        verify(eventService).sendEvent(any(DocumentChangeEvent.class));
        assertThat(documentFileElements).isEmpty();
        assertThat(result).isTrue();
    }

    @Test
    void givenNonExistedDocument_whenDelete_thenReturnFalse() {
        final var documentFileElements = Workspace.getInstance().getFileMap().get(DOCUMENT);
        final var mockPath = mock(Path.class, "Path");
        final var mockDocumentFileElement = mock(DocumentFileElement.class);
        when(workspaceHandler.getDocumentFileElement(mockPath)).thenReturn(Optional.empty());
        documentFileElements.add(mockDocumentFileElement);

        final var result = underTest.delete(mockPath);

        verify(workspaceHandler).getDocumentFileElement(any(Path.class));
        verify(eventService, never()).sendEvent(any(DocumentChangeEvent.class));
        assertThat(documentFileElements).hasSize(1);
        assertThat(documentFileElements.get(0)).isEqualTo(mockDocumentFileElement);
        assertThat(result).isFalse();
    }

    @Test
    void testModify() {
        final var mockPath = mock(Path.class, "Path");
        when(workspaceHandler.getDocumentFileElement(mockPath)).thenReturn(Optional.of(mock(DocumentFileElement.class)));

        underTest.modify(mockPath);

        verify(workspaceHandler, times(2)).getDocumentFileElement(any(Path.class));
        verify(eventService, times(3)).sendEvent(any(DocumentChangeEvent.class));
    }
}
