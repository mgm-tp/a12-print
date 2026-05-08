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

import com.mgmtp.a12.kernel.md.model.a12internal.DocumentModel;
import com.mgmtp.a12.kernel.md.model.a12internal.fieldtypes.CustomFieldType;
import com.mgmtp.a12.kernel.md.model.a12internal.fieldtypes.StringType;
import com.mgmtp.a12.kernel.md.model.a12internal.services.DocumentModelReferenceResolver;
import com.mgmtp.a12.kernel.md.model.a12internal.services.DocumentModelService;
import com.mgmtp.a12.kernel.md.model.api.IDocumentModel;
import com.mgmtp.a12.kernel.md.model.api.services.DocumentModelExpansionException;
import com.mgmtp.a12.kernel.md.model.api.services.IDocumentModelSerializer;
import com.mgmtp.a12.kernel.md.serializer.MDSerializerFactory;
import com.mgmtp.a12.model.notification.RankedNotification;
import com.mgmtp.a12.print.workspace.internal.exceptions.PrintWorkspaceException;
import com.mgmtp.a12.print.workspace.internal.handler.WorkspaceHandler;
import com.mgmtp.a12.print.workspace.internal.resolver.CustomDocumentModelReferenceResolver;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.io.StringWriter;
import java.util.stream.Collectors;

@Slf4j
public class DocumentModelUtils {
	@NonNull
	private final IDocumentModelSerializer documentModelSerializer;
	@NonNull
	private final DocumentModelReferenceResolver documentModelReferenceResolver;
	@NonNull
	private final WorkspaceHandler workspaceHandler;
	@NonNull
	private final DocumentModelService documentModelService;


	public DocumentModelUtils(@NonNull WorkspaceHandler workspaceHandler) {
		final var serializerFactory = new MDSerializerFactory();
		this.documentModelSerializer = serializerFactory.createDocumentModelSerializer();
		this.workspaceHandler = workspaceHandler;
		this.documentModelReferenceResolver = new CustomDocumentModelReferenceResolver(workspaceHandler);
		this.documentModelService = new DocumentModelService();
	}

	public IDocumentModel expand(String modelId) {
		final var documentModel = workspaceHandler.getUnexpandedModel(modelId);

		try {
			this.documentModelService.expand(
				documentModel,
				documentModelReferenceResolver
			);
		} catch (DocumentModelExpansionException e) {
			throw new PrintWorkspaceException(e);
		}

		return this.documentModelService.convertToExternal(documentModel);
	}

	public void suffixTypeDefinitionWithModelName(DocumentModel model) {
		final var documentModelId = model.getHeader().getId();
		model.getContent().getTypeDefinitions().forEach(def ->
			def.setName(String.format("%s_%s", documentModelId, def.getName()))
		);
	}

	public String serializeDocumentModel(IDocumentModel internDocumentModel) {
		StringWriter expandedModel = new StringWriter();
		try {
			documentModelSerializer.serialize(internDocumentModel, expandedModel, (RankedNotification rankedNotification) -> {
				log.debug("Document Model Serialization Notification: {}", rankedNotification.getMessage());
			});
		} catch (IOException e) {
			throw new PrintWorkspaceException(e);
		}
		return expandedModel.toString();
	}

	public DocumentModel convertCustomTypeDefinitionsToStringType(
		DocumentModel documentModel
	) {
		documentModel.getContent().setTypeDefinitions(
			documentModel.getContent().getTypeDefinitions().stream().peek(def -> {
				if (def.getFieldType() instanceof CustomFieldType) {
					def.setFieldType(new StringType());
				}
			}).collect(Collectors.toList())
		);
		return documentModel;
	}
}
