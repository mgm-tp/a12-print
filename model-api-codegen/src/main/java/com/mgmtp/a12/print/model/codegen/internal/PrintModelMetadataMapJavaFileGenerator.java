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

import com.fasterxml.jackson.databind.node.ObjectNode;

import java.io.StringWriter;
import java.util.TreeMap;

public class PrintModelMetadataMapJavaFileGenerator implements PrintModelMetadataMapFileGenerator {

	@Override
	public void saveMapToFile(
		TreeMap<String, PrintModelMetadataMapGenerator.FieldMetadata> metadataMap,
		ObjectNode metadataObject,
		ObjectNode typeObject,
		SaveFile saveFile
	) throws PrintModelMetadataMapGenerationException {
		final var resultString = new StringWriter();

		for (final var entry : metadataMap.entrySet()) {
			final var metadata = entry.getValue();

			resultString.append(
				String.format("put(\"%s\", new InputSourceMetadata(%s, %s, %s, %s));%n",
					entry.getKey(),
					metadata.defaultValue() != null
						? "\"" + metadata.defaultValue() + "\""
						: "null",
					metadata.isRequired(),
					metadata.hasInherited(),
					metadata.inheritedCondition() != null
						? "\"" + metadata.inheritedCondition() + "\""
						: "null"
				)
			);
		}



		saveFile.save(
			String.format("""
			package com.mgmtp.a12.print.model.map;

			import java.util.Map;
			import java.util.HashMap;

			public class PrintMetaModelMap {

				public static Map<String, InputSourceMetadata> PRINT_MODEL_METADATA_MAP = new HashMap<String, InputSourceMetadata>() {{
					%s
				}};

				public record InputSourceMetadata(
					String defaultValue,
					boolean isRequired,
					boolean hasInherited,
					String inheritedCondition
				) {}
			}
			""", resultString)
		);
	}
}
