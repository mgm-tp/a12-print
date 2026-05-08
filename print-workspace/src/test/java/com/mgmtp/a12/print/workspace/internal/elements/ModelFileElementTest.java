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

import com.mgmtp.a12.model.header.Header;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class ModelFileElementTest {
    private ModelFileElement underTest;

    @Test
    void givenMocks_whenSetRelatedTransactionLogFileElement_thenCorrect() {
        final var mockPath = mock(Path.class, "Path");
        final var mockHeader = mock(Header.class);
        underTest = new ModelFileElement(mockPath, mockHeader);
        final var mockTransactionLogFileElement = mock(TransactionLogFileElement.class);

        underTest.setRelatedTransactionLogFileElement(mockTransactionLogFileElement);

        final var result = underTest.getRelatedTransactionLogFileElement().get();
        assertThat(result).isEqualTo(mockTransactionLogFileElement);
    }

    @Test
    void givenValidModelContent_whenIsModelFile_thenTrue() {
        final var contentOpt = Optional.of("{\"header\":{},\"content\":{}}");

        final var result = ModelFileElement.isModelFile(contentOpt);

        assertThat(result).isTrue();
    }

    @Test
    void givenInvalidModelContent_whenIsModelFile_thenFalse() {
        final var contentOpt = Optional.of("{\"content\":{}}");

        final var result = ModelFileElement.isModelFile(contentOpt);

        assertThat(result).isFalse();
    }

    @Test
    void givenPath_whenGetRelatedLogPath_thenCorrect() {
        final var printModelPath = Paths.get("testdata/data/", "PrintModelTest.json");
        final var transactionLogPath = Paths.get("testdata/data/", "PrintModelTest.wal");
        final var mockHeader = mock(Header.class);
        underTest = new ModelFileElement(printModelPath, mockHeader);

        final var result = underTest.getRelatedLogPath().toString();

        assertThat(result).isEqualTo(transactionLogPath.toString());
    }

    @Test
    void givenMocks_whenGetModelHeader_thenCorrect() {
        final var mockPath = mock(Path.class, "Path");
        final var mockHeader = mock(Header.class);
        underTest = new ModelFileElement(mockPath, mockHeader);

        final var result = underTest.getModelHeader();

        assertThat(result).isEqualTo(mockHeader);
    }
}
