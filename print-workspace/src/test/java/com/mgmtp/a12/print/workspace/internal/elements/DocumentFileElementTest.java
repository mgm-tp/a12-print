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
package com.mgmtp.a12.print.workspace.internal.elements;

import org.junit.jupiter.api.Test;

import java.nio.file.Path;
import java.nio.file.Paths;

import static org.assertj.core.api.Assertions.assertThat;

class DocumentFileElementTest {
    private DocumentFileElement underTest;

    @Test
    void givenPath_whenIsDocumentFile_thenTrue() {
        final var path = Paths.get("testdata/data/test/", "TestFieldDM-1.json");
        final var result = DocumentFileElement.isDocumentFile(path);
        assertThat(result).isTrue();
    }

    @Test
    void givenPath_whenResolveModelName_thenCorrect() {
        final var path = Paths.get("testdata/data/test/", "TestFieldDM-1.json");
        final var result = DocumentFileElement.resolveModelName(path);
        assertThat(result).isEqualTo("TestFieldDM");
    }

    @Test
    void givenDocumentId_whenResolveModelName_thenCorrect() {
        final var documentId = "TestFieldDM-1.json";
        final var result = DocumentFileElement.resolveModelName(documentId);
        assertThat(result).isEqualTo("TestFieldDM");
    }

    @Test
    void givenDocumentId_whenResolveIdWithoutModel_thenCorrect() {
        final var documentId = "TestFieldDM-1.json";
        final var result = DocumentFileElement.resolveIdWithoutModel(documentId);
        assertThat(result).isEqualTo("1.json");
    }

    @Test
    void givenPath_whenResolveDocumentId_thenCorrect() {
        final var path = Paths.get("testdata/data/test/", "TestFieldDM-1.json");
        final var result = DocumentFileElement.resolveDocumentId(path);
        assertThat(result).isEqualTo("TestFieldDM-1");
    }

    @Test
    void givenPath_whenGetDocumentId_thenCorrect() {
        final var path = Paths.get("testdata/data/test/", "TestFieldDM-1.json");
        final var documentModelId = "TestFieldDM-1";
        final var documentId = "1";
        underTest = new DocumentFileElement(path, documentModelId, documentId);

        assertThat(underTest.getPath()).isEqualTo(path);
        assertThat(underTest.getDocumentModelId()).isEqualTo(documentModelId);
        assertThat(underTest.getDocumentId()).isEqualTo(documentId);
    }
}
