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
import com.mgmtp.a12.print.workspace.internal.elements.YamlFileElement;
import com.mgmtp.a12.print.workspace.internal.event.ConfigChangeEvent;
import com.mgmtp.a12.print.workspace.internal.event.EventService;
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

import static com.mgmtp.a12.print.workspace.internal.elements.FileElementType.YAML;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class YamlHandlerTest {
    @Mock
    private WorkspaceHandler workspaceHandler;
    @Mock
    private EventService eventService;
    @Spy
    @InjectMocks
    private YamlHandler underTest;

    @BeforeEach
    public void setUp() {
        Workspace.getInstance().getFileMap().get(YAML).clear();
    }

    @Test
    void givenExistedYaml_whenDelete_thenReturnTrue() {
        final var yamlFileElements = Workspace.getInstance().getFileMap().get(YAML);
        final var mockPath = Paths.get("print-config.yaml");
        final var mockYamlFileElement = mock(YamlFileElement.class);
        when(workspaceHandler.getFileElement(mockPath, YAML)).thenReturn(Optional.of(mockYamlFileElement));
        yamlFileElements.add(mockYamlFileElement);
        assertThat(yamlFileElements).hasSize(1);

        final var result = underTest.delete(mockPath);

        verify(workspaceHandler).getFileElement(mockPath, YAML);
        verify(eventService).sendEvent(any(ConfigChangeEvent.class));
        assertThat(yamlFileElements).isEmpty();
        assertThat(result).isTrue();
    }

    @Test
    void givenNonExistedYaml_whenDelete_thenReturnFalse() {
        final var yamlFileElements = Workspace.getInstance().getFileMap().get(YAML);
        final var mockPath = mock(Path.class, "Path");
        final var mockYamlFileElement = mock(YamlFileElement.class);
        when(workspaceHandler.getFileElement(mockPath, YAML)).thenReturn(Optional.empty());
        yamlFileElements.add(mockYamlFileElement);

        final var result = underTest.delete(mockPath);

        verify(workspaceHandler).getFileElement(mockPath, YAML);
        verify(eventService, never()).sendEvent(any(ConfigChangeEvent.class));
        assertThat(yamlFileElements).hasSize(1);
        assertThat(yamlFileElements.get(0)).isEqualTo(mockYamlFileElement);
        assertThat(result).isFalse();
    }

    @Test
    void testModify() {
        final var mockPath = Paths.get("print-config.yaml");
        YamlFileElement mockYamlFileElement = mock(YamlFileElement.class);
        when(workspaceHandler.getYamlFileElement(mockPath)).thenReturn(Optional.of(mockYamlFileElement));
        when(workspaceHandler.getFileElement(mockPath, YAML)).thenReturn(Optional.of(mockYamlFileElement));

        underTest.modify(mockPath);

        verify(workspaceHandler).getFileElement(mockPath, YAML);
        verify(workspaceHandler).getYamlFileElement(any(Path.class));
        verify(eventService, times(3)).sendEvent(any(ConfigChangeEvent.class));
    }
}
