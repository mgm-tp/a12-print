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
package com.mgmtp.a12.print.integration.internal.service;

import com.mgmtp.a12.contentstore.client.configuration.ContentStoreClientProperties;
import com.mgmtp.a12.dataservices.attachment.AttachmentService;
import com.mgmtp.a12.dataservices.attachment.AttachmentUrl;
import com.mgmtp.a12.dataservices.common.exception.InvalidInputException;
import com.mgmtp.a12.dataservices.document.DocumentReference;
import com.mgmtp.a12.print.engine.api.a12.AttachmentDependencyDescriptor;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.ObjectProvider;

import java.util.Optional;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AttachmentProviderFactoryTest {

	private static final String ATTACHMENT_ID = "attachment-1";
	private static final String REMOTE_URL = "http://content-store:8081";
	private static final String RELATIVE_LOCATION = "./cs/download/05f8c8f6-f9de-4465-af21-dc2c78a5b3d0?filename=mgm_leipzig_0507.jpg";

	private final AttachmentService attachmentService = mock(AttachmentService.class);
	private final DocumentReference documentReference = mock(DocumentReference.class);

	@ParameterizedTest
	@CsvSource({
		"'http://localhost:8082/cs/download/x?filename=a.jpg', 'http://host:8080/ds', 'http://localhost:8082/cs/download/x?filename=a.jpg'",
		"'./cs/download/x?filename=a.jpg',                     'http://host:8080/ds', 'http://host:8080/ds/cs/download/x?filename=a.jpg'",
		"'./cs/download/x?filename=a.jpg',                     'http://host:8080/',   'http://host:8080/cs/download/x?filename=a.jpg'",
		"'/cs/download/x?filename=a.jpg',                      'http://host:8080/ds', 'http://host:8080/cs/download/x?filename=a.jpg'",
		"'./cs/download/x?filename=a.jpg',                     '',                    './cs/download/x?filename=a.jpg'"
	})
	void toAbsoluteUri_resolvesRelativeLocationsAgainstServerBaseUrl(String location, String serverBaseUrl, String expected) {
		assertThat(AttachmentProviderFactory.toAbsoluteUri(location, serverBaseUrl)).hasToString(expected);
	}

	@Test
	void givenRemoteUrl_whenGettingServerBaseUrl_thenRemoteUrlIsReturned() {
		assertThat(factory(REMOTE_URL).getServerBaseUrl()).isEqualTo(REMOTE_URL);
	}

	@ParameterizedTest
	@ValueSource(strings = { "", " " })
	void givenBlankRemoteUrl_whenGettingServerBaseUrl_thenNullIsReturned(String remoteUrl) {
		assertThat(factory(remoteUrl).getServerBaseUrl()).isNull();
	}

	@Test
	void givenNoContentStoreClientProperties_whenGettingServerBaseUrl_thenNullIsReturned() {
		assertThat(factory(null).getServerBaseUrl()).isNull();
	}

	@Test
	void givenRelativeUrlWithoutRemoteUrl_whenLoadingAttachment_thenInvalidInputExceptionIsThrown() {
		attachmentLocation(RELATIVE_LOCATION);

		assertThatThrownBy(() -> load(factory(null)))
			.isInstanceOf(InvalidInputException.class)
			.hasMessageContaining(ATTACHMENT_ID);
	}

	@Test
	void givenMissingAttachment_whenLoadingIt_thenInvalidInputExceptionIsThrown() {
		when(attachmentService.findAttachmentUrl(anyString(), any())).thenReturn(Optional.empty());

		assertThatThrownBy(() -> load(factory(null)))
			.isInstanceOf(InvalidInputException.class)
			.hasMessageContaining(ATTACHMENT_ID);
	}

	@Test
	void givenUnreachableAttachment_whenLoadingIt_thenInvalidInputExceptionIsThrown() {
		attachmentLocation("http://127.0.0.1:1/attachment");

		assertThatThrownBy(() -> load(factory(null)))
			.isInstanceOf(InvalidInputException.class);
	}

	private void load(AttachmentProviderFactory factory) {
		factory.getAttachmentProvider(documentReference).loadAttachment(descriptor());
	}

	private AttachmentProviderFactory factory(String remoteUrl) {
		@SuppressWarnings("unchecked")
		ObjectProvider<ContentStoreClientProperties> provider = mock(ObjectProvider.class);
		if (remoteUrl == null) {
			when(provider.stream()).thenAnswer(invocation -> Stream.empty());
		} else {
			ContentStoreClientProperties properties = new ContentStoreClientProperties();
			properties.getConfiguration().setRemoteUrl(remoteUrl);
			when(provider.stream()).thenAnswer(invocation -> Stream.of(properties));
		}
		return new AttachmentProviderFactory(attachmentService, provider);
	}

	private void attachmentLocation(String location) {
		AttachmentUrl attachmentUrl = mock(AttachmentUrl.class);
		when(attachmentUrl.getLocation()).thenReturn(location);
		when(attachmentService.findAttachmentUrl(ATTACHMENT_ID, documentReference)).thenReturn(Optional.of(attachmentUrl));
	}

	private static AttachmentDependencyDescriptor descriptor() {
		AttachmentDependencyDescriptor descriptor = mock(AttachmentDependencyDescriptor.class);
		when(descriptor.getAttachmentId()).thenReturn(ATTACHMENT_ID);
		return descriptor;
	}
}
