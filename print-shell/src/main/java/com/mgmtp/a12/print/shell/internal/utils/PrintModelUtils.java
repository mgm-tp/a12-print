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
package com.mgmtp.a12.print.shell.internal.utils;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mgmtp.a12.print.model.api.model.internal.dto.PrintModelDto;
import com.mgmtp.a12.print.model.api.utils.serialization.ObjectMapperFactory;
import com.mgmtp.a12.print.shell.internal.exceptions.PrintShellException;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class PrintModelUtils {

	private static final ObjectMapper objectMapper = ObjectMapperFactory.createPrintModelMapper();

	public static PrintModelDto deserializePrintModel(String modelId, String printModelContent) {
		try {
			return objectMapper.readValue(printModelContent, PrintModelDto.class);
		} catch (JsonProcessingException exception) {
			throw new PrintShellException(
				String.format("The current print model %s could not be deserialized", modelId),
				exception
			);
		}
	}

	public static String serializePrintModel(String modelId, PrintModelDto printModel) {
		try {
			return objectMapper.writeValueAsString(printModel);
		} catch (JsonProcessingException exception) {
			throw new PrintShellException(
				String.format("The current print model %s could not be serialized", modelId),
				exception
			);
		}
	}
}
