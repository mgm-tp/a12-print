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
package com.mgmtp.a12.print.model.api.utils.serialization;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.mgmtp.a12.print.model.api.model.internal.dto.PrintModelDto;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import utils.FileUtils;

import java.io.IOException;
import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertTrue;

@Slf4j
public class SerializationTest {

	private static final ObjectMapper printModelMapper = ObjectMapperFactory.createPrintModelMapper();

	@Test
	void testSerialization() throws IOException {
		final String originalContent = FileUtils.getFileContent("/PrintModel-for-serialization.json");

		final PrintModelDto printModelDto = printModelMapper.readValue(originalContent, PrintModelDto.class);

		String resultContent = printModelMapper.writeValueAsString(printModelDto);

		FileUtils.writeFileContent("/PrintModel-for-serialization.json", resultContent);

		boolean result = checkJsonNodeKeysActualInExpected(
			printModelMapper.readTree(originalContent),
			printModelMapper.readTree(resultContent)
		);

		assertTrue(result);
	}


	private boolean checkJsonNodeKeysActualInExpected(JsonNode expected, JsonNode actual) {
		Set<String> actualKeys = new HashSet<>(actual.propertyNames());

		for (String key: actualKeys) {
			if (!expected.has(key)) {
				JsonNode actualObject = actual.get(key);

				if ((actualObject != null && actualObject.isArray()) && actualObject.isEmpty()) {
					log.info("The property {} is an empty array in the result JSON and does not exist in the original JSON", key);
				} else {
					return false;
				}
			} else if (!checkJsonNodeKeysActualInExpected(expected.get(key), actual.get(key))) {
				return false;
			}
		}
		return true;
	}
}
