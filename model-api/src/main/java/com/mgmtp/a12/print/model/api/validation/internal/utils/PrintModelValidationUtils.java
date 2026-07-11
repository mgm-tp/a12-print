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
package com.mgmtp.a12.print.model.api.validation.internal.utils;

import com.mgmtp.a12.kernel.md.document.api.services.DocumentDeserializationConfig;
import com.mgmtp.a12.kernel.md.document.api.services.DocumentSerializationConfig;
import com.mgmtp.a12.kernel.md.document.apiV2.immutable.DocumentV2;
import com.mgmtp.a12.kernel.md.document.apiV2.services.IDocumentV2Serializer;
import com.mgmtp.a12.kernel.md.facade.DocumentRtServiceFactory;
import com.mgmtp.a12.kernel.md.model.api.services.IDocumentModelResolver;
import com.mgmtp.a12.kernel.md.rt.api.*;
import com.mgmtp.a12.kernel.md.serializer.MDSerializerFactory;
import com.mgmtp.a12.model.notification.RankedNotification;
import com.mgmtp.a12.print.model.api.validation.IPrintModelIntegrityMessage;
import com.mgmtp.a12.print.model.api.validation.IPrintModelIntegrityReport;
import com.mgmtp.a12.print.model.api.validation.PrintModelValidatorOptions;
import com.mgmtp.a12.print.model.api.validation.custom.PrintCustomConditionFactory;
import com.mgmtp.a12.print.model.api.validation.custom.PrintCustomFieldTypeFactory;
import com.mgmtp.a12.print.model.api.validation.internal.PrintModelIntegrityReport;
import com.mgmtp.a12.print.model.api.validation.internal.html.HtmlFieldCollector;

import java.io.Reader;
import java.io.StringReader;
import java.util.*;

public class PrintModelValidationUtils {

	private static final String PRINT_META_MODEL = "DomainPrintMetaModel";
	private static final String GENERATED_MODEL_PACKAGE = "com.mgmtp.a12.kernel.generated.domainprintmetamodel";

	private static final IDocumentModelResolver documentResolver = new DocumentModelResolver();

	private static final IDocumentV2Serializer documentSerializer = new MDSerializerFactory().createDocumentSerializerV2(documentResolver);

	public static IPrintModelIntegrityReport validate(String rawPrintModel, Locale locale) {
		return validate(rawPrintModel, new PrintModelValidatorOptions(locale, false));
	}

	public static IPrintModelIntegrityReport validate(String rawPrintModel, PrintModelValidatorOptions options) {
		DocumentRtServiceFactory rtFactory = new DocumentRtServiceFactory(documentResolver);
		IDocumentRtService docRtService = rtFactory.createDocumentRtService(getDocumentStaticServiceConfig());
		DocumentProcessingConfig documentProcessConfig = DocumentProcessingConfig.builder(options.locale())
			.customFieldTypeFactory(new PrintCustomFieldTypeFactory())
			.customConditionFactory(new PrintCustomConditionFactory())
			.build();
		IDocumentValidationResult result = docRtService.validateFull(deserializeDocument(rawPrintModel), documentProcessConfig);
		List<IPrintModelIntegrityMessage> htmlMessages = options.html()
			? HtmlFieldCollector.collect(rawPrintModel)
			: List.of();
		return new PrintModelIntegrityReport(result, htmlMessages);
	}

	private static DocumentV2 deserializeDocument(String documentString) {
		Reader reader = new StringReader(documentString);

		// Ignore the problems of the documentSerializer, because they are the same as the validation process
		return documentSerializer.deserializeV2(
			reader,
			PRINT_META_MODEL,
			DocumentDeserializationConfig.builder()
										 .format(DocumentSerializationConfig.Format.JSON)
										 .build(),
			(RankedNotification rankedNotification) -> {
			}
		);
	}
	private static final IStaticModelCodeCache cache = new IStaticModelCodeCache() {
		private final Map<String, IStaticModelCode> map = Collections.synchronizedMap(new HashMap<>());

		@Override public IStaticModelCode getModelCode(String modelCodeIdentifier) {
			return map.get(modelCodeIdentifier);
		}

		@Override public void addModelCode(String modelCodeIdentifier, IStaticModelCode modelCode) {
			map.put(modelCodeIdentifier, modelCode);
		}
	};
	private static IDocumentStaticServiceConfig getDocumentStaticServiceConfig() {
		return new IDocumentStaticServiceConfig() {

			@Override
			public Optional<IStaticModelCodeCache> getCache() {
				return Optional.of(cache);
			}

			@Override
			public Optional<ILabelProvider> getLabelProvider() {
				return Optional.empty();
			}
			@Override
			public Optional<String> getModelPackage(String documentModelId) {
				return Optional.of(GENERATED_MODEL_PACKAGE);
			}
		};
	}
}
