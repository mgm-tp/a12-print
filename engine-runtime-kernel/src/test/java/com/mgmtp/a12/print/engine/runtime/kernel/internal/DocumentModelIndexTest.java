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

import com.mgmtp.a12.kernel.md.combination.a12internal.CombinationModelService;
import com.mgmtp.a12.kernel.md.combination.a12internal.DMWrapper;
import com.mgmtp.a12.kernel.md.model.a12internal.DocumentModel;
import com.mgmtp.a12.kernel.md.model.a12internal.expansioninfo.ExpansionInfo;
import com.mgmtp.a12.kernel.md.model.a12internal.services.DocumentModelService;
import com.mgmtp.a12.kernel.md.model.api.IDocumentModel;
import com.mgmtp.a12.kernel.md.model.api.services.IDocumentModelSerializer;
import com.mgmtp.a12.kernel.md.model.internal.wrapper.fieldtypes.DateTypeWrapper;
import com.mgmtp.a12.kernel.md.model.internal.wrapper.fieldtypes.NumberTypeWrapper;
import com.mgmtp.a12.kernel.md.model.internal.wrapper.fieldtypes.TimeTypeWrapper;
import com.mgmtp.a12.kernel.md.serializer.MDSerializerFactory;
import com.mgmtp.a12.model.notification.Severity;
import com.mgmtp.a12.print.engine.api.exception.PrintException;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;

import java.io.InputStreamReader;

import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Slf4j
class DocumentModelIndexTest {

	private final IDocumentModelSerializer documentModelSerializer;
	private final DocumentModelService documentModelService;

	public DocumentModelIndexTest() {
		final var serializerFactory = new MDSerializerFactory();
		documentModelSerializer = serializerFactory.createDocumentModelSerializer();
		documentModelService = new DocumentModelService();
	}

	private static DocumentModel loadDocumentModel(
		String modelName,
		String pathToTestResources,
		boolean replaceTypeDefinitionNames,
		IDocumentModelSerializer documentModelSerializer,
		DocumentModelService documentModelServer
	) {
		try(final var inputStream =  DocumentModelIndexTest.class.getResourceAsStream(String.format("/%s/%s.json", pathToTestResources, modelName))){
			if (inputStream != null) {
				final var documentModel = documentModelSerializer.deserialize(new InputStreamReader(inputStream));

				final var internDocumentModel = documentModelServer.convertFromExternal(documentModel);

				if (replaceTypeDefinitionNames) {
					final var documentModelId = internDocumentModel.getHeader().getId();
					internDocumentModel.getContent().getTypeDefinitions().forEach(def ->
						def.setName(String.format("%s_%s", documentModelId, def.getName()))
					);
				}

				return internDocumentModel;
			} else {
				throw new RuntimeException("The model could not be loaded");
			}
		} catch(Exception e){
			throw new RuntimeException(e);
		}
	}

	private record ExpandedDocumentModel(IDocumentModel documentModel, ExpansionInfo expansionInfo) {}

	private ExpandedDocumentModel getExpandedDocumentModel(String documentModelId, String documentModelFolder, boolean replaceTypeDefinitionNames) {
		final var documentModel = loadDocumentModel(
			documentModelId,
			documentModelFolder,
			replaceTypeDefinitionNames,
			documentModelSerializer,
			documentModelService
		);

		final ExpansionInfo[] capturedExpansionInfo = { null };
		final var expandedDM = CombinationModelService.expand(
			documentModelService.convertToExternal(documentModel),
			dmId -> new DMWrapper(
				documentModelService.convertToExternal(loadDocumentModel(dmId, documentModelFolder, replaceTypeDefinitionNames, documentModelSerializer, documentModelService))
			),
			CombinationModelService.CombinationModelExpandParams.builder()
				.notificationReceiver(rankedNotification -> {
					if (rankedNotification.getSeverity().equals(Severity.ERROR)) {
						throw new PrintException(rankedNotification.getMessage());
					} else if (rankedNotification.getSeverity().equals(Severity.WARNING)) {
						log.warn(rankedNotification.getMessage());
					} else {
						log.info(rankedNotification.getMessage());
					}
				})
				.a12Internal_expansionInfoReceiver(ei -> capturedExpansionInfo[0] = ei)
				.build()
		);

		if (expandedDM.isEmpty()) {
			throw new PrintException("The expansion for the Document Model {} failed.", documentModel.getHeader().getId());
		}

		return new ExpandedDocumentModel(expandedDM.get(), capturedExpansionInfo[0]);
	}

