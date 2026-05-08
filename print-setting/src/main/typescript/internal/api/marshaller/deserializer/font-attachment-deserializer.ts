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
import { Deserializer } from "@com.mgmtp.a12.print/print-model-api-utils";

import * as ModelAPI from "../../model/print-setting-model.js";
import * as GeneratedDTO from "../../generated/dto/PrintSettingModelDTO.js";

export class FontAttachmentDeserializer extends Deserializer<GeneratedDTO.FontAttachmentDTO, ModelAPI.FontAttachment> {
	prefix = "fontAttachment";

	map(property: keyof GeneratedDTO.FontAttachmentDTO, dto: GeneratedDTO.FontAttachmentDTO) {
		switch (property) {
			case "attachment_id":
				return dto.attachment_id;
			case "original_filename":
				return dto.original_filename;
			case "internal_filename":
				return dto.internal_filename;
			case "mime_type":
				return dto.mime_type;
			case "category":
				return dto.category;
			case "description":
				return dto.description;
			case "size":
				return dto.size;
			case "content":
				return dto.content;
		}
		this.unknownProperty(property);
	}
}
