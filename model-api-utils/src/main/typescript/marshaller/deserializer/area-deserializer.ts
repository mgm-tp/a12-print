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
import * as ModelAPI from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import * as GeneratedDTO from "@com.mgmtp.a12.print/print-model-api/lib/generated/internal/dto/PrintModelDTO.js";

import { Deserializer } from "./deserializer.js";
import { ElementReferenceDeserializer } from "./element-reference-deserializer.js";
import { MeasureDeserializer } from "./measure-deserializer.js";
import { DataContextDeserializer } from "./data-context-deserializer.js";

export class AreaDeserializer extends Deserializer<GeneratedDTO.AreaDTO, ModelAPI.AreaProperties> {
	prefix = "area";

	map(property: keyof GeneratedDTO.AreaDTO, dto: GeneratedDTO.AreaDTO) {
		switch (property) {
			case "id":
				return this.getRequired(dto.id, property);
			case "dimensions":
				return this.deserializeRequired(dto.dimensions, property, new AreaDimensionsDeserializer(this.path));
			case "elementReferences":
				return this.deserializeRepeatable(
					dto.elementReferences,
					index => new ElementReferenceDeserializer(this.path, index, true),
					property
				);
			case "dataContexts":
				return this.deserializeRepeatable(
					dto.dataContexts,
					index => new DataContextDeserializer(this.path, index, true),
					property
				);
			case "maxRepetitions":
				return dto.maxRepetitions;
		}
		this.unknownProperty(property);
	}
}

class AreaDimensionsDeserializer extends Deserializer<GeneratedDTO.DimensionsDTO_3, ModelAPI.OverflowDimensions> {
	prefix = "dimensions";
	elementBase = {};

	map(property: keyof GeneratedDTO.DimensionsDTO_3, dto: GeneratedDTO.DimensionsDTO_3) {
		switch (property) {
			case "id":
				return this.getRequired(dto.id, property);
			case "height":
				return this.deserializeRequired(dto.height, property, new MeasureDeserializer(this.path));
			case "width":
				return this.deserializeRequired(dto.width, property, new MeasureDeserializer(this.path));
			case "overflowHeight":
				return this.deserializeRequired(dto.overflowHeight, property, new MeasureDeserializer(this.path));
		}
		this.unknownProperty(property);
	}
}