	/*
		This is the use-case from the print model editor preview: The type definitions are getting the related document model as prefix on expansion.
		That means that the type definition id needs to match exactly without looking into the type definition model references
	 */
	@Test
	void evaluateFieldTypeDefinitionTestWithAlreadyChangedDocumentModel() {
		final var expanded = getExpandedDocumentModel("DocumentModelRoot", "typeDefinitions", true);
		final var documentModelIndex = DocumentModelIndex.load(expanded.documentModel(), expanded.expansionInfo());

		// the root model has a number type definition
		final var rootFieldType = documentModelIndex.getFieldType(() -> "DocumentModelRoot_TypeDefinition");
		assert rootFieldType.isPresent();
		assert rootFieldType.get() instanceof NumberTypeWrapper;

		// the first include model has a date type definition
		final var include1FieldType = documentModelIndex.getFieldType(() -> "Include1_TypeDefinition");
		assertTrue(include1FieldType.isPresent());
		assertInstanceOf(DateTypeWrapper.class, include1FieldType.get());

		// the second include model has a time type definition
		final var include2FieldType = documentModelIndex.getFieldType(() -> "Include2_TypeDefinition");
		assertTrue(include2FieldType.isPresent());
		assertInstanceOf(TimeTypeWrapper.class, include2FieldType.get());

		// the type definition without prefix should not be there
		final var fieldType = documentModelIndex.getFieldType(() -> "TypeDefinition");
		assertTrue(fieldType.isEmpty());
	}

	/*
		This is the use-case from external projects which integrates the print engine: The type definitions are not getting the related document model as prefix on expansion.
		That means that the type definition id does not match exactly and the function need to look into the model references of the type definitions
	 */
	@Test
	void evaluateFieldTypeDefinitionTestWithoutAlreadyChangedDocumentModel() {
		final var expanded = getExpandedDocumentModel("DocumentModelRoot", "typeDefinitions", false);
		final var documentModelIndex = DocumentModelIndex.load(expanded.documentModel(), expanded.expansionInfo());

		// the root model has a number type definition
		final var rootFieldType = documentModelIndex.getFieldType(() -> "DocumentModelRoot_TypeDefinition");
		assertTrue(rootFieldType.isPresent());
		assertInstanceOf(NumberTypeWrapper.class, rootFieldType.get());

		// the first include model has a date type definition
		final var include1FieldType = documentModelIndex.getFieldType(() -> "Include1_TypeDefinition");
		assertTrue(include1FieldType.isPresent());
		assertInstanceOf(DateTypeWrapper.class, include1FieldType.get());

		// the second include model has a time type definition
		final var include2FieldType = documentModelIndex.getFieldType(() -> "Include2_TypeDefinition");
		assertTrue(include2FieldType.isPresent());
		assertInstanceOf(TimeTypeWrapper.class, include2FieldType.get());

		// the type definition without prefix is the same as the type from include 2
		final var fieldType = documentModelIndex.getFieldType(() -> "TypeDefinition");
		assertTrue(fieldType.isPresent());
		assertInstanceOf(TimeTypeWrapper.class, fieldType.get());
	}

	/*
		This case covers Document Models that import Type Definitions via importing them from Type Definition Models.
	*/
	@Test
	void evaluateImportedFieldTypeDefinitionTestWithAlreadyChangedDocumentModel() {
		final var expanded = getExpandedDocumentModel("testCDM", "cdm", true);
		final var documentModelIndex = DocumentModelIndex.load(expanded.documentModel(), expanded.expansionInfo());

		// imported type definitions can be resolved from the root model
		final var rootFieldType = documentModelIndex.getFieldType(() -> "testCDM_CustomDate");
		assertTrue(rootFieldType.isPresent());
	}

	/*
		This case covers the external perspective of importing Type Definitions - in this case we can't look at the
		deepest reference.
	*/
	@Test
	void evaluateImportedFieldTypeDefinitionTestWithOutAlreadyChangedDocumentModel() {
		final var expanded = getExpandedDocumentModel("testCDM", "cdm", false);
		final var documentModelIndex = DocumentModelIndex.load(expanded.documentModel(), expanded.expansionInfo());

		// imported type definitions can be resolved from the root model
		final var rootFieldType = documentModelIndex.getFieldType(() -> "testCDM_CustomDate");
		assertTrue(rootFieldType.isPresent());
	}
}
