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
import com.mgmtp.a12.print.workspace.internal.elements.PropertiesFileElement;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.nio.file.Path;
import java.util.Optional;

import static com.mgmtp.a12.print.workspace.internal.elements.FileElementType.PROPERTIES;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PropertyHandlerTest {
	@Mock
	private WorkspaceHandler workspaceHandler;
	@Spy
	@InjectMocks
	private PropertyHandler underTest;

	@BeforeEach
	public void setUp() {
		Workspace.getInstance().getFileMap().get(PROPERTIES).clear();
	}

	@Test
	void testCreate() {
		final var mockPath = mock(Path.class, "Path");
		final var propertiesFileElements = Workspace.getInstance().getFileMap().get(PROPERTIES);
		assertThat(propertiesFileElements).isEmpty();

		underTest.create(mockPath);

		assertThat(propertiesFileElements).hasSize(1);
	}

	@Test
	void givenExistedProperties_whenDelete_thenReturnTrue() {
		final var propertiesFileElements = Workspace.getInstance().getFileMap().get(PROPERTIES);
		final var mockPath = mock(Path.class, "Path");
		final var mockPropertiesFileElement = mock(PropertiesFileElement.class);
		when(workspaceHandler.getFileElement(mockPath, PROPERTIES)).thenReturn(Optional.of(mockPropertiesFileElement));
		propertiesFileElements.add(mockPropertiesFileElement);
		assertThat(propertiesFileElements).hasSize(1);

		final var result = underTest.delete(mockPath);

		verify(workspaceHandler).getFileElement(mockPath, PROPERTIES);
		assertThat(propertiesFileElements).isEmpty();
		assertThat(result).isTrue();
	}

	@Test
	void givenNonExistedProperties_whenDelete_thenReturnFalse() {
		final var propertiesFileElements = Workspace.getInstance().getFileMap().get(PROPERTIES);
		final var mockPath = mock(Path.class, "Path");
		final var mockPropertiesFileElement = mock(PropertiesFileElement.class);
		propertiesFileElements.add(mockPropertiesFileElement);
		when(workspaceHandler.getFileElement(mockPath, PROPERTIES)).thenReturn(Optional.empty());

		final var result = underTest.delete(mockPath);

		verify(workspaceHandler).getFileElement(mockPath, PROPERTIES);
		assertThat(propertiesFileElements).hasSize(1);
		assertThat(propertiesFileElements.get(0)).isEqualTo(mockPropertiesFileElement);
		assertThat(result).isFalse();
	}
}
