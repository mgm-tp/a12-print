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

import com.mgmtp.a12.kernel.md.document.api.services.DocumentDeserializationConfig;
import com.mgmtp.a12.kernel.md.document.api.services.DocumentSerializationConfig;
import com.mgmtp.a12.kernel.md.document.apiV2.immutable.DocumentV2;
import com.mgmtp.a12.kernel.md.document.apiV2.services.IDocumentV2Serializer;
import com.mgmtp.a12.print.workspace.internal.exceptions.PrintWorkspaceException;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.StringReader;

@Slf4j
public class DocumentV2Utils {

	private static final String DOCUMENT_KEY = "document";
	private static final String DOCUMENT_MODEL_NAME_KEY = "documentModelName";

	@NonNull
	private final IDocumentV2Serializer documentSerializer;

	private static final ObjectMapper MAPPER = new ObjectMapper();

	private final DocumentDeserializationConfig deserializationConfig
		= DocumentDeserializationConfig.builder()
		.format(DocumentSerializationConfig.Format.JSON)
		.build();

	public DocumentV2Utils(@NonNull final IDocumentV2Serializer documentSerializer) {
		this.documentSerializer = documentSerializer;
	}

	public DocumentV2 getDocumentV2(String content, String documentModelId) {
		final var jsonTree = MAPPER.readTree(content);
		if (isWrapperDocument(jsonTree)) {
			return deserializeDocument(jsonTree.get(DOCUMENT_KEY).toString(), documentModelId);
		}

		return deserializeDocument(content, documentModelId);
	}

	private boolean isWrapperDocument(JsonNode jsonNode) {
		return jsonNode.isObject() &&
			jsonNode.size() == 2 &&
			jsonNode.has(DOCUMENT_KEY) &&
			jsonNode.has(DOCUMENT_MODEL_NAME_KEY);
	}

	private DocumentV2 deserializeDocument(String content, String documentModelId) {
		return documentSerializer.deserializeV2(
			new StringReader(content),
			documentModelId,
			deserializationConfig,
			rankedNotification -> {
				switch (rankedNotification.getSeverity()) {
					case INFO:
						log.info(rankedNotification.getMessage());
						break;
					case WARNING:
						log.warn(rankedNotification.getMessage());
						break;
					case ERROR:
						log.error(rankedNotification.getMessage());
						throw new PrintWorkspaceException("Error on parsing document: " + rankedNotification);
				}
			});
	}
}
