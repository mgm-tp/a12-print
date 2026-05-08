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
package com.mgmtp.a12.print.engine.runtime.kernel.internal;

import com.mgmtp.a12.kernel.md.facade.DocumentModelServiceFactory;
import com.mgmtp.a12.kernel.md.model.api.IDocumentModel;
import com.mgmtp.a12.kernel.md.model.api.IFieldTypeDefinition;
import com.mgmtp.a12.kernel.md.model.api.fieldtypes.IFieldType;
import com.mgmtp.a12.kernel.md.model.api.services.IDocumentModelSearchService;
import com.mgmtp.a12.model.header.ModelReference;
import com.mgmtp.a12.print.model.api.model.element.base.TypeDefinition;
import lombok.Data;
import lombok.NonNull;
import lombok.experimental.Delegate;

import java.util.Optional;

@Data
public class DocumentModelIndex implements IDocumentModel, IDocumentModelSearchService {

	@Delegate(types = {IDocumentModel.class})
	private final IDocumentModel documentModel;

	@Delegate(types = {IDocumentModelSearchService.class})
	private final transient IDocumentModelSearchService documentModelSearchService;

	public static DocumentModelIndex buildFrom(IDocumentModel documentModel) {
		var documentModelSearchService = new DocumentModelServiceFactory().createDocumentModelSearchService(documentModel);
		return new DocumentModelIndex(documentModel, documentModelSearchService);
	}

	public static DocumentModelIndex load(@NonNull IDocumentModel documentModel) {
		return buildFrom(documentModel);
	}

	public Optional<IFieldType> getFieldType(TypeDefinition typeDefinition) {
		return documentModel.getContent()
							.getTypeDefinitions()
							.stream()
							.filter(e -> {
								final var typeDefinitionIsEqual = e.getName().equals(typeDefinition.getId());

								return typeDefinitionIsEqual || (e.getAllModelReferencePaths().isEmpty()
									? suffixTypeDefinitionWithModelName(documentModel.getHeader().getId(), e.getName()).equals(typeDefinition.getId())
									: getDeepestModelReferenceFromFieldTypeDefinition(e)
										.map(ref -> suffixTypeDefinitionWithModelName(ref.getReference(), e.getName()).equals(typeDefinition.getId()))
										.orElse(false));
							})
							.findAny()
							.map(IFieldTypeDefinition::getFieldType);
	}

	private Optional<ModelReference> getDeepestModelReferenceFromFieldTypeDefinition(IFieldTypeDefinition fieldTypeDefinition) {
		return fieldTypeDefinition.getAllModelReferencePaths().stream().findFirst().map((p) -> p.get(p.size() - 1));
	}

	private String suffixTypeDefinitionWithModelName(String modelName, String typeDefinitionName) {
		return String.format("%s_%s", modelName, typeDefinitionName);
	}
}
