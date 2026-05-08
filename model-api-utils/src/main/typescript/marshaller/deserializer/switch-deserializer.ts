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
import { MeasureDeserializer } from "./measure-deserializer.js";

export class SwitchDeserializer extends Deserializer<GeneratedDTO.SwitchDTO, ModelAPI.SwitchProperties> {
	prefix = "switch";

	map(property: keyof GeneratedDTO.SwitchDTO, dto: GeneratedDTO.SwitchDTO) {
		switch (property) {
			case "id":
				return this.getRequired(dto.id, property);
			case "name":
				return this.getRequired(dto.name, property);
			case "model":
				return this.getRequired(dto.model, property);
			case "dimensions":
				return this.deserializeRequired(dto.dimensions, property, new SwitchDimensionsDeserializer(this.path));
			case "cases":
				return this.deserializeRepeatable(
					dto.cases,
					index => new SwitchCasesDeserializer(this.path, index, true),
					property
				);
		}
		this.unknownProperty(property);
	}
}

class SwitchDimensionsDeserializer extends Deserializer<GeneratedDTO.DimensionsDTO_2, ModelAPI.SwitchDimensions> {
	prefix = "dimensions";
	elementBase = {};

	map(property: keyof GeneratedDTO.DimensionsDTO_2, dto: GeneratedDTO.DimensionsDTO_2) {
		switch (property) {
			case "id":
				return this.getRequired(dto.id, property);
			case "height":
				return this.deserializeRequired(dto.height, property, new MeasureDeserializer(this.path));
			case "width":
				return this.deserializeRequired(dto.width, property, new MeasureDeserializer(this.path));
		}
		this.unknownProperty(property);
	}
}

class SwitchCasesDeserializer extends Deserializer<GeneratedDTO.CasesDTO, ModelAPI.SwitchCase> {
	prefix = "cases";
	elementBase = {};

	map(property: keyof GeneratedDTO.CasesDTO, dto: GeneratedDTO.CasesDTO) {
		switch (property) {
			case "id":
				return dto.id;
			case "refId":
				return dto.refId;
			case "precondition":
				return dto.precondition;
		}
		this.unknownProperty(property);
	}
}
