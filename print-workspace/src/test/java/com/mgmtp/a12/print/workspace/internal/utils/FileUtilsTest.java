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

import com.mgmtp.a12.print.workspace.internal.exceptions.PrintWorkspaceException;
import org.junit.jupiter.api.Test;

import java.nio.file.Paths;

import static com.mgmtp.a12.print.workspace.internal.WorkspaceTest.RUNTIME_WORKSPACE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
class FileUtilsTest {

    @Test
    void givenExistedDocumentModel_whenReadFileContent_thenCorrect() {
        final var path = Paths.get(RUNTIME_WORKSPACE, "test/TestFieldDM.json");

        final var result = FileUtils.readFileContent(path);

        assertThat(result).contains("TestFieldDM");
    }

    @Test
    void givenNonExistedDocumentModel_whenReadFileContent_thenThrowException() {
        final var path = Paths.get(RUNTIME_WORKSPACE, "TestDM.json");

        assertThatThrownBy(() -> FileUtils.readFileContent(path))
                .isInstanceOf(PrintWorkspaceException.class)
                .hasMessageContaining("unable to read file");

    }

    @Test
    void givenExistedDocumentModel_whenTryReadFileContent_thenCorrect() {
        final var path = Paths.get(RUNTIME_WORKSPACE, "test/TestFieldDM.json");

        final var result = FileUtils.tryReadFileContent(path);

        assertThat(result.isPresent()).isTrue();
    }

    @Test
    void givenNonExistedDocumentModel_whentryReadFileContent_thenReturnEmpty() {
        final var path = Paths.get(RUNTIME_WORKSPACE, "TestDM.json");

        final var result = FileUtils.tryReadFileContent(path);

        assertThat(result.isPresent()).isFalse();

    }

    @Test
    void testGetFileExtension() {
        final var path = Paths.get(RUNTIME_WORKSPACE, "test/TestFieldDM.json");

        final var result = FileUtils.getFileExtension(path);

        assertThat(result).isEqualTo("json");
    }
}
