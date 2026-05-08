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
package com.mgmtp.a12.print.model.codegen.internal;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.util.TreeMap;

public class PrintModelMetadataMapTypescriptFileGenerator implements PrintModelMetadataMapFileGenerator {
	private static final String STRING_FORMAT_LITERAL = "\"%s\"";
	private static final String STRING_FORMAT_OPTIONAL_LITERAL = "\"%s\"?";

	@Override
	public void saveMapToFile(
		TreeMap<String, PrintModelMetadataMapGenerator.FieldMetadata> metadataMap,
		ObjectNode metadataObject,
		ObjectNode typeObject,
		SaveFile saveFile
	) throws PrintModelMetadataMapGenerationException, JsonProcessingException {
		ObjectMapper writerMapper = new ObjectMapper();
		ObjectWriter prettyJsonWriter = writerMapper.writerWithDefaultPrettyPrinter();

		saveFile.save(
			String.format("""
                export interface PrintEntityMetadata {
                   isRequired: boolean;
                   path: string;
                   defaultValue?: string;
                   hasInherited?: boolean;
                   inheritedCondition?: string;
                }

                export function isMetadataInstance(element: object): element is PrintEntityMetadata {
                  return (
                     "isRequired" in element &&
                     "path" in element &&
                     typeof element.isRequired === "boolean" &&
                     typeof element.path === "string"
                  );
                }

                export const PRINT_MODEL_METADATA_MAP: %s = %s
            """,
				prettyJsonWriter.writeValueAsString(typeObject)
					.replaceAll(
						String.format(STRING_FORMAT_LITERAL, PrintModelMetadataMapGenerator.DEFAULT_VALUE),
						String.format(STRING_FORMAT_OPTIONAL_LITERAL, PrintModelMetadataMapGenerator.DEFAULT_VALUE)
					)
					.replaceAll(
						String.format(STRING_FORMAT_LITERAL, PrintModelMetadataMapGenerator.HAS_INHERITED),
						String.format(STRING_FORMAT_OPTIONAL_LITERAL, PrintModelMetadataMapGenerator.HAS_INHERITED)
					)
					.replaceAll(
						String.format(STRING_FORMAT_LITERAL, PrintModelMetadataMapGenerator.INHERIT_CONDITION),
						String.format(STRING_FORMAT_OPTIONAL_LITERAL, PrintModelMetadataMapGenerator.INHERIT_CONDITION)
					)
					.replaceAll(
						String.format(STRING_FORMAT_LITERAL, PrintModelMetadataMapGenerator.STRING),
						PrintModelMetadataMapGenerator.STRING
					)
					.replaceAll(
						String.format(STRING_FORMAT_LITERAL, PrintModelMetadataMapGenerator.BOOLEAN),
						PrintModelMetadataMapGenerator.BOOLEAN
					),
				prettyJsonWriter.writeValueAsString(metadataObject)
			)
		);
	}
}
