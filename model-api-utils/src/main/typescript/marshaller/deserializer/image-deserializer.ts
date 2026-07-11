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
import * as ModelAPI from "@com.mgmtp.a12.print/print-model-api/model";
import type * as GeneratedDTO from "@com.mgmtp.a12.print/print-model-api/generated/a12internal";

import { Deserializer } from "./deserializer.js";
import { MeasureDeserializer } from "./measure-deserializer.js";

export class ImageDeserializer extends Deserializer<GeneratedDTO.ImageDTO, ModelAPI.ImageProperties> {
	prefix = "image";

	map(property: keyof GeneratedDTO.ImageDTO, dto: GeneratedDTO.ImageDTO) {
		switch (property) {
			case "id":
				return this.getRequired(dto.id, property);
			case "alternativeText":
				return this.getRequired(dto.alternativeText, property);
			case "imageSrcType":
				return ModelAPI.ImageSrcType[this.getRequired(dto.imageSrcType, property)];
			case "resourceSource":
				return this.deserializeOptional(
					dto.resourceSource,
					new ResourceSourceDeserializer(this.path),
					property
				);
			case "dimensions":
				return this.deserializeOptional(dto.dimensions, new DimensionDeserializer(this.path), property);
			case "fieldSource":
				return this.deserializeOptional(dto.fieldSource, new FieldSourceDeserializer(this.path), property);
		}
		this.unknownProperty(property);
	}
}

class FieldSourceDeserializer extends Deserializer<GeneratedDTO.FieldSourceDTO, ModelAPI.FieldSource> {
	prefix = "fieldSource";

	map(property: keyof GeneratedDTO.FieldSourceDTO, dto: GeneratedDTO.FieldSourceDTO) {
		switch (property) {
			case "id":
				return this.getRequired(dto.id, property);
			case "model":
				return this.getRequired(dto.model, property);
			case "path":
				return this.getRequired(dto.path, property);
		}
		this.unknownProperty(property);
	}
}

class DimensionDeserializer extends Deserializer<GeneratedDTO.DimensionsDTO_1, ModelAPI.ImageDimensions> {
	prefix = "dimensions";

	map(property: keyof GeneratedDTO.DimensionsDTO_1, dto: GeneratedDTO.DimensionsDTO_1) {
		switch (property) {
			case "id":
				return dto.id;
			case "height":
				return this.deserializeRequired(dto.height, property, new MeasureDeserializer(this.path));
			case "width":
				return this.deserializeRequired(dto.width, property, new MeasureDeserializer(this.path));
			case "originalHeight":
				return this.deserializeRequired(dto.originalHeight, property, new MeasureDeserializer(this.path));
			case "originalWidth":
				return this.deserializeRequired(dto.originalWidth, property, new MeasureDeserializer(this.path));
		}
		this.unknownProperty(property);
	}
}

class ResourceSourceDeserializer extends Deserializer<GeneratedDTO.ResourceSourceDTO, ModelAPI.ResourceSource> {
	prefix = "resourceSource";

	map(property: keyof GeneratedDTO.ResourceSourceDTO, dto: GeneratedDTO.ResourceSourceDTO) {
		switch (property) {
			case "id":
				return this.getRequired(dto.id, property);
			case "resourceName":
				return this.getRequired(dto.resourceName, property);
		}
		this.unknownProperty(property);
	}
}
