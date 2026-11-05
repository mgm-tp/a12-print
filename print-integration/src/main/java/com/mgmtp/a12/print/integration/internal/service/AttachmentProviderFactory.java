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
import com.mgmtp.a12.dataservices.document.DocumentReference;
import com.mgmtp.a12.print.engine.runtime.AttachmentProvider;
import com.mgmtp.a12.print.integration.exception.PrintServiceException;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.Strings;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;

@Component
@RequiredArgsConstructor
public class AttachmentProviderFactory {

	private final AttachmentService attachmentService;
	private final ObjectProvider<ContentStoreClientProperties> contentStoreClientProperties;

	public AttachmentProvider getAttachmentProvider(DocumentReference documentReference) {
		String serverBaseUrl = getServerBaseUrl();
		return AttachmentProvider.fromLoader(SecurityContextPropagation.withCurrentSecurityContext(id -> {
			String location = attachmentService.findAttachmentUrl(id, documentReference).orElseThrow(() ->
				new PrintServiceException(String.format("The attachment with the id %s was not found", id))
			).getLocation();

			try (InputStream is = toAbsoluteUri(location, serverBaseUrl).toURL().openStream()) {
				return new ByteArrayInputStream(is.readAllBytes());
			} catch (IOException | IllegalArgumentException e) {
				throw new PrintServiceException(String.format("The attachment with the id %s could not be loaded", id), e);
			}
		}));
	}

	static URI toAbsoluteUri(String location, String serverBaseUrl) {
		URI uri = URI.create(location);
		if (uri.isAbsolute() || StringUtils.isBlank(serverBaseUrl)) {
			return uri;
		}
		return URI.create(Strings.CS.appendIfMissing(serverBaseUrl, "/")).resolve(uri).normalize();
	}

	String getServerBaseUrl() {
		return contentStoreClientProperties.stream()
			.map(properties -> properties.getConfiguration().getRemoteUrl())
			.filter(StringUtils::isNotBlank)
			.findFirst()
			.orElse(null);
	}
}
