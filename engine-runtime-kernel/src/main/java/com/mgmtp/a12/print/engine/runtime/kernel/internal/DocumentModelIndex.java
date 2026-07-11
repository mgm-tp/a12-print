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
import com.mgmtp.a12.kernel.md.model.a12internal.expansioninfo.ExpansionInfo;
import com.mgmtp.a12.kernel.md.model.a12internal.expansioninfo.origingraph.ExpansionEdge;
import com.mgmtp.a12.kernel.md.model.a12internal.expansioninfo.origingraph.ExpansionEdgeLabel;
import com.mgmtp.a12.kernel.md.model.a12internal.expansioninfo.origingraph.ExpansionNode;
import com.mgmtp.a12.kernel.md.model.a12internal.expansioninfo.origingraph.LocalCoordinates;
import com.mgmtp.a12.kernel.md.model.api.IDocumentModel;
import com.mgmtp.a12.kernel.md.model.api.IFieldTypeDefinition;
import com.mgmtp.a12.kernel.md.model.api.fieldtypes.IFieldType;
import com.mgmtp.a12.kernel.md.model.api.services.IDocumentModelSearchService;
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

	private final transient ExpansionInfo expansionInfo;

	public static DocumentModelIndex buildFrom(IDocumentModel documentModel) {
		return buildFrom(documentModel, null);
	}

	public static DocumentModelIndex buildFrom(IDocumentModel documentModel, ExpansionInfo expansionInfo) {
		var documentModelSearchService = new DocumentModelServiceFactory().createDocumentModelSearchService(documentModel);
		return new DocumentModelIndex(documentModel, documentModelSearchService, expansionInfo);
	}

	public static DocumentModelIndex load(@NonNull IDocumentModel documentModel) {
		return buildFrom(documentModel);
	}

	public static DocumentModelIndex load(@NonNull IDocumentModel documentModel, ExpansionInfo expansionInfo) {
		return buildFrom(documentModel, expansionInfo);
	}

	public Optional<IFieldType> getFieldType(TypeDefinition typeDefinition) {
		// direct name match (covers pre-prefixed type definitions from the print model editor)
		var directMatch = documentModel.getContent()
				.getTypeDefinitions()
				.stream()
				.filter(e -> e.getName().equals(typeDefinition.getId()))
				.findAny()
				.map(IFieldTypeDefinition::getFieldType);

		if (directMatch.isPresent()) {
			return directMatch;
		}

		// resolve the origin model for each type definition (external case where type definition names are not pre-prefixed)
		if (expansionInfo != null) {
			return documentModel.getContent()
					.getTypeDefinitions()
					.stream()
					.filter(e ->  canBeResolvedInAlternateOrigin(typeDefinition, e))
					.findAny()
					.map(IFieldTypeDefinition::getFieldType);
		}

		return Optional.empty();
	}

	private boolean canBeResolvedInAlternateOrigin(TypeDefinition typeDefinition, IFieldTypeDefinition e) {
		ExpansionNode origin = expansionInfo.getOrigin(LocalCoordinates.Typedef.of(e.getId()));
		if (origin == null) {
			return false;
		}

		String baseTypeDefName = stripPrefix(e.getName());

		if (hasImportEdge(origin)) {
			// For imported type definitions (purpose "typeDefinitions"),
			// attribute to the root model that imported them
			String prefixed = String.format("%s_%s", documentModel.getHeader().getId(), baseTypeDefName);
			return prefixed.equals(typeDefinition.getId());
		}

		// For included type definitions, attribute to the ultimate origin model
		for (ExpansionNode ultimateOrigin : origin.ultimateOrigins()) {
			String prefixed = String.format("%s_%s", ultimateOrigin.modelId(), baseTypeDefName);
			if (prefixed.equals(typeDefinition.getId())) {
				return true;
			}
		}
		return false;
	}

	private static String stripPrefix(String typeDefName) {
		int lastUnderscore = typeDefName.lastIndexOf('_');
		if (lastUnderscore >= 0) {
			return typeDefName.substring(lastUnderscore + 1);
		}
		return typeDefName;
	}

	private static boolean hasImportEdge(ExpansionNode node) {
		for (ExpansionEdge edge : node.previousOrigins()) {
			if (edge.label() instanceof ExpansionEdgeLabel.Dm.Import) {
				return true;
			}
			if (hasImportEdge(edge.previousNode())) {
				return true;
			}
		}
		return false;
	}
}
