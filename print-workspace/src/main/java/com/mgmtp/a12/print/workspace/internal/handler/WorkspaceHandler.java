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

import com.mgmtp.a12.kernel.md.document.apiV2.immutable.DocumentV2;
import com.mgmtp.a12.kernel.md.model.a12internal.DocumentModel;
import com.mgmtp.a12.kernel.md.model.a12internal.services.DocumentModelService;
import com.mgmtp.a12.kernel.md.model.api.IDocumentModel;
import com.mgmtp.a12.kernel.md.model.api.services.IDocumentModelResolver;
import com.mgmtp.a12.kernel.md.model.api.services.IDocumentModelSerializer;
import com.mgmtp.a12.kernel.md.serializer.MDSerializerFactory;
import com.mgmtp.a12.model.header.Header;
import com.mgmtp.a12.print.engine.api.PdfBoxPrintEngineConfig;
import com.mgmtp.a12.print.workspace.internal.Workspace;
import com.mgmtp.a12.print.workspace.internal.constants.ModelType;
import com.mgmtp.a12.print.workspace.internal.elements.DocumentFileElement;
import com.mgmtp.a12.print.workspace.internal.elements.FileElement;
import com.mgmtp.a12.print.workspace.internal.elements.FileElementType;
import com.mgmtp.a12.print.workspace.internal.elements.ModelFileElement;
import com.mgmtp.a12.print.workspace.internal.exceptions.PrintWorkspaceException;
import com.mgmtp.a12.print.workspace.internal.fonts.FontLoader;
import com.mgmtp.a12.print.workspace.internal.utils.DocumentModelUtils;
import com.mgmtp.a12.print.workspace.internal.utils.DocumentV2Utils;
import com.mgmtp.a12.print.workspace.internal.utils.FileUtils;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.io.StringReader;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
public class WorkspaceHandler implements IDocumentModelResolver {

	@NonNull
	private final DocumentV2Utils documentV2Utils;
	@NonNull
	private final IDocumentModelSerializer documentModelSerializer;
	@NonNull
	private final DocumentModelUtils documentModelUtils;
	@NonNull
	private final DocumentModelService documentModelService;

	public WorkspaceHandler() {
		this.documentModelUtils = new DocumentModelUtils(this);
		final var serializerFactory = new MDSerializerFactory();
		this.documentModelSerializer = serializerFactory.createDocumentModelSerializer();
		this.documentV2Utils = new DocumentV2Utils(serializerFactory.createDocumentSerializerV2(this));
		this.documentModelService = new DocumentModelService();
	}

	@Override
	public IDocumentModel getDocumentModelById(String id) {
		return documentModelUtils.expand(id);
	}

	public DocumentModel getUnexpandedModel(String id) {
		return getFileMap()
			.get(FileElementType.MODEL)
			.stream()
			.map(ModelFileElement.class::cast)
			.filter(e -> e.getModelHeader().getModelType().equals(ModelType.DOCUMENT_MODEL_TYPE) && e.getModelHeader().getId().equals(id))
			.findFirst()
			.map(this::getFileElementContent)
			.map(e -> {
				try {
					final var internDocumentModel = documentModelUtils.convertCustomTypeDefinitionsToStringType(
						documentModelService.convertFromExternal(documentModelSerializer.deserialize(new StringReader(e)))
					);

					documentModelUtils.prefixTypeDefinitionWithModelName(internDocumentModel);

					return internDocumentModel;
				} catch (IOException ex) {
					throw new PrintWorkspaceException(ex);
				}
			})
			.orElseThrow(
				() -> new PrintWorkspaceException("DocumentModel was not found in the Workspace : " + id)
			);
	}

	public Optional<String> getExpandedModelContent(String id) {
		Optional<ModelFileElement> modelFileElement = getModelFileElement(id);

		if (modelFileElement.isPresent()) {
			String modelContent;
			if (modelFileElement.get().getModelHeader().getModelType().equals(ModelType.DOCUMENT_MODEL_TYPE)) {
				IDocumentModel expandedDocumentModel = getDocumentModelById(
					modelFileElement.get().getModelHeader().getId()
				);
				modelContent = documentModelUtils.serializeDocumentModel(expandedDocumentModel);
			} else {
				modelContent = getFileElementContent(modelFileElement.get());
			}

			return Optional.ofNullable(modelContent);
		}
		return Optional.empty();
	}

