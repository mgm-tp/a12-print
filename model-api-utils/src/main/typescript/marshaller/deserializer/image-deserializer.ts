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
			case "attachmentSource":
				return this.deserializeOptional(
					dto.attachmentSource,
					new AttachmentSourceDeserializer(this.path),
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
				return this.deserializeOptional(dto.height, new MeasureDeserializer(this.path), property);
			case "width":
				return this.deserializeOptional(dto.width, new MeasureDeserializer(this.path), property);
			case "originalHeight":
				return this.deserializeOptional(dto.originalHeight, new MeasureDeserializer(this.path), property);
			case "originalWidth":
				return this.deserializeOptional(dto.originalWidth, new MeasureDeserializer(this.path), property);
		}
		this.unknownProperty(property);
	}
}

class AttachmentSourceDeserializer extends Deserializer<GeneratedDTO.AttachmentSourceDTO, ModelAPI.AttachmentSource> {
	prefix = "attachmentSource";

	map(property: keyof GeneratedDTO.AttachmentSourceDTO, dto: GeneratedDTO.AttachmentSourceDTO) {
		switch (property) {
			case "id":
				return this.getRequired(dto.id, property);
			case "imageAttachment":
				return this.deserializeRequired(dto.imageAttachment, property, new AttachmentDeserializer(this.path));
		}
		this.unknownProperty(property);
	}
}

class AttachmentDeserializer extends Deserializer<GeneratedDTO.ImageAttachmentDTO, ModelAPI.Attachment> {
	prefix = "imageAttachment";

	map(property: keyof GeneratedDTO.ImageAttachmentDTO, dto: GeneratedDTO.ImageAttachmentDTO) {
		switch (property) {
			case "content": {
				const content = this.getRequired(dto.content, property);
				this.addAdditionalProperty("id", ModelAPI.getEntityId(ModelAPI.EntityKey.Attachment, content));
				return content;
			}
			case "internal_filename":
				return this.getRequired(dto.internal_filename, property);
			case "mime_type":
				return this.getRequired(dto.mime_type, property);
			case "size":
				return this.getRequired(dto.size, property);
			case "attachment_id":
				return dto.attachment_id;
			case "category":
				return dto.category;
			case "description":
				return dto.description;
			case "original_filename":
				return dto.original_filename;
		}
		this.unknownProperty(property);
	}
}
