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

import com.mgmtp.a12.print.integration.exception.PrintServiceException;
import com.mgmtp.a12.print.typesetting.internal.model.impl.TypesettingModelDto;
import com.mgmtp.a12.print.typesetting.internal.serialization.ObjectMapperFactory;
import com.mgmtp.a12.print.typesetting.internal.validation.ITypesettingModelIntegrityMessage;
import com.mgmtp.a12.print.typesetting.internal.validation.ITypesettingModelIntegrityReport;
import com.mgmtp.a12.print.typesetting.internal.validation.TypesettingModelValidator;
import tools.jackson.databind.ObjectMapper;

import java.util.Locale;
import java.util.stream.Collectors;

public class TypesettingDeserializer {
	private TypesettingDeserializer() {}

	private static final ObjectMapper MAPPER = ObjectMapperFactory.createTypesettingModelMapper();
	private static final TypesettingModelValidator VALIDATOR = new TypesettingModelValidator();

	static TypesettingModelDto validateAndMarshallTypesettingDto(String rawModel, Locale locale) {
		ITypesettingModelIntegrityReport report = VALIDATOR.validate(rawModel, locale);
		if (!report.noErrorOccurred()) {
			throw new PrintServiceException(
					String.format(
							"Typesetting Model is not valid: %s",
							report.getMessages().stream()
								.map(ITypesettingModelIntegrityMessage::getErrorText)
								.collect(Collectors.joining(", "))
					)
			);
		}
		return MAPPER.readValue(rawModel, TypesettingModelDto.class);
	}
}
