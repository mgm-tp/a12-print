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
import type * as ModelAPI from "@com.mgmtp.a12.print/print-model-api/model";
import type * as GeneratedDTO from "@com.mgmtp.a12.print/print-model-api/generated/a12internal";

import { Deserializer } from "./deserializer.js";

export class TextDeserializer extends Deserializer<GeneratedDTO.TextElementDTO, ModelAPI.TextElementProperties> {
	prefix = "text";
	elementBase = {
		entities: [],
	};

	map(property: keyof GeneratedDTO.TextElementDTO, dto: GeneratedDTO.TextElementDTO) {
		switch (property) {
			case "id":
				return dto.id;
			case "text":
				return this.getRequired(dto.text, property);
			case "hideIfEmpty":
				return dto.hideIfEmpty;
			case "entities":
				return this.deserializeRepeatable(
					dto.entities,
					index => new EntityDeserializer(this.path, index, true),
					property
				);
		}
		this.unknownProperty(property);
	}
}

class EntityDeserializer extends Deserializer<GeneratedDTO.EntitiesDTO, ModelAPI.Reference> {
	prefix = "entities";

	map(property: keyof GeneratedDTO.EntitiesDTO, dto: GeneratedDTO.EntitiesDTO) {
		switch (property) {
			case "id":
				return dto.id;
			case "refId":
				return dto.refId;
		}
		this.unknownProperty(property);
	}
}
