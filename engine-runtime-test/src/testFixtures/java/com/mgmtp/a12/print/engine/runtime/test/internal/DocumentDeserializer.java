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
package com.mgmtp.a12.print.engine.runtime.test.internal;

import com.mgmtp.a12.kernel.md.document.api.IDocument;
import com.mgmtp.a12.kernel.md.document.api.services.IDocumentSerializer;
import com.mgmtp.a12.kernel.md.model.api.services.IDocumentModelResolver;
import com.mgmtp.a12.kernel.md.serializer.MDSerializerFactory;
import com.mgmtp.a12.model.notification.RankedNotification;
import com.mgmtp.a12.model.notification.Severity;
import com.mgmtp.a12.print.engine.api.exception.impl.DocumentLoadingException;

import java.io.StringReader;
import java.util.function.Consumer;

import static com.mgmtp.a12.print.engine.runtime.test.internal.DocumentModelResolver.DESERIALIZATION_CONFIG;


public class DocumentDeserializer {
	public IDocument provide(
		final String documentModelId,
		final String jsonDocument,
		IDocumentModelResolver documentModelResolver
	) {
		final IDocumentSerializer documentSerializer = new MDSerializerFactory().createDocumentSerializer(documentModelResolver);
		return convert(documentSerializer, documentModelId, jsonDocument);
	}

	private IDocument convert(
		final IDocumentSerializer documentSerializer,
		final String documentModelId,
		final String jsonDocument
	) {
		IDocument document;
		try (final StringReader reader = new StringReader(jsonDocument)) {
			document = documentSerializer.deserialize(reader, documentModelId, DESERIALIZATION_CONFIG, new Consumer<RankedNotification>() {
				@Override
				public void accept(RankedNotification rankedNotification) {
					if (rankedNotification.getSeverity().equals(Severity.ERROR)) {
						throw new DocumentLoadingException("Error on parsing document: {}", rankedNotification);
					}
				}
			});
		} catch (final Exception exception) {
			throw new DocumentLoadingException("Error on parsing document.", exception);
		}
		return document;
	}
}