	public List<ModelFileElement> getModelFileElementsByType(String type) {
		return getFileMap().get(FileElementType.MODEL).stream()
						   .filter(model -> ((ModelFileElement) model).getModelHeader().getModelType().equals(type))
						   .map(ModelFileElement.class::cast).toList();
	}

	public Optional<ModelFileElement> getModelFileElement(String id) {
		return getFileMap().get(FileElementType.MODEL).stream()
						   .map(ModelFileElement.class::cast)
						   .filter(model -> model.getModelHeader().getId().equals(id))
						   .findAny();
	}

	public Optional<ModelFileElement> getModelFileElement(Path path) {
		return getFileMap().get(FileElementType.MODEL).stream().filter(model -> model.getPath().equals(path))
						   .map(ModelFileElement.class::cast)
						   .findAny();
	}

	public String getFileElementContent(FileElement fileElement) {
		return FileUtils.readFileContent(fileElement.getPath());
	}


	public List<DocumentFileElement> getDocumentFileElementsByModelId(String modelId) {
		return getFileMap().get(FileElementType.DOCUMENT).stream()
						   .filter(document -> ((DocumentFileElement) document).getDocumentModelId().equals(modelId))
						   .map(DocumentFileElement.class::cast)
						   .collect(Collectors.toList());
	}

	public Optional<DocumentFileElement> getDocumentFileElement(String id) {
		return getFileMap().get(FileElementType.DOCUMENT).stream()
						   .filter(document -> ((DocumentFileElement) document).getDocumentId().equals(id))
						   .map(DocumentFileElement.class::cast)
						   .findAny();
	}

	public Optional<DocumentFileElement> getDocumentFileElement(Path path) {
		return getFileMap().get(FileElementType.DOCUMENT).stream()
						   .filter(document -> document.getPath().equals(path))
						   .map(DocumentFileElement.class::cast)
						   .findAny();
	}

	public Optional<String> getDocumentContent(String id) {
		return getDocumentFileElement(id).map(documentFileElement -> FileUtils.readFileContent(documentFileElement.getPath()));
	}

	public Optional<DocumentV2> getDocument(String id) {
		final var documentModelId = DocumentFileElement.resolveModelName(id);
		final var documentIdWithoutModel = DocumentFileElement.resolveIdWithoutModel(id);

		Optional<DocumentV2> document = getDocumentContent(id).map(e ->
			documentV2Utils.getDocumentV2(e, documentModelId)
		);

		if (document.isPresent()) {
			document = Optional.of(document.get().withId(documentIdWithoutModel));
		}

		return document;
	}

	public Map<String, List<String>> getPossibleDocuments(String printModelId) {
		Map<String, List<String>> documents = new HashMap<>();
		Optional<ModelFileElement> model = getModelFileElement(printModelId);
		if (model.isPresent()) {
			Header modelHeader = model.get().getModelHeader();
			if (modelHeader.getModelReferences() != null) {
				modelHeader.getModelReferences().stream().filter(ref -> ref.getModelType().equals(FileElementType.DOCUMENT.getType())).forEach(ref -> {
					List<DocumentFileElement> documentFileElements =
						getDocumentFileElementsByModelId(ref.getReference());

					documents.put(ref.getReference(), documentFileElements.stream()
						.map(DocumentFileElement::getDocumentId).toList());
				});
			}
		}
		return documents;
	}

	public Optional<FileElement> getFileElement(Path path, FileElementType type) {
		return getFileMap().get(type).stream().filter(property -> property.getPath().equals(path))
						   .findAny();
	}

	public PdfBoxPrintEngineConfig getPrintConfig() {
		return FontLoader.loadFontConfig();
	}

	public Map<FileElementType, List<FileElement>> getFileMap() {
		return Workspace.getInstance().getFileMap();
	}
}
