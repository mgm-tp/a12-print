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
package com.mgmtp.a12.print.workspace.internal;

import com.mgmtp.a12.print.workspace.internal.elements.FileElement;
import com.mgmtp.a12.print.workspace.internal.elements.FileElementType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.lang.reflect.InvocationTargetException;
import java.nio.file.Path;
import java.util.AbstractMap;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

public class WorkspaceTest {
	public static final String RUNTIME_WORKSPACE = "../engine-runtime-test/src/testFixtures/resources/data/";
	public static final String TEST_WORKSPACE = "src/test/resources/data/";
    private Workspace underTest;

    private static final Map<FileElementType, List<FileElement>> FILE_MAP = Map.ofEntries(
            new AbstractMap.SimpleEntry<>(FileElementType.MODEL, new ArrayList<>()),
            new AbstractMap.SimpleEntry<>(FileElementType.PROPERTIES, new ArrayList<>()),
            new AbstractMap.SimpleEntry<>(FileElementType.YAML, new ArrayList<>()),
            new AbstractMap.SimpleEntry<>(FileElementType.PDF, new ArrayList<>()),
            new AbstractMap.SimpleEntry<>(FileElementType.LOG, new ArrayList<>()),
            new AbstractMap.SimpleEntry<>(FileElementType.DOCUMENT, new ArrayList<>()),
            new AbstractMap.SimpleEntry<>(FileElementType.UNKNOWN, new ArrayList<>())
    );

    @BeforeEach
    void setUp() throws NoSuchMethodException, InvocationTargetException, InstantiationException, IllegalAccessException {
        final var constructor = Workspace.class.getDeclaredConstructor();
        constructor.setAccessible(true);
        underTest = constructor.newInstance();
    }

    @Test
    public void testSetWorkspace() {
        final var initFileMap = underTest.getFileMap();
        final var initPath = underTest.getPath();
        assertThat(initFileMap).hasSize(7).isEqualTo(FILE_MAP);
		assertThat(initPath.toString()).isEqualTo("");

        final var mockPath = mock(Path.class, "Path");
        underTest.setWorkspace(mockPath);

        final var setFileMap = underTest.getFileMap();
        var setPath = underTest.getPath();

        assertThat(setFileMap).hasSize(7).isEqualTo(FILE_MAP);
        assertThat(setPath).isEqualTo(mockPath);
    }

    @Test
    public void testGetFileMap() {
        final var fileMap = underTest.getFileMap();
        assertThat(fileMap).hasSize(7).isEqualTo(FILE_MAP);
    }

    @Test
    public void testGetPath() {
        final var initPath = underTest.getPath();
        assertThat(initPath.toString()).isEqualTo("");
    }

    @Test
    public void testGetInstance() {
        final var firstInstance = Workspace.getInstance();
        final var secondInstance = Workspace.getInstance();
        assertThat(firstInstance).isEqualTo(secondInstance);
    }
}
