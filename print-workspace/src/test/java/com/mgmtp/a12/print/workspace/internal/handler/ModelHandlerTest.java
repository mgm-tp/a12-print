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

import com.mgmtp.a12.model.header.Header;
import com.mgmtp.a12.print.workspace.internal.Workspace;
import com.mgmtp.a12.print.workspace.internal.elements.ModelFileElement;
import com.mgmtp.a12.print.workspace.internal.event.EventService;
import com.mgmtp.a12.print.workspace.internal.event.ModelChangeEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Optional;

import static com.mgmtp.a12.print.workspace.internal.WorkspaceTest.RUNTIME_WORKSPACE;
import static com.mgmtp.a12.print.workspace.internal.elements.FileElementType.MODEL;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ModelHandlerTest {
    @Mock
    private WorkspaceHandler workspaceHandler;
    @Mock
    private EventService eventService;
    @Spy
    @InjectMocks
    private ModelHandler underTest;

    @BeforeEach
    public void setUp() {
        Workspace.getInstance().getFileMap().get(MODEL).clear();
    }

    @Test
    void givenExistedModel_whenCreate_thenCorrect() {
        final var path = Paths.get(RUNTIME_WORKSPACE, "test/TestPM.json");
        when(workspaceHandler.getModelFileElement(anyString())).thenReturn(Optional.of(mock(ModelFileElement.class)));

        underTest.create(path);

        verify(workspaceHandler).getModelFileElement(anyString());
        verify(eventService, never()).sendEvent(any(ModelChangeEvent.class));
        assertThat(Workspace.getInstance().getFileMap().get(MODEL)).isEmpty();
    }

    @Test
    void givenNewModel_whenCreate_thenCorrect() {
        final var path = Paths.get(RUNTIME_WORKSPACE, "test/TestPM.json");
        when(workspaceHandler.getModelFileElement(anyString())).thenReturn(Optional.empty());

        underTest.create(path);

        verify(workspaceHandler).getModelFileElement(anyString());
        verify(eventService).sendEvent(any(ModelChangeEvent.class));
        assertThat(Workspace.getInstance().getFileMap().get(MODEL)).hasSize(1);
    }

    @Test
    void givenExistedModel_whenDelete_thenReturnTrue() {
        final var modelFileElements = Workspace.getInstance().getFileMap().get(MODEL);
        final var mockPath = mock(Path.class, "Path");
        final var mockModelFileElement = mock(ModelFileElement.class);
        final var mockModelHeader = mock(Header.class);
        when(workspaceHandler.getModelFileElement(mockPath)).thenReturn(Optional.of(mockModelFileElement));
        when(mockModelFileElement.getModelHeader()).thenReturn(mockModelHeader);
        modelFileElements.add(mockModelFileElement);
        assertThat(modelFileElements).hasSize(1);

        final var result = underTest.delete(mockPath);

        verify(workspaceHandler).getModelFileElement(mockPath);
        verify(eventService).sendEvent(any(ModelChangeEvent.class));
        assertThat(modelFileElements).isEmpty();
        assertThat(result).isTrue();
    }

    @Test
    void givenNonExistedModel_whenDelete_thenReturnFalse() {
        final var modelFileElements = Workspace.getInstance().getFileMap().get(MODEL);
        final var mockPath = mock(Path.class, "Path");
        final var mockModelFileElement = mock(ModelFileElement.class);
        when(workspaceHandler.getModelFileElement(mockPath)).thenReturn(Optional.empty());
        modelFileElements.add(mockModelFileElement);

        final var result = underTest.delete(mockPath);

        verify(workspaceHandler).getModelFileElement(mockPath);
        verify(eventService, never()).sendEvent(any(ModelChangeEvent.class));
        assertThat(modelFileElements).hasSize(1);
        assertThat(modelFileElements.get(0)).isEqualTo(mockModelFileElement);
        assertThat(result).isFalse();
    }

    @Test
    void testModify() {
        final var path = Paths.get(RUNTIME_WORKSPACE, "test/TestPM.json");
        final var mockModelFileElement = mock(ModelFileElement.class);
        final var mockModelHeader = mock(Header.class);
        when(workspaceHandler.getModelFileElement(path)).thenReturn(Optional.of(mockModelFileElement));
        when(mockModelFileElement.getModelHeader()).thenReturn(mockModelHeader);

        underTest.modify(path);

        verify(workspaceHandler, times(2)).getModelFileElement(any(Path.class));
        verify(eventService, times(3)).sendEvent(any(ModelChangeEvent.class));
    }
}
