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
import com.mgmtp.a12.print.workspace.internal.elements.ModelFileElement;
import com.mgmtp.a12.print.workspace.internal.elements.TransactionLogFileElement;
import com.mgmtp.a12.print.workspace.internal.event.EventService;
import com.mgmtp.a12.print.workspace.internal.event.ModelChangeEvent;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.nio.file.Path;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TransactionLogHandlerTest {
    @Mock
    private WorkspaceHandler workspaceHandler;
    @Mock
    private EventService eventService;
    @Spy
    @InjectMocks
    private TransactionLogHandler underTest;

    @Test
    void testCreate() {
        final var mockPath = mock(Path.class, "Path");
        final var mockModelFileElement = mock(ModelFileElement.class);
        final var mockModelHeader = mock(Header.class);
        when(workspaceHandler.getModelFileElement(mockPath)).thenReturn(Optional.of(mockModelFileElement));
        when(mockModelFileElement.getRelatedTransactionLogFileElement()).thenReturn(Optional.empty());
        when(mockPath.getParent()).thenReturn(mockPath);
        when(mockPath.resolve(anyString())).thenReturn(mockPath);
        when(mockModelFileElement.getModelHeader()).thenReturn(mockModelHeader);

        underTest.create(mockPath);

        verify(workspaceHandler).getModelFileElement(mockPath);
        verify(eventService).sendEvent(any(ModelChangeEvent.class));
    }

    @Test
    void testDelete() {
        final var mockPath = mock(Path.class, "Path");
        final var mockModelHeader = mock(Header.class);
        final var mockModelFileElement = spy(new ModelFileElement(mockPath, mockModelHeader));
        when(mockPath.getParent()).thenReturn(mockPath);
        when(mockPath.resolve(anyString())).thenReturn(mockPath);
        when(workspaceHandler.getModelFileElement(mockPath)).thenReturn(Optional.of(mockModelFileElement));
        when(mockModelFileElement.getRelatedTransactionLogFileElement()).thenReturn(Optional.of(mock(TransactionLogFileElement.class)));
        when(mockModelFileElement.getModelHeader()).thenReturn(mockModelHeader);

        final var result = underTest.delete(mockPath);

        verify(workspaceHandler).getModelFileElement(mockPath);
        verify(eventService).sendEvent(any(ModelChangeEvent.class));
        assertThat(result).isTrue();
    }
}
