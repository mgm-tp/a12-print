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
import {
	ComputationAlternativeDeserializer,
	DisplayOptionsDeserializer,
	FieldTypeDeserializer,
} from "./misc-deserializer.js";

export class FieldDeserializer extends Deserializer<GeneratedDTO.FieldDTO, ModelAPI.FieldProperties> {
	prefix = "prefix";

	map(property: keyof GeneratedDTO.FieldDTO, dto: GeneratedDTO.FieldDTO) {
		switch (property) {
			case "id":
				return this.getRequired(dto.id, property);
			case "model":
				return this.getRequired(dto.model, property);
			case "path":
				return this.getRequired(dto.path, property);
			case "displayOptions":
				return this.deserializeOptional(
					dto.displayOptions,
					new DisplayOptionsDeserializer(this.path),
					property
				);
		}
		this.unknownProperty(property);
	}
}

export class CalculationDeserializer extends Deserializer<GeneratedDTO.CalculationDTO, ModelAPI.CalculationProperties> {
	prefix = "calculation";

	map(property: keyof GeneratedDTO.CalculationDTO, dto: GeneratedDTO.CalculationDTO) {
		switch (property) {
			case "id":
				return this.getRequired(dto.id, property);
			case "name":
				return this.getRequired(dto.name, property);
			case "model":
				return this.getRequired(dto.model, property);
			case "fieldType":
				return this.deserializeOptional(dto.fieldType, new FieldTypeDeserializer(this.path), property);
			case "displayOptions":
				return this.deserializeOptional(
					dto.displayOptions,
					new DisplayOptionsDeserializer(this.path),
					property
				);
			case "computationAlternatives":
				return this.deserializeRepeatable(
					dto.computationAlternatives,
					index => new ComputationAlternativeDeserializer(this.path, index, true),
					property
				);
		}
		this.unknownProperty(property);
	}
}
